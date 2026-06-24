import { ErrorHandler } from '@angular/core';
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
});
