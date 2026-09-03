/**
 * Serialize a value for the `data-value` attribute consumed by QA automation.
 *
 * null/undefined/empty-string → ''.
 * Date → ISO string.
 * Array / object → JSON.stringify, '' on failure (circular refs).
 * Primitives → String().
 */
export function sdSerializeDataValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

/** True when the value should drive `data-empty="true"` on a form control. */
export function sdIsEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
