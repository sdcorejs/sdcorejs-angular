import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SdAuthService } from '@sdcorejs/angular/modules';
import { SdUnauthorizedInterceptor } from './unauthorized.interceptor';

// â”€â”€â”€ Suite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('SdUnauthorizedInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<Pick<SdAuthService, 'signout'>>;

  beforeEach(() => {
    authServiceSpy = { signout: jasmine.createSpy('signout') };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        SdUnauthorizedInterceptor,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: SdUnauthorizedInterceptor,
          multi: true,
        },
        { provide: SdAuthService, useValue: authServiceSpy },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // â”€â”€â”€ 1. Instantiation / registration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should be created and registered as an HTTP interceptor', () => {
    const interceptor = TestBed.inject(SdUnauthorizedInterceptor);
    expect(interceptor).toBeTruthy();
    expect(interceptor).toBeInstanceOf(SdUnauthorizedInterceptor);
  });

  // â”€â”€â”€ 2. Pass-through on success â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should pass through a successful (200) response without calling signout', () => {
    let result: unknown;
    httpClient.get('/api/resource').subscribe({ next: r => (result = r) });

    const req = httpMock.expectOne('/api/resource');
    req.flush({ data: 'ok' });

    expect(authServiceSpy.signout).not.toHaveBeenCalled();
    expect(result).toEqual({ data: 'ok' });
  });

  // â”€â”€â”€ 3. 401 â†’ calls signout once â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should call authService.signout() once when a 401 error is returned', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient
      .get('/api/protected')
      .subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });

    const req = httpMock.expectOne('/api/protected');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.signout).toHaveBeenCalledTimes(1);
    expect(caughtError?.status).toBe(401);
  });

  it('should rethrow the original 401 error so downstream handlers still receive it', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient
      .get('/api/protected')
      .subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });

    httpMock.expectOne('/api/protected').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(caughtError).toBeInstanceOf(HttpErrorResponse);
    expect(caughtError!.status).toBe(401);
  });

  // â”€â”€â”€ 4. #unauthorizedHandled guard â€” no duplicate signout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should NOT call signout a second time when a second 401 arrives on the same instance', () => {
    // First 401
    httpClient.get('/api/a').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/a').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Second 401 â€” same interceptor instance (singleton)
    httpClient.get('/api/b').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/b').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.signout).toHaveBeenCalledTimes(1);
  });

  // â”€â”€â”€ 5. Other error statuses pass through without calling signout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should NOT call signout when a 400 error is returned', () => {
    httpClient.get('/api/bad').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/bad').flush('Bad Request', { status: 400, statusText: 'Bad Request' });

    expect(authServiceSpy.signout).not.toHaveBeenCalled();
  });

  it('should NOT call signout when a 403 error is returned', () => {
    httpClient.get('/api/forbidden').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/forbidden').flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(authServiceSpy.signout).not.toHaveBeenCalled();
  });

  it('should NOT call signout when a 500 error is returned', () => {
    httpClient.get('/api/crash').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/crash').flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(authServiceSpy.signout).not.toHaveBeenCalled();
  });

  it('should rethrow non-401 errors unchanged', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient
      .get('/api/not-found')
      .subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });

    httpMock.expectOne('/api/not-found').flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(caughtError?.status).toBe(404);
    expect(authServiceSpy.signout).not.toHaveBeenCalled();
  });
});

