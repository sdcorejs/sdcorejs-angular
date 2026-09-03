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
  /** Material icon shown before the label in the field picker; falls back to `SD_QB_TYPE_ICON[type]` then `'tune'`. */
  icon?: string;
  /** Override the allowed operator set (otherwise `SD_QB_OPERATORS_BY_TYPE[type]`). */
  operators?: Operator[];
  /** Override the starting operator (otherwise `SD_QB_DEFAULT_OPERATOR_BY_TYPE[type]`). */
  defaultOperator?: Operator;
  /** Options for `type: 'values'` — the select list + display-label lookup. */
  values?: SdQueryBuilderFieldOption[];
  /** Label for the `true` branch of a boolean field (defaults to i18n `core.component.query-builder.boolean.true`). */
  trueLabel?: string;
  /** Label for the `false` branch of a boolean field (defaults to i18n `core.component.query-builder.boolean.false`). */
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
  comparisonMode?: SdQbComparisonMode;
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

// why: cả cụm `qb*` / `QB_*` / `Qb*` trước đây được export public từ `@sdcorejs/angular/components/query-builder`
// (và lọt tiếp ra barrel `@sdcorejs/angular/components`) với tiền tố `qb` tự chế — không nằm trong namespace `sd`
// của package. `QbGroup`, `QbRule`, `QbToken` là những tên rất dễ trùng với model cùng tên bên app consumer khi
// import kiểu `export *`. Nay chuẩn hoá về `SdQb*` / `SD_QB_*` / `sdQb*`; các type đã đúng tiền tố `SdQb*`
// (`SdQbRelativeUnit`, `SdQbRelativeDirection`, …) giữ nguyên.
export type SdQbNode = SdQbGroup | SdQbRule;

/** Component-level capability for right-hand operands. */
export type SdQbComparisonMode = 'value-only' | 'value-or-field';

/** Per-rule right-hand operand source. */
export type SdQbValueSource = 'literal' | 'field';

/** A logical group of nodes joined by AND / OR. Maps to `FilterAndOr`. */
export interface SdQbGroup {
  id: string;
  kind: 'group';
  logic: 'AND' | 'OR';
  children: SdQbNode[];
  /** UI-only: whether this group's "+" dropdown is open. */
  open?: boolean;
}

/** A single `field operator value` condition. Maps to a leaf `Filter`. */
export interface SdQbRule {
  id: string;
  kind: 'rule';
  field?: string;
  operator?: Operator;
  /** Single value, `{ from, to }` for BETWEEN, or an array for IN / NOT_IN. */
  value?: any;
  /** Internal UI state: literal input or a same-type field reference. */
  valueSource?: SdQbValueSource;
  /** Right-hand field key when `valueSource` is `'field'`. */
  compareField?: string;
}

/** Type guard — narrows a `SdQbNode` to a `SdQbGroup`. */
export function sdIsQbGroup(node: SdQbNode): node is SdQbGroup {
  return node.kind === 'group';
}

// ---------------------------------------------------------------------------
// View-mode tokens — the serializer turns a `Filter` into a token stream so the
// template can wrap each piece in a highlight `<span>` (operator / value / etc).
// ---------------------------------------------------------------------------

export type SdQbTokenKind = 'field' | 'op' | 'value' | 'logic' | 'paren' | 'plain';

/** One piece of the rendered raw query string, tagged for highlight styling. */
export interface SdQbToken {
  text: string;
  kind: SdQbTokenKind;
}

// ---------------------------------------------------------------------------
// Operator vocabulary per field type. Mirrors query-bar's
// SD_QUERY_OPERATORS_BY_TYPE so the two components stay consistent, but is kept
// local so query-builder has no dependency on the query-bar package.
// ---------------------------------------------------------------------------

/** Allowed operators per field type — used when `field.operators` is not set. */
export const SD_QB_OPERATORS_BY_TYPE: Record<SdQueryBuilderFieldType, Operator[]> = {
  string: ['CONTAIN', 'NOT_CONTAIN', 'EQUAL', 'NOT_EQUAL', 'START_WITH', 'END_WITH', 'NULL', 'NOT_NULL'],
  number: ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'GREATER_OR_EQUAL', 'LESS_THAN', 'LESS_OR_EQUAL', 'BETWEEN', 'NULL', 'NOT_NULL'],
  boolean: ['EQUAL', 'NOT_EQUAL'],
  date: ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'NULL', 'NOT_NULL'],
  datetime: ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'NULL', 'NOT_NULL'],
  values: ['IN', 'NOT_IN', 'EQUAL', 'NOT_EQUAL', 'NULL', 'NOT_NULL'],
};

/** Default operator when a rule is first created for a field. */
export const SD_QB_DEFAULT_OPERATOR_BY_TYPE: Record<SdQueryBuilderFieldType, Operator> = {
  string: 'CONTAIN',
  number: 'EQUAL',
  boolean: 'EQUAL',
  date: 'BETWEEN',
  datetime: 'BETWEEN',
  values: 'IN',
};

/** Operators with no value payload — the value editor is hidden for these. */
export const SD_QB_NO_DATA_OPERATORS: Operator[] = ['NULL', 'NOT_NULL'];

/** Operators whose value is an array — the value editor offers multi-select. */
export const SD_QB_MULTI_OPERATORS: Operator[] = ['IN', 'NOT_IN'];

/** Operators allowed for `field` — explicit override wins, else the per-type set. */
export function sdQbAllowedOperators(field: SdQueryBuilderField | undefined): Operator[] {
  if (!field) return [];
  if (field.operators?.length) return field.operators;
  return SD_QB_OPERATORS_BY_TYPE[field.type] ?? [];
}

/** Starting operator for a new rule on `field` — falls back to the per-type default. */
export function sdQbDefaultOperator(field: SdQueryBuilderField | undefined): Operator | undefined {
  if (!field) return undefined;
  const allowed = sdQbAllowedOperators(field);
  if (field.defaultOperator && allowed.includes(field.defaultOperator)) return field.defaultOperator;
  const byType = SD_QB_DEFAULT_OPERATOR_BY_TYPE[field.type];
  return allowed.includes(byType) ? byType : allowed[0];
}

/** True when `op` is NULL / NOT_NULL (no value editor). */
export function sdQbIsNoDataOperator(op: Operator | undefined): boolean {
  return !!op && SD_QB_NO_DATA_OPERATORS.includes(op);
}

/** True when `op` is IN / NOT_IN (array value). */
export function sdQbIsMultiOperator(op: Operator | undefined): boolean {
  return !!op && SD_QB_MULTI_OPERATORS.includes(op);
}

/** True when the operator accepts one right-hand operand, including a field reference. */
export function sdQbSupportsFieldCompareOperator(op: Operator | undefined): boolean {
  return !!op && !sdQbIsNoDataOperator(op) && !sdQbIsMultiOperator(op) && op !== 'BETWEEN';
}

/**
 * Icon fallback per field type when `SdQueryBuilderField.icon` is not set.
 * Mirrors query-bar's `SD_QUERY_TYPE_ICON` so the two components read consistently,
 * but kept local so query-builder has no dependency on the query-bar package.
 */
export const SD_QB_TYPE_ICON: Record<SdQueryBuilderFieldType, string> = {
  string: 'text_fields',
  number: 'tag',
  boolean: 'toggle_on',
  date: 'event',
  datetime: 'schedule',
  values: 'list',
};

/**
 * Icon shown before a field in the field picker / selected trigger.
 * Priority: `field.icon` → `SD_QB_TYPE_ICON[field.type]` → `'tune'` (default, like query-bar).
 */
export function sdQbFieldIcon(field: SdQueryBuilderField | undefined): string {
  if (!field) return 'tune';
  return field.icon ?? SD_QB_TYPE_ICON[field.type] ?? 'tune';
}

// ---------------------------------------------------------------------------
// Node factories — monotonic counter for stable, render-safe ids (no Math.random
// / Date.now so SSR + tests stay deterministic).
// ---------------------------------------------------------------------------

let qbSeq = 0;

/** Next stable node id with the given prefix. */
export function sdQbId(prefix = 'qb'): string {
  return `${prefix}-${++qbSeq}`;
}

/** Build a fresh rule node (optionally pre-filled). */
export function sdQbNewRule(
  field?: string,
  operator?: Operator,
  value?: any,
  valueSource?: SdQbValueSource,
  compareField?: string
): SdQbRule {
  return { id: sdQbId('r'), kind: 'rule', field, operator, value, valueSource, compareField };
}

/** Build a fresh group node. */
export function sdQbNewGroup(logic: 'AND' | 'OR' = 'AND', children: SdQbNode[] = []): SdQbGroup {
  return { id: sdQbId('g'), kind: 'group', logic, children };
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
export const SD_QB_TODAY = 'TODAY';
/** The `'TODAY'` sentinel type (matches the utils `date-today` data literal). */
export type SdQbToday = typeof SD_QB_TODAY;

/** Date value editor mode for a date/datetime rule (derived from the rule value). */
export type SdQbDateMode = 'absolute' | 'now' | 'relative';

/** Type guard — narrows a rule value to a utils `DateRelative` (offset spec). */
export const sdQbIsRelativeDate = FilterUtilities.isDateRelative;

/** Type guard — narrows a rule value to the `'TODAY'` sentinel ("now"/today mode). */
export function sdQbIsToday(v: any): v is SdQbToday {
  return v === SD_QB_TODAY;
}

/** Starting relative value when a rule first switches to "relative" mode. */
export function sdQbDefaultRelative(): DateRelative {
  return { amount: 1, direction: 'previous', unit: 'day' };
}

// ---------------------------------------------------------------------------
// Option tables — mỗi option mang KEY i18n, không mang nhãn đã dịch.
//
// why: các bảng này là hằng số cấp module, được đánh giá đúng MỘT lần lúc load module. Nhãn dịch
// sẵn ở đây sẽ đóng băng theo ngôn ngữ tại thời điểm đó và không bao giờ phản ứng với
// `I18nService.setLanguage()`. Giữ key ở đây rồi dịch lúc ĐỌC (computed trong component) để nhãn
// bám theo ngôn ngữ hiện tại, đồng thời `computed` vẫn memo hoá nên tham chiếu mảng ổn định giữa
// các chu kỳ change detection — điều kiện bắt buộc của `sd-select [items]` (xem `#booleanOptionsByKey`).
// ---------------------------------------------------------------------------

/** One date-mode option — carries a Material icon shown in the dropdown + selected trigger. */
export interface SdQbDateModeOption {
  value: SdQbDateMode;
  /** i18n key of the label — resolved at read time, NOT at module-eval time. */
  labelKey: string;
  /** Material icon name (outlined set). */
  icon: string;
}

/** Stable option list for the date-mode select (module ref — never reallocated). */
export const SD_QB_DATE_MODES: SdQbDateModeOption[] = [
  { value: 'absolute', labelKey: 'core.component.query-builder.date-mode.absolute', icon: 'event' },
  { value: 'now', labelKey: 'core.component.query-builder.date-mode.now', icon: 'today' },
  { value: 'relative', labelKey: 'core.component.query-builder.date-mode.relative', icon: 'history' },
];

/** One value-source option for field-to-field comparison UI. */
export interface SdQbValueSourceOption {
  value: SdQbValueSource;
  /** i18n key of the label — resolved at read time, NOT at module-eval time. */
  labelKey: string;
  /** Material icon name (outlined set). */
  icon: string;
}

/** Stable option list for choosing between a literal value and another field. */
export const SD_QB_VALUE_SOURCE_OPTIONS: SdQbValueSourceOption[] = [
  { value: 'literal', labelKey: 'core.component.query-builder.value-source.literal', icon: 'edit_note' },
  { value: 'field', labelKey: 'core.component.query-builder.value-source.field', icon: 'view_column' },
];

/** One combined direction×unit option (token `'unit:direction'`). */
export interface SdQbRelativeUnitOption {
  value: string;
  /** i18n key of the label — resolved at read time, NOT at module-eval time. */
  labelKey: string;
}

/** Stable combined direction×unit option list (token `'unit:direction'`). */
export const SD_QB_RELATIVE_UNIT_OPTIONS: SdQbRelativeUnitOption[] = [
  { value: 'day:previous', labelKey: 'core.component.query-builder.relative.day-previous' },
  { value: 'day:next', labelKey: 'core.component.query-builder.relative.day-next' },
  { value: 'week:previous', labelKey: 'core.component.query-builder.relative.week-previous' },
  { value: 'week:next', labelKey: 'core.component.query-builder.relative.week-next' },
  { value: 'month:previous', labelKey: 'core.component.query-builder.relative.month-previous' },
  { value: 'month:next', labelKey: 'core.component.query-builder.relative.month-next' },
];

/** i18n key of the combined `unit`×`direction` phrase for a relative-date offset. */
export function qbRelativeLabelKey(unit: SdQbRelativeUnit, direction: SdQbRelativeDirection): string {
  return `core.component.query-builder.relative.${unit}-${direction}`;
}

/** Shared empty option array — stable ref for fallbacks (avoids per-call allocation). */
export const SD_QB_EMPTY_OPTIONS: SdQueryBuilderFieldOption[] = [];
