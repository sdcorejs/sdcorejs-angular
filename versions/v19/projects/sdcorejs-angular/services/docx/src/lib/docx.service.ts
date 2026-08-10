import { inject, Injectable } from '@angular/core';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { SdLoadingService } from '@sdcorejs/angular/services/loading';
import { I18nService } from '@sdcorejs/angular/i18n';

import { SdDocxConvertOptions, SdDocxConvertResult } from './docx.model';
import { createPandocInstance, PandocInstance } from './pandoc-core';

@Injectable({
  providedIn: 'root',
})
export class SdDocxService {
  private notifyService = inject(SdNotifyService);
  private loadingService = inject(SdLoadingService);

  readonly #i18n = inject(I18nService);

  readonly #DEFAULT_MAX_SIZE_MB = 50;
  readonly #VALID_EXTENSIONS = ['.doc', '.docx'];

  readonly #PANDOC_WASM_URL = 'https://pandoc.github.io/pandoc-wasm/pandoc.wasm';

  #fileInput: HTMLInputElement | null = null;
  #pandocInstance: PandocInstance | null = null;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  async open(options?: SdDocxConvertOptions): Promise<SdDocxConvertResult | null> {
    return new Promise(resolve => {
      this.#createFileInput();
      if (!this.#fileInput) {
        resolve(null);
        return;
      }

      // why: `sd-docx.md` công bố "resolves with `null` if the user cancels", nhưng service chỉ
      // nghe `change`. Bấm Esc / Cancel trong hộp thoại chọn file của HĐH KHÔNG phát `change` —
      // promise không bao giờ settle, `await` treo vĩnh viễn và closure của caller bị ghim lại.
      // `cancel` là sự kiện chuẩn của `<input type="file">` cho đúng trường hợp đó.
      const handleCancel = () => {
        this.#fileInput?.removeEventListener('change', handleChange);
        resolve(null);
      };

      const handleChange = async (event: Event) => {
        this.#fileInput?.removeEventListener('cancel', handleCancel);
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
          resolve(null);
          return;
        }

        this.loadingService.start();
        try {
          const result = await this.convertToHtml(file, options);
          resolve(result);
        } catch (error) {
          console.error('[SdDocxService] DocX conversion error:', error);
          this.notifyService.error(this.#i18n.t('core.docx.convert-error'));
          resolve(null);
        } finally {
          input.value = '';
          input.removeEventListener('change', handleChange);
          this.loadingService.stop();
        }
      };

      this.#fileInput.addEventListener('change', handleChange, { once: true });
      this.#fileInput.addEventListener('cancel', handleCancel, { once: true });
      this.#fileInput.click();
    });
  }

  #createFileInput(): void {
    if (this.#fileInput) {
      return;
    }

    this.#fileInput = document.createElement('input');
    this.#fileInput.type = 'file';
    this.#fileInput.accept = '.doc,.docx';
    this.#fileInput.style.display = 'none';
    document.body.appendChild(this.#fileInput);
  }

  async #getPandocInstance(): Promise<PandocInstance> {
    if (this.#pandocInstance) {
      return this.#pandocInstance;
    }

    const wasmResponse = await fetch(this.#PANDOC_WASM_URL);
    if (!wasmResponse.ok) {
      throw new Error(`Failed to fetch pandoc.wasm: ${wasmResponse.status} ${wasmResponse.statusText}`);
    }
    const wasmBinary = await wasmResponse.arrayBuffer();
    this.#pandocInstance = await createPandocInstance(wasmBinary);
    return this.#pandocInstance;
  }

  async convertToHtml(input: File | Blob | ArrayBuffer, options?: SdDocxConvertOptions): Promise<SdDocxConvertResult | null> {
    const opts = {
      validateFormat: true,
      validateSize: true,
      maxSizeInMb: this.#DEFAULT_MAX_SIZE_MB,
      ...options,
    };

    try {
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let blob: Blob;

      if (input instanceof File) {
        fileName = input.name;
        fileSize = input.size;
        blob = input;
      } else if (input instanceof Blob) {
        fileSize = input.size;
        blob = input;
      } else {
        blob = new Blob([input], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      }

      if (opts.validateFormat && fileName) {
        if (!this.#isValidFormat(fileName)) {
          this.notifyService.error(this.#i18n.t('core.docx.invalid-format'));
          return null;
        }
      }

      if (opts.validateSize && fileSize !== undefined) {
        const maxSizeInBytes = opts.maxSizeInMb! * 1024 * 1024;
        if (fileSize > maxSizeInBytes) {
          this.notifyService.error(this.#i18n.t('core.docx.size-exceeded'));
          return null;
        }
      }

      const pandoc = await this.#getPandocInstance();

      const pandocOpts: Record<string, any> = {
        from: 'docx',
        to: 'html',
        'input-files': ['document.docx'],
        standalone: true,
        'embed-resources': true,
      };

      const result = await pandoc.convert(pandocOpts, null, { 'document.docx': blob });

      return {
        html: result.stdout,
        messages: result.warnings.map((w: any) => String(w)),
      };
    } catch (error) {
      console.error('[SdDocxService] DocX conversion error:', error);
      this.notifyService.error(this.#i18n.t('core.docx.convert-error'));
      return null;
    }
  }

  async convertToHtmlString(input: File | Blob | ArrayBuffer, options?: SdDocxConvertOptions): Promise<string | null> {
    const result = await this.convertToHtml(input, options);
    return result?.html ?? null;
  }

  #isValidFormat(fileName: string): boolean {
    const lowerCaseName = fileName.toLowerCase();
    return this.#VALID_EXTENSIONS.some(ext => lowerCaseName.endsWith(ext));
  }
}
