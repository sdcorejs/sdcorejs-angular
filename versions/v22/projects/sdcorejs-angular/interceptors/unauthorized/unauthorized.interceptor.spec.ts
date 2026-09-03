import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SdAuthService } from '@sdcorejs/angular/modules';
import { SdUnauthorizedInterceptor } from './unauthorized.interceptor';

// ─── Suite ────────────────────────────────────────────────────────────────────

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

  // ─── 1. Instantiation / registration ────────────────────────────────────────

  it('should be created and registered as an HTTP interceptor', () => {
    const interceptor = TestBed.inject(SdUnauthorizedInterceptor);
    expect(interceptor).toBeTruthy();
    expect(interceptor).toBeInstanceOf(SdUnauthorizedInterceptor);
  });

  // ─── 2. Pass-through on success ─────────────────────────────────────────────

  it('should pass through a successful (200) response without calling signout', () => {
    let result: unknown;
    httpClient.get('/api/resource').subscribe({ next: r => (result = r) });

    const req = httpMock.expectOne('/api/resource');
    req.flush({ data: 'ok' });

    expect(authServiceSpy.signout).not.toHaveBeenCalled();
    expect(result).toEqual({ data: 'ok' });
  });

  // ─── 3. 401 → calls signout once ────────────────────────────────────────────

  it('should call authService.signout() once when a 401 error is returned', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient.get('/api/protected').subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });

    const req = httpMock.expectOne('/api/protected');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.signout).toHaveBeenCalledTimes(1);
    expect(caughtError?.status).toBe(401);
  });

  it('should rethrow the original 401 error so downstream handlers still receive it', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient.get('/api/protected').subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });

    httpMock.expectOne('/api/protected').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(caughtError).toBeInstanceOf(HttpErrorResponse);
    expect(caughtError!.status).toBe(401);
  });

  // ─── 4. Debounce guard — no duplicate signout for concurrent 401s ───────────

  it('should NOT call signout a second time when a second 401 arrives on the same instance', () => {
    // First 401
    httpClient.get('/api/a').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/a').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Second 401 — same interceptor instance (singleton)
    httpClient.get('/api/b').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/b').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.signout).toHaveBeenCalledTimes(1);
  });

  it('should reopen the latch once the debounce window has elapsed', () => {
    let now = 1_000_000;
    spyOn(Date, 'now').and.callFake(() => now);

    httpClient.get('/api/a').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/a').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(authServiceSpy.signout).toHaveBeenCalledTimes(1);

    // why: latch cũ là boolean vĩnh viễn — mọi 401 sau lần đầu đều bị nuốt, nên phiên hết hạn
    // sau khi đăng nhập lại không còn ép signout nữa.
    now += 3000;

    httpClient.get('/api/b').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/b').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(authServiceSpy.signout).toHaveBeenCalledTimes(2);
  });

  it('should call signout ONCE for a burst of 401s interleaved with 2xx responses', () => {
    // why: đây đúng là kịch bản latch sinh ra để chặn — nhiều request song song, vài cái trúng
    // endpoint công khai nên trả 2xx, số còn lại trả 401. Bản trước reset latch ở MỖI HttpResponse
    // thành công, nên mỗi 200 xen giữa lại mở latch và 401 kế tiếp gọi signout thêm một lần.
    // Một 2xx từ endpoint không cần auth KHÔNG chứng minh phiên còn sống.
    const paths = ['/api/private-a', '/api/public-a', '/api/private-b', '/api/public-b', '/api/private-c'];
    for (const path of paths) httpClient.get(path).subscribe({ next: () => undefined, error: () => undefined });

    httpMock.expectOne('/api/private-a').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/public-a').flush({ ok: true });
    httpMock.expectOne('/api/private-b').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/public-b').flush({ ok: true });
    httpMock.expectOne('/api/private-c').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.signout).toHaveBeenCalledTimes(1);
  });

  it('should keep the latch closed when a 2xx arrives inside the debounce window', () => {
    let now = 2_000_000;
    spyOn(Date, 'now').and.callFake(() => now);

    httpClient.get('/api/a').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/a').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(authServiceSpy.signout).toHaveBeenCalledTimes(1);

    // Chỉ 1 giây trôi qua — vẫn trong cửa sổ debounce.
    now += 1000;
    httpClient.get('/api/public').subscribe();
    httpMock.expectOne('/api/public').flush({ ok: true });

    httpClient.get('/api/b').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/b').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(authServiceSpy.signout).toHaveBeenCalledTimes(1);

    // Hết cửa sổ thì latch mở lại — bất kể có 2xx nào hay không.
    now += 2000;
    httpClient.get('/api/c').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/c').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(authServiceSpy.signout).toHaveBeenCalledTimes(2);
  });

  it('should not burn the latch permanently when the auth configuration has no signout action', () => {
    // why: `SdAuthService.signout()` là no-op khi SD_AUTH_CONFIGURATION.action.signout không được
    // cấu hình. Với latch vĩnh viễn, 401 đầu tiên đốt latch mà KHÔNG làm gì cả, và mọi 401 về sau
    // im lặng trôi qua.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: SdUnauthorizedInterceptor, multi: true },
      ],
    });
    const unconfiguredAuth = TestBed.inject(SdAuthService);
    const signoutSpy = spyOn(unconfiguredAuth, 'signout').and.callThrough();
    const client = TestBed.inject(HttpClient);
    const mock = TestBed.inject(HttpTestingController);

    let now = 5_000_000;
    spyOn(Date, 'now').and.callFake(() => now);

    client.get('/api/a').subscribe({ error: () => undefined });
    mock.expectOne('/api/a').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(signoutSpy).toHaveBeenCalledTimes(1);

    now += 3000;

    client.get('/api/b').subscribe({ error: () => undefined });
    mock.expectOne('/api/b').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(signoutSpy).toHaveBeenCalledTimes(2);
    mock.verify();
  });

  // ─── 5. Other error statuses pass through without calling signout ────────────

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

    httpClient.get('/api/not-found').subscribe({ error: (e: HttpErrorResponse) => (caughtError = e) });

    httpMock.expectOne('/api/not-found').flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(caughtError?.status).toBe(404);
    expect(authServiceSpy.signout).not.toHaveBeenCalled();
  });
});
