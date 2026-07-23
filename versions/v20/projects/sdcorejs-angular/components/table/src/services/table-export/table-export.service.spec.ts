import { TestBed } from '@angular/core/testing';
import { SdExcelService } from '@sdcorejs/angular/services';
import { SdTableOption } from '../../models/table-option.model';
import { SdTableExportContext, TableExportService } from './table-export.service';

describe('TableExportService', () => {
  let service: TableExportService;
  let excel: {
    export: jasmine.Spy;
    exportCSV: jasmine.Spy;
  };

  beforeEach(() => {
    excel = {
      export: jasmine.createSpy('export').and.resolveTo(),
      exportCSV: jasmine.createSpy('exportCSV').and.resolveTo(),
    };
    TestBed.configureTestingModule({
      providers: [TableExportService, { provide: SdExcelService, useValue: excel }],
    });
    service = TestBed.inject(TableExportService);
  });

  function context(option: SdTableOption, overrides: Partial<SdTableExportContext> = {}): SdTableExportContext {
    return {
      option,
      total: 1,
      cacheObjValues: {},
      fetchChunk: async () => [],
      getFilterInfo: () => ({ filters: [] }) as never,
      ...overrides,
    };
  }

  it('exports mapped batches with typed values, extra sheets, and progress cleanup', async () => {
    const option = {
      columns: [
        { field: 'name', title: 'Name', type: 'string' },
        { field: 'amount', title: { title: 'Amount' }, type: 'number' },
        { field: 'active', title: 'Active', type: 'boolean', option: { displayOnTrue: 'Yes', displayOnFalse: 'No' } },
        { field: 'created', title: 'Created', type: 'date' },
        { field: 'updated', title: 'Updated', type: 'datetime' },
        { field: 'at', title: 'At', type: 'time' },
        { field: 'status', title: 'Status', type: 'values', option: { displayField: 'label' } },
        { field: 'tags', title: 'Tags', type: 'lazy-values', option: { displayField: 'label' } },
        { field: 'missing', title: 'Missing', type: 'string' },
        { field: 'fallback', title: 'Fallback', type: 'html' },
        { field: 'computed', title: 'Computed', type: 'string', transform: async (value: string) => `${value}!` },
        {
          field: 'group',
          title: 'Group',
          type: 'children',
          children: [
            { field: 'nested.code', title: 'Code', type: 'string' },
            { field: 'disabled', title: 'Disabled', type: 'string', export: { disabled: true } },
          ],
        },
      ],
      export: {
        type: 'default',
        fileName: 'report',
        maxItemsPerRequest: 1,
        batch: 2,
        mapping: async (items: Record<string, unknown>[]) => items.map(item => ({ ...item, fallback: 'raw' })),
        columns: [
          { field: 'virtual', title: 'Virtual', transform: (_value: unknown, item: { name: string }) => `V:${item.name}` },
          { field: 'ignored', title: 'Ignored', export: { disabled: true } },
        ],
        sheets: [
          { name: 'Static', items: [{ id: 1 }], headers: [{ field: 'id', title: 'Id' }] },
          { name: 'Async', items: async () => [{ id: 2 }], headers: [{ field: 'id', title: 'Id' }] },
          { name: '', items: [], headers: [] },
        ],
      },
    } as unknown as SdTableOption;
    const first = {
      name: 'A',
      amount: 3,
      active: true,
      created: '2026-01-15T00:00:00',
      updated: '2026-01-15T10:30:00',
      at: '2026-01-15T10:30:00',
      status: 'open',
      tags: ['open', 'raw'],
      missing: null,
      computed: 'x',
      nested: { code: 'N1' },
    };
    const second = { ...first, name: 'B', active: false, nested: { code: 'N2' } };
    const fetchChunk = jasmine
      .createSpy('fetchChunk')
      .and.callFake(async (page: number) => (page === 0 ? [first] : { items: [second], total: 2 }));

    await service.exportExcel(
      context(option, {
        total: 2,
        fetchChunk,
        cacheObjValues: {
          status: { open: { label: 'Open' } },
          tags: { open: { label: 'Open' } },
        } as never,
      })
    );

    expect(fetchChunk.calls.allArgs()).toEqual([
      [0, 1],
      [1, 1],
    ]);
    expect(excel.export).toHaveBeenCalledTimes(1);
    const request = excel.export.calls.mostRecent().args[0];
    expect(request.fileName).toBe('report');
    expect(request.columns.map((column: { field: string }) => column.field)).toContain('nested.code');
    expect(request.columns.map((column: { field: string }) => column.field)).not.toContain('disabled');
    expect(request.items[0]).toEqual(
      jasmine.objectContaining({
        name: 'A',
        amount: 3,
        active: 'Yes',
        status: 'Open',
        tags: 'Open, raw',
        missing: '',
        fallback: 'raw',
        computed: 'x!',
        'nested.code': 'N1',
        virtual: 'V:A',
      })
    );
    expect(request.items[1].active).toBe('No');
    expect(request.sheets).toEqual([
      jasmine.objectContaining({ name: 'Static', items: [{ id: 1 }] }),
      jasmine.objectContaining({ name: 'Async', items: [{ id: 2 }] }),
    ]);
    expect(service.exporting()).toBeFalse();
    expect(service.exportTitle()).toBe('Export');
  });

  it('exports CSV with configured column order and an explicit field subset', async () => {
    const option = {
      columns: [
        { field: 'first', title: 'First', type: 'string' },
        { field: 'second', title: 'Second', type: 'string' },
        {
          field: 'group',
          title: 'Group',
          type: 'children',
          children: [{ field: 'child', title: 'Child', type: 'string' }],
        },
      ],
      export: { mapping: (items: unknown[]) => items },
    } as unknown as SdTableOption;

    await service.exportCSV(
      context(option, {
        configuration: {
          firstColumns: [{ field: 'group' }],
          secondColumns: [{ field: 'child' }, { field: 'second' }, { field: 'unknown' }],
        } as never,
        total: 1,
        fetchChunk: async () => [{ first: '1', second: '2', child: '3' }],
      }),
      [
        { field: 'child', title: 'Child' },
        { field: 'second', title: 'Second' },
      ]
    );

    const request = excel.exportCSV.calls.mostRecent().args[0];
    expect(request.columns.map((column: { field: string }) => column.field)).toEqual(['child', 'second']);
    expect(request.items).toEqual([{ child: '3', second: '2' }]);
  });

  it('delegates custom exports with current filters and releases the exporting flag', async () => {
    const onExport = jasmine.createSpy('onExport').and.resolveTo();
    const filter = { filters: [{ field: 'name', operator: 'EQUAL', value: 'A' }] };
    const option = { columns: [], export: { type: 'custom', onExport } } as unknown as SdTableOption;

    service.exportCustom(context(option, { getFilterInfo: () => filter as never }));
    expect(service.exporting()).toBeTrue();
    await Promise.resolve();
    await Promise.resolve();

    expect(onExport).toHaveBeenCalledWith(filter);
    expect(service.exporting()).toBeFalse();
    await expectAsync(service.exportExcel(context(option))).toBeResolvedTo(undefined);
    expect(excel.export).not.toHaveBeenCalled();
  });

  it('ignores exportCustom for default export options', () => {
    service.exportCustom(context({ columns: [], export: { type: 'default' } } as unknown as SdTableOption));

    expect(service.exporting()).toBeFalse();
  });

  it('always resets progress when the file adapter rejects', async () => {
    excel.exportCSV.and.rejectWith(new Error('write failed'));
    const option = { columns: [{ field: 'id', title: 'Id', type: 'number' }], export: {} } as unknown as SdTableOption;

    await expectAsync(service.exportCSV(context(option, { total: 1, fetchChunk: async () => [{ id: 1 }] }))).toBeRejectedWithError(
      'write failed'
    );
    expect(service.exporting()).toBeFalse();
    expect(service.exportTitle()).toBe('Export');
  });
});
