import { Utilities } from '@sdcorejs/utils/fns';

/** Segments that must never be traversed, matching the `@sdcorejs/utils` 1.2 safe-key rule. */
const PROTOTYPE_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

/** Upper bound for the per-field cache; column/group fields are a small, stable set in practice. */
const MAX_CACHED_FIELDS = 1000;

/** `true` when `@sdcorejs/utils` rejects the field as a property path. */
const rejectedFields = new Map<string, boolean>();

/**
 * Reads a row value by table field (`column.field`, group field) for every table read path.
 *
 * why (NSP-5745): `@sdcorejs/utils` 1.2 parses property paths strictly and throws
 * `UnsafePropertyPathError` for a segment with whitespace or a path with leading/trailing
 * whitespace. Tables whose columns come from backend data (for example import headers such as
 * "Số phòng ngủ" or "Loại sản phẩm*") then failed the whole read with "Không thể tải dữ liệu".
 *
 * A path that utils accepts keeps the exact `getNestedValue` result. A path that utils rejects
 * falls back to the 1.1.x dot-split lookup, restricted to own data properties (no inherited
 * values, no getters), never through a prototype-sensitive segment and never into a prototype
 * object.
 */
export function resolveFieldValue<T = any>(source: unknown, field: unknown): T | undefined {
  if (!isTraversable(source)) return undefined;
  if (typeof field !== 'string' || field === '') return undefined;
  if (isRejectedPath(field)) return readOwnDotPath<T>(source, field);
  try {
    return Utilities.getNestedValue<T>(source, field);
  } catch {
    // why: for an accepted path utils 1.2 only throws when the traversal meets a prototype
    // object, which this resolver never reads (same result as the fallback).
    return undefined;
  }
}

/**
 * Detects a path that `@sdcorejs/utils` rejects, once per field.
 *
 * why: matching `instanceof UnsafePropertyPathError` is unreliable. `@sdcorejs/utils/fns` and
 * `@sdcorejs/utils/errors` each ship their own copy of the class, and an application bundler
 * renames one of them, so the brand check fails in bundled apps. An empty own-property root can
 * only make `getNestedValue` throw for the path itself, so the probe needs no error type. The
 * cache also keeps sort/filter loops from paying for a thrown exception on every row.
 */
function isRejectedPath(field: string): boolean {
  const cached = rejectedFields.get(field);
  if (cached !== undefined) return cached;
  let rejected = false;
  try {
    Utilities.getNestedValue({}, field);
  } catch {
    rejected = true;
  }
  if (rejectedFields.size >= MAX_CACHED_FIELDS) rejectedFields.clear();
  rejectedFields.set(field, rejected);
  return rejected;
}

function readOwnDotPath<T>(source: object, field: string): T | undefined {
  let current: unknown = source;
  for (const segment of field.split('.')) {
    if (PROTOTYPE_SEGMENTS.has(segment)) return undefined;
    if (!isTraversable(current)) return undefined;
    const descriptor = Object.getOwnPropertyDescriptor(current, segment);
    if (!descriptor || !('value' in descriptor)) return undefined;
    current = descriptor.value;
  }
  return isPrototypeObject(current) ? undefined : (current as T);
}

/** Non-null object or function that is not a built-in prototype object. */
function isTraversable(value: unknown): value is object {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return false;
  return !isPrototypeObject(value);
}

function isPrototypeObject(value: unknown): boolean {
  return value === Object.prototype || value === Function.prototype;
}
