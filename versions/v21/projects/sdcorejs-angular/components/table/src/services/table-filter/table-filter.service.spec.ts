import { TestBed } from '@angular/core/testing';
import { SdStorageService } from '@sdcorejs/angular/services';
import { BehaviorSubject } from 'rxjs';
import { SdTableFilterService } from './table-filter.service';

describe('SdTableFilterService storage ownership', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('destroys replaced storage facades and every retained facade on injector destroy', () => {
    const handles: { destroy: jasmine.Spy; value: unknown }[] = [];
    const create = jasmine.createSpy('create').and.callFake((_key: unknown, option: { default: unknown }) => {
      const subject = new BehaviorSubject(option.default);
      const handle = {
        value: option.default,
        get: () => handle.value,
        set: (value: unknown) => {
          handle.value = value;
          subject.next(value);
        },
        setSilent: (value: unknown) => {
          handle.value = value;
        },
        has: () => true,
        remove: () => undefined,
        destroy: jasmine.createSpy('destroy'),
        subject,
        observer: subject.asObservable(),
      };
      handles.push(handle);
      return handle;
    });
    TestBed.configureTestingModule({
      providers: [SdTableFilterService, { provide: SdStorageService, useValue: { create } }],
    });
    const service = TestBed.inject(SdTableFilterService);
    const args = { id: 'orders', columns: [], externalFilters: [], filterDefs: [] };

    const first = service.register(undefined, args);
    expect(create).toHaveBeenCalledTimes(2);
    expect(first.value.set({ notReload: true }).notReload).toBeTrue();

    const replaced = service.register(undefined, { ...args, force: true });
    expect(replaced).not.toBe(first);
    expect(create).toHaveBeenCalledTimes(4);
    expect(handles[0].destroy).toHaveBeenCalledTimes(1);
    expect(handles[1].destroy).toHaveBeenCalledTimes(1);

    TestBed.resetTestingModule();
    expect(handles[2].destroy).toHaveBeenCalledTimes(1);
    expect(handles[3].destroy).toHaveBeenCalledTimes(1);
  });

  it('destroys a partially-created registration when the second storage facade cannot be created', () => {
    const subject = new BehaviorSubject({ inlineExternal: {} });
    const first = {
      get: () => ({ inlineExternal: {} }),
      set: () => undefined,
      setSilent: () => undefined,
      has: () => true,
      remove: () => undefined,
      destroy: jasmine.createSpy('destroy'),
      subject,
      observer: subject.asObservable(),
    };
    const create = jasmine.createSpy('create').and.returnValues(first, undefined);
    TestBed.configureTestingModule({
      providers: [SdTableFilterService, { provide: SdStorageService, useValue: { create } }],
    });
    const service = TestBed.inject(SdTableFilterService);

    expect(() => service.register(undefined, { id: 'partial', columns: [], externalFilters: [], filterDefs: [] })).toThrow();
    expect(first.destroy).toHaveBeenCalledTimes(1);
  });
});

describe('SdTableFilterService value.default()', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('returns what remove() stores, without writing it', () => {
    TestBed.configureTestingModule({ providers: [SdTableFilterService] });
    const service = TestBed.inject(SdTableFilterService);
    const register = service.register(undefined, {
      id: `default-${Math.random()}`,
      columns: [
        { field: 'code', title: 'Code', type: 'string', filter: { default: 'DH', operator: { enable: true, default: 'EQUAL' } } },
      ] as never,
      externalFilters: [{ field: 'period', title: 'Period', type: 'daterange', default: { from: '2026/10/01' } }],
      filterDefs: [],
      quickSearch: {
        filters: [
          {
            field: 'tenant',
            title: 'Tenant',
            type: 'values',
            default: 'north',
            option: { items: [], valueField: 'id', displayField: 'name' },
          },
        ],
      },
    });
    register.value.set({ columnFilter: { code: 'X' } });

    const defaults = register.value.default!();
    expect(defaults).toEqual({
      columnFilter: { code: 'DH' },
      externalFilter: { period: { from: '2026/10/01', to: undefined } },
      columnOperator: { code: 'EQUAL' },
      quickSearch: { term: '', filters: { tenant: 'north' } },
    });
    expect(register.value.get().columnFilter).toEqual({ code: 'X' });

    defaults.columnOperator!['code'] = 'CONTAIN';
    expect(register.value.default!().columnOperator).toEqual({ code: 'EQUAL' });
  });
});

// The filter mode the user picks in the settings modal is stored with the inline external filters.
describe('SdTableFilterService configuration.mode', () => {
  let key: string;

  const register = (force = false) =>
    TestBed.inject(SdTableFilterService).register({ key } as never, {
      id: key,
      columns: [{ field: 'code', title: 'Code', type: 'string' }] as never,
      externalFilters: [
        { field: 'status', title: 'Status', type: 'string', defaultShowing: true },
        { field: 'note', title: 'Note', type: 'string' },
      ],
      filterDefs: [],
      force,
    });

  beforeEach(() => {
    key = `filter-mode-${Math.random().toString(36).slice(2)}`;
    TestBed.configureTestingModule({ providers: [SdTableFilterService] });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('stores the mode, and keeps it when only the inline external filters change', () => {
    const configuration = register().configuration;
    expect(configuration.get().mode).toBeUndefined();
    configuration.set({ mode: 'query-bar' });
    expect(configuration.get()).toEqual({ inlineExternal: { status: true, note: false }, mode: 'query-bar' });
    configuration.set({ inlineExternal: { status: false, note: true } });
    expect(configuration.get()).toEqual({ inlineExternal: { status: false, note: true }, mode: 'query-bar' });
  });

  it('clears the mode on an explicit undefined and keeps the inline external filters', () => {
    const configuration = register().configuration;
    configuration.set({ inlineExternal: { status: false, note: true }, mode: 'default' });
    configuration.set({ mode: undefined });
    expect(configuration.get()).toEqual({ inlineExternal: { status: false, note: true } });
  });

  it('reads the stored mode back after a reload, and drops a value it does not know', () => {
    register().configuration.set({ mode: 'query-bar' });
    expect(register(true).configuration.get().mode).toBe('query-bar');
    register().configuration.set({ mode: 'grid' as never });
    expect(register(true).configuration.get().mode).toBeUndefined();
  });

  it('removes the mode with the inline external filters', () => {
    const configuration = register().configuration;
    configuration.set({ inlineExternal: { status: false, note: true }, mode: 'query-bar' });
    configuration.remove();
    expect(configuration.get()).toEqual({ inlineExternal: { status: true, note: false } });
  });
});
