import { ConfiguredColumn, ConfiguredTable } from '../models/table-option-config.model';
import { SdTableOption } from '../models/table-option.model';
import { defaultConfiguredTable, sdTableHasCustomSetup } from './config-custom.util';

const option = (columns: unknown[], filter?: unknown): SdTableOption =>
  ({ type: 'local', key: 'custom-setup', items: () => [], columns, filter }) as unknown as SdTableOption;

const COLUMNS: Record<string, unknown>[] = [
  { field: 'code', title: 'Mã đơn', width: '120px', fixed: true },
  { field: 'customer', title: { title: 'Khách hàng' }, cell: { truncate: { enable: true } } },
  { field: 'secret', title: 'Bí mật', hidden: true },
  { field: 'note', title: 'Ghi chú', width: '20%', invisible: true },
];

/** The stored value right after a reset: the defaults of the option. */
const stored = (columns: unknown[] = COLUMNS): ConfiguredTable => defaultConfiguredTable(option(columns));

const edit = (table: ConfiguredTable, field: string, patch: Partial<ConfiguredColumn>): ConfiguredTable => ({
  ...table,
  columns: table.columns!.map(column => (column.origin.field === field ? { ...column, ...patch } : column)),
});

describe('table custom setup', () => {
  describe('defaultConfiguredTable', () => {
    it('lists every column that is not hidden, in option order, with its origin', () => {
      const table = defaultConfiguredTable(option(COLUMNS));
      expect(table.columns!.map(column => column.origin.field)).toEqual(['code', 'customer', 'note']);
      expect(table.columns![0]).toEqual({
        origin: { field: 'code', title: 'Mã đơn', width: '120px', invisible: undefined, fixed: true, truncate: undefined },
        title: 'Mã đơn',
        width: '120px',
        invisible: undefined,
        fixed: true,
        truncate: undefined,
      });
      expect(table.columns![1].origin.title).toBe('Khách hàng');
      expect(table.columns![1].truncate).toBe(true);
      expect(table.columns![2].invisible).toBe(true);
    });

    it('is empty without an option', () => {
      expect(defaultConfiguredTable(undefined)).toEqual({ columns: [] });
    });
  });

  describe('sdTableHasCustomSetup', () => {
    const has = (
      configuration: ConfiguredTable | undefined,
      columns: unknown[] = COLUMNS,
      inlineExternal?: Record<string, boolean>,
      filter?: unknown
    ) => sdTableHasCustomSetup({ option: option(columns, filter), configuration, inlineExternal });

    it('is false for the defaults and for nothing stored', () => {
      expect(has(stored())).toBe(false);
      expect(has(undefined)).toBe(false);
      expect(has({})).toBe(false);
    });

    it('is true when the order differs from the option', () => {
      const table = stored();
      expect(has({ columns: [table.columns![1], table.columns![0], table.columns![2]] })).toBe(true);
    });

    it('is true when a column is shown, hidden, renamed, resized, fixed or truncated', () => {
      expect(has(edit(stored(), 'note', { invisible: false })))
        .withContext('shown')
        .toBe(true);
      expect(has(edit(stored(), 'code', { invisible: true })))
        .withContext('hidden')
        .toBe(true);
      expect(has(edit(stored(), 'code', { title: 'Mã' })))
        .withContext('title')
        .toBe(true);
      expect(has(edit(stored(), 'code', { width: '200px' })))
        .withContext('width')
        .toBe(true);
      expect(has(edit(stored(), 'customer', { width: '160px' })))
        .withContext('width set')
        .toBe(true);
      expect(has(edit(stored(), 'code', { fixed: false })))
        .withContext('fixed')
        .toBe(true);
      expect(has(edit(stored(), 'customer', { truncate: false })))
        .withContext('truncate off')
        .toBe(true);
      expect(has(edit(stored(), 'code', { truncate: true })))
        .withContext('truncate on')
        .toBe(true);
    });

    it('treats an empty title or width as the original one', () => {
      expect(has(edit(stored(), 'code', { title: undefined, width: undefined }))).toBe(false);
      expect(has(edit(stored(), 'code', { title: '', width: '' }))).toBe(false);
      expect(has(edit(stored(), 'customer', { truncate: undefined }))).toBe(false);
    });

    it('ignores columns added to or removed from the option since the setup was stored', () => {
      const added = [COLUMNS[0], { field: 'phone', title: 'Điện thoại' }, ...COLUMNS.slice(1)];
      expect(has(stored(), added)).withContext('new column in the middle').toBe(false);
      expect(has(stored(), [COLUMNS[0], COLUMNS[3]]))
        .withContext('column removed')
        .toBe(false);
      expect(has(edit(stored(), 'customer', { title: 'Tên' }), [COLUMNS[0], COLUMNS[3]]))
        .withContext('a change on a removed column')
        .toBe(false);
    });

    it('compares values with the stored origin, so a title changed in code does not count', () => {
      const renamedInCode = [{ ...COLUMNS[0], title: 'Code' }, ...COLUMNS.slice(1)];
      expect(has(stored(), renamedInCode)).toBe(false);
    });

    it('is true when the inline external filters differ from defaultShowing', () => {
      const filter = { externalFilters: [{ field: 'status', defaultShowing: true }, { field: 'note' }] };
      expect(has(stored(), COLUMNS, { status: true, note: false }, filter)).toBe(false);
      expect(has(stored(), COLUMNS, { status: true }, filter))
        .withContext('missing means hidden')
        .toBe(false);
      expect(has(stored(), COLUMNS, { status: false, note: false }, filter)).toBe(true);
      expect(has(stored(), COLUMNS, { status: true, note: true }, filter)).toBe(true);
      expect(has(stored(), COLUMNS, undefined, filter))
        .withContext('not known yet')
        .toBe(false);
    });

    it('ignores inline external filters when filtering is off', () => {
      const filter = { disabled: true, externalFilters: [{ field: 'status', defaultShowing: true }] };
      expect(has(stored(), COLUMNS, { status: false }, filter)).toBe(false);
    });
  });
});
