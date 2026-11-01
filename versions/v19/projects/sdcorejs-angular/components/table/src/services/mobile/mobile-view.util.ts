import { isDevMode, type TemplateRef } from '@angular/core';
import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { SdTableRowMobileDefContext } from '../../directives/sd-table-row-mobile-def.directive';
import type { SdTableColumnAnyRow } from '../../models/table-column.model';
import type { SdTableMobileCardData, SdTableMobileDataFn } from '../../models/table-mobile.model';
import { leafColumns } from '../column-leaf.util';

/** What fills a phone card: a template, slots from `mobile.template.data`, or slots derived from the columns. */
export type SdTableMobileBody<T> =
  | { kind: 'template'; templateRef: TemplateRef<SdTableRowMobileDefContext<T>> }
  | { kind: 'data'; layout: unknown; data: SdTableMobileDataFn<T, SdTableMobileCardData<T>> }
  | { kind: 'auto' };

/** Grid cells before the "{n} more fields" button when `maxFields` is not set. */
export const SD_TABLE_MOBILE_MAX_FIELDS = 4;

/** A text slot of a card: the value of a column, or fixed text. */
export type SdTableMobileTextSlot = { column: SdTableColumnAnyRow } | { text: string };

/** The badge slot: a column value (`badge: false` when the column has no `useBadge`) or a fixed badge. */
export type SdTableMobileBadgeSlot = { column: SdTableColumnAnyRow; badge: boolean } | { data: SdBadgeData };

/** Card slots checked against the columns. */
export interface SdTableMobileView {
  layout: 'card';
  /** Missing: the card shows the row label (`mobile.rowLabel`, then `rowKey`, then the row number). */
  title?: SdTableMobileTextSlot;
  subtitle?: SdTableMobileTextSlot;
  badge?: SdTableMobileBadgeSlot;
  /** Grid cells in order. With `highlight` the first cell is the highlighted one. */
  fields: SdTableColumnAnyRow[];
  highlight: boolean;
  maxFields: number;
}

export type SdTableMobileIssueKind = 'unknown-field' | 'badge-field' | 'layout';

export interface SdTableMobileIssue {
  kind: SdTableMobileIssueKind;
  /** The field or layout value that failed. */
  value: string;
}

export interface SdTableMobileResolved {
  view: SdTableMobileView;
  issues: SdTableMobileIssue[];
}

const hasBadge = (column: SdTableColumnAnyRow): boolean => typeof (column as { useBadge?: unknown }).useBadge === 'function';

/**
 * Checks the slots returned by `mobile.template.data` against the table columns (leaf columns, children of grouped
 * headers included) and returns the card to draw. Pure: the caller warns about `issues`.
 *
 * - An unknown field drops its slot; a missing title falls back to the row label.
 * - A badge field without `useBadge` shows as text.
 * - An unknown `layout` (plain JavaScript) draws a card.
 * - Hidden, invisible and settings-hidden columns still show: the consumer named them.
 */
export const resolveMobileView = (
  columns: readonly SdTableColumnAnyRow[],
  layout: unknown,
  data: Record<string, unknown>
): SdTableMobileResolved => {
  const issues: SdTableMobileIssue[] = [];
  const byField = new Map(leafColumns(columns).map(column => [column.field as string, column]));
  if (layout !== undefined && layout !== 'card') issues.push({ kind: 'layout', value: String(layout) });

  const column = (field: unknown): SdTableColumnAnyRow | undefined => {
    if (typeof field !== 'string') return undefined;
    const found = byField.get(field);
    if (!found) issues.push({ kind: 'unknown-field', value: field });
    return found;
  };
  const text = (value: unknown): SdTableMobileTextSlot | undefined => {
    if (value && typeof value === 'object' && typeof (value as { text?: unknown }).text === 'string')
      return { text: (value as { text: string }).text };
    const found = column(value);
    return found ? { column: found } : undefined;
  };

  const title = text(data['title']);
  const subtitle = text(data['subtitle']);
  let badge: SdTableMobileBadgeSlot | undefined;
  if (typeof data['badge'] === 'string') {
    const found = column(data['badge']);
    if (found) {
      if (!hasBadge(found)) issues.push({ kind: 'badge-field', value: data['badge'] });
      badge = { column: found, badge: hasBadge(found) };
    }
  } else if (data['badge'] && typeof data['badge'] === 'object') {
    badge = { data: data['badge'] as SdBadgeData };
  }

  const highlight = column(data['highlight']);
  const fields: SdTableColumnAnyRow[] = highlight ? [highlight] : [];
  for (const field of Array.isArray(data['fields']) ? data['fields'] : []) {
    const found = column(field);
    if (found && !fields.includes(found)) fields.push(found);
  }
  const max = data['maxFields'];
  return {
    view: {
      layout: 'card',
      title,
      subtitle,
      badge,
      fields,
      highlight: !!highlight,
      maxFields: typeof max === 'number' && Number.isFinite(max) && max >= 0 ? Math.floor(max) : SD_TABLE_MOBILE_MAX_FIELDS,
    },
    issues,
  };
};

/**
 * Card built from the columns on screen (`SD_TABLE_CONFIGURATION.mobile.autoTemplate`, or a row whose `data` threw).
 * Title: the `rowKey` column, else the first column. Badge: the first other column with `useBadge`. Subtitle: the
 * first other `string` column. Fields: the rest, in column order. Hidden, invisible and settings-hidden columns are
 * left out — pass the columns on screen.
 */
export const autoMobileView = (columns: readonly SdTableColumnAnyRow[], rowKey?: string): SdTableMobileView => {
  const shown = leafColumns(columns).filter(column => !column.hidden && !column.invisible);
  const used = new Set<SdTableColumnAnyRow>();
  const take = (found: SdTableColumnAnyRow | undefined): SdTableColumnAnyRow | undefined => {
    if (found) used.add(found);
    return found;
  };
  const title = take(shown.find(column => !!rowKey && column.field === rowKey) ?? shown[0]);
  // why: the badge goes before the subtitle, so a `string` status column with `useBadge` becomes the badge.
  const badge = take(shown.find(column => !used.has(column) && hasBadge(column)));
  const subtitle = take(shown.find(column => !used.has(column) && column.type === 'string'));
  return {
    layout: 'card',
    title: title && { column: title },
    subtitle: subtitle && { column: subtitle },
    badge: badge && { column: badge, badge: true },
    fields: shown.filter(column => !used.has(column)),
    highlight: false,
    maxFields: SD_TABLE_MOBILE_MAX_FIELDS,
  };
};

/**
 * Leaf columns on screen in the order the settings give: `firstColumns` with each grouped header replaced by its
 * visible children (`secondColumns`).
 */
export const shownLeafColumns = (
  firstColumns: readonly SdTableColumnAnyRow[] | undefined,
  secondColumns: readonly SdTableColumnAnyRow[] | undefined
): SdTableColumnAnyRow[] => {
  const children = secondColumns ?? [];
  return (firstColumns ?? []).flatMap(column => {
    if (column.type !== 'children') return [column];
    const fields = new Set(column.children.map(child => child.field as string));
    return children.filter(child => fields.has(child.field as string));
  });
};

const warned = new WeakMap<object, Set<string>>();

/** `console.warn` once per owner (a table) and key, in dev mode only. */
export const warnMobileOnce = (owner: object, key: string, message: string, ...details: unknown[]): void => {
  if (!isDevMode()) return;
  let keys = warned.get(owner);
  if (!keys) warned.set(owner, (keys = new Set()));
  if (keys.has(key)) return;
  keys.add(key);
  console.warn(`[sd-table] ${message}`, ...details);
};
