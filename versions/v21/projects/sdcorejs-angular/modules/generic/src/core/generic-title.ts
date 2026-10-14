import type { SdGenericRecord, SdGenericSchemaIssue } from '../models';

const PLACEHOLDER = /\$\{\s*([^}]*?)\s*\}/g;

export type SdGenericTitleSection = 'list' | 'create' | 'detail' | 'update';

/** Keys referenced by `${key}` placeholders, in order. */
export const sdGenericTitlePlaceholders = (template: string): string[] => Array.from(template.matchAll(PLACEHOLDER), match => match[1]);

/**
 * Replaces `${key}` with the record value. The result is plain text: callers bind it with text interpolation,
 * never as HTML (INV-006).
 */
export const sdGenericRenderTitle = (template: string, record?: SdGenericRecord | null): string =>
  template.replace(PLACEHOLDER, (_, key: string) => {
    const value = record?.[key];
    return value === undefined || value === null ? '' : String(value);
  });

/** Issues of one section title: list/create titles take no placeholder, detail/update ones only known keys. */
export const sdGenericTitleIssues = (
  section: SdGenericTitleSection,
  template: unknown,
  keys: ReadonlySet<string>
): SdGenericSchemaIssue[] => {
  const path = `${section}.title`;
  if (template === undefined) return [];
  if (typeof template !== 'string') return [{ code: 'shape', severity: 'error', path, message: `${path} must be a string.` }];
  const placeholders = sdGenericTitlePlaceholders(template);
  if (section === 'list' || section === 'create') {
    return placeholders.length
      ? [
          {
            code: 'title-placeholder-forbidden',
            severity: 'error',
            path,
            message: `${path} cannot contain placeholders; there is no record yet.`,
          },
        ]
      : [];
  }
  return placeholders
    .filter(key => !keys.has(key))
    .map(key => ({
      code: 'title-placeholder-unknown' as const,
      severity: 'error' as const,
      path,
      message: `${path} references the unknown property "${key}".`,
    }));
};
