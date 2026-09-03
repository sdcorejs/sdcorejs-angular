import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SdKeycloakService } from './keycloak.service';
import { SdKeycloakInterceptor } from './keycloak.interceptor';
import { SdKeycloakTenantConfig } from './keycloak.configuration';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal SdKeycloakService mock with configurable keycloak + config state. */
function makeKeycloakServiceStub(overrides: Partial<SdKeycloakService> = {}): SdKeycloakService {
  return {
    keycloak: null as any,
    config: null as any,
    ...overrides,
  } as unknown as SdKeycloakService;
}

/** Keycloak instance stub that resolves updateToken immediately. */
function makeKeycloakInstanceStub(token = 'test-token', authenticated = true) {
  return {
    token,
    authenticated,
    updateToken: jasmine.createSpy('updateToken').and.resolveTo(true),
  };
}

const SECURE_CONFIG: SdKeycloakTenantConfig = {
  url: 'https://sso.example.com',
  realm: 'my-realm',
  clientId: 'my-spa',
  secureRoutes: ['/api/v1'],
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('SdKeycloakInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let keycloakServiceStub: SdKeycloakService;

  function configure(serviceOverrides: Partial<SdKeycloakService> = {}) {
    keycloakServiceStub = makeKeycloakServiceStub(serviceOverrides);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([SdKeycloakInterceptor])),
        provideHttpClientTesting(),
        { provide: SdKeycloakService, useValue: keycloakServiceStub },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => httpMock.verify());

  // ─── 1. Registration ─────────────────────────────────────────────────────────

  it('should be a valid HttpInterceptorFn (function)', () => {
    configure();
    expect(typeof SdKeycloakInterceptor).toBe('function');
  });

  // ─── 2. Pass-through — keycloak not initialized ──────────────────────────────

  it('should forward request unchanged when keycloak instance is not present', () => {
    configure({ keycloak: null as any, config: SECURE_CONFIG });

    let result: unknown;
    httpClient.get('/api/v1/resource').subscribe({ next: r => (result = r) });

    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ data: 'ok' });
    expect(result).toEqual({ data: 'ok' });
  });

  // ─── 3. Pass-through — not authenticated ─────────────────────────────────────

  it('should forward request unchanged when user is not authenticated', () => {
    const keycloakInstance = makeKeycloakInstanceStub('token-abc', false);
    configure({
      keycloak: keycloakInstance as any,
      config: SECURE_CONFIG,
    });

    let result: unknown;
    httpClient.get('/api/v1/resource').subscribe({ next: r => (result = r) });

    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ data: 'ok' });
    expect(result).toEqual({ data: 'ok' });
  });

  // ─── 4. Pass-through — config is null ────────────────────────────────────────

  it('should forward request unchanged when config is not present', () => {
    const keycloakInstance = makeKeycloakInstanceStub();
    configure({
      keycloak: keycloakInstance as any,
      config: null as any,
    });

    let result: unknown;
    httpClient.get('/api/v1/resource').subscribe({ next: r => (result = r) });

    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ data: 'ok' });
  });

  // ─── 5. Pass-through — URL not in secureRoutes ───────────────────────────────

  it('should forward request unchanged when URL does not match any secureRoute', () => {
    const keycloakInstance = makeKeycloakInstanceStub();
    configure({
      keycloak: keycloakInstance as any,
      config: SECURE_CONFIG,
    });

    let result: unknown;
    httpClient.get('/public/info').subscribe({ next: r => (result = r) });

    const req = httpMock.expectOne('/public/info');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ data: 'public' });
    expect(result).toEqual({ data: 'public' });
  });

  // ─── 6. Pass-through — secureRoutes is empty / undefined ────────────────────

  it('should forward request unchanged when secureRoutes is an empty array', () => {
    const keycloakInstance = makeKeycloakInstanceStub();
    configure({
      keycloak: keycloakInstance as any,
      config: { ...SECURE_CONFIG, secureRoutes: [] },
    });

    let result: unknown;
    httpClient.get('/api/v1/resource').subscribe({ next: r => (result = r) });

    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });

  it('should forward request unchanged when secureRoutes is undefined', () => {
    const keycloakInstance = makeKeycloakInstanceStub();
    configure({
      keycloak: keycloakInstance as any,
      config: { url: 'https://sso.example.com', realm: 'r', clientId: 'c' },
    });

    let result: unknown;
    httpClient.get('/api/v1/resource').subscribe({ next: r => (result = r) });

    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });

  // ─── 7. Token attached to secured requests ───────────────────────────────────

  it('should call updateToken(30) and attach Authorization header for a URL in secureRoutes', done => {
    const keycloakInstance = makeKeycloakInstanceStub('my-access-token');
    configure({
      keycloak: keycloakInstance as any,
      config: SECURE_CONFIG,
    });

    httpClient.get('/api/v1/users').subscribe({
      next: result => {
        expect(keycloakInstance.updateToken).toHaveBeenCalledWith(30);
        expect(result).toEqual({ users: [] });
        done();
      },
    });

    // Flush after a microtask tick so the Promise from updateToken resolves first.
    setTimeout(() => {
      const req = httpMock.expectOne('/api/v1/users');
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-access-token');
      req.flush({ users: [] });
    });
  });

  // ─── 8. Origin-aware route matching (token-leak regression) ──────────────────

  it('should attach token to a same-origin absolute URL under the configured path prefix', done => {
    const keycloakInstance = makeKeycloakInstanceStub('token-xyz');
    configure({
      keycloak: keycloakInstance as any,
      config: { ...SECURE_CONFIG, secureRoutes: ['/api/v1'] },
    });

    const sameOriginUrl = `${window.location.origin}/api/v1/orders?page=1`;
    httpClient.get(sameOriginUrl).subscribe({ next: () => done() });

    setTimeout(() => {
      const req = httpMock.expectOne(sameOriginUrl);
      expect(req.request.headers.get('Authorization')).toBe('Bearer token-xyz');
      req.flush({});
    });
  });

  it('should NOT attach token to a foreign origin whose path merely contains the secureRoute', () => {
    // why: đây chính là lỗ rò token. Điều kiện cũ `req.url.includes(route)` khớp chuỗi con không
    // neo, không xét host — nên `https://evil.example.com/api/v1/collect` cũng nhận
    // `Authorization: Bearer <token>`, tức access token bị gửi thẳng sang host bên thứ ba.
    const keycloakInstance = makeKeycloakInstanceStub('token-xyz');
    configure({
      keycloak: keycloakInstance as any,
      config: { ...SECURE_CONFIG, secureRoutes: ['/api/v1'] },
    });

    const foreignUrl = 'https://evil.example.com/api/v1/collect';
    httpClient.get(foreignUrl).subscribe({ next: () => undefined });

    // Không khớp secureRoute nên interceptor forward NGAY, không chờ updateToken.
    const req = httpMock.expectOne(foreignUrl);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(keycloakInstance.updateToken).not.toHaveBeenCalled();
    req.flush({});
  });

  it('should attach token when secureRoutes declares an absolute origin and the URL matches it', done => {
    const keycloakInstance = makeKeycloakInstanceStub('origin-token');
    configure({
      keycloak: keycloakInstance as any,
      config: { ...SECURE_CONFIG, secureRoutes: ['https://api.example.com/v1'] },
    });

    httpClient.get('https://api.example.com/v1/users').subscribe({ next: () => done() });

    setTimeout(() => {
      const req = httpMock.expectOne('https://api.example.com/v1/users');
      expect(req.request.headers.get('Authorization')).toBe('Bearer origin-token');
      req.flush({});
    });
  });

  it('should NOT attach token to a lookalike host of the configured absolute origin', () => {
    const keycloakInstance = makeKeycloakInstanceStub('origin-token');
    configure({
      keycloak: keycloakInstance as any,
      config: { ...SECURE_CONFIG, secureRoutes: ['https://api.example.com/v1'] },
    });

    const lookalike = 'https://api.example.com.evil.tld/v1/users';
    httpClient.get(lookalike).subscribe({ next: () => undefined });

    const req = httpMock.expectOne(lookalike);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should NOT attach token to a sibling path that merely string-prefixes the secureRoute', () => {
    const keycloakInstance = makeKeycloakInstanceStub('token-xyz');
    configure({
      keycloak: keycloakInstance as any,
      config: { ...SECURE_CONFIG, secureRoutes: ['/api/v1'] },
    });

    httpClient.get('/api/v1beta/orders').subscribe({ next: () => undefined });

    const req = httpMock.expectOne('/api/v1beta/orders');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  // ─── 9. Multiple secureRoutes — first matching route attaches token ───────────

  it('should attach token when URL matches the second entry in secureRoutes', done => {
    const keycloakInstance = makeKeycloakInstanceStub('multi-token');
    configure({
      keycloak: keycloakInstance as any,
      config: { ...SECURE_CONFIG, secureRoutes: ['/api/v2', '/api/v1'] },
    });

    httpClient.get('/api/v1/items').subscribe({
      next: () => done(),
    });

    setTimeout(() => {
      const req = httpMock.expectOne('/api/v1/items');
      expect(req.request.headers.get('Authorization')).toBe('Bearer multi-token');
      req.flush({});
    });
  });
});
