import type { SdFormGenericCatalogItem } from '../models/form-generic-config.model';
import type { SdFormGenericFill, SdFormGenericParam, SdFormGenericValueRef } from '../models/form-generic-field.model';
import { SD_FORM_GENERIC_RESERVED_KEYS, sdSchemaFields, sdStableStringify } from '../models/form-generic-schema';
import type { SdFormGenericSchema } from '../models/form-generic-schema.model';

// why: value ownership rules shared by the renderer — every helper returns a new object and never
// writes into the consumer's value, variables or schema.

type ValueRecord = Readonly<Record<string, unknown>>;

/** Giá trị của một tham chiếu: field khác, biến, hoặc hằng số. */
export const sdResolveValueRef = (ref: SdFormGenericValueRef, value: ValueRecord, variables: ValueRecord): unknown => {
  if (!ref || typeof ref !== 'object') return undefined;
  if ('field' in ref) return value[ref.field];
  if ('variable' in ref) return variables[ref.variable];
  return ref.value;
};

/** Danh sách tham số → record `{ name: value đã giải }`. */
export const sdResolveParams = (
  params: readonly SdFormGenericParam[] | null | undefined,
  value: ValueRecord,
  variables: ValueRecord
): Record<string, unknown> => {
  const resolved: Record<string, unknown> = {};
  for (const param of params ?? [])
    if (param?.name && !SD_FORM_GENERIC_RESERVED_KEYS.has(param.name))
      resolved[param.name] = sdResolveValueRef(param.value, value, variables);
  return resolved;
};

/**
 * Value mới có `defaultValue` cho key chưa có giá trị (`undefined`).
 * `null` là giá trị người dùng đã xoá nên được giữ nguyên. Không áp khi chỉ xem (cả form hoặc
 * field), không bao giờ áp cho password.
 */
export const sdApplyDefaults = (
  schema: SdFormGenericSchema,
  value: ValueRecord | null | undefined,
  options: { viewed: boolean }
): Record<string, unknown> => {
  const next: Record<string, unknown> = { ...(value ?? {}) };
  if (options.viewed) return next;
  for (const field of sdSchemaFields(schema)) {
    if (field.type === 'html' || !field.key || field.viewed || field.defaultValue === undefined) continue;
    // why: `next['__proto__'] = …` would replace the prototype of the value (see SD_FORM_GENERIC_RESERVED_KEYS).
    if (SD_FORM_GENERIC_RESERVED_KEYS.has(field.key)) continue;
    if (field.type === 'textfield' && field.subtype === 'password') continue;
    if (next[field.key] === undefined) next[field.key] = structuredClone(field.defaultValue);
  }
  return next;
};

/** Patch ghi `item.data[from]` vào từng field đích; bỏ chọn (`null`) thì xoá giá trị đích. */
export const sdFillPatch = (
  fill: readonly SdFormGenericFill[] | null | undefined,
  item: SdFormGenericCatalogItem | null | undefined
): Record<string, unknown> => {
  const patch: Record<string, unknown> = {};
  for (const target of fill ?? [])
    if (target?.field && !SD_FORM_GENERIC_RESERVED_KEYS.has(target.field))
      patch[target.field] = item ? (item.data?.[target.from] ?? null) : null;
  return patch;
};

/** Khoá bộ đệm catalog: id + params đã giải, không phụ thuộc thứ tự tham số. */
export const sdCatalogKey = (catalogId: string, params: ValueRecord): string => `${catalogId}|${sdStableStringify(params)}`;

/** Key của các field mang giá trị (không gồm html, phần tử type lạ). */
export const sdValueKeys = (schema: SdFormGenericSchema): string[] =>
  sdSchemaFields(schema)
    .filter(field => field.type !== 'html' && !!field.key)
    .map(field => field.key as string);
