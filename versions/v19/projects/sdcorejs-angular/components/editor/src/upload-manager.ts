import { SdEditorEngine, SdEditorImageAttributes } from '@sdcorejs/angular/components/editor-engine';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdSanitizeEditorHtml } from '@sdcorejs/angular/utilities/extensions';
import { SdEditorImageConfig } from './models';
import { SdEditorUploadFileDetail } from './configurations';
import { validateAndGetFile } from './plugins/image-upload/utils/validate.utils';

type ImagePort = Pick<SdEditorEngine, 'insertImage' | 'activeImageSources' | 'replaceImage'>;
const positiveInteger = (value: number | undefined, fallback: number): number =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value!)) : fallback;

/** Per-component file queue. Invalidating work ignores callbacks; it cannot cancel an app's API request. */
export class SdEditorUploadManager {
  readonly #pending = new Map<string, File>();
  readonly #validations = new Set<AbortController>();
  #generation = 0;
  #destroyed = false;
  #running?: Promise<void>;
  #runningGeneration = -1;
  #immediateTimer?: ReturnType<typeof setTimeout>;
  #nextImmediate = false;

  constructor(
    private readonly engine: ImagePort,
    private readonly configuration: () => SdEditorImageConfig,
    private readonly warning: (message: string) => void = () => {},
    private readonly i18n?: I18nService
  ) {}

  async selectFiles(files: File[]): Promise<void> {
    if (this.#destroyed || !this.configuration().uploadFn) return;
    const config = this.configuration();
    const generation = this.#generation;
    const maximum = config.maxImagesPerSelection;
    if (maximum !== undefined && files.length > Math.max(0, Math.floor(maximum))) {
      this.warning(this.i18n?.t('core.component.editor.image.max-per-selection', { max: maximum }) ?? '');
      return;
    }
    for (const file of files) {
      if (!this.#isCurrent(generation)) return;
      const validation = new AbortController();
      this.#validations.add(validation);
      try {
        await validateAndGetFile({ file }, config.validation, this.warning, this.i18n, validation.signal);
        if (!this.#isCurrent(generation)) return;
        const src = URL.createObjectURL(file);
        this.#pending.set(src, file);
        try {
          this.engine.insertImage({ src, alt: file.name, loading: config.lazyLoad === false ? 'eager' : 'lazy' });
        } catch (error) {
          this.#release(src);
          throw error;
        }
      } catch {
        // Validation already reports a localized warning. An invalidated local decode is silent.
      } finally {
        this.#validations.delete(validation);
      }
    }
    if (this.#isCurrent(generation) && config.uploadMode === 'immediate') this.#scheduleImmediate();
  }

  /** Snapshot only files still present; later insertions remain pending for a later deferred call. */
  upload(): Promise<void> {
    if (this.#running) {
      if (this.#runningGeneration === this.#generation) return this.#running;
      // An app callback remains in flight after invalidation. Await it to keep the
      // concurrency bound, then submit the new generation's own snapshot.
      return this.#running.catch(() => {}).then(() => this.upload());
    }
    const running = this.#uploadSnapshot();
    this.#running = running;
    this.#runningGeneration = this.#generation;
    void running
      .finally(() => {
        if (this.#running !== running) return;
        this.#running = undefined;
        if (this.#nextImmediate && !this.#destroyed) {
          this.#nextImmediate = false;
          this.#scheduleImmediate();
        }
      })
      .catch(() => {});
    return running;
  }

  async #uploadSnapshot(): Promise<void> {
    const config = this.configuration();
    const uploadFn = config.uploadFn;
    if (!uploadFn) throw new Error('No upload function configured for image upload');
    if (this.#destroyed) return;
    this.pruneRemoved();
    const generation = this.#generation;
    const entries = [...this.#pending.entries()];
    const batchSize = positiveInteger(config.batchSize, 2);
    const concurrency = positiveInteger(config.maxConcurrentUploads, 2);
    const batches: [string, File][][] = [];
    for (let i = 0; i < entries.length; i += batchSize) batches.push(entries.slice(i, i + batchSize));
    let head = 0;
    let failures = 0;
    const worker = async () => {
      while (head < batches.length && this.#isCurrent(generation)) {
        const batch = batches[head++].filter(([src, file]) => this.#pending.get(src) === file && this.engine.activeImageSources().has(src));
        if (!batch.length) continue;
        try {
          const results = await uploadFn(batch.map(([, file]) => file));
          if (!this.#isCurrent(generation)) return;
          if (!Array.isArray(results) || results.length !== batch.length)
            throw new Error('Image upload result cardinality does not match the submitted files');
          // Validate the whole batch before applying any result; failed batches remain retryable.
          const attributes = results.map((detail, i) => this.#resultAttributes(detail, batch[i][1], config));
          for (const [index, [src, file]] of batch.entries()) {
            if (!this.#isCurrent(generation)) return;
            if (this.#pending.get(src) !== file) continue;
            if (!this.engine.activeImageSources().has(src)) {
              this.#release(src);
              continue;
            }
            let replaced = false;
            try {
              replaced = this.engine.replaceImage(src, attributes[index]);
            } catch {
              /* Keep the active file retryable. */
            }
            if (replaced || !this.engine.activeImageSources().has(src)) this.#release(src);
            else failures++;
          }
        } catch {
          if (this.#isCurrent(generation))
            failures += batch.filter(([src, file]) => this.#pending.get(src) === file && this.engine.activeImageSources().has(src)).length;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, worker));
    if (this.#isCurrent(generation)) {
      this.pruneRemoved();
      if (failures) throw new Error(`Upload failed for ${failures} image(s)`);
    }
  }

  #resultAttributes(detail: SdEditorUploadFileDetail, file: File, config: SdEditorImageConfig): SdEditorImageAttributes {
    if (
      !detail ||
      typeof detail.cdn !== 'string' ||
      !detail.cdn.trim() ||
      /^blob:/i.test(detail.cdn.trim()) ||
      typeof detail.idOrKey !== 'string' ||
      (detail.name !== undefined && typeof detail.name !== 'string')
    )
      throw new Error('Invalid image upload metadata');
    const image = document.implementation.createHTMLDocument().createElement('img');
    image.setAttribute('src', detail.cdn);
    if (sdSanitizeEditorHtml(image.outerHTML) !== image.outerHTML) throw new Error('Unsafe image upload URL');
    return { src: detail.cdn, id: detail.idOrKey, alt: detail.name ?? file.name, loading: config.lazyLoad === false ? 'eager' : 'lazy' };
  }

  #scheduleImmediate(): void {
    if (this.#destroyed) return;
    if (this.#running) {
      this.#nextImmediate = true;
      return;
    }
    if (this.#immediateTimer !== undefined) clearTimeout(this.#immediateTimer);
    const ready = this.#pending.size >= positiveInteger(this.configuration().batchSize, 2);
    this.#immediateTimer = setTimeout(
      () => {
        this.#immediateTimer = undefined;
        void this.upload().catch(() => {
          if (!this.#destroyed) this.warning(this.i18n?.t('core.component.editor.image.upload-failed') ?? '');
        });
      },
      ready ? 0 : 50
    );
  }

  pruneRemoved(): void {
    if (this.#destroyed) return;
    const active = this.engine.activeImageSources();
    for (const src of this.#pending.keys()) if (!active.has(src)) this.#release(src);
  }
  invalidateWork(): void {
    this.#generation++;
    for (const validation of this.#validations) validation.abort();
    this.#validations.clear();
    if (this.#immediateTimer !== undefined) clearTimeout(this.#immediateTimer);
    this.#immediateTimer = undefined;
    this.#nextImmediate = false;
  }
  invalidateSource(): void {
    this.invalidateWork();
    for (const src of this.#pending.keys()) this.#release(src);
  }
  destroy(): void {
    if (!this.#destroyed) {
      this.invalidateSource();
      this.#destroyed = true;
    }
  }
  #release(src: string): void {
    if (this.#pending.delete(src)) URL.revokeObjectURL(src);
  }
  #isCurrent(generation: number): boolean {
    return !this.#destroyed && generation === this.#generation;
  }
}
