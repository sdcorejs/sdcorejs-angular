import type { SdTableColumnAnyRow } from '../../models/table-column.model';
import { autoMobileView, resolveMobileView, SD_TABLE_MOBILE_MAX_FIELDS, warnMobileOnce } from './mobile-view.util';

const columns: SdTableColumnAnyRow[] = [
  { field: 'code', type: 'string', title: 'Code' },
  { field: 'customer', type: 'string', title: 'Customer' },
  { field: 'status', type: 'string', title: 'Status', useBadge: () => ({ title: 'x', color: 'success' }) },
  { field: 'total', type: 'number', title: 'Total' },
  {
    field: 'audit',
    type: 'children',
    title: 'Audit',
    children: [
      { field: 'createdAt', type: 'date', title: 'Created' },
      { field: 'createdBy', type: 'string', title: 'By', invisible: true },
    ],
  },
  { field: 'note', type: 'string', title: 'Note', hidden: true },
];
const field = (slot: unknown): string | undefined => (slot as { column?: { field: string } } | undefined)?.column?.field;

describe('resolveMobileView', () => {
  it('maps every slot to its leaf column, children of grouped headers included', () => {
    const { view, issues } = resolveMobileView(columns, 'card', {
      title: 'code',
      subtitle: 'customer',
      badge: 'status',
      highlight: 'total',
      fields: ['createdAt', 'createdBy'],
    });
    expect(issues).toEqual([]);
    expect(field(view.title)).toBe('code');
    expect(field(view.subtitle)).toBe('customer');
    expect(view.badge).toEqual({ column: columns[2], badge: true });
    expect(view.fields.map(column => column.field)).toEqual(['total', 'createdAt', 'createdBy']);
    expect(view.highlight).toBeTrue();
    expect(view.maxFields).toBe(SD_TABLE_MOBILE_MAX_FIELDS);
  });

  it('keeps fixed text and a fixed badge as they are', () => {
    const badge = { title: 'Locked', color: 'error' as const };
    const { view, issues } = resolveMobileView(columns, undefined, { title: { text: 'Fixed' }, badge });
    expect(issues).toEqual([]);
    expect(view.title).toEqual({ text: 'Fixed' });
    expect(view.badge).toEqual({ data: badge });
  });

  it('drops an unknown field and reports it; a missing title is left to the row label', () => {
    const { view, issues } = resolveMobileView(columns, 'card', { title: 'cod', fields: ['total', 'missing'], highlight: 'nope' });
    expect(view.title).toBeUndefined();
    expect(view.highlight).toBeFalse();
    expect(view.fields.map(column => column.field)).toEqual(['total']);
    expect(issues).toEqual([
      { kind: 'unknown-field', value: 'cod' },
      { kind: 'unknown-field', value: 'nope' },
      { kind: 'unknown-field', value: 'missing' },
    ]);
  });

  it('shows a badge field without useBadge as text and reports it', () => {
    const { view, issues } = resolveMobileView(columns, 'card', { title: 'code', badge: 'customer' });
    expect(view.badge).toEqual({ column: columns[1], badge: false });
    expect(issues).toEqual([{ kind: 'badge-field', value: 'customer' }]);
  });

  it('draws a card for an unknown layout and reports it', () => {
    const { view, issues } = resolveMobileView(columns, 'list', { title: 'code' });
    expect(view.layout).toBe('card');
    expect(issues).toEqual([{ kind: 'layout', value: 'list' }]);
  });

  it('shows hidden, invisible and settings-hidden fields the consumer named', () => {
    const { view, issues } = resolveMobileView(columns, 'card', { title: 'note', fields: ['createdBy'] });
    expect(issues).toEqual([]);
    expect(field(view.title)).toBe('note');
    expect(view.fields.map(column => column.field)).toEqual(['createdBy']);
  });

  it('puts the highlight first once and floors maxFields', () => {
    const { view } = resolveMobileView(columns, 'card', {
      title: 'code',
      highlight: 'total',
      fields: ['customer', 'total'],
      maxFields: 2.7,
    });
    expect(view.fields.map(column => column.field)).toEqual(['total', 'customer']);
    expect(view.maxFields).toBe(2);
    expect(resolveMobileView(columns, 'card', { title: 'code', maxFields: -1 }).view.maxFields).toBe(SD_TABLE_MOBILE_MAX_FIELDS);
    expect(resolveMobileView(columns, 'card', { title: 'code', maxFields: 0 }).view.maxFields).toBe(0);
  });
});

describe('autoMobileView', () => {
  it('takes the rowKey column as title, a useBadge column as badge, the next string column as subtitle', () => {
    const view = autoMobileView(columns, 'total');
    expect(field(view.title)).toBe('total');
    expect(view.badge).toEqual({ column: columns[2], badge: true });
    expect(field(view.subtitle)).toBe('code');
    expect(view.fields.map(column => column.field)).toEqual(['customer', 'createdAt']);
    expect(view.highlight).toBeFalse();
  });

  it('falls back to the first column and leaves hidden and invisible columns out', () => {
    const view = autoMobileView(columns, 'missing');
    expect(field(view.title)).toBe('code');
    expect(field(view.subtitle)).toBe('customer');
    expect(view.fields.map(column => column.field)).not.toContain('note');
    expect(view.fields.map(column => column.field)).not.toContain('createdBy');
  });

  it('has no slots without columns', () => {
    expect(autoMobileView([])).toEqual({
      layout: 'card',
      title: undefined,
      subtitle: undefined,
      badge: undefined,
      fields: [],
      highlight: false,
      maxFields: 4,
    });
  });
});

describe('warnMobileOnce', () => {
  it('warns once per owner and key', () => {
    const warn = spyOn(console, 'warn');
    const a = {};
    const b = {};
    warnMobileOnce(a, 'unknown-field:cod', 'unknown field', 'cod');
    warnMobileOnce(a, 'unknown-field:cod', 'unknown field', 'cod');
    warnMobileOnce(a, 'layout:list', 'layout');
    warnMobileOnce(b, 'unknown-field:cod', 'unknown field', 'cod');
    expect(warn).toHaveBeenCalledTimes(3);
    expect(warn.calls.first().args).toEqual(['[sd-table] unknown field', 'cod']);
  });
});
