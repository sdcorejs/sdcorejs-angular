import { TestBed } from '@angular/core/testing';
import type { SdGenericAdapter, SdGenericSchema, SdGenericSchemaStore } from '../models';
import { provideSdGeneric, provideSdGenericEntity } from '../registry/provide-sd-generic';
import { SdGenericSchemaService } from './generic-schema.service';

const base = (): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'code', label: 'Code', dataType: 'string' },
      { key: 'name', label: 'Name', dataType: 'string' },
    ],
  },
});

const STORAGE_KEY = 'sd-generic:configuration:tms.order';

describe('SdGenericSchemaService', () => {
  let adapter: SdGenericAdapter;
  let store: jasmine.SpyObj<SdGenericSchemaStore> | undefined;

  const setup = (options: { store?: boolean; entitySchema?: (schema: SdGenericSchema) => SdGenericSchema } = {}) => {
    store = options.store ? jasmine.createSpyObj<SdGenericSchemaStore>('store', ['get', 'set']) : undefined;
    store?.get.and.resolveTo(null);
    store?.set.and.resolveTo();
    adapter = {
      module: 'tms',
      schema: jasmine.createSpy('schema').and.callFake(async () => base()),
      query: async () => ({ items: [], total: 0 }),
      detail: async () => ({}),
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => undefined,
      ...(store ? { schemaStore: store } : {}),
    };
    TestBed.configureTestingModule({
      providers: [
        provideSdGeneric({ adapters: [adapter] }),
        ...(options.entitySchema ? [provideSdGenericEntity({ module: 'tms', entity: 'order', schema: options.entitySchema })] : []),
        SdGenericSchemaService,
      ],
    });
    return TestBed.inject(SdGenericSchemaService);
  };

  beforeEach(() => localStorage.removeItem(STORAGE_KEY));
  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('uses the adapter schema when nothing is stored (AC-001)', async () => {
    const service = setup({ store: true });
    const resolved = await service.resolve('tms', 'order');
    expect(resolved.schema).toEqual(base());
    expect(resolved.invalid).toBeFalse();
    expect(store!.get).toHaveBeenCalledWith('order');
  });

  it('applies the entity schema function, then the stored configuration (AC-004)', async () => {
    const entitySchema = (schema: SdGenericSchema) => ({
      ...schema,
      general: {
        ...schema.general,
        properties: schema.general.properties.map(p => (p.key === 'code' ? { ...p, label: 'Order code' } : p)),
      },
    });
    const service = setup({ store: true, entitySchema });
    expect((await service.resolve('tms', 'order')).schema.general.properties.map(p => p.label)).toEqual(['Order code', 'Name']);

    const stored = base();
    stored.general.properties[1].label = 'Customer name';
    stored.general.properties[0].label = 'Order code';
    store!.get.and.resolveTo(stored);
    service.invalidate('tms', 'order');
    expect((await service.resolve('tms', 'order')).schema.general.properties.map(p => p.label)).toEqual(['Order code', 'Customer name']);
  });

  it('keeps the configuration in localStorage when the adapter has no store (AC-005)', async () => {
    const service = setup();
    const next = base();
    next.general.label = 'Sales order';
    expect(await service.save('tms', 'order', next)).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).general.label).toBe('Sales order');
    expect((await service.resolve('tms', 'order')).schema.general.label)
      .withContext('cache cleared after save')
      .toBe('Sales order');
  });

  it('falls back to the default configuration and warns when the stored one is invalid (AC-007)', async () => {
    const warn = spyOn(console, 'warn');
    const service = setup({ store: true });
    store!.get.and.resolveTo({ ...base(), version: 2 } as never);
    const resolved = await service.resolve('tms', 'order');
    expect(resolved.invalid).toBeTrue();
    expect(resolved.schema).toEqual(base());
    expect(resolved.issues.map(issue => issue.code)).toContain('version');
    expect(warn).toHaveBeenCalled();
  });

  it('treats unreadable localStorage content as an invalid configuration', async () => {
    spyOn(console, 'warn');
    localStorage.setItem(STORAGE_KEY, '{not json');
    const resolved = await setup().resolve('tms', 'order');
    expect(resolved.invalid).toBeTrue();
    expect(resolved.schema).toEqual(base());
  });

  it('falls back to the default configuration when a stored member has the wrong type (AC-007)', async () => {
    spyOn(console, 'warn');
    const service = setup({ store: true });
    store!.get.and.resolveTo({ ...base(), list: { columns: {} } } as never);
    const resolved = await service.resolve('tms', 'order');
    expect(resolved.invalid).toBeTrue();
    expect(resolved.schema).toEqual(base());
  });

  it('treats unavailable localStorage as no stored configuration', async () => {
    spyOn(localStorage, 'getItem').and.throwError('SecurityError');
    const resolved = await setup().resolve('tms', 'order');
    expect(resolved.invalid).toBeFalse();
    expect(resolved.schema).toEqual(base());
  });

  it('drops dangling references without invalidating the configuration (AC-006)', async () => {
    const service = setup({ store: true });
    store!.get.and.resolveTo({ ...base(), list: { columns: [{ key: 'gone' }, { key: 'code' }] } });
    const resolved = await service.resolve('tms', 'order');
    expect(resolved.invalid).toBeFalse();
    expect(resolved.schema.list!.columns!.map(column => column.key)).toEqual(['code']);
    expect(resolved.added).toEqual([]);
  });

  it('refuses to save an invalid configuration and does not call the store (AC-020)', async () => {
    const service = setup({ store: true });
    const issues = await service.save('tms', 'order', { ...base(), import: { upsertKey: 'gone' } });
    expect(issues.map(issue => issue.code)).toEqual(['reference-dangling']);
    expect(store!.set).not.toHaveBeenCalled();
  });

  // why: external filters are declared in code (backend schema or provideSdGenericEntity); a stored configuration
  // neither carries nor contributes them (D-011, INV-004).
  const withCodeFilters = (schema: SdGenericSchema): SdGenericSchema => ({
    ...schema,
    list: { ...schema.list, externalFilters: [{ key: 'code' }] },
  });

  it('never stores list.externalFilters, even when the effective schema has them (AC-003)', async () => {
    const service = setup({ store: true, entitySchema: withCodeFilters });
    const { schema } = await service.resolve('tms', 'order');
    expect(schema.list?.externalFilters).toEqual([{ key: 'code' }]);

    expect(await service.save('tms', 'order', schema)).toEqual([]);
    const saved = store!.set.calls.mostRecent().args[1];
    expect(saved.list && 'externalFilters' in saved.list).toBeFalse();
  });

  it('ignores list.externalFilters of a stored configuration without an issue and keeps the code-declared ones (AC-004)', async () => {
    const service = setup({ store: true, entitySchema: withCodeFilters });
    store!.get.and.resolveTo({ ...base(), list: { columns: [{ key: 'name' }], externalFilters: [{ key: 'ghost' }, { key: 'name' }] } });
    const resolved = await service.resolve('tms', 'order');
    expect(resolved.invalid).toBeFalse();
    expect(resolved.issues.filter(issue => issue.path.includes('externalFilters'))).toEqual([]);
    expect(resolved.schema.list?.externalFilters).toEqual([{ key: 'code' }]);
    expect(resolved.schema.list?.columns?.map(column => column.key)).toEqual(['name']);
  });

  it('caches the resolved schema per module and entity', async () => {
    const service = setup({ store: true });
    await service.resolve('tms', 'order');
    await service.resolve('tms', 'order');
    expect(adapter.schema).toHaveBeenCalledTimes(1);
  });

  it('rejects when no adapter is registered for the module', async () => {
    const service = setup({ store: true });
    await expectAsync(service.resolve('nope', 'order')).toBeRejectedWithError(/nope/);
  });
});
