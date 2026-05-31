import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdNoInternetInterceptor } from './no-internet.interceptor';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const HEALTH_URL = 'https://jsonplaceholder.typicode.com/todos/1';

/** Flush an error with status=0 (network loss) on the given request path. */
function flushNetworkError(httpMock: HttpTestingController, url: string): void {
  httpMock.expectOne(url).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
}

// â”€â”€â”€ Suite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('SdNoInternetInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let i18nSpy: jasmine.SpyObj<I18nService>;
  let snackBarRefSpy: jasmine.SpyObj<MatSnackBarRef<any>>;

  beforeEach(() => {
    // MatSnackBarRef mock â€” needs `onAction()` and `dismiss()`.
    snackBarRefSpy = jasmine.createSpyObj<MatSnackBarRef<any>>('MatSnackBarRef', ['dismiss', 'onAction']);
    snackBarRefSpy.onAction.and.returnValue({ subscribe: jasmine.createSpy('subscribe') } as any);

    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    snackBarSpy.open.and.returnValue(snackBarRefSpy);

    i18nSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    // Return the key so assertions can match on it without needing real translations.
    i18nSpy.t.and.callFake((key: string) => key);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        SdNoInternetInterceptor,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: SdNoInternetInterceptor,
          multi: true,
        },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: I18nService, useValue: i18nSpy },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    // Reset onLine to true after every test that may have changed it.
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
  });

  // â”€â”€â”€ 1. Instantiation / registration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should be created and registered as an HTTP interceptor', () => {
    const interceptor = TestBed.inject(SdNoInternetInterceptor);
    expect(interceptor).toBeTruthy();
    expect(interceptor).toBeInstanceOf(SdNoInternetInterceptor);
  });

  // â”€â”€â”€ 2. Pass-through on success (online) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should pass through a successful (200) response without opening a snackbar', () => {
    let result: unknown;
    httpClient.get('/api/data').subscribe({ next: r => (result = r) });

    httpMock.expectOne('/api/data').flush({ ok: true });

    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  // â”€â”€â”€ 3. Status 0 â€” genuine offline path â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should set #isOffline and ping health endpoint when status 0 is returned', () => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });

    // Trigger the original status-0 error.
    flushNetworkError(httpMock, '/api/resource');

    // expectOne throws if the request was NOT made â€” that IS the assertion.
    const healthReq = httpMock.expectOne(HEALTH_URL);
    expect(healthReq.request.url).toBe(HEALTH_URL);
    healthReq.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should show a sticky offline snackbar when health ping also fails (genuine no-internet)', () => {
    httpClient.get('/api/resource').subscribe({ error: () => undefined });

    flushNetworkError(httpMock, '/api/resource');

    // Health ping fails too â†’ genuine offline.
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

  // â”€â”€â”€ 4. Status 0 â€” CORS / SSL / server-block (health ping succeeds) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should show a CORS-error snackbar when health ping succeeds (not a real offline)', () => {
    httpClient.get('/api/cors-fail').subscribe({ error: () => undefined });

    flushNetworkError(httpMock, '/api/cors-fail');

    // Health ping succeeds â†’ was CORS/SSL error, not real offline.
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

  // â”€â”€â”€ 5. #isOffline guard â€” no duplicate health pings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should NOT ping the health endpoint a second time when already offline (#isOffline guard)', () => {
    // First request â†’ triggers health ping â†’ genuine offline.
    httpClient.get('/api/a').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/a');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    // Second status-0 while still offline â†’ guard must suppress second health ping.
    httpClient.get('/api/b').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/b');

    // expectNone throws if a request IS pending â€” that IS the assertion.
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

  // â”€â”€â”€ 6. Status 503 â€” maintenance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€â”€ 7. Other error statuses pass through untouched â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€â”€ 8. Polling â€” recovery path â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should show a "restored" snackbar when polling succeeds after an offline period', fakeAsync(() => {
    // Trigger genuine offline.
    httpClient.get('/api/resource').subscribe({ error: () => undefined });
    flushNetworkError(httpMock, '/api/resource');
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    // Advance timer by one poll interval (3 000 ms).
    tick(3000);

    // Polling fires â€” flush the health-check request as a success.
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

    // Advance another interval â€” no more health requests should be pending.
    tick(3000);
    httpMock.expectNone(HEALTH_URL);
  }));
});

