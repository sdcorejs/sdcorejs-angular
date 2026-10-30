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
