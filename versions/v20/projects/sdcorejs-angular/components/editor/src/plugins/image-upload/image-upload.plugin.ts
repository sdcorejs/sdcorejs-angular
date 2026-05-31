import { SdEditorImageConfig, SdEditorImageUploadValidation } from '../../models';
import { SdEditorUploadFileDetail, SdEditorUploadFileFuncUpload } from '../../configurations';
import { FileRepository, Image, ImageResize, ImageStyle, ImageToolbar, ImageUpload, Plugin, FileLoader } from 'ckeditor5';
import { I18nService } from '@sdcorejs/angular/i18n';
import { validateAndGetFile } from './utils';

type GetOptionFn =
  | (() => {
      imageConfig?: SdEditorImageConfig;
      uploadFn?: SdEditorUploadFileFuncUpload;
      onWarning?: (message: string) => void;
      _i18n?: I18nService;
    })
  | undefined;

interface ImageMeta {
  name?: string;
  fileName?: string;
  idOrKey?: string;
  lazyLoad: boolean;
}

class UploadQueue {
  #queue: Array<() => void> = [];
  #running = 0;
  readonly maxConcurrent: number;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.#running >= this.maxConcurrent) {
      await new Promise<void>(resolve => {
        this.#queue.push(resolve);
      });
    }
    this.#running++;
    try {
      return await task();
    } finally {
      this.#running--;
      this.#queue.shift()?.();
    }
  }
}

class BatchUploadScheduler {
  #pending: Array<{ file: File; resolve: (d: SdEditorUploadFileDetail) => void; reject: (e: unknown) => void }> = [];
  #timer: ReturnType<typeof setTimeout> | null = null;
  readonly #batchSize: number;
  readonly #uploadFn: SdEditorUploadFileFuncUpload;
  readonly #queue: UploadQueue;

  constructor(batchSize: number, uploadFn: SdEditorUploadFileFuncUpload, queue: UploadQueue) {
    this.#batchSize = batchSize;
    this.#uploadFn = uploadFn;
    this.#queue = queue;
  }

  enqueue(file: File): Promise<SdEditorUploadFileDetail> {
    return new Promise((resolve, reject) => {
      this.#pending.push({ file, resolve, reject });
      if (this.#timer) {
        clearTimeout(this.#timer);
      }
      if (this.#pending.length >= this.#batchSize) {
        this.#timer = null;
        this.#flush();
      } else {
        this.#timer = setTimeout(() => this.#flush(), 50);
      }
    });
  }

  destroy() {
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
    this.#pending.splice(0).forEach(p => p.reject(new Error('Upload cancelled')));
  }

  #flush() {
    this.#timer = null;
    const all = this.#pending.splice(0);
    if (all.length === 0) {
      return;
    }

    for (let i = 0; i < all.length; i += this.#batchSize) {
      const batch = all.slice(i, i + this.#batchSize);
      this.#queue
        .run(() => this.#uploadFn(batch.map(p => p.file)))
        .then(details => {
          batch.forEach((p, idx) => {
            if (details && details[idx]) {
              p.resolve(details[idx]);
            } else {
              p.reject(new Error('Upload failed: Missing details from server'));
            }
          });
        })
        .catch(err => {
          batch.forEach(p => p.reject(err));
        });
    }
  }
}

class DeferredImageUploadAdapter {
  #loader: FileLoader;
  #pendingFiles: Map<string, File>;
  #imageMetaMap: Map<string, ImageMeta>;
  #validation: SdEditorImageUploadValidation | undefined;
  #onWarning: ((message: string) => void) | undefined;
  #i18n: I18nService | undefined;
  #lazyLoad: boolean;
  #currentBlobUrl: string | null = null;

  constructor(
    loader: FileLoader,
    pendingFiles: Map<string, File>,
    imageMetaMap: Map<string, ImageMeta>,
    options: {
      validation?: SdEditorImageUploadValidation;
      onWarning?: (message: string) => void;
      i18n?: I18nService;
      lazyLoad: boolean;
    }
  ) {
    this.#loader = loader;
    this.#pendingFiles = pendingFiles;
    this.#imageMetaMap = imageMetaMap;
    this.#validation = options.validation;
    this.#onWarning = options.onWarning;
    this.#i18n = options.i18n;
    this.#lazyLoad = options.lazyLoad;
  }

  upload = async (): Promise<{ default: string }> => {
    const file = await validateAndGetFile(this.#loader, this.#validation, this.#onWarning, this.#i18n);
    if (!file) throw new Error('Image validation failed');
    this.#currentBlobUrl = URL.createObjectURL(file);
    this.#pendingFiles.set(this.#currentBlobUrl, file);
    this.#imageMetaMap.set(this.#currentBlobUrl, { fileName: file.name, lazyLoad: this.#lazyLoad });
    return { default: this.#currentBlobUrl };
  };

  abort() {
    if (this.#currentBlobUrl) {
      URL.revokeObjectURL(this.#currentBlobUrl);
      this.#pendingFiles.delete(this.#currentBlobUrl);
      this.#imageMetaMap.delete(this.#currentBlobUrl);
    }
  }
}

class ImmediateImageUploadAdapter {
  #loader: FileLoader;
  #validation: SdEditorImageUploadValidation | undefined;
  #onWarning: ((message: string) => void) | undefined;
  #i18n: I18nService | undefined;
  #scheduler: BatchUploadScheduler;
  #imageMetaMap: Map<string, ImageMeta>;
  #lazyLoad: boolean;

  constructor(
    loader: FileLoader,
    scheduler: BatchUploadScheduler,
    imageMetaMap: Map<string, ImageMeta>,
    options: {
      validation?: SdEditorImageUploadValidation;
      onWarning?: (message: string) => void;
      i18n?: I18nService;
      lazyLoad: boolean;
    }
  ) {
    this.#loader = loader;
    this.#scheduler = scheduler;
    this.#imageMetaMap = imageMetaMap;
    this.#validation = options.validation;
    this.#onWarning = options.onWarning;
    this.#i18n = options.i18n;
    this.#lazyLoad = options.lazyLoad;
  }

  upload = async (): Promise<{ default: string }> => {
    const file = await validateAndGetFile(this.#loader, this.#validation, this.#onWarning, this.#i18n);
    if (!file) throw new Error('Image validation failed');
    const detail = await this.#scheduler.enqueue(file);
    this.#imageMetaMap.set(detail.cdn, {
      name: detail.name,
      fileName: file.name,
      idOrKey: detail.idOrKey,
      lazyLoad: this.#lazyLoad,
    });
    return { default: detail.cdn };
  };

  abort() {}
}

export class EditorImageUploadPlugin extends Plugin {
  pendingFiles = new Map<string, File>();
  uploadQueue!: UploadQueue;
  #batchScheduler: BatchUploadScheduler | undefined;
  #imageMetaMap = new Map<string, ImageMeta>();

  setMeta(cdnUrl: string, meta: { name?: string; idOrKey?: string; lazyLoad: boolean }): void {
    this.#imageMetaMap.set(cdnUrl, { name: meta.name, idOrKey: meta.idOrKey, lazyLoad: meta.lazyLoad });
  }

  static get pluginName() {
    return 'EditorImageUploadPlugin' as const;
  }

  static get requires() {
    return [FileRepository, Image, ImageResize, ImageUpload, ImageStyle, ImageToolbar] as const;
  }

  init() {
    const editor = this.editor;
    const getOption = editor.config.get('getOption') as GetOptionFn;
    const maxConcurrent = getOption?.()?.imageConfig?.maxConcurrentUploads ?? 2;
    this.uploadQueue = new UploadQueue(maxConcurrent);

    this.#registerSchemaAndConverters();
    this.#listenForSrcChanges();

    editor.editing.view.document.on(
      'clipboardInput',
      (evt: any, data: any) => {
        const dataTransfer = data.dataTransfer;
        if (!dataTransfer) return;
        const hasImageFiles = Array.from<File>(dataTransfer.files ?? []).some(f => f.type.startsWith('image/'));
        const hasImageInHtml = /<img[\s>]/i.test(dataTransfer.getData('text/html') ?? '');
        if (hasImageFiles || hasImageInHtml) {
          evt.stop();
        }
      },
      { priority: 'highest' }
    );

    const uploadImageCommand = editor.commands.get('uploadImage');
    if (uploadImageCommand) {
      uploadImageCommand.on(
        'execute',
        (evt: any, args: any[]) => {
          const options = args[0] || {};
          const option = getOption?.();
          const maxPerSelection = option?.imageConfig?.maxImagesPerSelection;

          if (maxPerSelection !== undefined) {
            const files: File[] = Array.isArray(options?.file) ? options.file : options?.file ? [options.file] : [];
            if (files.length > maxPerSelection) {
              // Angular wrapper luÃ´n truyá»n _i18n; náº¿u thiáº¿u thÃ¬ warning sáº½ lÃ  chuá»—i rá»—ng (i18n service tá»± log missing key)
              const msg = option?._i18n?.t('core.component.editor.image.max-per-selection', { max: maxPerSelection }) ?? '';
              option?.onWarning?.(msg);
              evt.stop();
            }
          }
        },
        { priority: 'high' }
      );
    }

    editor.once('ready', () => {
      const notification = (editor.plugins as any).get('Notification');
      notification?.on(
        'show:warning',
        (evt: any) => {
          evt.stop();
        },
        { priority: 'highest' }
      );
    });

    editor.plugins.get('FileRepository').createUploadAdapter = (loader: FileLoader) => {
      const option = getOption?.();
      const imageConfig = option?.imageConfig;
      const uploadMode = imageConfig?.uploadMode ?? 'deferred';
      const validation = imageConfig?.validation;
      const onWarning = option?.onWarning;
      const i18n = option?._i18n;
      const lazyLoad = imageConfig?.lazyLoad ?? true;

      if (uploadMode === 'deferred') {
        return new DeferredImageUploadAdapter(loader, this.pendingFiles, this.#imageMetaMap, { validation, onWarning, i18n, lazyLoad });
      }

      if (!this.#batchScheduler) {
        const uploadFn = option?.uploadFn;
        if (uploadFn) {
          const batchSize = imageConfig?.batchSize ?? 2;
          this.#batchScheduler = new BatchUploadScheduler(batchSize, uploadFn, this.uploadQueue);
        }
      }

      if (!this.#batchScheduler) {
        throw new Error('No upload function configured');
      }
      return new ImmediateImageUploadAdapter(loader, this.#batchScheduler, this.#imageMetaMap, { validation, onWarning, i18n, lazyLoad });
    };
  }

  override destroy() {
    super.destroy();
    this.#batchScheduler?.destroy();
    for (const blobUrl of this.pendingFiles.keys()) {
      URL.revokeObjectURL(blobUrl);
    }
    this.pendingFiles.clear();
    this.#imageMetaMap.clear();
  }

  #registerSchemaAndConverters() {
    const editor = this.editor;
    const schema = editor.model.schema;

    for (const type of ['imageBlock', 'imageInline'] as const) {
      if (schema.isRegistered(type)) {
        schema.extend(type, { allowAttributes: ['loading', 'imageId'] });
      }
    }

    // Downcast: model â†’ HTML view
    editor.conversion.for('downcast').add((dispatcher: any) => {
      for (const [modelAttr, htmlAttr] of [
        ['loading', 'loading'],
        ['imageId', 'id'],
      ] as const) {
        const handleAttribute = (isBlock: boolean) => (evt: any, data: any, conversionApi: any) => {
          if (!conversionApi.consumable.consume(data.item, evt.name)) return;

          const viewElement = conversionApi.mapper.toViewElement(data.item);
          const viewImg = isBlock ? this.#findImg(viewElement) : viewElement;

          if (!viewImg) return;

          if (data.attributeNewValue != null) {
            conversionApi.writer.setAttribute(htmlAttr, String(data.attributeNewValue), viewImg);
          } else {
            conversionApi.writer.removeAttribute(htmlAttr, viewImg);
          }
        };

        dispatcher.on(`attribute:${modelAttr}:imageBlock`, handleAttribute(true));
        dispatcher.on(`attribute:${modelAttr}:imageInline`, handleAttribute(false));
      }
    });

    // Upcast: HTML â†’ model
    editor.conversion.for('upcast').add((dispatcher: any) => {
      dispatcher.on(
        'element:figure',
        (_evt: any, data: any, conversionApi: any) => {
          if (!data.viewItem.hasClass('image')) return;
          const modelElement = data.modelRange?.start?.nodeAfter;
          if (!modelElement) return;
          const viewImg = this.#findImg(data.viewItem);
          if (!viewImg) return;
          this.#transferHtmlAttrsToModel(viewImg, modelElement, conversionApi);
        },
        { priority: 'low' }
      );

      dispatcher.on(
        'element:img',
        (_evt: any, data: any, conversionApi: any) => {
          const modelElement = data.modelRange?.start?.nodeAfter;
          if (!modelElement) return;
          this.#transferHtmlAttrsToModel(data.viewItem, modelElement, conversionApi);
        },
        { priority: 'low' }
      );
    });
  }

  #listenForSrcChanges() {
    const editor = this.editor;

    editor.model.document.on('change', () => {
      const changes = editor.model.document.differ.getChanges();
      const updates: Array<{ element: any; meta: ImageMeta }> = [];

      for (const change of changes) {
        if (change.type !== 'attribute' || change.attributeKey !== 'src') continue;
        const newSrc = (change as any).attributeNewValue as string;
        const meta = this.#imageMetaMap.get(newSrc);
        if (!meta) continue;

        const node = (change as any).range?.start?.nodeAfter;
        if (node?.is('element')) {
          updates.push({ element: node, meta });
          this.#imageMetaMap.delete(newSrc);
        }
      }

      if (updates.length === 0) return;

      editor.model.enqueueChange('transparent' as any, (writer: any) => {
        for (const { element, meta } of updates) {
          if (meta.name || meta.fileName) {
            writer.setAttribute('alt', meta.name || this.#generateAlt(meta.fileName), element);
          }

          if (meta.lazyLoad) {
            writer.setAttribute('loading', 'lazy', element);
          }

          if (meta.idOrKey) {
            writer.setAttribute('imageId', meta.idOrKey, element);
          }
        }
      });
    });
  }

  #findImg(viewElement: any): any {
    if (!viewElement) return null;
    if (viewElement.is?.('element', 'img')) return viewElement;
    for (const child of viewElement.getChildren?.() ?? []) {
      if ((child as any).is?.('element', 'img')) return child;
    }
    return null;
  }

  #transferHtmlAttrsToModel(viewImg: any, modelElement: any, conversionApi: any) {
    const schema = this.editor.model.schema;
    if (viewImg.hasAttribute('loading') && schema.checkAttribute(modelElement, 'loading')) {
      conversionApi.writer.setAttribute('loading', viewImg.getAttribute('loading'), modelElement);
    }
    if (viewImg.hasAttribute('id') && schema.checkAttribute(modelElement, 'imageId')) {
      conversionApi.writer.setAttribute('imageId', viewImg.getAttribute('id'), modelElement);
    }
  }

  #generateAlt(fileName?: string): string {
    if (!fileName) return 'Image';
    const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
    const result = nameWithoutExt
      .replace(/[_\-\.]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return result || 'Image';
  }
}

