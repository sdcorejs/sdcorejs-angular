/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signal } from '@angular/core';
import { SdSearch } from '@sdcorejs/angular/forms/models';
import { Filter, NestedKeyOf, Operator } from '@sdcorejs/utils/models';

// ---------------------------------------------------------------------------
// Field definitions — discriminated union by `type`, mirroring sd-table column
// vocabulary. Each consumer declares its searchable fields via `SdQueryField`.
// ---------------------------------------------------------------------------

export type SdQueryFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'values'
  | 'lazy-values';

interface SdQueryFieldBase<T = any> {
  /** Dot-notation field path (matches `Filter.field`). */
  key: NestedKeyOf<T>;
  /** Human-readable label shown on chip + field picker. */
  label: string;
  /** Material icon name; falls back to `SD_QUERY_TYPE_ICON[type]` then `'tune'`. */
  icon?: string;
  /**
   * Controls the operator selector in the chip popover:
   * - omitted / `false` → **simple mode**: no operator dropdown; the chip always uses
   *   `defaultOperator` (or the per-type default). Use this for screens that don't need
   *   operator choice.
   * - `true` → show the full operator set for the field's `type`
   *   (`SD_QUERY_OPERATORS_BY_TYPE[type]`).
   * - `Operator[]` → show exactly these operators.
   */
  operators?: boolean | Operator[];
  /**
   * Operator the chip starts with. Falls back to `SD_QUERY_DEFAULT_OPERATOR_BY_TYPE[type]`:
   * string→CONTAIN, number→EQUAL, values/lazy-values→IN, boolean→EQUAL, date/datetime→BETWEEN.
   */
  defaultOperator?: Operator;
  /** Field is offered in picker but not interactive (read-only badge in chip). */
  disabled?: boolean;
}

export interface SdQueryFieldString<T = any> extends SdQueryFieldBase<T> {
  type: 'string';
}

export interface SdQueryFieldNumber<T = any> extends SdQueryFieldBase<T> {
  type: 'number';
  /** Bounds for the input control inside the chip popover. */
  min?: number;
  max?: number;
  /** Step for the number input. */
  step?: number;
}

export interface SdQueryFieldBoolean<T = any> extends SdQueryFieldBase<T> {
  type: 'boolean';
  /** Labels rendered for the true/false buttons. Default: "Có" / "Không". */
  trueLabel?: string;
  falseLabel?: string;
}

export interface SdQueryFieldDate<T = any> extends SdQueryFieldBase<T> {
  type: 'date' | 'datetime';
  /** Restrict the picker calendar to this range. */
  min?: Date | string;
  max?: Date | string;
}

/**
 * Statically-known options (sync array, signal, or one-shot promise).
 * Mirrors `SdTableColumnValues.option`.
 */
export interface SdQueryFieldValues<T = any, K = Record<string, any>> extends SdQueryFieldBase<T> {
  type: 'values';
  option: {
    items: K[] | Signal<K[]> | (() => Promise<K[]>);
    valueField: NestedKeyOf<K>;
    displayField: NestedKeyOf<K>;
  };
}

/**
 * Server-backed options — searchable, paginated. Mirrors `SdTableColumnLazyValues.option`.
 * `search` is the unified `SdSearch<K>` callback used by `sd-select`: it handles
 * `{ type: 'SEARCH', searchText }` for live queries and `{ type: 'VALUE', value }` for
 * resolving chip-display labels of already-selected IDs.
 */
export interface SdQueryFieldLazyValues<T = any, K = Record<string, any>> extends SdQueryFieldBase<T> {
  type: 'lazy-values';
  option: {
    search: SdSearch<K>;
    valueField: NestedKeyOf<K>;
    displayField: NestedKeyOf<K>;
  };
}

export type SdQueryField<T = any> =
  | SdQueryFieldString<T>
  | SdQueryFieldNumber<T>
  | SdQueryFieldBoolean<T>
  | SdQueryFieldDate<T>
  | SdQueryFieldValues<T>
  | SdQueryFieldLazyValues<T>;

// ---------------------------------------------------------------------------
// Output model — `SdQuery` is the canonical payload emitted via `[(query)]`.
// It composes the reusable `Filter[]` from utils plus query-bar-only metadata
// (global logic, free-text search). Callers can also bind `[(filters)]` alone
// when they don't need logic/search.
// ---------------------------------------------------------------------------

export type SdQueryLogic = 'AND' | 'OR';

export interface SdQuery<T = any> {
  filters: Filter<T>[];
  /** Global connector between filters. Defaults to `'AND'`. */
  logic?: SdQueryLogic;
  /** Free-text search box (only present when `showSearch=true`). */
  search?: string;
}

export interface SdQueryBarOption<T = any> {
  /** Prefix for auto-generated `data-autoid` on inner controls. */
  autoId?: string;
  /** Available fields the user can filter by. */
  fields: SdQueryField<T>[];
  /** Initial active filter chips. */
  filters?: Filter<T>[];
  /** Initial global connector between filters. */
  logic?: SdQueryLogic;
  /** Initial free-text search string. */
  search?: string;
  mode?: 'popover' | 'inline';
  density?: 'compact' | 'comfortable';
  showSearch?: boolean;
  showSavedFilters?: boolean;
  savedFiltersKey?: string;
  showLogicToggle?: boolean;
  showClearAll?: boolean;
  showOperatorOnChip?: boolean;
  onQueryChange?: (query: SdQuery<T>) => void;
  onApply?: (query: SdQuery<T>) => void;
}

/** Persisted bookmark of a query (filters + logic + search) — managed by `[savedFiltersKey]`. */
export interface SdSavedFilter<T = any> {
  id: string;
  name: string;
  query: SdQuery<T>;
}

/**
 * Transient state of the in-progress chip during inline-mode token build (field →
 * operator → value). Lives at the parent (`SdQueryBar.building()`) and is rendered
 * by `<sd-query-build-chip>`. Step transitions:
 *   - 'operator' — operator menu open, waiting for the user to pick a condition
 *   - 'value'    — operator locked, value picker / seamless input is the focus
 */
export interface BuildingChip<T = any> {
  field: SdQueryField<T>;
  operator?: Operator;
  step: 'operator' | 'value';
  value?: unknown;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Full operator set per field type — used when `operators: true`. */
export const SD_QUERY_OPERATORS_BY_TYPE: Record<SdQueryFieldType, Operator[]> = {
  string:        ['CONTAIN', 'EQUAL', 'NOT_EQUAL', 'START_WITH', 'END_WITH', 'NULL', 'NOT_NULL'],
  number:        ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'GREATER_OR_EQUAL', 'LESS_THAN', 'LESS_OR_EQUAL', 'BETWEEN'],
  boolean:       ['EQUAL'],
  date:          ['EQUAL', 'BETWEEN', 'GREATER_THAN', 'LESS_THAN'],
  datetime:      ['EQUAL', 'BETWEEN', 'GREATER_THAN', 'LESS_THAN'],
  values:        ['IN', 'NOT_IN', 'NULL', 'NOT_NULL'],
  'lazy-values': ['IN', 'NOT_IN', 'NULL', 'NOT_NULL'],
};

/** Default operator when a chip is created and `field.defaultOperator` is not set. */
export const SD_QUERY_DEFAULT_OPERATOR_BY_TYPE: Record<SdQueryFieldType, Operator> = {
  string:        'CONTAIN',
  number:        'EQUAL',
  boolean:       'EQUAL',
  date:          'BETWEEN',
  datetime:      'BETWEEN',
  values:        'IN',
  'lazy-values': 'IN',
};

/** Icon fallback per field type when `SdQueryField.icon` is not set. */
export const SD_QUERY_TYPE_ICON: Record<SdQueryFieldType, string> = {
  string:        'text_fields',
  number:        'tag',
  boolean:       'toggle_on',
  date:          'event',
  datetime:      'schedule',
  values:        'list',
  'lazy-values': 'list',
};

/**
 * Resolves the icon shown on chips and in the field picker.
 * Priority: `field.icon` → `SD_QUERY_TYPE_ICON[field.type]` → `'tune'`.
 */
export function sdQueryFieldIcon(field: SdQueryField): string {
  return field.icon ?? SD_QUERY_TYPE_ICON[field.type] ?? 'tune';
}

/** Operators that carry no data — value section is hidden in chip popover. */
export const SD_QUERY_NO_DATA_OPERATORS: Operator[] = ['NULL', 'NOT_NULL'];

/** Operators that carry an array payload — UI offers multi-select. */
export const SD_QUERY_MULTI_OPERATORS: Operator[] = ['IN', 'NOT_IN'];

/** Picks the initial operator when a new chip is created for `field`. */
export function sdQueryDefaultOperator(field: SdQueryField): Operator {
  if (field.defaultOperator) return field.defaultOperator;
  return SD_QUERY_DEFAULT_OPERATOR_BY_TYPE[field.type];
}

/**
 * Operators offered in the chip popover for `field`:
 * - `operators === true` → full set for the type
 * - `operators` is an array → that array (deduped against the type set is the caller's job)
 * - otherwise (simple mode) → just the single default operator (no real choice)
 */
export function sdQueryAllowedOperators(field: SdQueryField): Operator[] {
  if (field.operators === true) return SD_QUERY_OPERATORS_BY_TYPE[field.type];
  if (Array.isArray(field.operators) && field.operators.length > 0) return field.operators;
  return [sdQueryDefaultOperator(field)];
}

/**
 * Whether the operator selector should be visible. Simple mode (operators omitted/false,
 * or an array with a single entry) hides the dropdown — the chip uses one fixed operator.
 */
export function sdQueryShowOperatorSelector(field: SdQueryField): boolean {
  return sdQueryAllowedOperators(field).length > 1;
}
