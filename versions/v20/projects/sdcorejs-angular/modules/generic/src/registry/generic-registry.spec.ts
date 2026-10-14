import { EnvironmentInjector, Injectable, InjectionToken, createEnvironmentInjector, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SdGenericAdapter } from '../models';
import { SD_GENERIC_SCOPE } from './generic-registry';
import { provideSdGeneric, provideSdGenericEntity } from './provide-sd-generic';

const adapter = (module: string, tag: string): SdGenericAdapter & { tag: string } => ({
  module,
  tag,
  schema: async () => ({ version: 1, module, entity: 'x', general: { label: 'X', properties: [] } }),
  query: async () => ({ items: [], total: 0 }),
  detail: async () => ({}),
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => undefined,
});

const BASE_URL = new InjectionToken<string>('BASE_URL');

@Injectable()
class HttpLikeAdapter implements SdGenericAdapter {
  readonly module = 'crm';
  readonly url = inject(BASE_URL);
  schema = async () => ({ version: 1 as const, module: 'crm', entity: 'x', general: { label: 'X', properties: [] } });
  query = async () => ({ items: [], total: 0 });
  detail = async () => ({});
  create = async () => ({});
  update = async () => ({});
  delete = async () => undefined;
}

describe('generic registry', () => {
  let root: EnvironmentInjector;
  const tagOf = (injector: EnvironmentInjector, module: string) =>
    (injector.get(SD_GENERIC_SCOPE).adapter(module) as { tag?: string } | undefined)?.tag;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: BASE_URL, useValue: '/api' },
        provideSdGeneric({ adapters: [adapter('tms', 'root-tms'), adapter('wms', 'root-wms'), HttpLikeAdapter] }),
      ],
    });
    root = TestBed.inject(EnvironmentInjector);
  });

  it('resolves adapters by module and creates adapter classes through DI', () => {
    const scope = root.get(SD_GENERIC_SCOPE);
    expect(tagOf(root, 'tms')).toBe('root-tms');
    expect((scope.adapter('crm') as HttpLikeAdapter).url).toBe('/api');
    expect(scope.adapter('unknown')).toBeUndefined();
  });

  it('lets the nearest injector win and falls back to its parents (AC-002)', () => {
    const lazy = createEnvironmentInjector([provideSdGeneric({ adapters: [adapter('tms', 'lazy-tms')] })], root);
    expect(tagOf(lazy, 'tms')).toBe('lazy-tms');
    expect(tagOf(lazy, 'wms')).withContext('not declared in the lazy injector').toBe('root-wms');
    expect(tagOf(root, 'tms')).withContext('the root keeps its own adapter').toBe('root-tms');
  });

  it('throws while the injector is created when a module is registered twice in it (AC-003)', () => {
    expect(() =>
      createEnvironmentInjector([provideSdGeneric({ adapters: [adapter('tms', 'a'), adapter('tms', 'b')] })], root)
    ).toThrowError(/"tms"/);
    expect(() =>
      createEnvironmentInjector(
        [provideSdGeneric({ adapters: [adapter('fms', 'a')] }), provideSdGeneric({ adapters: [adapter('fms', 'b')] })],
        root
      )
    ).toThrowError(/"fms"/);
  });

  it('resolves entity configurations by module and entity, nearest first', () => {
    const lazy = createEnvironmentInjector(
      [
        provideSdGenericEntity({ module: 'tms', entity: 'order', hiddenDefaults: ['delete'] }),
        provideSdGenericEntity({ module: 'tms', entity: 'trip' }),
      ],
      root
    );
    const nested = createEnvironmentInjector(
      [provideSdGenericEntity({ module: 'tms', entity: 'order', hiddenDefaults: ['import'] })],
      lazy
    );
    expect(nested.get(SD_GENERIC_SCOPE).entity('tms', 'order')?.hiddenDefaults).toEqual(['import']);
    expect(nested.get(SD_GENERIC_SCOPE).entity('tms', 'trip')).toBeDefined();
    expect(lazy.get(SD_GENERIC_SCOPE).entity('tms', 'order')?.hiddenDefaults).toEqual(['delete']);
    expect(root.get(SD_GENERIC_SCOPE).entity('tms', 'order')).toBeUndefined();
    expect(() =>
      createEnvironmentInjector(
        [provideSdGenericEntity({ module: 'a', entity: 'b' }), provideSdGenericEntity({ module: 'a', entity: 'b' })],
        root
      )
    ).toThrowError(/a\.b/);
  });

  it('reads the permission option from the nearest scope that declares it', () => {
    expect(root.get(SD_GENERIC_SCOPE).permissionEnabled()).toBeTrue();
    const off = createEnvironmentInjector([provideSdGeneric({ adapters: [], permission: false })], root);
    const inherit = createEnvironmentInjector([provideSdGenericEntity({ module: 'tms', entity: 'order' })], off);
    const on = createEnvironmentInjector([provideSdGeneric({ adapters: [], permission: true })], off);
    expect(off.get(SD_GENERIC_SCOPE).permissionEnabled()).toBeFalse();
    expect(inherit.get(SD_GENERIC_SCOPE).permissionEnabled()).toBeFalse();
    expect(on.get(SD_GENERIC_SCOPE).permissionEnabled()).toBeTrue();
  });
});
