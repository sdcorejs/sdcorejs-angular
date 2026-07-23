import { DOCUMENT } from '@angular/common';
import { EnvironmentInjector, PLATFORM_ID, RendererFactory2, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SdLoadingService } from './loading.service';

const STYLE_SELECTOR = 'style[data-sd-loading-styles]';

class RejectedThenable<T> implements PromiseLike<T> {
  constructor(private readonly reason: unknown) {}

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.reject(this.reason).then(onfulfilled, onrejected);
  }
}

describe('SdLoadingService', () => {
  let service: SdLoadingService;
  const testHosts = new Set<HTMLElement>();
  const testInjectors = new Set<EnvironmentInjector>();

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdLoadingService);
  });

  afterEach(() => {
    for (const injector of testInjectors) injector.destroy();
    testInjectors.clear();
    TestBed.resetTestingModule();
    for (const host of testHosts) host.remove();
    testHosts.clear();
    document.body.removeAttribute('aria-busy');
    document.body.querySelectorAll('.sd-loading').forEach(overlay => overlay.remove());
    document.head.querySelectorAll(STYLE_SELECTOR).forEach(style => style.remove());
  });

  function createHost(className = ''): HTMLDivElement {
    const host = document.createElement('div');
    host.className = className;
    document.body.appendChild(host);
    testHosts.add(host);
    return host;
  }

  function createServiceInjector(): EnvironmentInjector {
    const injector = createEnvironmentInjector(
      [{ provide: SdLoadingService, useClass: SdLoadingService }],
      TestBed.inject(EnvironmentInjector)
    );
    testInjectors.add(injector);
    return injector;
  }

  function destroyServiceInjector(injector: EnvironmentInjector): void {
    injector.destroy();
    testInjectors.delete(injector);
  }

  it('is created and reports a matching idle host as not loading', () => {
    expect(service).toBeTruthy();
    expect(service.isLoading()).toBeFalse();
    expect(service.isLoading('.missing-loading-host')).toBeNull();
  });

  it('keeps the legacy start, stop, and isLoading callbacks bound to the service', () => {
    const { start, stop, isLoading } = service;

    const ref = start();
    expect(isLoading()).toBe(document.body);
    stop();
    expect(ref.closed).toBeTrue();
    expect(isLoading()).toBeFalse();
  });

  it('returns an idempotent ref and keeps one overlay until every overlapping ref closes', () => {
    const first = service.start();
    const second = service.start();

    expect(first.closed).toBeFalse();
    expect(second.closed).toBeFalse();
    expect(document.body.querySelectorAll(':scope > .sd-loading').length).toBe(1);

    second.close();
    second.close();
    expect(second.closed).toBeTrue();
    expect(first.closed).toBeFalse();
    expect(service.isLoading()).toBe(document.body);

    first.close();
    expect(first.closed).toBeTrue();
    expect(service.isLoading()).toBeFalse();
    expect(document.body.querySelector(':scope > .sd-loading')).toBeNull();
  });

  it('supports out-of-order nested handle closure', () => {
    const first = service.start();
    const second = service.start();
    const third = service.start();

    second.close();
    first.close();
    expect(service.isLoading()).toBe(document.body);

    third.close();
    expect(service.isLoading()).toBeFalse();
  });

  it('keeps legacy start calls reference-counted across stop calls', () => {
    service.start();
    service.start();

    service.stop();
    expect(service.isLoading()).toBe(document.body);
    expect(document.body.querySelectorAll(':scope > .sd-loading').length).toBe(1);

    service.stop();
    expect(service.isLoading()).toBeFalse();
  });

  it('makes legacy stop consume one start ownership without double-releasing a later handle', () => {
    const first = service.start();
    const second = service.start();

    service.stop();
    expect(first.closed).toBeTrue();
    expect(second.closed).toBeFalse();

    first.close();
    expect(service.isLoading()).toBe(document.body);

    second.close();
    expect(service.isLoading()).toBeFalse();
  });

  it('shares one host overlay and global aria-busy lifetime across service instances', () => {
    const host = createHost('shared-loading-host');
    host.setAttribute('aria-busy', 'false');
    const firstInjector = createServiceInjector();
    const secondInjector = createServiceInjector();
    const firstService = firstInjector.get(SdLoadingService);
    const secondService = secondInjector.get(SdLoadingService);

    const firstRef = firstService.start('.shared-loading-host');
    const secondRef = secondService.start('.shared-loading-host');

    expect(host.querySelectorAll(':scope > .sd-loading').length).toBe(1);
    expect(host.getAttribute('aria-busy')).toBe('true');
    expect(firstService.isLoading('.shared-loading-host')).toBe(host);
    expect(secondService.isLoading('.shared-loading-host')).toBe(host);

    secondRef.close();
    expect(host.querySelectorAll(':scope > .sd-loading').length).toBe(1);
    expect(host.getAttribute('aria-busy')).toBe('true');

    firstRef.close();
    expect(host.querySelector(':scope > .sd-loading')).toBeNull();
    expect(host.getAttribute('aria-busy')).toBe('false');
  });

  it('destroy releases only the service contributions in either service order', () => {
    const firstHost = createHost('first-shared-loading-host');
    const firstAInjector = createServiceInjector();
    const firstBInjector = createServiceInjector();
    firstAInjector.get(SdLoadingService).start('.first-shared-loading-host');
    firstBInjector.get(SdLoadingService).start('.first-shared-loading-host');

    destroyServiceInjector(firstAInjector);
    expect(firstHost.querySelectorAll(':scope > .sd-loading').length).toBe(1);
    expect(firstHost.getAttribute('aria-busy')).toBe('true');
    destroyServiceInjector(firstBInjector);
    expect(firstHost.querySelector(':scope > .sd-loading')).toBeNull();
    expect(firstHost.hasAttribute('aria-busy')).toBeFalse();

    const secondHost = createHost('second-shared-loading-host');
    const secondAInjector = createServiceInjector();
    const secondBInjector = createServiceInjector();
    secondAInjector.get(SdLoadingService).start('.second-shared-loading-host');
    secondBInjector.get(SdLoadingService).start('.second-shared-loading-host');

    destroyServiceInjector(secondBInjector);
    expect(secondHost.querySelectorAll(':scope > .sd-loading').length).toBe(1);
    expect(secondHost.getAttribute('aria-busy')).toBe('true');
    destroyServiceInjector(secondAInjector);
    expect(secondHost.querySelector(':scope > .sd-loading')).toBeNull();
    expect(secondHost.hasAttribute('aria-busy')).toBeFalse();
  });

  it('keeps handle close and stop ownership isolated between service instances', () => {
    const host = createHost('shared-loading-host');
    const firstInjector = createServiceInjector();
    const secondInjector = createServiceInjector();
    const firstService = firstInjector.get(SdLoadingService);
    const secondService = secondInjector.get(SdLoadingService);
    const firstRef = firstService.start('.shared-loading-host');
    const secondRef = secondService.start('.shared-loading-host');

    firstService.stop('.shared-loading-host');
    firstService.stop('.shared-loading-host');

    expect(firstRef.closed).toBeTrue();
    expect(secondRef.closed).toBeFalse();
    expect(host.querySelectorAll(':scope > .sd-loading').length).toBe(1);

    secondRef.close();
    expect(host.querySelector(':scope > .sd-loading')).toBeNull();
  });

  it('treats stop without a matching start as a no-op', () => {
    expect(() => service.stop()).not.toThrow();
    expect(service.isLoading()).toBeFalse();
  });

  it('captures every host matched at start and releases those exact hosts', () => {
    const first = createHost('loading-target');
    const second = createHost('loading-target');
    const laterMatch = createHost();

    const ref = service.start('.loading-target');
    first.classList.remove('loading-target');
    laterMatch.classList.add('loading-target');

    expect(first.querySelector(':scope > .sd-loading')).toBeTruthy();
    expect(second.querySelector(':scope > .sd-loading')).toBeTruthy();
    expect(laterMatch.querySelector(':scope > .sd-loading')).toBeNull();

    ref.close();
    expect(first.querySelector(':scope > .sd-loading')).toBeNull();
    expect(second.querySelector(':scope > .sd-loading')).toBeNull();
    expect(laterMatch.querySelector(':scope > .sd-loading')).toBeNull();
  });

  it('stop closes the oldest exact-selector start after selector membership changes', () => {
    const host = createHost('moving-loading-host');
    host.setAttribute('aria-busy', 'false');
    const first = service.start('.moving-loading-host');
    const second = service.start('.moving-loading-host');
    host.classList.remove('moving-loading-host');

    service.stop('.moving-loading-host');
    expect(first.closed).toBeTrue();
    expect(second.closed).toBeFalse();
    expect(host.querySelectorAll(':scope > .sd-loading').length).toBe(1);
    expect(host.getAttribute('aria-busy')).toBe('true');

    service.stop('.moving-loading-host');
    expect(second.closed).toBeTrue();
    expect(host.querySelector(':scope > .sd-loading')).toBeNull();
    expect(host.getAttribute('aria-busy')).toBe('false');
  });

  it('stop closes an exact-selector start after its host is detached', () => {
    const host = createHost('detached-loading-host');
    const ref = service.start('.detached-loading-host');
    host.remove();

    service.stop('.detached-loading-host');

    expect(ref.closed).toBeTrue();
    expect(host.querySelector(':scope > .sd-loading')).toBeNull();
    expect(host.hasAttribute('aria-busy')).toBeFalse();
  });

  it('returns an already-closed ref when the selector matches no hosts', () => {
    const ref = service.start('.missing-loading-host');

    expect(ref.closed).toBeTrue();
    expect(() => ref.close()).not.toThrow();
  });

  it('legacy stop decrements every host that currently matches the selector', () => {
    const first = createHost('loading-target');
    const second = createHost('loading-target');
    service.start('.loading-target');
    service.start('.loading-target');

    service.stop('.loading-target');
    expect(first.querySelectorAll(':scope > .sd-loading').length).toBe(1);
    expect(second.querySelectorAll(':scope > .sd-loading').length).toBe(1);

    service.stop('.loading-target');
    expect(first.querySelector(':scope > .sd-loading')).toBeNull();
    expect(second.querySelector(':scope > .sd-loading')).toBeNull();
  });

  it('exact-selector stop releases every original host captured by its oldest handle', () => {
    const first = createHost('loading-target');
    const second = createHost('loading-target');
    const ref = service.start('.loading-target');
    first.classList.remove('loading-target');

    service.stop('.loading-target');
    expect(first.querySelector(':scope > .sd-loading')).toBeNull();
    expect(second.querySelector(':scope > .sd-loading')).toBeNull();
    expect(ref.closed).toBeTrue();
  });

  it('falls back to this service oldest contribution on each current host for a different selector', () => {
    const first = createHost('source-loading-host fallback-loading-host');
    const second = createHost('source-loading-host fallback-loading-host');
    const ref = service.start('.source-loading-host');

    service.stop('.fallback-loading-host');

    expect(ref.closed).toBeTrue();
    expect(first.querySelector(':scope > .sd-loading')).toBeNull();
    expect(second.querySelector(':scope > .sd-loading')).toBeNull();
  });

  it('creates accessible, id-free overlay markup and restores host aria-busy', () => {
    const host = createHost('loading-target');
    host.setAttribute('aria-busy', 'false');

    const ref = service.start('.loading-target');
    const overlay = host.querySelector<HTMLElement>(':scope > .sd-loading');

    expect(host.getAttribute('aria-busy')).toBe('true');
    expect(overlay).toBeTruthy();
    expect(overlay?.hasAttribute('id')).toBeFalse();
    expect(overlay?.getAttribute('role')).toBe('status');
    expect(overlay?.getAttribute('aria-live')).toBe('polite');
    expect(overlay?.querySelector(':scope > .sd-loading-spinner')).toBeTruthy();

    ref.close();
    expect(host.getAttribute('aria-busy')).toBe('false');
  });

  it('does not overwrite aria-busy when the host changes it while loading', () => {
    const host = createHost('loading-target');
    const ref = service.start('.loading-target');
    host.setAttribute('aria-busy', 'false');

    ref.close();

    expect(host.getAttribute('aria-busy')).toBe('false');
  });

  it('injects one identifiable stylesheet across repeated starts and hosts', () => {
    createHost('loading-target');
    createHost('loading-target');

    service.start();
    service.start('.loading-target');
    service.start('.loading-target');

    const styles = document.head.querySelectorAll(STYLE_SELECTOR);
    expect(styles.length).toBe(1);
    expect(styles[0].textContent).toContain('@keyframes sd-loading-spin');
    expect(styles[0].textContent).toContain('.sd-loading-spinner');
  });

  it('repairs a removed overlay without duplicating global host state', () => {
    const host = createHost('repair-loading-host');
    host.setAttribute('aria-busy', 'false');
    const first = service.start('.repair-loading-host');
    const removedOverlay = host.querySelector<HTMLElement>(':scope > .sd-loading');
    removedOverlay?.remove();

    expect(service.isLoading('.repair-loading-host')).toBeFalse();

    const second = service.start('.repair-loading-host');
    expect(service.isLoading('.repair-loading-host')).toBe(host);
    expect(host.querySelectorAll(':scope > .sd-loading').length).toBe(1);

    second.close();
    expect(host.querySelectorAll(':scope > .sd-loading').length).toBe(1);
    expect(host.getAttribute('aria-busy')).toBe('true');
    first.close();
    expect(host.querySelector(':scope > .sd-loading')).toBeNull();
    expect(host.getAttribute('aria-busy')).toBe('false');
  });

  it('repairs a reparented overlay and removes it from the foreign parent', () => {
    const host = createHost('repair-loading-host');
    const foreignParent = createHost('foreign-loading-parent');
    const first = service.start('.repair-loading-host');
    const overlay = host.querySelector<HTMLElement>(':scope > .sd-loading');
    if (overlay) foreignParent.appendChild(overlay);

    expect(service.isLoading('.repair-loading-host')).toBeFalse();

    const second = service.start('.repair-loading-host');
    expect(host.querySelectorAll(':scope > .sd-loading').length).toBe(1);
    expect(foreignParent.querySelector('.sd-loading')).toBeNull();

    first.close();
    second.close();
    expect(host.querySelector(':scope > .sd-loading')).toBeNull();
    expect(host.hasAttribute('aria-busy')).toBeFalse();
  });

  it('shares its owned stylesheet safely across service instances', () => {
    const firstHost = createHost('first-loading-host');
    const secondHost = createHost('second-loading-host');
    const firstInjector = createServiceInjector();
    const secondInjector = createServiceInjector();
    const firstService = firstInjector.get(SdLoadingService);
    const secondService = secondInjector.get(SdLoadingService);

    firstService.start('.first-loading-host');
    secondService.start('.second-loading-host');
    expect(document.head.querySelectorAll(STYLE_SELECTOR).length).toBe(1);

    destroyServiceInjector(firstInjector);
    expect(firstHost.querySelector('.sd-loading')).toBeNull();
    expect(secondHost.querySelector('.sd-loading')).toBeTruthy();
    expect(document.head.querySelectorAll(STYLE_SELECTOR).length).toBe(1);

    destroyServiceInjector(secondInjector);
    expect(secondHost.querySelector('.sd-loading')).toBeNull();
    expect(document.head.querySelector(STYLE_SELECTOR)).toBeNull();
  });

  it('augments and later restores a pre-existing partial stylesheet', () => {
    const externalStyle = document.createElement('style');
    externalStyle.setAttribute('data-sd-loading-styles', '');
    const externalContent = '.external-loading-rule { color: rebeccapurple; }';
    externalStyle.textContent = externalContent;
    document.head.appendChild(externalStyle);
    const injector = createServiceInjector();
    const ownedService = injector.get(SdLoadingService);

    ownedService.start();
    expect(externalStyle.textContent).toContain(externalContent);
    expect(externalStyle.textContent).toContain('.sd-loading {');
    expect(externalStyle.textContent).toContain('.sd-loading-spinner');
    expect(externalStyle.textContent).toContain('@keyframes sd-loading-spin');

    destroyServiceInjector(injector);

    expect(externalStyle.isConnected).toBeTrue();
    expect(externalStyle.textContent).toBe(externalContent);
  });

  it('retains external stylesheet augmentation until the last service owner in either destroy order', () => {
    const externalStyle = document.createElement('style');
    externalStyle.setAttribute('data-sd-loading-styles', '');
    const externalContent = '.external-loading-rule { color: teal; }';
    externalStyle.textContent = externalContent;
    document.head.appendChild(externalStyle);
    const firstInjector = createServiceInjector();
    const secondInjector = createServiceInjector();
    firstInjector.get(SdLoadingService).start();
    secondInjector.get(SdLoadingService).start();

    destroyServiceInjector(firstInjector);
    expect(externalStyle.textContent).toContain('@keyframes sd-loading-spin');
    destroyServiceInjector(secondInjector);
    expect(externalStyle.textContent).toBe(externalContent);

    const thirdInjector = createServiceInjector();
    const fourthInjector = createServiceInjector();
    thirdInjector.get(SdLoadingService).start();
    fourthInjector.get(SdLoadingService).start();

    destroyServiceInjector(fourthInjector);
    expect(externalStyle.textContent).toContain('@keyframes sd-loading-spin');
    destroyServiceInjector(thirdInjector);
    expect(externalStyle.textContent).toBe(externalContent);
  });

  it('rebinds a removed external stylesheet while preserving owners and external content', () => {
    const externalStyle = document.createElement('style');
    externalStyle.setAttribute('data-sd-loading-styles', '');
    const externalContent = '.external-loading-rule { color: navy; }';
    externalStyle.textContent = externalContent;
    document.head.appendChild(externalStyle);
    const firstInjector = createServiceInjector();
    const secondInjector = createServiceInjector();
    const firstService = firstInjector.get(SdLoadingService);
    const secondService = secondInjector.get(SdLoadingService);
    firstService.start();
    secondService.start();

    externalStyle.remove();
    firstService.start();

    const repairedStyles = document.head.querySelectorAll(STYLE_SELECTOR);
    expect(repairedStyles.length).toBe(1);
    expect(repairedStyles[0].textContent).toContain('.sd-loading-spinner');
    expect(repairedStyles[0].textContent).toContain('@keyframes sd-loading-spin');
    expect(externalStyle.textContent).toBe(externalContent);

    destroyServiceInjector(firstInjector);
    expect(document.head.querySelectorAll(STYLE_SELECTOR).length).toBe(1);
    destroyServiceInjector(secondInjector);
    expect(document.head.querySelector(STYLE_SELECTOR)).toBeNull();
  });

  it('run starts before invoking a task and closes after resolution', async () => {
    const result = await service.run(async () => {
      expect(service.isLoading()).toBe(document.body);
      return 'result';
    });

    expect(result).toBe('result');
    expect(service.isLoading()).toBeFalse();
  });

  it('run accepts a synchronous callback with inferred result type', async () => {
    const result: number = await service.run(() => 42);

    expect(result).toBe(42);
    expect(service.isLoading()).toBeFalse();
  });

  it('run scopes loading to its selector', async () => {
    const host = createHost('loading-target');

    await service.run(async () => {
      expect(service.isLoading('.loading-target')).toBe(host);
      expect(service.isLoading()).toBeFalse();
    }, '.loading-target');

    expect(service.isLoading('.loading-target')).toBeFalse();
  });

  it('run preserves a rejected task error and always closes', async () => {
    const expected = new Error('rejected task');

    await expectAsync(service.run(() => Promise.reject(expected))).toBeRejectedWith(expected);
    expect(service.isLoading()).toBeFalse();
  });

  it('run preserves a rejected custom thenable error and always closes', async () => {
    const expected = new Error('rejected thenable');

    await expectAsync(service.run(() => new RejectedThenable<never>(expected))).toBeRejectedWith(expected);
    expect(service.isLoading()).toBeFalse();
  });

  it('run preserves a synchronous task error and always closes', async () => {
    const expected = new Error('synchronous task');

    await expectAsync(
      service.run(() => {
        throw expected;
      })
    ).toBeRejectedWith(expected);
    expect(service.isLoading()).toBeFalse();
  });

  it('run accepts an already-created promise', async () => {
    const result = await service.run(Promise.resolve(42));

    expect(result).toBe(42);
    expect(service.isLoading()).toBeFalse();
  });

  it('destroy removes live overlays, closes refs, and removes its owned stylesheet', async () => {
    const host = createHost('loading-target');
    const injector = createServiceInjector();
    const ownedService = injector.get(SdLoadingService);
    const bodyRef = ownedService.start();
    const hostRef = ownedService.start('.loading-target');

    destroyServiceInjector(injector);

    expect(bodyRef.closed).toBeTrue();
    expect(hostRef.closed).toBeTrue();
    expect(document.body.querySelector(':scope > .sd-loading')).toBeNull();
    expect(host.querySelector(':scope > .sd-loading')).toBeNull();
    expect(document.head.querySelector(STYLE_SELECTOR)).toBeNull();
    expect(() => bodyRef.close()).not.toThrow();

    const lateRef = ownedService.start();
    expect(lateRef.closed).toBeTrue();
    expect(ownedService.isLoading()).toBeNull();
    await expectAsync(ownedService.run(() => Promise.resolve('after-destroy'))).toBeResolvedTo('after-destroy');
  });
});

describe('SdLoadingService on the server', () => {
  let serverDocument: Document;
  let rendererFactory: jasmine.SpyObj<RendererFactory2>;
  let serverInjector: EnvironmentInjector;

  beforeEach(() => {
    serverDocument = document.implementation.createHTMLDocument('server');
    spyOn(serverDocument, 'querySelectorAll').and.throwError('server document queried');
    spyOn(serverDocument, 'createElement').and.throwError('server document mutated');
    spyOn(serverDocument.head, 'appendChild').and.throwError('server document mutated');
    rendererFactory = jasmine.createSpyObj<RendererFactory2>('RendererFactory2', ['createRenderer']);
    rendererFactory.createRenderer.and.throwError('server renderer created');

    serverInjector = createEnvironmentInjector(
      [
        SdLoadingService,
        { provide: DOCUMENT, useValue: serverDocument },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: RendererFactory2, useValue: rendererFactory },
      ],
      TestBed.inject(EnvironmentInjector)
    );
  });

  afterEach(() => serverInjector.destroy());

  it('does not create a renderer or access the DOM and returns no-op state', () => {
    const serverService = serverInjector.get(SdLoadingService);
    const ref = serverService.start();

    expect(ref.closed).toBeTrue();
    expect(serverService.isLoading()).toBeNull();
    expect(() => serverService.stop()).not.toThrow();
    expect(rendererFactory.createRenderer).not.toHaveBeenCalled();
  });

  it('still executes run tasks without accessing the DOM', async () => {
    const serverService = serverInjector.get(SdLoadingService);

    await expectAsync(serverService.run(() => Promise.resolve('server-result'))).toBeResolvedTo('server-result');
    expect(rendererFactory.createRenderer).not.toHaveBeenCalled();
  });
});
