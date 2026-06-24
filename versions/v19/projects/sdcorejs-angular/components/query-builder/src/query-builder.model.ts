import { DateRelative, Filter, Operator } from '@sdcorejs/utils/models';
import { FilterUtilities } from '@sdcorejs/utils/fns';

// ---------------------------------------------------------------------------
// Field metadata — the public config a consumer declares so the builder knows
// each filterable field's type (→ which operators make sense) and how to render
// its value editor + view-mode label. Self-contained: query-builder does NOT
// reuse query-bar's SdQueryField; it only borrows `Operator`/`Filter` from utils.
// ---------------------------------------------------------------------------

/** Field kinds the builder understands. Drives the operator set + value editor. */
export type SdQueryBuilderFieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'values';

/** One option for a `values`-type field (enum / lookup). */
export interface SdQueryBuilderFieldOption {
  /** Stored value (sent inside the `Filter`). */
  value: any;
  /** Human-readable label shown in the select + view-mode string. */
  display: string;
}

/**
 * One filterable field. `key` matches `Filter.field` (dot-notation allowed);
 * `label` is what the view-mode raw string renders (field token = label).
 */
export interface SdQueryBuilderField {
  /** Dot-notation field path — written to `Filter.field`. */
  key: string;
  /** Human label — shown in the field picker AND as the view-mode field token. */
  label: string;
  /** Field type — picks the default operator set + value editor control. */
  type: SdQueryBuilderFieldType;
  /** Material icon shown before the label in the field picker; falls back to `QB_TYPE_ICON[type]` then `'tune'`. */
  icon?: string;
  /** Override the allowed operator set (otherwise `QB_OPERATORS_BY_TYPE[type]`). */
  operators?: Operator[];
  /** Override the starting operator (otherwise `QB_DEFAULT_OPERATOR_BY_TYPE[type]`). */
  defaultOperator?: Operator;
  /** Options for `type: 'values'` — the select list + display-label lookup. */
  values?: SdQueryBuilderFieldOption[];
  /** Label for the `true` branch of a boolean field (default `'Có'`). */
  trueLabel?: string;
  /** Label for the `false` branch of a boolean field (default `'Không'`). */
  falseLabel?: string;
  /** Lower bound for number / date value editors. */
  min?: number | string;
  /** Upper bound for number / date value editors. */
  max?: number | string;
  /** Optional domain guard for field-to-field comparison candidates. */
  compareGroup?: string;
  /** Set false to hide this field from field-to-field comparison. */
  allowFieldCompare?: boolean;
}

export interface SdQueryBuilderOption {
  autoId?: string;
  fields: SdQueryBuilderField[];
  mode?: 'edit' | 'view';
  comparisonMode?: QbComparisonMode;
  disabled?: boolean;
  value?: Filter | null;
  filters?: Filter[];
  rootLogic?: 'AND' | 'OR';
  onValueChange?: (value: Filter | null) => void;
  onFiltersChange?: (filters: Filter[]) => void;
  onRootLogicChange?: (logic: 'AND' | 'OR') => void;
}

// ---------------------------------------------------------------------------
// Internal tree — carries UI state (stable `id` for @for + dropdown `open`).
// NEVER emitted; mapped to/from the public `Filter` by the serializer.
// ---------------------------------------------------------------------------

export type QbNode = QbGroup | QbRule;

/** Component-level capability for right-hand operands. */
export type QbComparisonMode = 'value-only' | 'value-or-field';

/** Per-rule right-hand operand source. */
export type QbValueSource = 'literal' | 'field';

/** A logical group of nodes joined by AND / OR. Maps to `FilterAndOr`. */
export interface QbGroup {
  id: string;
  kind: 'group';
  logic: 'AND' | 'OR';
  children: QbNode[];
  /** UI-only: whether this group's "+" dropdown is open. */
  open?: boolean;
}

/** A single `field operator value` condition. Maps to a leaf `Filter`. */
export interface QbRule {
  id: string;
  kind: 'rule';
  field?: string;
  operator?: Operator;
  /** Single value, `{ from, to }` for BETWEEN, or an array for IN / NOT_IN. */
  value?: any;
  /** Internal UI state: literal input or a same-type field reference. */
  valueSource?: QbValueSource;
  /** Right-hand field key when `valueSource` is `'field'`. */
  compareField?: string;
}

/** Type guard — narrows a `QbNode` to a `QbGroup`. */
export function isQbGroup(node: QbNode): node is QbGroup {
  return node.kind === 'group';
}

// ---------------------------------------------------------------------------
// View-mode tokens — the serializer turns a `Filter` into a token stream so the
// template can wrap each piece in a highlight `<span>` (operator / value / etc).
// ---------------------------------------------------------------------------

export type QbTokenKind = 'field' | 'op' | 'value' | 'logic' | 'paren' | 'plain';

/** One piece of the rendered raw query string, tagged for highlight styling. */
export interface QbToken {
  text: string;
  kind: QbTokenKind;
}

// ---------------------------------------------------------------------------
// Operator vocabulary per field type. Mirrors query-bar's
// SD_QUERY_OPERATORS_BY_TYPE so the two components stay consistent, but is kept
// local so query-builder has no dependency on the query-bar package.
// ---------------------------------------------------------------------------

/** Allowed operators per field type — used when `field.operators` is not set. */
export const QB_OPERATORS_BY_TYPE: Record<SdQueryBuilderFieldType, Operator[]> = {
  string: ['CONTAIN', 'NOT_CONTAIN', 'EQUAL', 'NOT_EQUAL', 'START_WITH', 'END_WITH', 'NULL', 'NOT_NULL'],
  number: ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'GREATER_OR_EQUAL', 'LESS_THAN', 'LESS_OR_EQUAL', 'BETWEEN', 'NULL', 'NOT_NULL'],
  boolean: ['EQUAL', 'NOT_EQUAL'],
  date: ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'NULL', 'NOT_NULL'],
  datetime: ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'NULL', 'NOT_NULL'],
  values: ['IN', 'NOT_IN', 'EQUAL', 'NOT_EQUAL', 'NULL', 'NOT_NULL'],
};

/** Default operator when a rule is first created for a field. */
export const QB_DEFAULT_OPERATOR_BY_TYPE: Record<SdQueryBuilderFieldType, Operator> = {
  string: 'CONTAIN',
  number: 'EQUAL',
  boolean: 'EQUAL',
  date: 'BETWEEN',
  datetime: 'BETWEEN',
  values: 'IN',
};

/** Operators with no value payload — the value editor is hidden for these. */
export const QB_NO_DATA_OPERATORS: Operator[] = ['NULL', 'NOT_NULL'];

/** Operators whose value is an array — the value editor offers multi-select. */
export const QB_MULTI_OPERATORS: Operator[] = ['IN', 'NOT_IN'];

/** Operators allowed for `field` — explicit override wins, else the per-type set. */
export function qbAllowedOperators(field: SdQueryBuilderField | undefined): Operator[] {
  if (!field) return [];
  if (field.operators?.length) return field.operators;
  return QB_OPERATORS_BY_TYPE[field.type] ?? [];
}

/** Starting operator for a new rule on `field` — falls back to the per-type default. */
export function qbDefaultOperator(field: SdQueryBuilderField | undefined): Operator | undefined {
  if (!field) return undefined;
  const allowed = qbAllowedOperators(field);
  if (field.defaultOperator && allowed.includes(field.defaultOperator)) return field.defaultOperator;
  const byType = QB_DEFAULT_OPERATOR_BY_TYPE[field.type];
  return allowed.includes(byType) ? byType : allowed[0];
}

/** True when `op` is NULL / NOT_NULL (no value editor). */
export function qbIsNoDataOperator(op: Operator | undefined): boolean {
  return !!op && QB_NO_DATA_OPERATORS.includes(op);
}

/** True when `op` is IN / NOT_IN (array value). */
export function qbIsMultiOperator(op: Operator | undefined): boolean {
  return !!op && QB_MULTI_OPERATORS.includes(op);
}

/** True when the operator accepts one right-hand operand, including a field reference. */
export function qbSupportsFieldCompareOperator(op: Operator | undefined): boolean {
  return !!op && !qbIsNoDataOperator(op) && !qbIsMultiOperator(op) && op !== 'BETWEEN';
}

/**
 * Icon fallback per field type when `SdQueryBuilderField.icon` is not set.
 * Mirrors query-bar's `SD_QUERY_TYPE_ICON` so the two components read consistently,
 * but kept local so query-builder has no dependency on the query-bar package.
 */
export const QB_TYPE_ICON: Record<SdQueryBuilderFieldType, string> = {
  string: 'text_fields',
  number: 'tag',
  boolean: 'toggle_on',
  date: 'event',
  datetime: 'schedule',
  values: 'list',
};

/**
 * Icon shown before a field in the field picker / selected trigger.
 * Priority: `field.icon` → `QB_TYPE_ICON[field.type]` → `'tune'` (default, like query-bar).
 */
export function qbFieldIcon(field: SdQueryBuilderField | undefined): string {
  if (!field) return 'tune';
  return field.icon ?? QB_TYPE_ICON[field.type] ?? 'tune';
}

// ---------------------------------------------------------------------------
// Node factories — monotonic counter for stable, render-safe ids (no Math.random
// / Date.now so SSR + tests stay deterministic).
// ---------------------------------------------------------------------------

let qbSeq = 0;

/** Next stable node id with the given prefix. */
export function qbId(prefix = 'qb'): string {
  return `${prefix}-${++qbSeq}`;
}

/** Build a fresh rule node (optionally pre-filled). */
export function qbNewRule(field?: string, operator?: Operator, value?: any, valueSource?: QbValueSource, compareField?: string): QbRule {
  return { id: qbId('r'), kind: 'rule', field, operator, value, valueSource, compareField };
}

/** Build a fresh group node. */
export function qbNewGroup(logic: 'AND' | 'OR' = 'AND', children: QbNode[] = []): QbGroup {
  return { id: qbId('g'), kind: 'group', logic, children };
}

// ---------------------------------------------------------------------------
// Relative dates — a date/datetime rule's value may be a relative spec resolved
// at query time, instead of an absolute picked date. The model is REUSED from
// `@sdcorejs/utils`: an offset is a `DateRelative` ({ amount, direction, unit });
// "today" is the `'TODAY'` sentinel. The serializer maps these to the Filter
// `dataType` discriminator (`'date-relative'` / `'date-today'`). The builder UI
// only offers day/week/month even though `DateRelative` also allows `'hour'`.
// Single-value operators only (not BETWEEN).
// ---------------------------------------------------------------------------

/** Offset unit for a relative date — re-exported from the utils `DateRelative` model. */
export type SdQbRelativeUnit = DateRelative['unit'];

/** Offset direction for a relative date — re-exported from the utils `DateRelative` model. */
export type SdQbRelativeDirection = DateRelative['direction'];

/** Sentinel held as a rule value (and emitted as `data`) for the "today" date mode. */
export const QB_TODAY = 'TODAY';
/** The `'TODAY'` sentinel type (matches the utils `date-today` data literal). */
export type QbToday = typeof QB_TODAY;

/** Date value editor mode for a date/datetime rule (derived from the rule value). */
export type QbDateMode = 'absolute' | 'now' | 'relative';

/** Type guard — narrows a rule value to a utils `DateRelative` (offset spec). */
export const qbIsRelativeDate = FilterUtilities.isDateRelative;

/** Type guard — narrows a rule value to the `'TODAY'` sentinel ("now"/today mode). */
export function qbIsToday(v: any): v is QbToday {
  return v === QB_TODAY;
}

/** Starting relative value when a rule first switches to "relative" mode. */
export function qbDefaultRelative(): DateRelative {
  return { amount: 1, direction: 'previous', unit: 'day' };
}

/** One date-mode option — carries a Material icon shown in the dropdown + selected trigger. */
export interface QbDateModeOption {
  value: QbDateMode;
  display: string;
  /** Material icon name (outlined set). */
  icon: string;
}

/** Stable option list for the date-mode select (module ref — never reallocated). */
export const QB_DATE_MODES: readonly QbDateModeOption[] = [
  { value: 'absolute', display: 'Ngày cụ thể', icon: 'event' },
  { value: 'now', display: 'Hôm nay', icon: 'today' },
  { value: 'relative', display: 'Tương đối', icon: 'history' },
];

/** One value-source option for field-to-field comparison UI. */
export interface QbValueSourceOption {
  value: QbValueSource;
  display: string;
  /** Material icon name (outlined set). */
  icon: string;
}

/** Stable option list for choosing between a literal value and another field. */
export const QB_VALUE_SOURCE_OPTIONS: readonly QbValueSourceOption[] = [
  { value: 'literal', display: 'Nhập giá trị', icon: 'edit_note' },
  { value: 'field', display: 'Chọn trường', icon: 'view_column' },
];

/** Stable combined direction×unit option list (token `'unit:direction'`). */
export const QB_RELATIVE_UNIT_OPTIONS: readonly { value: string; display: string }[] = [
  { value: 'day:previous', display: 'ngày trước' },
  { value: 'day:next', display: 'ngày tới' },
  { value: 'week:previous', display: 'tuần trước' },
  { value: 'week:next', display: 'tuần tới' },
  { value: 'month:previous', display: 'tháng trước' },
  { value: 'month:next', display: 'tháng tới' },
];

/** Shared empty option array — stable ref for fallbacks (avoids per-call allocation). */
export const QB_EMPTY_OPTIONS: SdQueryBuilderFieldOption[] = [];
