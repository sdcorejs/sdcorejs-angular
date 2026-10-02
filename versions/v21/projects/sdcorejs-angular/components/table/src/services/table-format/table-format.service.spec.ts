import { TestBed } from '@angular/core/testing';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { TableFormatService } from './table-format.service';
import { SdTableColumn } from '../../models/table-column.model';
import { signal } from '@angular/core';

// EMPTY_STR resolves to '--'
const EMPTY_STR = '--';

// ---------------------------------------------------------------------------
// Test setup helper
// ---------------------------------------------------------------------------
function buildService(): TableFormatService {
  TestBed.configureTestingModule({
    providers: [TableFormatService, SdFormatNumberPipe],
  });
  return TestBed.inject(TableFormatService);
}

// ---------------------------------------------------------------------------
// format() — core display generation
// ---------------------------------------------------------------------------
describe('TableFormatService.format', () => {
  let service: TableFormatService;

  beforeEach(() => {
    service = buildService();
  });

  // -----------------------------------------------------------------------
  // Empty / no data
  // -----------------------------------------------------------------------
  it('returns an empty array for empty rawItems', async () => {
    const result = await service.format([], [], {}, {});
    expect(result).toEqual([]);
  });

  it('returns items preserving original data', async () => {
    const raw = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const result = await service.format(raw, [], {}, {});
    expect(result.length).toBe(2);
    expect(result[0].data).toBe(raw[0]);
    expect(result[1].data).toBe(raw[1]);
  });

  // -----------------------------------------------------------------------
  // String column
  // -----------------------------------------------------------------------
  it('formats a string column correctly', async () => {
    const raw = [{ name: 'Alice' }];
    const cols: SdTableColumn[] = [{ field: 'name', title: 'Name', type: 'string' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['name'].data).toBe('Alice');
    expect(result[0].meta.display['name'].isHtml).toBeFalse();
  });

  it('sets display.data to EMPTY_STR for null string value', async () => {
    const raw = [{ name: null }];
    const cols: SdTableColumn[] = [{ field: 'name', title: 'Name', type: 'string' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['name'].data).toBe(EMPTY_STR);
  });

  it('sets display.data to EMPTY_STR for undefined value', async () => {
    const raw = [{ age: undefined }] as any[];
    const cols: SdTableColumn[] = [{ field: 'age' as any, title: 'Age', type: 'string' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['age'].data).toBe(EMPTY_STR);
  });

  it('sets display.data to EMPTY_STR for empty string value', async () => {
    const raw = [{ name: '' }];
    const cols: SdTableColumn[] = [{ field: 'name', title: 'Name', type: 'string' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['name'].data).toBe(EMPTY_STR);
  });

  // -----------------------------------------------------------------------
  // Number column
  // -----------------------------------------------------------------------
  it('formats a number column to formatted string', async () => {
    const raw = [{ price: 1234567 }];
    const cols: SdTableColumn[] = [{ field: 'price', title: 'Price', type: 'number' }];

    const result = await service.format(raw, cols, {}, {});
    // SdFormatNumberPipe transforms to ISO format by default
    expect(result[0].meta.display['price'].data).toBeTruthy();
    expect(result[0].meta.display['price'].data).not.toBe(EMPTY_STR);
  });

  it('keeps number value as EMPTY_STR when value is null', async () => {
    const raw = [{ price: null }];
    const cols: SdTableColumn[] = [{ field: 'price', title: 'Price', type: 'number' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['price'].data).toBe(EMPTY_STR);
  });

  // -----------------------------------------------------------------------
  // Boolean column
  // -----------------------------------------------------------------------
  it('formats true boolean to displayOnTrue value', async () => {
    const raw = [{ active: true }];
    const cols: SdTableColumn[] = [
      { field: 'active', title: 'Active', type: 'boolean', option: { displayOnTrue: 'Yes', displayOnFalse: 'No' } },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['active'].data).toBe('Yes');
  });

  it('formats false boolean to displayOnFalse value', async () => {
    const raw = [{ active: false }];
    const cols: SdTableColumn[] = [
      { field: 'active', title: 'Active', type: 'boolean', option: { displayOnTrue: 'Yes', displayOnFalse: 'No' } },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['active'].data).toBe('No');
  });

  it('uses default True/False when option is not provided for boolean', async () => {
    const raw = [{ active: true }];
    const cols: SdTableColumn[] = [{ field: 'active', title: 'Active', type: 'boolean' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['active'].data).toBe('True');
  });

  it('formats false boolean to default "False" label', async () => {
    const raw = [{ active: false }];
    const cols: SdTableColumn[] = [{ field: 'active', title: 'Active', type: 'boolean' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['active'].data).toBe('False');
  });

  it('sets empty string for null boolean value', async () => {
    const raw = [{ active: null }];
    const cols: SdTableColumn[] = [{ field: 'active', title: 'Active', type: 'boolean' }];

    const result = await service.format(raw, cols, {}, {});
    // null boolean → '' → then EMPTY_STR override
    expect(result[0].meta.display['active'].data).toBe(EMPTY_STR);
  });

  // -----------------------------------------------------------------------
  // Date column
  // -----------------------------------------------------------------------
  it('formats a date column and returns a non-empty string for valid date', async () => {
    const raw = [{ createdAt: '2024-01-15' }];
    const cols: SdTableColumn[] = [{ field: 'createdAt', title: 'Created', type: 'date' }];

    const result = await service.format(raw, cols, {}, {});
    // Should format to dd/MM/yyyy
    expect(result[0].meta.display['createdAt'].data).toBe('15/01/2024');
    expect(result[0].meta.display['createdAt'].isHtml).toBeFalse();
  });

  // why: cột ngày của bảng hiện '--' cho timestamp BE có micro giây khi dùng @sdcorejs/utils 1.2.0–1.2.2;
  // giữ test này để lần nâng utils sau không lặp lại lỗi (Core Legacy 19.0.36–19.0.39).
  it('formats date, datetime and time columns from backend microsecond timestamps', async () => {
    const reference = [{ at: '2026-07-09T08:49:29.851Z' }];
    const backend = [{ at: '2026-07-09T08:49:29.851409Z' }, { at: '2026-07-09T15:49:29.851409+07:00' }];
    for (const type of ['date', 'datetime', 'time'] as const) {
      const cols: SdTableColumn<{ at: string }>[] = [{ field: 'at', title: 'At', type }];
      const [expected] = await service.format(reference, cols, {}, {});
      expect(expected.meta.display['at'].data).withContext(type).not.toBe(EMPTY_STR);
      const result = await service.format(backend, cols, {}, {});
      for (const item of result) {
        expect(item.meta.display['at'].data).withContext(`${type} ${item.data.at}`).toBe(expected.meta.display['at'].data);
      }
    }
  });

  it('formats a datetime column as HTML', async () => {
    const raw = [{ updatedAt: '2024-01-15T10:30:00' }];
    const cols: SdTableColumn[] = [{ field: 'updatedAt', title: 'Updated', type: 'datetime' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['updatedAt'].isHtml).toBeTrue();
    expect(result[0].meta.display['updatedAt'].data).toContain('15/01/2024');
  });

  it('formats a time column', async () => {
    const raw = [{ time: '2024-01-15T10:30:00' }];
    const cols: SdTableColumn[] = [{ field: 'time', title: 'Time', type: 'time' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['time'].data).toBe('10:30:00');
    expect(result[0].meta.display['time'].isHtml).toBeFalse();
  });

  it('returns EMPTY_STR for invalid date value', async () => {
    const raw = [{ createdAt: 'not-a-date' }];
    const cols: SdTableColumn[] = [{ field: 'createdAt', title: 'Created', type: 'date' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['createdAt'].data).toBe(EMPTY_STR);
  });

  // -----------------------------------------------------------------------
  // htmlTemplate column
  // -----------------------------------------------------------------------
  it('applies htmlTemplate function and marks isHtml=true', async () => {
    const raw = [{ name: 'Alice' }];
    const cols: SdTableColumn[] = [
      {
        field: 'name',
        title: 'Name',
        type: 'string',
        htmlTemplate: (value: any) => `<b>${value}</b>`,
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['name'].data).toBe('<b>Alice</b>');
    expect(result[0].meta.display['name'].isHtml).toBeTrue();
  });

  // -----------------------------------------------------------------------
  // transform column
  // -----------------------------------------------------------------------
  it('applies transform function synchronously', async () => {
    const raw = [{ code: 'abc' }];
    const cols: SdTableColumn[] = [
      {
        field: 'code',
        title: 'Code',
        type: 'string',
        transform: (value: any) => value.toUpperCase(),
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['code'].data).toBe('ABC');
  });

  it('awaits async transform function', async () => {
    const raw = [{ code: 'abc' }];
    const cols: SdTableColumn[] = [
      {
        field: 'code',
        title: 'Code',
        type: 'string',
        transform: (value: any) => Promise.resolve(`[${value}]`),
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['code'].data).toBe('[abc]');
  });

  // -----------------------------------------------------------------------
  // tooltip and click callbacks
  // -----------------------------------------------------------------------
  it('sets tooltip from tooltip function', async () => {
    const raw = [{ name: 'Alice' }];
    const cols: SdTableColumn[] = [
      {
        field: 'name',
        title: 'Name',
        type: 'string',
        tooltip: (value: any) => `Tip: ${value}`,
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['name'].tooltip).toBe('Tip: Alice');
  });

  it('wraps click function into a parameterless closure', async () => {
    const clickSpy = jasmine.createSpy('click');
    const raw = [{ id: 42 }];
    const cols: SdTableColumn[] = [
      {
        field: 'id',
        title: 'ID',
        type: 'number',
        click: (value: any, rowData: any) => clickSpy(value, rowData),
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    result[0].meta.display['id'].click!();
    expect(clickSpy).toHaveBeenCalledWith(42, raw[0]);
  });

  // -----------------------------------------------------------------------
  // align: right → cellStyle
  // -----------------------------------------------------------------------
  it('applies right-align cellStyle when column align is "right"', async () => {
    const raw = [{ amount: 100 }];
    const cols: SdTableColumn[] = [{ field: 'amount', title: 'Amount', type: 'number', align: 'right' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['amount'].cellStyle).toEqual({ 'text-align': 'right!important' });
  });

  // -----------------------------------------------------------------------
  // values column
  // -----------------------------------------------------------------------
  it('resolves values column from cacheObjValues lookup', async () => {
    const raw = [{ status: 'A' }];
    const cacheObjValues: Record<string, Record<string, any>> = {
      status: {
        A: { code: 'A', label: 'Active' },
        B: { code: 'B', label: 'Inactive' },
      },
    };
    const cols: SdTableColumn[] = [
      {
        field: 'status',
        title: 'Status',
        type: 'values',
        option: {
          items: [
            { code: 'A', label: 'Active' },
            { code: 'B', label: 'Inactive' },
          ],
          valueField: 'code',
          displayField: 'label',
        },
      },
    ];

    const result = await service.format(raw, cols, {}, cacheObjValues);
    // Should display the label from the lookup
    expect(result[0].meta.display['status'].data).toBe('Active');
  });

  it('falls back to raw value when cacheObjValues has no entry', async () => {
    const raw = [{ status: 'X' }];
    const cols: SdTableColumn[] = [
      {
        field: 'status',
        title: 'Status',
        type: 'values',
        option: {
          items: [],
          valueField: 'code',
          displayField: 'label',
        },
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    // No cache → falls back to raw value 'X'
    expect(result[0].meta.display['status'].data).toBe('X');
  });

  it('handles array values column with multiple entries', async () => {
    const raw = [{ tags: ['A', 'B'] }];
    const cacheObjValues: Record<string, Record<string, any>> = {
      tags: {
        A: { code: 'A', label: 'Alpha' },
        B: { code: 'B', label: 'Beta' },
      },
    };
    const cols: SdTableColumn[] = [
      {
        field: 'tags',
        title: 'Tags',
        type: 'values',
        option: { items: [], valueField: 'code', displayField: 'label' },
      },
    ];

    const result = await service.format(raw, cols, {}, cacheObjValues);
    expect(result[0].meta.display['tags'].data).toBe('Alpha, Beta');
  });

  // -----------------------------------------------------------------------
  // boolean badge (auto-generated)
  // -----------------------------------------------------------------------
  it('attaches a success badge for true boolean', async () => {
    const raw = [{ active: true }];
    const cols: SdTableColumn[] = [{ field: 'active', title: 'Active', type: 'boolean' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['active'].badge?.color).toBe('success');
  });

  it('attaches an error badge for false boolean', async () => {
    const raw = [{ active: false }];
    const cols: SdTableColumn[] = [{ field: 'active', title: 'Active', type: 'boolean' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['active'].badge?.color).toBe('error');
  });

  it('clears badge when boolean value is null', async () => {
    const raw = [{ active: null }];
    const cols: SdTableColumn[] = [{ field: 'active', title: 'Active', type: 'boolean' }];

    const result = await service.format(raw, cols, {}, {});
    // null → '' → EMPTY_STR path sets badge to undefined
    expect(result[0].meta.display['active'].badge).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // useBadge custom function
  // -----------------------------------------------------------------------
  it('applies useBadge result for a non-values column', async () => {
    const raw = [{ priority: 'HIGH' }];
    const cols: SdTableColumn[] = [
      {
        field: 'priority',
        title: 'Priority',
        type: 'string',
        useBadge: (value: any) => ({ color: 'warning', type: 'round' }),
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['priority'].badge?.color).toBe('warning');
  });

  it('does not override data when useBadge has no title', async () => {
    const raw = [{ priority: 'HIGH' }];
    const cols: SdTableColumn[] = [
      {
        field: 'priority',
        title: 'Priority',
        type: 'string',
        useBadge: (value: any) => ({ color: 'error', type: 'round' }),
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['priority'].data).toBe('HIGH');
  });

  it('overrides data with badge.title when useBadge returns a title', async () => {
    const raw = [{ status: 1 }];
    const cols: SdTableColumn[] = [
      {
        field: 'status',
        title: 'Status',
        type: 'number',
        useBadge: (value: any) => ({ color: 'success', title: 'Active' }),
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['status'].data).toBe('Active');
  });

  // -----------------------------------------------------------------------
  // hidden columns are skipped
  // -----------------------------------------------------------------------
  it('skips hidden columns', async () => {
    const raw = [{ id: 1, secret: 'shhh' }];
    const cols: SdTableColumn[] = [
      { field: 'id', title: 'ID', type: 'number' },
      { field: 'secret', title: 'Secret', type: 'string', hidden: true },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['id']).toBeDefined();
    expect(result[0].meta.display['secret']).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // children column
  // -----------------------------------------------------------------------
  it('processes children columns of a children-type column', async () => {
    const raw = [{ id: 1, firstName: 'Alice', lastName: 'Smith' }];
    const cols: SdTableColumn[] = [
      {
        field: 'name',
        title: 'Name',
        type: 'children',
        children: [
          { field: 'firstName', title: 'First', type: 'string' },
          { field: 'lastName', title: 'Last', type: 'string' },
        ],
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['firstName'].data).toBe('Alice');
    expect(result[0].meta.display['lastName'].data).toBe('Smith');
  });

  it('skips hidden children columns', async () => {
    const raw = [{ id: 1, visible: 'yes', hidden: 'no' }];
    const cols: SdTableColumn[] = [
      {
        field: 'group',
        title: 'Group',
        type: 'children',
        children: [
          { field: 'visible', title: 'Visible', type: 'string' },
          { field: 'hidden', title: 'Hidden', type: 'string', hidden: true },
        ],
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['visible']).toBeDefined();
    expect(result[0].meta.display['hidden']).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // Nested field access
  // -----------------------------------------------------------------------
  it('accesses nested fields via dot notation', async () => {
    const raw = [{ user: { address: { city: 'Hanoi' } } }];
    const cols: SdTableColumn[] = [{ field: 'user.address.city' as any, title: 'City', type: 'string' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['user.address.city'].data).toBe('Hanoi');
  });

  // -----------------------------------------------------------------------
  // Multiple rows
  // -----------------------------------------------------------------------
  it('formats all rows independently', async () => {
    const raw = [{ val: 1 }, { val: null }, { val: 3 }];
    const cols: SdTableColumn[] = [{ field: 'val', title: 'Val', type: 'number' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result.length).toBe(3);
    expect(result[0].meta.display['val'].data).not.toBe(EMPTY_STR);
    expect(result[1].meta.display['val'].data).toBe(EMPTY_STR);
    expect(result[2].meta.display['val'].data).not.toBe(EMPTY_STR);
  });

  // -----------------------------------------------------------------------
  // lazy-values column with views function
  // -----------------------------------------------------------------------
  it('loads and resolves lazy-values column via views function', async () => {
    const raw = [{ categoryId: 'cat1' }];
    const viewsSpy = jasmine.createSpy('views').and.returnValue(Promise.resolve([{ id: 'cat1', name: 'Category One' }]));
    const cacheObjValues: Record<string, Record<string, any>> = {};
    const cols: SdTableColumn[] = [
      {
        field: 'categoryId',
        title: 'Category',
        type: 'lazy-values',
        option: {
          items: [] as any,
          valueField: 'id',
          displayField: 'name',
          views: viewsSpy,
        },
      },
    ];

    const result = await service.format(raw, cols, {}, cacheObjValues);
    expect(viewsSpy).toHaveBeenCalledWith(['cat1']);
    expect(cacheObjValues['categoryId']['cat1']).toBeDefined();
  });

  it('lazy-values: skips views call when value is already in cache', async () => {
    const raw = [{ categoryId: 'cat1' }];
    const viewsSpy = jasmine.createSpy('views').and.returnValue(Promise.resolve([]));
    // Pre-populate cache
    const cacheObjValues: Record<string, Record<string, any>> = {
      categoryId: { cat1: { id: 'cat1', name: 'Cached' } },
    };
    const cols: SdTableColumn[] = [
      {
        field: 'categoryId',
        title: 'Category',
        type: 'lazy-values',
        option: {
          items: [] as any,
          valueField: 'id',
          displayField: 'name',
          views: viewsSpy,
        },
      },
    ];

    await service.format(raw, cols, {}, cacheObjValues);
    // All values already cached, views() should not be called
    expect(viewsSpy).not.toHaveBeenCalled();
  });

  it('lazy-values: handles views() rejection gracefully', async () => {
    const raw = [{ tagId: 'tag1' }];
    const errorSpy = spyOn(console, 'error');
    const viewsSpy = jasmine.createSpy('views').and.returnValue(Promise.reject(new Error('API error')));
    const cols: SdTableColumn[] = [
      {
        field: 'tagId',
        title: 'Tag',
        type: 'lazy-values',
        option: {
          items: [] as any,
          valueField: 'id',
          displayField: 'label',
          views: viewsSpy,
        },
      },
    ];

    await expectAsync(service.format(raw, cols, {}, {})).toBeResolved();
    expect(errorSpy).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // time column with valid date
  // -----------------------------------------------------------------------
  it('formats a time column with only time part visible', async () => {
    const raw = [{ logTime: '2024-03-10T09:15:30' }];
    const cols: SdTableColumn[] = [{ field: 'logTime', title: 'Log Time', type: 'time' }];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['logTime'].data).toBe('09:15:30');
    expect(result[0].meta.display['logTime'].isHtml).toBeFalse();
  });

  // -----------------------------------------------------------------------
  // useBadge with null return (no badge applied)
  // -----------------------------------------------------------------------
  it('does not attach badge when useBadge returns null', async () => {
    const raw = [{ status: 'X' }];
    const cols: SdTableColumn[] = [
      {
        field: 'status',
        title: 'Status',
        type: 'string',
        useBadge: () => null as any,
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['status'].badge).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // Display callbacks that fail (NSP-4877) — the cell falls back, format still resolves
  // -----------------------------------------------------------------------
  it('falls back to the raw value when transform rejects, logging once per column', async () => {
    const errorSpy = spyOn(console, 'error');
    const raw = [{ code: 'A' }, { code: ['B', 'C'] }, { code: null }];
    const cols: SdTableColumn[] = [
      { field: 'code', title: 'Code', type: 'string', transform: () => Promise.reject(new Error('lookup down')) },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result.map(item => item.meta.display['code'].data)).toEqual(['A', 'B, C', EMPTY_STR]);
    expect(result.every(item => !item.meta.display['code'].isHtml)).toBeTrue();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps the formatted cell when only tooltip throws', async () => {
    spyOn(console, 'error');
    const raw = [{ amount: 1000 }];
    const cols: SdTableColumn[] = [
      {
        field: 'amount',
        title: 'Amount',
        type: 'number',
        tooltip: () => {
          throw new Error('tooltip broke');
        },
      },
    ];

    const result = await service.format(raw, cols, {}, {});
    expect(result[0].meta.display['amount'].tooltip).toBeUndefined();
    expect(result[0].meta.display['amount'].data).toBe(TestBed.inject(SdFormatNumberPipe).transform(1000));
  });
});

// ---------------------------------------------------------------------------
// loadValues()
// ---------------------------------------------------------------------------
describe('TableFormatService.loadValues', () => {
  let service: TableFormatService;

  beforeEach(() => {
    service = buildService();
  });

  it('does nothing for columns with no type=values', async () => {
    const cacheValues: Record<string, any[]> = {};
    const cacheObjValues: Record<string, Record<string, string>> = {};
    const cols: SdTableColumn[] = [{ field: 'name', title: 'Name', type: 'string' }];

    await service.loadValues(cols, cacheValues, cacheObjValues);
    expect(Object.keys(cacheValues)).toEqual([]);
  });

  it('loads static array items into cacheValues', async () => {
    const cacheValues: Record<string, any[]> = {};
    const cacheObjValues: Record<string, Record<string, string>> = {};
    const items = [
      { code: 'A', label: 'Alpha' },
      { code: 'B', label: 'Beta' },
    ];
    const cols: SdTableColumn[] = [
      {
        field: 'status',
        title: 'Status',
        type: 'values',
        option: { items, valueField: 'code', displayField: 'label' },
      },
    ];

    await service.loadValues(cols, cacheValues, cacheObjValues);

    expect(cacheValues['status']).toBeDefined();
    expect(cacheValues['status'].length).toBe(2);
    expect(cacheObjValues['status']).toBeDefined();
    expect(cacheObjValues['status']['A']).toBeDefined();
    expect(cacheObjValues['status']['B']).toBeDefined();
  });

  it('loads Promise-based items into cacheValues', async () => {
    const cacheValues: Record<string, any[]> = {};
    const cacheObjValues: Record<string, Record<string, string>> = {};
    const items = [
      { id: '1', name: 'One' },
      { id: '2', name: 'Two' },
    ];
    const cols: SdTableColumn[] = [
      {
        field: 'type',
        title: 'Type',
        type: 'values',
        option: {
          items: () => Promise.resolve(items),
          valueField: 'id',
          displayField: 'name',
        },
      },
    ];

    await service.loadValues(cols, cacheValues, cacheObjValues);

    expect(cacheValues['type']).toBeDefined();
    expect(cacheValues['type'].length).toBe(2);
    expect(cacheObjValues['type']['1']).toBeDefined();
  });

  it('loads Signal-based items into cacheValues', async () => {
    const cacheValues: Record<string, any[]> = {};
    const cacheObjValues: Record<string, Record<string, string>> = {};
    const items = [{ key: 'x', val: 'X-value' }];
    const itemsSignal = signal(items);
    const cols: SdTableColumn[] = [
      {
        field: 'cat',
        title: 'Category',
        type: 'values',
        option: {
          items: itemsSignal,
          valueField: 'key',
          displayField: 'val',
        },
      },
    ];

    await service.loadValues(cols, cacheValues, cacheObjValues);

    expect(cacheValues['cat']).toBeDefined();
    expect(cacheValues['cat'].length).toBe(1);
    expect(cacheObjValues['cat']['x']).toBeDefined();
  });

  it('skips column if already cached', async () => {
    const cacheValues: Record<string, any[]> = { status: [{ code: 'A', label: 'Existing' }] };
    const cacheObjValues: Record<string, Record<string, string>> = {};
    const fetchSpy = jasmine.createSpy('fetch').and.returnValue(Promise.resolve([]));
    const cols: SdTableColumn[] = [
      {
        field: 'status',
        title: 'Status',
        type: 'values',
        option: { items: fetchSpy, valueField: 'code', displayField: 'label' },
      },
    ];

    await service.loadValues(cols, cacheValues, cacheObjValues);

    expect(fetchSpy).not.toHaveBeenCalled();
    // cacheValues['status'] should remain unchanged
    expect(cacheValues['status'].length).toBe(1);
  });

  it('handles Promise that returns non-array gracefully', async () => {
    const cacheValues: Record<string, any[]> = {};
    const cacheObjValues: Record<string, Record<string, string>> = {};
    const cols: SdTableColumn[] = [
      {
        field: 'type',
        title: 'Type',
        type: 'values',
        option: {
          items: () => Promise.resolve(null as any),
          valueField: 'id',
          displayField: 'name',
        },
      },
    ];

    await service.loadValues(cols, cacheValues, cacheObjValues);

    // null → [] after Array.isArray check
    expect(cacheValues['type']).toBeDefined();
    expect(cacheValues['type'].length).toBe(0);
  });

  for (const [name, items] of [
    ['rejects', () => Promise.reject(new Error('lookup down'))],
    [
      'throws synchronously',
      () => {
        throw new Error('lookup down');
      },
    ],
  ] as const) {
    it(`resolves and leaves the cache empty when a lookup ${name}, so the next configuration retries it`, async () => {
      const errorSpy = spyOn(console, 'error');
      const cacheValues: Record<string, unknown[]> = {};
      const cacheObjValues: Record<string, Record<string, string>> = {};
      const cols: SdTableColumn[] = [
        { field: 'type', title: 'Type', type: 'values', option: { items, valueField: 'id', displayField: 'name' } },
        {
          field: 'other',
          title: 'Other',
          type: 'values',
          option: { items: [{ id: 1, name: 'One' }], valueField: 'id', displayField: 'name' },
        },
      ];

      await expectAsync(service.loadValues(cols, cacheValues, cacheObjValues)).toBeResolved();
      expect(cacheValues['type']).toBeUndefined();
      expect(cacheObjValues['type']).toBeUndefined();
      expect(cacheValues['other'].length).toBe(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  }
});

// ---------------------------------------------------------------------------
// NSP-5745: fields that @sdcorejs/utils 1.2 rejects as property paths
// ---------------------------------------------------------------------------
describe('TableFormatService.format — invalid-path fields (NSP-5745)', () => {
  let service: TableFormatService;

  beforeEach(() => {
    service = buildService();
  });

  it('resolves literal and legacy-nested values instead of rejecting the whole format', async () => {
    const raw = [{ 'Loại sản phẩm*': 'Cao tầng', 'Hướng ban công': 'Tây', ' Mã ': 'X-01', a: { 'b c': 3 } }];
    const cols: SdTableColumn[] = [
      { field: 'Loại sản phẩm*', title: 'Loại sản phẩm', type: 'string' },
      { field: 'Hướng ban công', title: 'Hướng ban công', type: 'string' },
      { field: ' Mã ', title: 'Mã', type: 'string' },
      { field: 'a.b c', title: 'Nested', type: 'string' },
    ];

    const result = await service.format(raw, cols, {}, {});

    const display = result[0].meta.display;
    expect(display['Loại sản phẩm*'].data).toBe('Cao tầng');
    expect(display['Hướng ban công'].data).toBe('Tây');
    expect(display[' Mã '].data).toBe('X-01');
    expect(display['a.b c'].data).toBe(3);
  });

  it('collects lazy-values keys from a whitespace field', async () => {
    const raw = [{ 'Mã hướng': 'UNIT_DIRECTION_W' }];
    const viewsSpy = jasmine.createSpy('views').and.returnValue(Promise.resolve([{ id: 'UNIT_DIRECTION_W', name: 'Tây' }]));
    const cacheObjValues: Record<string, Record<string, string>> = {};
    const cols: SdTableColumn[] = [
      {
        field: 'Mã hướng',
        title: 'Hướng',
        type: 'lazy-values',
        option: { items: () => Promise.resolve([]), valueField: 'id', displayField: 'name', views: viewsSpy },
      },
    ];

    const result = await service.format(raw, cols, {}, cacheObjValues);

    expect(viewsSpy).toHaveBeenCalledWith(['UNIT_DIRECTION_W']);
    expect(result[0].meta.display['Mã hướng']).toBeDefined();
    expect(cacheObjValues['Mã hướng']['UNIT_DIRECTION_W']).toBeDefined();
  });
});
