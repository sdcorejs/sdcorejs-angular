import type { SdGenericProperty, SdGenericRecord, SdGenericSchema } from '../models';
import { sdGenericImportable, sdGenericPropertyMap } from './generic-defaults';
import { sdGenericRelationInfo } from './generic-search';

/** Concurrent adapter calls of an import (D-016). */
export const SD_GENERIC_IMPORT_CONCURRENCY = 5;

/** Values per lookup request of an import, so that one request stays under backend page-size and URL limits. */
export const SD_GENERIC_IMPORT_LOOKUP_SIZE = 100;

/** Lookup entry of a match value that several records share; such a cell cannot be resolved. */
export const SD_GENERIC_AMBIGUOUS = Symbol('sd-generic-ambiguous');

export interface SdGenericImportColumnInfo {
  key: string;
  property: SdGenericProperty;
  /** Relation column: field of the related record matched against the cell. */
  matchField?: string;
}

export interface SdGenericImportCellError {
  key: string;
  code: 'enum-unknown' | 'relation-not-found' | 'number-invalid' | 'match-ambiguous';
  value: unknown;
}

export type SdGenericImportOp = { kind: 'create'; data: SdGenericRecord } | { kind: 'update'; id: string; data: SdGenericRecord };

const TRUE_VALUES = new Set(['true', '1', 'yes', 'x']);

/** `values` split into lists of at most `size` items. */
export const sdGenericChunk = <T>(values: readonly T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let start = 0; start < values.length; start += size) chunks.push(values.slice(start, start + size));
  return chunks;
};

/** `match value -> stored value`; a match value shared by several records maps to `SD_GENERIC_AMBIGUOUS`. */
export const sdGenericLookupMap = (entries: readonly (readonly [string, unknown])[]): Map<string, unknown> => {
  const lookup = new Map<string, unknown>();
  for (const [match, value] of entries) lookup.set(match, lookup.has(match) && lookup.get(match) !== value ? SD_GENERIC_AMBIGUOUS : value);
  return lookup;
};

const matchFieldOf = (property: SdGenericProperty, schema: SdGenericSchema, configured?: string): string | undefined =>
  property.dataType === 'relation' ? configured || sdGenericRelationInfo(property, schema.module).displayField : undefined;

/** Import columns: configured ones that still exist, or every insertable property except system, json and file. */
export const sdGenericImportColumns = (schema: SdGenericSchema): SdGenericImportColumnInfo[] => {
  const properties = sdGenericPropertyMap(schema);
  const configured = schema.import?.columns;
  if (configured) {
    return configured.flatMap(column => {
      const property = properties.get(column.key);
      return property ? [{ key: property.key, property, matchField: matchFieldOf(property, schema, column.matchField) }] : [];
    });
  }
  return schema.general.properties
    .filter(sdGenericImportable)
    .map(property => ({ key: property.key, property, matchField: matchFieldOf(property, schema) }));
};

/** Empty spreadsheet cell: no value, or only spaces. */
export const sdGenericIsBlank = (value: unknown): boolean =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
const isBlank = sdGenericIsBlank;

/**
 * Converts one spreadsheet row: enum cells by value or label, relation cells through `lookups`
 * (`property key -> match value -> stored value`).
 */
export const sdGenericParseImportRow = (
  row: Readonly<Record<string, unknown>>,
  columns: readonly SdGenericImportColumnInfo[],
  lookups: ReadonlyMap<string, ReadonlyMap<string, unknown>>
): { data: SdGenericRecord; errors: SdGenericImportCellError[] } => {
  const data: SdGenericRecord = {};
  const errors: SdGenericImportCellError[] = [];
  for (const { key, property } of columns) {
    const cell = row[key];
    if (isBlank(cell)) continue;
    switch (property.dataType) {
      case 'enum': {
        const text = String(cell).trim();
        const option =
          property.enums?.find(candidate => candidate.value === text) ??
          property.enums?.find(candidate => candidate.label.trim().toLowerCase() === text.toLowerCase());
        if (option) data[key] = option.value;
        else errors.push({ key, code: 'enum-unknown', value: cell });
        break;
      }
      case 'relation': {
        const lookup = lookups.get(key);
        const texts = property.multiple
          ? String(cell)
              .split(',')
              .map(part => part.trim())
              .filter(Boolean)
          : [String(cell).trim()];
        const values = texts.map(text => lookup?.get(text));
        const missing = texts.filter((_, index) => values[index] === undefined);
        const ambiguous = texts.filter((_, index) => values[index] === SD_GENERIC_AMBIGUOUS);
        if (missing.length) errors.push({ key, code: 'relation-not-found', value: property.multiple ? missing.join(', ') : cell });
        else if (ambiguous.length) errors.push({ key, code: 'match-ambiguous', value: property.multiple ? ambiguous.join(', ') : cell });
        else data[key] = property.multiple ? values : values[0];
        break;
      }
      case 'number': {
        const value = typeof cell === 'number' ? cell : Number(String(cell).trim());
        if (Number.isFinite(value)) data[key] = value;
        else errors.push({ key, code: 'number-invalid', value: cell });
        break;
      }
      case 'boolean':
        data[key] = typeof cell === 'boolean' ? cell : TRUE_VALUES.has(String(cell).trim().toLowerCase());
        break;
      default:
        data[key] = cell;
    }
  }
  return { data, errors };
};

/**
 * Update when the upsert key matches one existing record (`existing`: key value -> id), otherwise create. A key
 * value that several records share is not planned: the caller reports the row as ambiguous.
 */
export const sdGenericPlanUpsert = (
  rows: readonly SdGenericRecord[],
  upsertKey: string | undefined,
  existing: ReadonlyMap<string, unknown>
): (SdGenericImportOp | null)[] =>
  rows.map(data => {
    const match = upsertKey && !isBlank(data[upsertKey]) ? existing.get(String(data[upsertKey])) : undefined;
    if (match === SD_GENERIC_AMBIGUOUS) return null;
    return match === undefined ? { kind: 'create', data } : { kind: 'update', id: String(match), data };
  });

/** Runs `worker` over `items` with at most `limit` calls in flight; results keep the item order. */
export const sdGenericRunLimited = async <T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> => {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const lane = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = { status: 'fulfilled', value: await worker(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, lane));
  return results;
};
