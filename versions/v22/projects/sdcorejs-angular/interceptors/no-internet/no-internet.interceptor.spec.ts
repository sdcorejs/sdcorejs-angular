import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Provider } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SD_NO_INTERNET_PROBE_URL, SdNoInternetInterceptor } from './no-internet.interceptor';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Default same-origin probe path — replaces the old hardcoded jsonplaceholder.typicode.com ping. */
const HEALTH_URL = '/favicon.ico';

/** Flush an error with status=0 (network loss) on the given request path. */
function flushNetworkError(httpMock: HttpTestingController, url: string): void {
  httpMock.expectOne(url).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('SdNoInternetInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let i18nSpy: jasmine.SpyObj<I18nService>;
  let snackBarRefSpy: jasmine.SpyObj<MatSnackBarRef<any>>;

  /** Mount the interceptor, optionally with extra providers or application functional interceptors. */
  function configure(options: { providers?: Provider[]; functionalInterceptors?: HttpInterceptorFn[] } = {}): void {
    TestBed.configureTestingModule({
      providers: [
        options.functionalInterceptors?.length
          ? provideHttpClient(withInterceptorsFromDi(), withInterceptors(options.functionalInterceptors))
          : provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        SdNoInternetInterceptor,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: SdNoInternetInterceptor,
          multi: true,
        },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: I18nService, useValue: i18nSpy },
        ...(options.providers ?? []),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  /** Re-mount with a different configuration from inside a spec. */
  function reconfigure(options: { providers?: Provider[]; functionalInterceptors?: HttpInterceptorFn[] }): void {
    TestBed.resetTestingModule();
    configure(options);
  }

  beforeEach(() => {
    // MatSnackBarRef mock — needs `onAction()` and `dismiss()`.
    snackBarRefSpy = jasmine.createSpyObj<MatSnackBarRef<any>>('MatSnackBarRef', ['dismiss', 'onAction']);
    snackBarRefSpy.onAction.and.returnValue({ subscribe: jasmine.createSpy('subscribe') } as any);

    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    snackBarSpy.open.and.returnValue(snackBarRefSpy);

    i18nSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    // Return the key so assertions can match on it without needing real translations.
    i18nSpy.t.and.callFake((key: string) => key);

    configure();
  });

  afterEach(() => {
    httpMock.verify();
    // Reset onLine to true after every test that may have changed it.
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
  });

  // ─── 1. Instantiation / registration ────────────────────────────────────────

  it('should be created and registered as an HTTP interceptor', () => {
    const interceptor = TestBed.inject(SdNoInternetInterceptor);
    expect(interceptor).toBeTruthy();
    expect(interceptor).toBeInstanceOf(SdNoInternetInterceptor);
  });

  // ─── 2. Pass-through on success (online) ────────────────────────────────────

  it('should pass through a successful (200) response without opening a snackbar', () => {
    let result: unknown;
    httpClient.get('/api/data').subscribe({ next: r => (result = r) });

    httpMock.expectOne('/api/data').flush({ ok: true });

    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  // ─── 3. Status 0 — genuine offline path ─────────────────────────────────────

  it('should set #isOffline and ping health endpoint when status 0 is returned', () => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });

    // Trigger the original status-0 error.
    flushNetworkError(httpMock, '/api/resource');

    // expectOne throws if the request was NOT made — that IS the assertion.
    const healthReq = httpMock.expectOne(HEALTH_URL);
    expect(healthReq.request.url).toBe(HEALTH_URL);
    healthReq.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should show a sticky offline snackbar when health ping also fails (genuine no-internet)', () => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });

    flushNetworkError(httpMock, '/api/resource');

    // Health ping fails too → genuine offline.
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'core.interceptor.no-internet.offline',
      'core.common.reload',
      jasmine.objectContaining({ panelClass: ['offline-snackbar'] })
    );
  });

  it('should rethrow the original error when genuinely offline so the caller still sees the failure', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient.get('/api/resource').subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });

    flushNetworkError(httpMock, '/api/resource');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(caughtError).toBeInstanceOf(HttpErrorResponse);
    expect(caughtError!.status).toBe(0);
  });

  // ─── 4. Status 0 — CORS / SSL / server-block (health ping succeeds) ──────────

  it('should show a CORS-error snackbar when health ping succeeds (not a real offline)', () => {
    httpClient.get('/api/cors-fail').subscribe({ error: () => undefined });

    flushNetworkError(httpMock, '/api/cors-fail');

    // Health ping succeeds → was CORS/SSL error, not real offline.
    httpMock.expectOne(HEALTH_URL).flush({});

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'core.interceptor.no-internet.cors-error',
      'core.common.close',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should rethrow the original error for CORS/SSL case so the caller still sees the failure', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient.get('/api/cors-fail').subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });

    flushNetworkError(httpMock, '/api/cors-fail');
    httpMock.expectOne(HEALTH_URL).flush({});

    expect(caughtError).toBeInstanceOf(HttpErrorResponse);
    expect(caughtError!.status).toBe(0);
  });

  // ─── 5. #isOffline guard — no duplicate health pings ─────────────────────────

  it('should NOT ping the health endpoint a second time when already offline (#isOffline guard)', () => {
    // First request → triggers health ping → genuine offline.
    httpClient.get('/api/a').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/a');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    // Second status-0 while still offline → guard must suppress second health ping.
    httpClient.get('/api/b').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/b');

    // expectNone throws if a request IS pending — that IS the assertion.
    const pending = httpMock.match(HEALTH_URL);
    expect(pending.length).toBe(0);
  });

  it('should NOT show a second offline snackbar when already in offline state', () => {
    httpClient.get('/api/a').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/a');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    const firstCallCount = snackBarSpy.open.calls.count();

    httpClient.get('/api/b').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/b');

    expect(snackBarSpy.open.calls.count()).toBe(firstCallCount);
  });

  // ─── 6. Status 503 — maintenance ────────────────────────────────────────────

  it('should show a maintenance snackbar when a 503 response is returned', () => {
    httpClient.get('/api/service').subscribe({ error: () => undefined });

    httpMock.expectOne('/api/service').flush('Service Unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'core.interceptor.no-internet.maintenance',
      'core.common.close',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should rethrow the 503 error so the caller still sees it', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient.get('/api/service').subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });

    httpMock.expectOne('/api/service').flush('Service Unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(caughtError).toBeInstanceOf(HttpErrorResponse);
    expect(caughtError!.status).toBe(503);
  });

  // ─── 7. Other error statuses pass through untouched ─────────────────────────

  it('should NOT open a snackbar for a 400 error and should rethrow it', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient.get('/api/bad').subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });
    httpMock.expectOne('/api/bad').flush('Bad Request', { status: 400, statusText: 'Bad Request' });

    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(caughtError?.status).toBe(400);
  });

  it('should NOT open a snackbar for a 404 error and should rethrow it', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient.get('/api/missing').subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });
    httpMock.expectOne('/api/missing').flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(caughtError?.status).toBe(404);
  });

  it('should NOT open a snackbar for a 500 error and should rethrow it', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient.get('/api/crash').subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });
    httpMock.expectOne('/api/crash').flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(caughtError?.status).toBe(500);
  });

  // ─── 8. Polling — recovery path ─────────────────────────────────────────────

  it('should show a "restored" snackbar when polling succeeds after an offline period', fakeAsync(() => {
    // Trigger genuine offline.
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    // Advance timer by one poll interval (3 000 ms).
    tick(3000);

    // Polling fires — flush the health-check request as a success.
    httpMock.expectOne(HEALTH_URL).flush({});

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'core.interceptor.no-internet.restored',
      'core.common.reload',
      jasmine.objectContaining({ duration: 5000 })
    );
  }));

  it('should dismiss the existing snackbar before showing the restored one', fakeAsync(() => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    tick(3000);
    httpMock.expectOne(HEALTH_URL).flush({});

    // dismiss() must have been called on the original offline snackbar ref.
    expect(snackBarRefSpy.dismiss).toHaveBeenCalled();
  }));

  it('should stop polling after connection is restored (no more health requests after recovery)', fakeAsync(() => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    // First poll fires and recovers.
    tick(3000);
    httpMock.expectOne(HEALTH_URL).flush({});

    // Advance another interval — no more health requests should be pending.
    tick(3000);
    expect(httpMock.match(HEALTH_URL).length).toBe(0);
  }));

  // ─── 9. Probe target is same-origin and configurable ────────────────────────

  it('should probe a same-origin path by default instead of a hardcoded third-party host', () => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');

    const probe = httpMock.expectOne(HEALTH_URL);
    // why: bản cũ ping https://jsonplaceholder.typicode.com/todos/1 — mọi app dùng thư viện đều
    // gọi ra một bên thứ ba mỗi 3 giây khi mất mạng, không có cách nào tắt.
    expect(probe.request.url.startsWith('http')).toBeFalse();
    probe.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should use the probe URL provided through SD_NO_INTERNET_PROBE_URL', () => {
    reconfigure({ providers: [{ provide: SD_NO_INTERNET_PROBE_URL, useValue: '/health/ping' }] });

    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');

    const probe = httpMock.expectOne('/health/ping');
    expect(probe.request.method).toBe('GET');
    httpMock.expectNone(HEALTH_URL);
    probe.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should issue the probe through HttpBackend so application interceptors never see it', () => {
    const interceptedUrls: string[] = [];
    const authInterceptor: HttpInterceptorFn = (request, next) => {
      interceptedUrls.push(request.url);
      return next(request.clone({ setHeaders: { Authorization: 'Bearer app-token' } }));
    };
    reconfigure({ functionalInterceptors: [authInterceptor] });

    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');

    const probe = httpMock.expectOne(HEALTH_URL);
    // why: probe đi qua chuỗi interceptor của app sẽ mang theo header auth gắn vô điều kiện —
    // với URL bên thứ ba như bản cũ, đó là rò token ra ngoài origin.
    expect(interceptedUrls).toEqual(['/api/resource']);
    expect(probe.request.headers.get('Authorization')).toBeNull();
    probe.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should send the probe with no-cache headers so a cached hit cannot fake connectivity', () => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');

    const probe = httpMock.expectOne(HEALTH_URL);
    expect(probe.request.headers.get('Cache-Control')).toBe('no-cache');
    expect(probe.request.responseType).toBe('text');
    probe.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  // ─── 10. Probe status classification — only status 0 means offline ──────────

  it('should classify a 404 from the probe as ONLINE, not as genuine offline', () => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');

    // why: probe đi qua HttpBackend, mà HttpBackend ném HttpErrorResponse cho MỌI non-2xx. 404 rất
    // phổ biến (app xoá favicon mặc định của CLI) nhưng chính nó đã chứng minh là CÓ mạng.
    httpMock.expectOne(HEALTH_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'core.interceptor.no-internet.cors-error',
      'core.common.close',
      jasmine.objectContaining({ duration: 5000 })
    );
    expect(snackBarSpy.open).not.toHaveBeenCalledWith('core.interceptor.no-internet.offline', jasmine.anything(), jasmine.anything());
  });

  it('should classify a 403 from the probe as ONLINE too (any HTTP status proves connectivity)', () => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');

    httpMock.expectOne(HEALTH_URL).flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'core.interceptor.no-internet.cors-error',
      'core.common.close',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should NOT start the 3s poll loop when the probe answers with an HTTP status', fakeAsync(() => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');
    httpMock.expectOne(HEALTH_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });

    // why: bản trước coi 404 là offline → snackbar dính cứng + vòng poll 3 giây mà probe không bao
    // giờ "thành công" được, nên không có lối thoát.
    tick(3000);
    expect(httpMock.match(HEALTH_URL).length).toBe(0);
  }));

  it('should recover from the poll loop when the probe answers 404 after a real outage', fakeAsync(() => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    tick(3000);
    httpMock.expectOne(HEALTH_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'core.interceptor.no-internet.restored',
      'core.common.reload',
      jasmine.objectContaining({ duration: 5000 })
    );

    tick(3000);
    expect(httpMock.match(HEALTH_URL).length).toBe(0);
  }));

  it('should still treat a status-0 probe failure as genuine offline', () => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'core.interceptor.no-internet.offline',
      'core.common.reload',
      jasmine.objectContaining({ panelClass: ['offline-snackbar'] })
    );
  });

  // ─── 11. Teardown — polling must not outlive the injector ───────────────────

  it('should stop the connectivity poll loop when the injector is destroyed', fakeAsync(() => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();
    TestBed.resetTestingModule();

    // why: không có teardown thì setInterval 3s và request HTTP của nó vẫn sống mãi sau khi app
    // (hoặc microfrontend) đã bị huỷ. fakeAsync cũng sẽ báo "periodic timer still in the queue".
    expect(clearIntervalSpy).toHaveBeenCalled();
    tick(3000);
    expect(httpMock.match(HEALTH_URL).length).toBe(0);
  }));
});
