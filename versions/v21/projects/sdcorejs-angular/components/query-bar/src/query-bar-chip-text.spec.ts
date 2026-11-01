import { fakeAsync, flush } from '@angular/core/testing';
import type { Filter } from '@sdcorejs/utils/models';
import { SdQueryField } from './query-bar.model';
import { ɵSdQueryChipLabels, ɵsdQueryChipValueText, type ɵSdQueryChipTextContext } from './query-bar-chip-text';

const context: ɵSdQueryChipTextContext = {
  t: (key, params) => `${key}(${params?.['value'] ?? ''})`,
  toFormat: (value, format) => {
    const date = new Date(String(value));
    const pad = (n: number) => String(n).padStart(2, '0');
    if (format === 'yyyy') return String(date.getFullYear());
    if (format === 'dd/MM') return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  },
};
const status: SdQueryField = {
  key: 'status',
  label: 'Status',
  type: 'values',
  option: {
    items: [
      { id: 'new', name: 'New' },
      { id: 'done', name: 'Done' },
    ],
    valueField: 'id',
    displayField: 'name',
  },
} as SdQueryField;
const created = { key: 'created', label: 'Created', type: 'date' } as SdQueryField;
const total = { key: 'total', label: 'Total', type: 'number' } as SdQueryField;
const text = (filter: unknown, field: SdQueryField | undefined, extra: Partial<ɵSdQueryChipTextContext> = {}) =>
  ɵsdQueryChipValueText(filter as Filter, field, { ...context, ...extra });

describe('ɵsdQueryChipValueText', () => {
  it('shows one value by its label and several as the first label plus a count', () => {
    expect(text({ field: 'status', operator: 'IN', data: ['done'] }, status)).toBe('Done');
    expect(text({ field: 'status', operator: 'IN', data: ['done', 'new'] }, status)).toBe('Done +1');
    expect(text({ field: 'status', operator: 'IN', data: [] }, status)).toBe('');
  });

  it('shows a date range inside one year as dd/MM – dd/MM/yyyy', () => {
    expect(text({ field: 'created', operator: 'BETWEEN', data: { from: '2026-10-01', to: '2026-10-31' } }, created)).toBe(
      '01/10 – 31/10/2026'
    );
  });

  it('shows an open range with from / to and a closed number range with a dash', () => {
    expect(text({ field: 'total', operator: 'BETWEEN', data: { from: 10, to: null } }, total)).toBe(
      'core.component.query-bar.range.from(10)'
    );
    expect(text({ field: 'total', operator: 'BETWEEN', data: { from: null, to: 20 } }, total)).toBe(
      'core.component.query-bar.range.to(20)'
    );
    expect(text({ field: 'total', operator: 'BETWEEN', data: { from: 10, to: 20 } }, total)).toBe('10 – 20');
  });

  it('shows nothing for NULL / NOT_NULL and falls back to the raw value without a field', () => {
    expect(text({ field: 'status', operator: 'NULL', data: null }, status)).toBe('');
    expect(text({ field: 'x', operator: 'EQUAL', data: 'raw' }, undefined)).toBe('raw');
  });

  it('uses loaded labels for values it cannot read synchronously', () => {
    const lazy = { key: 'owner', label: 'Owner', type: 'lazy-values', option: { valueField: 'id', displayField: 'name' } } as SdQueryField;
    expect(text({ field: 'owner', operator: 'EQUAL', data: 7 }, lazy)).toBe('7');
    expect(text({ field: 'owner', operator: 'EQUAL', data: 7 }, lazy, { labels: new Map([[7, 'Lan']]) })).toBe('Lan');
  });
});

describe('ɵSdQueryChipLabels', () => {
  it('looks lazy-values labels up once through views', fakeAsync(() => {
    const views = jasmine.createSpy('views').and.resolveTo([{ id: 7, name: 'Lan' }]);
    const lazy = {
      key: 'owner',
      label: 'Owner',
      type: 'lazy-values',
      option: { valueField: 'id', displayField: 'name', views, search: () => Promise.resolve([]) },
    } as unknown as SdQueryField;
    const labels = new ɵSdQueryChipLabels();
    const filter = { field: 'owner', operator: 'EQUAL', data: 7 } as unknown as Filter;
    labels.resolve(filter, lazy);
    labels.resolve(filter, lazy);
    flush();
    expect(views).toHaveBeenCalledTimes(1);
    expect(labels.get('owner')?.get(7)).toBe('Lan');
  }));
});
