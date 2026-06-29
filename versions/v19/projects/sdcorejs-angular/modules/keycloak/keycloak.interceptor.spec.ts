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

  // ─── 8. Substring matching — partial URL match ───────────────────────────────

  it('should attach token when secureRoute substring appears anywhere in the URL', done => {
    const keycloakInstance = makeKeycloakInstanceStub('token-xyz');
    configure({
      keycloak: keycloakInstance as any,
      config: { ...SECURE_CONFIG, secureRoutes: ['/api/v1'] },
    });

    httpClient.get('https://backend.example.com/api/v1/orders?page=1').subscribe({
      next: () => done(),
    });

    setTimeout(() => {
      const req = httpMock.expectOne('https://backend.example.com/api/v1/orders?page=1');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token-xyz');
      req.flush({});
    });
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
