import { FilterUtilities } from '@sdcorejs/utils/fns';
import type { Filter, FilterFieldType } from '@sdcorejs/utils/models';
import type { SdFormGenericRules } from '../models/form-generic-field.model';
import { sdSchemaFields } from '../models/form-generic-schema';
import type { SdFormGenericSchema } from '../models/form-generic-schema.model';

// why: the ONE evaluator for every rule and form-level Filter validation. It wraps
// FilterUtilities.evaluate of @sdcorejs/utils 1.1.4 and compensates, in this single place, for the
// gaps measured against the operators sd-query-builder produces (see the spec):
// - a form control uses '' / [] for "no value", but NULL/NOT_NULL only treat null/undefined as empty;
// - IN / NOT_IN on a multiple value (array) must mean "any selected item is in the list", and EQUAL /
//   NOT_EQUAL on it "one selected item equals" / "none equals";
// - a checkbox without a value is unticked (false);
// - an empty AND/OR group means "no condition": skipped inside a group, and a rule or validation that is
//   only an empty group does not apply (FilterUtilities returns false for an empty OR).

/** Giá trị form + biến mà Filter được đánh giá trên. */
export type SdFormGenericScope = Readonly<Record<string, unknown>>;

/** Kiểu của từng key để so sánh đúng (ngày dạng chuỗi ISO, số…). */
export type SdFormGenericFieldTypes = Readonly<Record<string, FilterFieldType>>;

export interface SdFormGenericElementState {
  visible: boolean;
  disabled: boolean;
  required: boolean;
}

/** Phần tử có cờ tĩnh và rules — field, group hoặc trang. */
export interface SdFormGenericRuleTarget {
  hidden?: boolean;
  disabled?: boolean;
  validation?: { required?: boolean };
  rules?: SdFormGenericRules;
}

const FIELD_TYPES: Readonly<Record<string, FilterFieldType>> = { number: 'number', datetime: 'date', checkbox: 'boolean' };

const isEmptyValue = (value: unknown): boolean =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

const isNode = (value: unknown): value is Filter => !!value && typeof value === 'object' && !Array.isArray(value);

/** Filter không có điều kiện nào: vắng, hoặc AND/OR mà mọi nhánh con đều rỗng. */
export const sdIsEmptyFilter = (filter: Filter | null | undefined): boolean => {
  if (!isNode(filter)) return true;
  if (filter.operator !== 'AND' && filter.operator !== 'OR') return false;
  return (Array.isArray(filter.data) ? filter.data : []).every(child => sdIsEmptyFilter(child));
};

/** `{ ...value, ...variables }` — biến dùng chung không gian key với field. */
export const sdFormScope = (
  value?: Readonly<Record<string, unknown>> | null,
  variables?: Readonly<Record<string, unknown>> | null
): SdFormGenericScope => ({
  ...(value ?? {}),
  ...(variables ?? {}),
});

/** Kiểu so sánh theo field của schema (datetime → date, number → number, checkbox → boolean). */
export const sdFilterFieldTypes = (schema: SdFormGenericSchema | null | undefined): Record<string, FilterFieldType> => {
  const types: Record<string, FilterFieldType> = {};
  for (const field of sdSchemaFields(schema)) {
    const type = FIELD_TYPES[field.type];
    if (type && field.key) types[field.key] = type;
  }
  return types;
};

const evaluate = (
  filter: Filter,
  entity: Record<string, unknown>,
  fieldTypes: SdFormGenericFieldTypes | undefined,
  timeZone: string | undefined
): boolean => {
  if (filter.operator === 'AND' || filter.operator === 'OR') {
    // why: null children (hand-edited JSON) and empty sub-groups carry no condition — skipped, else an
    // empty group would make an OR always true.
    const children = (Array.isArray(filter.data) ? filter.data : []).filter(child => isNode(child) && !sdIsEmptyFilter(child));
    if (!children.length) return true;
    return filter.operator === 'AND'
      ? children.every(child => evaluate(child, entity, fieldTypes, timeZone))
      : children.some(child => evaluate(child, entity, fieldTypes, timeZone));
  }
  // why: a leaf without a field can never match; FilterUtilities would read it as a group and throw.
  const field = (filter as { field?: unknown }).field;
  if (typeof field !== 'string') return false;
  // why: `timeZone` is passed only when one is configured, so the local options stay exactly as before.
  const options =
    fieldTypes || timeZone ? { ...(fieldTypes ? { fieldTypes: { ...fieldTypes } } : {}), ...(timeZone ? { timeZone } : {}) } : undefined;
  if ((filter.operator === 'IN' || filter.operator === 'NOT_IN') && Array.isArray(entity[field])) {
    const selected = entity[field] as unknown[];
    const list = Array.isArray(filter.data) ? (filter.data as unknown[]) : [filter.data];
    const hit = selected.some(item => list.includes(item));
    return filter.operator === 'IN' ? hit : !hit;
  }
  // why: EQUAL / NOT_EQUAL on a multiple value (select multiple, chips) mean "one of the selected items
  // equals" / "none equals" — an array never equals a single value, so the rule would never match.
  if ((filter.operator === 'EQUAL' || filter.operator === 'NOT_EQUAL') && Array.isArray(entity[field]) && !Array.isArray(filter.data)) {
    const equal = { ...filter, operator: 'EQUAL' } as Filter;
    const hit = (entity[field] as unknown[]).some(item => FilterUtilities.evaluate(equal, { ...entity, [field]: item }, options));
    return filter.operator === 'EQUAL' ? hit : !hit;
  }
  return FilterUtilities.evaluate(filter, entity, options);
};

/**
 * Đánh giá một Filter trên scope. Không mutate scope. `timeZone` (IANA, chỉ khi có
 * `ISdCoreConfiguration.timeZone`) resolve date-today, date-relative và chuỗi ngày không múi giờ trong zone đó.
 */
export const sdEvaluateFilter = (
  filter: Filter,
  scope: SdFormGenericScope,
  fieldTypes?: SdFormGenericFieldTypes,
  timeZone?: string
): boolean => {
  if (!isNode(filter)) return false;
  // why: no prototype — a `__proto__` key in the value becomes a plain property instead of a new prototype.
  const entity: Record<string, unknown> = Object.create(null);
  for (const [key, value] of Object.entries(scope)) entity[key] = isEmptyValue(value) ? null : value;
  // why: a checkbox nobody touched has no value yet, but on screen it is unticked — `EQUAL false` must match.
  for (const [key, type] of Object.entries(fieldTypes ?? {})) if (type === 'boolean' && entity[key] == null) entity[key] = false;
  return evaluate(filter, entity, fieldTypes, timeZone);
};

/**
 * Trạng thái hiện/khoá/bắt buộc: hiện khi (`visible` vắng hoặc đúng) và (`hidden` vắng hoặc sai) và cờ
 * `hidden` tĩnh tắt; `disabled`/`required` là OR của cờ tĩnh với rule.
 */
export const sdElementState = (
  target: SdFormGenericRuleTarget,
  scope: SdFormGenericScope,
  fieldTypes?: SdFormGenericFieldTypes,
  timeZone?: string
): SdFormGenericElementState => {
  const rules = target.rules;
  // why: an empty group (no condition) is the same as no rule — never "always hidden / required".
  const present = (filter: Filter | undefined): filter is Filter => !sdIsEmptyFilter(filter);
  const matches = (filter: Filter | undefined) => present(filter) && sdEvaluateFilter(filter, scope, fieldTypes, timeZone);
  const visible = !target.hidden && (!present(rules?.visible) || matches(rules?.visible)) && !matches(rules?.hidden);
  return {
    visible,
    disabled: !!target.disabled || matches(rules?.disabled),
    required: !!target.validation?.required || matches(rules?.required),
  };
};

/** Chế độ hiển thị của renderer áp lên phần tử không phải field. */
export interface SdFormGenericDisplayPolicy {
  viewed: boolean;
  /** `[keys]` — danh sách trắng của field; `null` = không giới hạn. */
  keys: ReadonlySet<string> | null;
}

/**
 * Phần tử Tĩnh / button có hiện không: `[keys]` không đặt (keys chỉ liệt kê field), không ở `[viewed]` — trừ
 * phần tử Tĩnh và button bật `showWhenViewed` — và rules cho phép (`state.visible`). `state.disabled` vẫn áp
 * khi viewed.
 */
export const sdNonFieldVisible = (
  element: { type: string; showWhenViewed?: boolean },
  state: SdFormGenericElementState,
  policy: SdFormGenericDisplayPolicy
): boolean => policy.keys === null && (!policy.viewed || element.type !== 'button' || element.showWhenViewed === true) && state.visible;
