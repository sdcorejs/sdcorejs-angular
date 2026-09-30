import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, createEnvironmentInjector, EnvironmentInjector, inject, Injectable, InjectionToken, NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideSdApiConfiguration, SdApiHandlerRegistry } from './api-handler-registry';
import { ISdApiConfiguration, SD_API_CONFIG, SD_API_CONFIGURATION, SdApiHandler } from './api.model';
import { SdApiService } from './api.service';
import { SdHttpInterceptor } from './interceptors/api.interceptor';

/** Handler gắn header `X-Handler: <name>` để test biết handler nào đã chạy. */
const tagging = (name: string, hosts: string[], extra: Partial<SdApiHandler> = {}): SdApiHandler => ({
  hosts,
  intercept: (() => ({ setHeaders: { 'X-Handler': name } })) as any,
  ...extra,
});

@Component({ standalone: true, template: 'lazy' })
class LazyPageComponent {}

const LAZY_TENANT = new InjectionToken<string>('lazy tenant');

/** Configuration dạng class, inject dependency chỉ có trong scope lazy. */
@Injectable()
class LazyScopedApiConfiguration implements ISdApiConfiguration {
  readonly #tenant = inject(LAZY_TENANT);
  readonly handlers = [tagging(`module:${this.#tenant}`, ['https://gw.example/module'])];
}

/** Library NgModule được shell nạp bằng `loadChildren` — ca thật của One Portal. */
@NgModule({
  imports: [LazyPageComponent],
  providers: [{ provide: LAZY_TENANT, useValue: 'tenant-a' }, provideSdApiConfiguration(LazyScopedApiConfiguration)],
})
class LazyLibraryModule {}

function configure(routes: Routes = [], extraProviders: any[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting(),
      { provide: HTTP_INTERCEPTORS, useClass: SdHttpInterceptor, multi: true },
      provideRouter(routes),
      ...extraProviders,
    ],
  });
}

/** Gửi GET qua HttpClient root, trả về header `X-Handler` interceptor đã gắn (null nếu không handler nào chạy). */
function handlerFor(url: string): string | null {
  TestBed.inject(HttpClient).get(url).subscribe();
  const request = TestBed.inject(HttpTestingController).expectOne(url);
  request.flush({});
  return request.request.headers.get('X-Handler');
}

describe('SdApiHandlerRegistry / provideSdApiConfiguration', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('intercepts with a handler registered only in a lazy Route.providers once the route is active', async () => {
    configure([
      {
        path: 'lazy',
        providers: [provideSdApiConfiguration({ handlers: [tagging('lazy', ['https://gw.example/lazy'])] })],
        loadComponent: () => Promise.resolve(LazyPageComponent),
      },
    ]);
    expect(handlerFor('https://gw.example/lazy/items')).toBeNull();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/lazy');

    expect(handlerFor('https://gw.example/lazy/items')).toBe('lazy');
  });

  it('intercepts with a class configuration from a lazily loaded library NgModule, resolving its scoped dependencies', async () => {
    configure([{ path: 'lib', loadChildren: () => Promise.resolve(LazyLibraryModule) }]);
    expect(handlerFor('https://gw.example/module/a')).toBeNull();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/lib');

    expect(handlerFor('https://gw.example/module/a')).toBe('module:tenant-a');
  });

  it('stops intercepting once the scope injector that registered the handler is destroyed', () => {
    configure();
    const scope = createEnvironmentInjector(
      [provideSdApiConfiguration({ handlers: [tagging('scoped', ['https://gw.example/scoped'])] })],
      TestBed.inject(EnvironmentInjector)
    );
    expect(handlerFor('https://gw.example/scoped/1')).toBe('scoped');
    expect(TestBed.inject(SdApiHandlerRegistry).configurations().length).toBe(1);

    scope.destroy();

    expect(handlerFor('https://gw.example/scoped/1')).toBeNull();
    expect(TestBed.inject(SdApiHandlerRegistry).configurations()).toEqual([]);
  });

  for (const lazyFirst of [false, true]) {
    it(`lets root and lazy handlers coexist with the longest matching prefix winning (${lazyFirst ? 'lazy' : 'root'} registered with the shorter prefix)`, () => {
      const shortHost = 'https://gw.example';
      const longHost = 'https://gw.example/bpm';
      configure(
        [],
        [{ provide: SD_API_CONFIG, multi: true, useValue: { handlers: [tagging('root', [lazyFirst ? longHost : shortHost])] } }]
      );
      const scope = createEnvironmentInjector(
        [provideSdApiConfiguration({ handlers: [tagging('lazy', [lazyFirst ? shortHost : longHost])] })],
        TestBed.inject(EnvironmentInjector)
      );

      const longOwner = lazyFirst ? 'root' : 'lazy';
      const shortOwner = lazyFirst ? 'lazy' : 'root';
      expect(handlerFor('https://gw.example/bpm/tasks')).toBe(longOwner);
      expect(handlerFor('https://gw.example/crm/leads')).toBe(shortOwner);
      scope.destroy();
    });
  }

  it('keeps registration order as the tie-break between equally long prefixes', () => {
    configure(
      [],
      [
        { provide: SD_API_CONFIG, multi: true, useValue: { handlers: [tagging('first', ['https://gw.example/a'])] } },
        { provide: SD_API_CONFIG, multi: true, useValue: { handlers: [tagging('second', ['https://gw.example/a'])] } },
      ]
    );
    expect(handlerFor('https://gw.example/a/x')).toBe('first');
  });

  it('uses lazily registered handlers in SdApiService too (mapResponse)', async () => {
    configure();
    const scope = createEnvironmentInjector(
      [
        provideSdApiConfiguration({
          handlers: [tagging('svc', ['https://gw.example/svc'], { mapResponse: ((body: any) => body.data) as any })],
        }),
      ],
      TestBed.inject(EnvironmentInjector)
    );
    const result = TestBed.inject(SdApiService).get('https://gw.example/svc/item', { autoCache: false });
    TestBed.inject(HttpTestingController).expectOne('https://gw.example/svc/item').flush({ data: 'mapped' });
    await expectAsync(result).toBeResolvedTo('mapped');
    scope.destroy();
  });

  it('resolves SD_API_CONFIG and SD_API_CONFIGURATION to the same handler list', () => {
    expect(SD_API_CONFIGURATION).toBe(SD_API_CONFIG);
    configure(
      [],
      [
        { provide: SD_API_CONFIGURATION, multi: true, useValue: { handlers: [tagging('new-name', ['https://gw.example/new'])] } },
        { provide: SD_API_CONFIG, multi: true, useValue: { handlers: [tagging('old-name', ['https://gw.example/old'])] } },
      ]
    );
    expect(TestBed.inject(SD_API_CONFIG) as unknown as ISdApiConfiguration[]).toEqual(
      TestBed.inject(SD_API_CONFIGURATION) as unknown as ISdApiConfiguration[]
    );
    expect(handlerFor('https://gw.example/new/1')).toBe('new-name');
    expect(handlerFor('https://gw.example/old/1')).toBe('old-name');
  });

  // why: host trống đã fail closed trong `sdMatchesSecureRoute` (bước này đã có ở @sdcorejs/angular); chỉ khẳng định
  // nó không nuốt request của handler khác và không làm hỏng việc chọn prefix dài nhất.
  describe('blank hosts', () => {
    it('matches nothing through a blank host and leaves other handlers untouched', () => {
      configure(
        [],
        [
          { provide: SD_API_CONFIG, multi: true, useValue: { handlers: [tagging('blank', ['', '   '])] } },
          { provide: SD_API_CONFIG, multi: true, useValue: { handlers: [tagging('real', ['https://gw.example/real'])] } },
        ]
      );
      expect(handlerFor('https://gw.example/real/1')).toBe('real');
      expect(handlerFor('https://anything.example/x')).toBeNull();
    });

    it('keeps the real host of a handler that also lists a blank one', () => {
      configure([], [{ provide: SD_API_CONFIG, multi: true, useValue: { handlers: [tagging('gw', ['', 'https://gw.example'])] } }]);
      expect(handlerFor('https://gw.example/x')).toBe('gw');
      expect(handlerFor('https://other.example/x')).toBeNull();
    });
  });
});
