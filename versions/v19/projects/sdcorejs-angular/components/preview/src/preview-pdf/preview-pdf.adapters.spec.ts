import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SD_PDF_BROWSER_ADAPTER, SdPdfBrowserAdapter } from './preview-pdf.browser';
import { SD_PDF_PRINT_ADAPTER, SdPdfPrintAdapter, SdPdfPrintJob } from './preview-pdf.print';

describe('SdPreviewPdf browser boundaries', () => {
  describe('server platform', () => {
    let browser: SdPdfBrowserAdapter;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      browser = TestBed.inject(SD_PDF_BROWSER_ADAPTER);
    });

    it('keeps file, blob, URL, download, fullscreen, and DOM operations inert', async () => {
      const host = { focus: () => undefined } as HTMLElement;

      expect(browser.isBrowser).toBe(false);
      expect(browser.canDownloadUrl).toBe(false);
      expect(browser.canDownloadBlob).toBe(false);
      expect(browser.canFullscreen).toBe(false);
      expect(browser.isFile({ name: 'report.pdf' })).toBe(false);
      expect(browser.isBlob({ size: 10 })).toBe(false);
      expect(browser.createPdfBlob(new Uint8Array([1, 2, 3]))).toBeNull();
      expect(browser.createObjectUrl({} as Blob)).toBeNull();
      expect(browser.download('blob:test', 'report.pdf')).toBe(false);
      expect(browser.createElement('div')).toBeNull();
      expect(browser.createImage()).toBeNull();
      await expectAsync(browser.toggleFullscreen(host)).toBeResolved();
    });

    it('returns deterministic no-op observer/listener/frame cleanups', () => {
      const host = { focus: () => undefined } as HTMLElement;
      const fullscreenCleanup = browser.listenFullscreen(host, () => undefined);
      const resizeCleanup = browser.observeResize(host, () => undefined);
      const intersectionCleanup = browser.observeIntersections([], () => undefined);
      const frame = browser.scheduleFrame(() => fail('server frame callback must not run'));

      expect(frame).toBeNull();
      expect(() => fullscreenCleanup()).not.toThrow();
      expect(() => resizeCleanup()).not.toThrow();
      expect(() => intersectionCleanup()).not.toThrow();
      expect(() => browser.cancelFrame(frame)).not.toThrow();
    });

    it('does not create a print job', () => {
      const print = TestBed.inject(SD_PDF_PRINT_ADAPTER);
      expect(print.isSupported).toBe(false);
      expect(print.start(new Uint8Array([1, 2, 3]), 'report.pdf')).toBeNull();
    });
  });

  describe('browser print lifecycle', () => {
    let print: SdPdfPrintAdapter;
    let revokeObjectUrl: jasmine.Spy;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      spyOn(URL, 'createObjectURL').and.returnValue('about:blank');
      revokeObjectUrl = spyOn(URL, 'revokeObjectURL');
      print = TestBed.inject(SD_PDF_PRINT_ADAPTER);
      expect(print.isSupported).toBe(true);
    });

    afterEach(() => {
      document.querySelectorAll('iframe[title="report.pdf"]').forEach(frame => frame.remove());
    });

    function startJob(): { job: SdPdfPrintJob; frame: HTMLIFrameElement; printWindow: Window } {
      const job = print.start(new Uint8Array([1, 2, 3]), 'report.pdf');
      const frame = document.querySelector('iframe[title="report.pdf"]') as HTMLIFrameElement | null;
      expect(job).not.toBeNull();
      expect(frame).not.toBeNull();
      const printWindow = frame?.contentWindow ?? null;
      expect(printWindow).not.toBeNull();
      return { job: job!, frame: frame!, printWindow: printWindow! };
    }

    it('prints after frame load and cleans the frame and object URL after afterprint', async () => {
      const { job, frame, printWindow } = startJob();

      frame.dispatchEvent(new Event('load'));
      printWindow.dispatchEvent(new Event('afterprint'));
      await expectAsync(job.finished).toBeResolved();

      expect(frame.isConnected).toBeFalse();
      expect(revokeObjectUrl).toHaveBeenCalledOnceWith('about:blank');
    });

    it('rejects and cleans up when the print frame fails to load', async () => {
      const { job, frame } = startJob();
      const finished = expectAsync(job.finished).toBeRejectedWithError('Unable to load the PDF print frame.');

      frame.dispatchEvent(new Event('error'));
      await finished;

      expect(frame.isConnected).toBeFalse();
      expect(revokeObjectUrl).toHaveBeenCalledOnceWith('about:blank');
    });

    it('cleans up on timeout and explicit cancellation', async () => {
      jasmine.clock().install();
      try {
        const timed = startJob();
        timed.frame.dispatchEvent(new Event('load'));
        jasmine.clock().tick(30_000);
        await expectAsync(timed.job.finished).toBeResolved();
        expect(timed.frame.isConnected).toBeFalse();

        const cancelled = startJob();
        cancelled.job.cancel();
        await expectAsync(cancelled.job.finished).toBeResolved();
        expect(cancelled.frame.isConnected).toBeFalse();
        expect(revokeObjectUrl).toHaveBeenCalledTimes(2);
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('settles cancel, afterprint, error, and timeout even when cleanup operations throw', async () => {
      jasmine.clock().install();
      try {
        const exercise = async (terminal: 'cancel' | 'afterprint' | 'error' | 'timeout'): Promise<void> => {
          const { job, frame, printWindow } = startJob();
          if (terminal === 'afterprint' || terminal === 'timeout') frame.dispatchEvent(new Event('load'));
          const nativeRemove = frame.remove.bind(frame);
          spyOn(frame, 'remove').and.callFake(() => {
            nativeRemove();
            throw new Error('frame remove failed');
          });
          revokeObjectUrl.and.throwError('URL revoke failed');
          const finished =
            terminal === 'error'
              ? expectAsync(job.finished).toBeRejectedWithError('Unable to load the PDF print frame.')
              : expectAsync(job.finished).toBeResolved();

          let thrown: unknown;
          try {
            if (terminal === 'cancel') job.cancel();
            else if (terminal === 'afterprint') printWindow.dispatchEvent(new Event('afterprint'));
            else if (terminal === 'error') frame.dispatchEvent(new Event('error'));
            else jasmine.clock().tick(30_000);
          } catch (error) {
            thrown = error;
          }

          expect(thrown).toBeUndefined();
          if (thrown === undefined) await finished;
          expect(frame.isConnected).toBeFalse();
        };

        await exercise('cancel');
        await exercise('afterprint');
        await exercise('error');
        await exercise('timeout');
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });

  describe('restricted WebView print capability', () => {
    it('does not create a print job without object-URL revocation support', () => {
      const createObjectURL = jasmine.createSpy('createObjectURL').and.returnValue('blob:print');
      const webViewDocument = {
        body: {},
        defaultView: {
          Blob,
          URL: { createObjectURL },
        },
      } as unknown as Document;
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: webViewDocument },
        ],
      });

      const restrictedPrint = TestBed.inject(SD_PDF_PRINT_ADAPTER);
      expect(restrictedPrint.isSupported).toBeFalse();
      expect(restrictedPrint.start(new Uint8Array([1, 2, 3]), 'report.pdf')).toBeNull();
      expect(createObjectURL).not.toHaveBeenCalled();
    });
  });
});
