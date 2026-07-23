import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';

export interface SdPdfPrintJob {
  readonly finished: Promise<void>;
  cancel(): void;
}

export interface SdPdfPrintAdapter {
  readonly isSupported: boolean;
  start(data: Uint8Array, filename: string): SdPdfPrintJob | null;
}

class SdPdfIframePrintAdapter implements SdPdfPrintAdapter {
  readonly #isBrowser: boolean;
  readonly isSupported: boolean;

  constructor(
    private readonly document: Document,
    platformId: object
  ) {
    this.#isBrowser = isPlatformBrowser(platformId) && !!document.defaultView;
    const view = document.defaultView;
    this.isSupported =
      this.#isBrowser &&
      !!view?.Blob &&
      typeof view.URL?.createObjectURL === 'function' &&
      typeof view.URL?.revokeObjectURL === 'function' &&
      !!document.body;
  }

  start(data: Uint8Array, filename: string): SdPdfPrintJob | null {
    const view = this.document.defaultView;
    const BlobCtor = view?.Blob;
    const urlApi = view?.URL;
    if (
      !this.isSupported ||
      !view ||
      !BlobCtor ||
      typeof urlApi?.createObjectURL !== 'function' ||
      typeof urlApi.revokeObjectURL !== 'function' ||
      !this.document.body
    ) {
      return null;
    }

    const blob = new BlobCtor([new Uint8Array(data)], { type: 'application/pdf' });
    const objectUrl = urlApi.createObjectURL(blob);
    const frame = this.document.createElement('iframe');
    frame.hidden = true;
    frame.title = filename;

    let settled = false;
    let timeoutHandle: number | null = null;
    let resolveFinished: () => void = () => undefined;
    let rejectFinished: (reason: Error) => void = () => undefined;
    const finished = new Promise<void>((resolve, reject) => {
      resolveFinished = resolve;
      rejectFinished = reject;
    });

    const attemptCleanup = (operation: () => void): void => {
      try {
        operation();
      } catch {
        // Cleanup is best-effort; every remaining step and promise settlement must still run.
      }
    };
    const cleanup = (): void => {
      if (timeoutHandle !== null) attemptCleanup(() => view.clearTimeout(timeoutHandle!));
      attemptCleanup(() => frame.contentWindow?.removeEventListener('afterprint', complete));
      attemptCleanup(() => frame.removeEventListener('load', onLoad));
      attemptCleanup(() => frame.removeEventListener('error', onError));
      attemptCleanup(() => frame.remove());
      attemptCleanup(() => urlApi.revokeObjectURL(objectUrl));
    };
    const complete = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolveFinished();
    };
    const fail = (message: string): void => {
      if (settled) return;
      settled = true;
      cleanup();
      rejectFinished(new Error(message));
    };
    const onError = (): void => fail('Unable to load the PDF print frame.');
    const onLoad = (): void => {
      const printWindow = frame.contentWindow;
      if (!printWindow?.print) {
        fail('Printing is unavailable in this browser.');
        return;
      }
      printWindow.addEventListener('afterprint', complete, { once: true });
      timeoutHandle = view.setTimeout(complete, 30_000);
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        fail('The browser blocked the PDF print dialog.');
      }
    };

    frame.addEventListener('load', onLoad, { once: true });
    frame.addEventListener('error', onError, { once: true });
    frame.src = objectUrl;
    this.document.body.appendChild(frame);

    return {
      finished,
      cancel: complete,
    };
  }
}

export const SD_PDF_PRINT_ADAPTER = new InjectionToken<SdPdfPrintAdapter>('SD_PDF_PRINT_ADAPTER', {
  providedIn: 'root',
  factory: () => new SdPdfIframePrintAdapter(inject(DOCUMENT), inject(PLATFORM_ID)),
});
