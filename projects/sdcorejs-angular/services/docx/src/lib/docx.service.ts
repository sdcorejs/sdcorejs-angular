import { Injectable } from '@angular/core';
import * as mammoth from 'mammoth';
import { docxToHtml } from '@omer-go/docx-parser-converter-ts';
import { SdDocxConvertOptions, SdDocxConvertResult } from './docx.model';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';

@Injectable({
  providedIn: 'root',
})
export class SdDocxService {
  readonly #DEFAULT_MAX_SIZE_MB = 50;
  readonly #VALID_EXTENSIONS = ['.doc', '.docx'];

  readonly #ERROR_INVALID_FORMAT = 'Äá»‹nh dáº¡ng khÃ´ng há»£p lá»‡. Vui lÃ²ng chá»n Máº«u cÃ³ Ä‘á»‹nh dáº¡ng DOC hoáº·c DOCX';
  readonly #ERROR_SIZE_EXCEEDED = 'KÃ­ch thÆ°á»›c tá»‡p máº«u vÆ°á»£t quÃ¡ tiÃªu chuáº©n há»— trá»£ cá»§a há»‡ thá»‘ng. Vui lÃ²ng thá»­ láº¡i';

  #fileInput: HTMLInputElement | null = null;

  constructor(private notifyService: SdNotifyService) {}

  async open(options?: SdDocxConvertOptions): Promise<SdDocxConvertResult | null> {
    return new Promise(resolve => {
      this.#createFileInput();
      if (!this.#fileInput) {
        resolve(null);
        return;
      }

      const handleChange = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
          resolve(null);
          return;
        }

        const result = await this.convertToHtml(file, options);
        resolve(result);

        // Cleanup
        input.value = '';
        input.removeEventListener('change', handleChange);
      };

      this.#fileInput.addEventListener('change', handleChange, { once: true });
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
      let arrayBuffer: ArrayBuffer;

      if (input instanceof File) {
        fileName = input.name;
        fileSize = input.size;
        arrayBuffer = await this.#fileToArrayBuffer(input);
      } else if (input instanceof Blob) {
        fileSize = input.size;
        arrayBuffer = await this.#blobToArrayBuffer(input);
      } else {
        arrayBuffer = input;
      }

      if (opts.validateFormat && fileName) {
        if (!this.#isValidFormat(fileName)) {
          this.notifyService.error(this.#ERROR_INVALID_FORMAT);
          return null;
        }
      }

      if (opts.validateSize && fileSize !== undefined) {
        const maxSizeInBytes = opts.maxSizeInMb! * 1024 * 1024;
        if (fileSize > maxSizeInBytes) {
          this.notifyService.error(this.#ERROR_SIZE_EXCEEDED);
          return null;
        }
      }

      const { validateFormat, validateSize, maxSizeInMb, ...conversionOptions } = opts;

      // Try @omer-go first for better formatting, fallback to mammoth on BOM error
      let html: string;
      let messages: string[] = [];
      try {
        html = await docxToHtml(arrayBuffer, {
          styleMode: 'inline',
          useSemanticTags: true,
          fragmentOnly: true,
          ...conversionOptions,
        });
      } catch (omerError: any) {
        console.log(omerError);
        // Fallback to mammoth if @omer-go fails (e.g., BOM issue)
        console.warn('@omer-go/docx-parser-converter-ts failed, falling back to mammoth:', omerError?.message);
        const result = await mammoth.convertToHtml({ arrayBuffer }, conversionOptions as any);
        html = result.value;
        messages = result.messages.map(m => m.toString());
      }

      return {
        html,
        messages,
      };
    } catch (error) {
      console.error('DocX conversion error:', error);
      this.notifyService.error('CÃ³ lá»—i xáº£y ra khi chuyá»ƒn Ä‘á»•i file DOCX');
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

  #fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as ArrayBuffer;
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  #blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as ArrayBuffer;
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to read blob'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }
}

