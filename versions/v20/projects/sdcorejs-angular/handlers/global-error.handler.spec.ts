import { ErrorHandler, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdGlobalErrorHandler } from './global-error.handler';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Builds a minimal I18nService stub whose `t()` returns the key unchanged. */
function makeI18nStub(): jasmine.SpyObj<Pick<I18nService, 't'>> {
  return { t: jasmine.createSpy('t').and.callFake((key: string) => key) };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('SdGlobalErrorHandler', () => {
  let handler: SdGlobalErrorHandler;
  let i18nStub: jasmine.SpyObj<Pick<I18nService, 't'>>;
  let consoleErrorSpy: jasmine.Spy;
  let consoleWarnSpy: jasmine.Spy;
  let confirmSpy: jasmine.Spy;

  beforeEach(() => {
    i18nStub = makeI18nStub();

    // Prevent real dialog — confirm returns false (cancel) by default
    confirmSpy = spyOn(window, 'confirm').and.returnValue(false);

    consoleErrorSpy = spyOn(console, 'error').and.stub();
    consoleWarnSpy = spyOn(console, 'warn').and.stub();

    TestBed.configureTestingModule({
      providers: [
        SdGlobalErrorHandler,
        { provide: ErrorHandler, useExisting: SdGlobalErrorHandler },
        { provide: I18nService, useValue: i18nStub },
      ],
    });

    handler = TestBed.inject(SdGlobalErrorHandler);
  });

  // ─── 1. Instantiation ───────────────────────────────────────────────────────

  it('should be created via TestBed.inject', () => {
    expect(handler).toBeTruthy();
    expect(handler).toBeInstanceOf(SdGlobalErrorHandler);
  });

  // ─── 2. Normal (non-chunk) Error — falls through to console.error ──────────

  it('should call console.error for a normal Error object', () => {
    const err = new Error('Something broke');
    handler.handleError(err);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', err);
  });

  it('should NOT show confirm dialog for a normal Error', () => {
    handler.handleError(new Error('generic error'));
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('should call console.error for a plain string error', () => {
    handler.handleError('plain string error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', 'plain string error');
  });

  it('should call console.error for a null/undefined error', () => {
    handler.handleError(null);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', null);
  });

  // ─── 3. Chunk-load errors — confirm + reload branch ────────────────────────

  it('should detect "Loading chunk" (Webpack) and show confirm', () => {
    handler.handleError(new Error('Loading chunk 42 failed'));
    expect(consoleWarnSpy).toHaveBeenCalledWith(jasmine.stringContaining('Chunk Load error detected:'), jasmine.any(String));
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should detect "Failed to fetch dynamically imported module" and show confirm', () => {
    handler.handleError(new Error('Failed to fetch dynamically imported module /chunk-abc.js'));
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should detect "Importing a module script failed" and show confirm', () => {
    handler.handleError(new Error('Importing a module script failed'));
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should detect "error loading dynamically imported module" (Firefox/Safari) and show confirm', () => {
    handler.handleError(new Error('error loading dynamically imported module'));
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should detect "missing source map" signature and show confirm', () => {
    handler.handleError(new Error('missing source map for compiled output'));
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('chunk-load error as plain string should show confirm', () => {
    handler.handleError('Loading chunk 7 failed');
    expect(confirmSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  // ─── 4. Confirm dialog controls reload — confirmed vs cancelled ─────────────
  // NOTE: window.location.reload is non-configurable in Chrome Headless; calling
  // it with confirm=true would navigate the Karma test runner away (DISCONNECT).
  // We only assert the decision-gate behaviour (confirm call count / return path).

  it('should call window.confirm exactly once when a chunk-load error is detected', () => {
    handler.handleError(new Error('Loading chunk 1 failed'));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it('should NOT call console.error for a chunk-load error (regardless of confirm)', () => {
    // confirm defaults to false (cancel) — no reload, no console.error
    handler.handleError(new Error('Loading chunk 1 failed'));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  // ─── 5. i18n keys passed to confirm dialog ──────────────────────────────────

  it('should call i18n.t for update-title and update-body keys', () => {
    handler.handleError(new Error('Loading chunk 3 failed'));
    expect(i18nStub.t).toHaveBeenCalledWith('core.handler.global-error.update-title');
    expect(i18nStub.t).toHaveBeenCalledWith('core.handler.global-error.update-body');
  });

  // ─── 6. Rejection wrapper (Angular unhandled promise) ───────────────────────

  it('should detect chunk error inside a rejection string wrapper', () => {
    handler.handleError({ rejection: 'Loading chunk 5 failed (missing: /chunk-5.js)' });
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should detect chunk error inside a rejection Error wrapper', () => {
    handler.handleError({ rejection: new Error('Failed to fetch dynamically imported module /chunk-x.js') });
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should call console.error for a rejection wrapper with a normal error', () => {
    const inner = { rejection: new Error('network timeout') };
    handler.handleError(inner);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', inner);
  });

  // ─── 7. Case-insensitive matching ───────────────────────────────────────────

  it('should match chunk signature case-insensitively (uppercase message)', () => {
    handler.handleError(new Error('LOADING CHUNK 10 FAILED'));
    expect(confirmSpy).toHaveBeenCalled();
  });

  // ─── 8. console.warn is NOT called for non-chunk errors ─────────────────────

  it('should NOT call console.warn for non-chunk errors', () => {
    handler.handleError(new Error('ordinary runtime error'));
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  // ─── 9. SSR — no browser API may be touched on the server ───────────────────

  /** Re-mount the handler on a non-browser platform, reusing the console/confirm spies. */
  function injectServerHandler(): SdGlobalErrorHandler {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [SdGlobalErrorHandler, { provide: I18nService, useValue: i18nStub }, { provide: PLATFORM_ID, useValue: 'server' }],
    });
    return TestBed.inject(SdGlobalErrorHandler);
  }

  it('should NOT call window.confirm for a chunk-load error when running on the server', () => {
    const serverHandler = injectServerHandler();

    // why: `window.confirm`/`window.location.reload` không tồn tại khi render trên server — gọi
    // thẳng khiến CHÍNH ErrorHandler ném lỗi và che mất lỗi gốc.
    expect(() => serverHandler.handleError(new Error('Loading chunk 42 failed'))).not.toThrow();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('should still classify the error on the server without touching browser APIs', () => {
    const serverHandler = injectServerHandler();

    serverHandler.handleError(new Error('Failed to fetch dynamically imported module /chunk-a.js'));
    expect(consoleWarnSpy).toHaveBeenCalledWith(jasmine.stringContaining('Chunk Load error detected:'), jasmine.any(String));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should keep logging ordinary errors on the server (no browser API involved)', () => {
    const serverHandler = injectServerHandler();
    const error = new Error('ordinary server-side error');

    expect(() => serverHandler.handleError(error)).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', error);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  // ─── 10. Dev vs production logging ──────────────────────────────────────────

  it('should emit both the chunk warning and the error log while dev mode is on', () => {
    handler.handleError(new Error('dev mode logging'));
    expect(consoleErrorSpy).toHaveBeenCalled();

    handler.handleError(new Error('Loading chunk 99 failed'));
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  describe('production build (ngDevMode = false)', () => {
    // why: `isDevMode()` chỉ đọc global `ngDevMode`, nên tắt cờ này là mô phỏng đúng production
    // build. `enableProdMode()` là global một chiều của cả process nên không dùng được ở đây.
    const globalRef = globalThis as unknown as { ngDevMode?: unknown };
    let originalNgDevMode: unknown;
    let hadNgDevMode = false;

    beforeEach(() => {
      hadNgDevMode = 'ngDevMode' in globalRef;
      originalNgDevMode = globalRef.ngDevMode;
      globalRef.ngDevMode = false;
    });

    afterEach(() => {
      if (hadNgDevMode) globalRef.ngDevMode = originalNgDevMode;
      else delete globalRef.ngDevMode;
    });

    it('should STILL console.error an ordinary application error in production', () => {
      // why: `ErrorHandler` này THAY THẾ ErrorHandler mặc định của Angular (vốn luôn log). Gate
      // `console.error` sau `isDevMode()` khiến bản production nuốt sạch mọi lỗi ứng dụng — không
      // console, không log collector, bug production vô hình.
      const error = new Error('production runtime error');
      handler.handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', error);
    });

    it('should STILL console.error a string / rejection-wrapped error in production', () => {
      handler.handleError('production string error');
      const rejection = { rejection: new Error('production network timeout') };
      handler.handleError(rejection);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', 'production string error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', rejection);
    });

    it('should NOT emit the verbose chunk-detection warning in production', () => {
      handler.handleError(new Error('Loading chunk 42 failed'));

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should still prompt the user to reload on a chunk-load error in production', () => {
      // Chỉ log dài dòng bị tắt; hành vi hướng tới người dùng thì không đổi.
      handler.handleError(new Error('Failed to fetch dynamically imported module /chunk-a.js'));

      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
