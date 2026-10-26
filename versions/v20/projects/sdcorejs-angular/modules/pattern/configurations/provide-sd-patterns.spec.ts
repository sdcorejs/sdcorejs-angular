import { HttpClient, HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SD_PERMISSION_CONFIGURATION, SdPermissionService, type ISdPermissionConfiguration } from '@sdcorejs/angular/modules/permission';
import { patternApiSegments } from '../core/mock-api/mock-api.interceptor';
import { PATTERN_MOCK_TIMEOUT_MS, PatternMockApiState } from '../core/mock-api/mock-api.state';
import { PatternRoleStore } from '../core/permission/pattern-role.store';
import { SD_PATTERN_CONFIGURATION, type SdPatternConfiguration } from './pattern.configuration';
import { provideSdPatterns } from './provide-sd-patterns';

/** The environment injector of a `/pattern` route, under a root that already has HttpClient. */
function patternInjector(configuration?: SdPatternConfiguration): EnvironmentInjector {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  return createEnvironmentInjector([provideSdPatterns(configuration)], TestBed.inject(EnvironmentInjector));
}

describe('provideSdPatterns', () => {
  afterEach(() => {
    ['sd-pattern.mock-api', 'sd-pattern.role', 'sd-pattern.db.products'].forEach(key => sessionStorage.removeItem(key));
  });

  it('resolves the defaults and normalizes the base URL', () => {
    const configuration = patternInjector({ apiBaseUrl: '/api/pattern/' }).get(SD_PATTERN_CONFIGURATION);
    expect(configuration).toEqual({ mockApi: true, apiBaseUrl: '/api/pattern', latencyMs: 400, storage: 'session', forbiddenUrl: null });
  });

  it('refuses a base URL that is not root-relative or HTTP(S), or carries a query', () => {
    expect(() => provideSdPatterns({ apiBaseUrl: 'pattern-api' })).toThrowError(/root-relative/);
    expect(() => provideSdPatterns({ apiBaseUrl: '//cdn/pattern' })).toThrowError(/root-relative/);
    expect(() => provideSdPatterns({ apiBaseUrl: '/pattern-api?x=1' })).toThrowError(/query/);
  });

  it('answers pattern API requests from the mock and passes other requests to the host HttpClient', async () => {
    const http = patternInjector({ latencyMs: 0, storage: 'none' }).get(HttpClient);
    expect(await firstValueFrom(http.get('/pattern-api/products/1'))).toEqual(jasmine.objectContaining({ id: '1', code: 'SP-001' }));

    const other = firstValueFrom(http.get('/api/other'));
    TestBed.inject(HttpTestingController).expectOne('/api/other').flush({ ok: true });
    expect(await other).toEqual({ ok: true });
  });

  it('simulates 500, 404 and 403 on every mock request', async () => {
    const injector = patternInjector({ latencyMs: 0, storage: 'none' });
    const http = injector.get(HttpClient);
    const state = injector.get(PatternMockApiState);
    for (const failure of ['500', '404', '403'] as const) {
      state.setFailure(failure);
      const error = await firstValueFrom(http.get('/pattern-api/products/1')).catch((caught: HttpErrorResponse) => caught);
      expect((error as HttpErrorResponse).status).toBe(Number(failure));
    }
    expect(JSON.parse(sessionStorage.getItem('sd-pattern.mock-api')!)).toEqual({ latencyMs: 0, failure: '403' });
  });

  it('fails a simulated timeout with status 0 after the wait', fakeAsync(() => {
    const injector = patternInjector({ latencyMs: 0, storage: 'none' });
    injector.get(PatternMockApiState).setFailure('timeout');
    let status: number | undefined;
    injector
      .get(HttpClient)
      .get('/pattern-api/products/1')
      .subscribe({ error: (error: HttpErrorResponse) => (status = error.status) });
    tick(PATTERN_MOCK_TIMEOUT_MS - 1);
    expect(status).toBeUndefined();
    tick(1);
    expect(status).toBe(0);
  }));

  it('forces the read state of one resource for its list request only', async () => {
    const injector = patternInjector({ latencyMs: 0, storage: 'none' });
    const http = injector.get(HttpClient);
    const state = injector.get(PatternMockApiState);
    state.setReadOverride('products', { limit: 3 });
    expect((await firstValueFrom(http.get<{ total: number }>('/pattern-api/products'))).total).toBe(3);
    expect(await firstValueFrom(http.get('/pattern-api/products/5'))).toEqual(jasmine.objectContaining({ id: '5' }));

    state.setReadOverride('products', { mode: 'error' });
    const error = await firstValueFrom(http.get('/pattern-api/products')).catch((caught: HttpErrorResponse) => caught);
    expect((error as HttpErrorResponse).status).toBe(500);

    state.setReadOverride('products', { mode: 'loading' });
    let answered = false;
    const subscription = http.get('/pattern-api/products').subscribe(() => (answered = true));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(answered).toBeFalse();
    subscription.unsubscribe();
    state.setReadOverride('products', undefined);
  });

  it('goes back to the seed when the data is reset', async () => {
    const injector = patternInjector({ latencyMs: 0 });
    const http = injector.get(HttpClient);
    await firstValueFrom(http.post('/pattern-api/products', { code: 'SP-NEW', name: 'Mới', price: 1000 }));
    expect((await firstValueFrom(http.get<{ total: number }>('/pattern-api/products'))).total).toBe(37);
    await injector.get(PatternMockApiState).resetData();
    expect((await firstValueFrom(http.get<{ total: number }>('/pattern-api/products'))).total).toBe(36);
  });

  it('calls the real API when mockApi is false', async () => {
    const injector = patternInjector({ mockApi: false, apiBaseUrl: 'https://api.example.com/pattern' });
    expect(() => injector.get(PatternMockApiState)).toThrow();
    const request = firstValueFrom(injector.get(HttpClient).get('https://api.example.com/pattern/products/1'));
    TestBed.inject(HttpTestingController).expectOne('https://api.example.com/pattern/products/1').flush({ id: '1' });
    expect(await request).toEqual({ id: '1' });
  });

  it('gives the route its own permissions from the sample role and opens forbiddenUrl on a denial', async () => {
    const injector = patternInjector({ forbiddenUrl: '/forbidden' });
    const permission = injector.get(SdPermissionService);
    // Provided again at the route: the host's own SdPermissionService and configuration stay untouched.
    expect(injector.get(SdPermissionService, null, { self: true })).toBe(permission);

    injector.get(PatternRoleStore).set('viewer');
    await permission.loadAllPermissions();
    expect(permission.hasPermission('PATTERN_PRODUCT_R_LIST')).toBeTrue();
    expect(permission.hasPermission('PATTERN_PRODUCT_C_CREATE')).toBeFalse();

    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    (injector.get(SD_PERMISSION_CONFIGURATION) as ISdPermissionConfiguration).onForbiden?.();
    expect(navigate).toHaveBeenCalledOnceWith('/forbidden');
  });
});

describe('patternApiSegments', () => {
  it('returns the decoded path under the base URL, or null outside it', () => {
    expect(patternApiSegments('/pattern-api/products/a%2Fb?x=1', '/pattern-api')).toEqual(['products', 'a/b']);
    expect(patternApiSegments('/pattern-api', '/pattern-api/')).toEqual([]);
    expect(patternApiSegments('/pattern-apis/products', '/pattern-api')).toBeNull();
    expect(patternApiSegments('https://api.example.com/x', '/pattern-api')).toBeNull();
  });
});
