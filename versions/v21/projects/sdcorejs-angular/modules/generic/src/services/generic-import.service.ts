import { Injectable, inject } from '@angular/core';
import {
  SD_GENERIC_IMPORT_CONCURRENCY,
  SD_GENERIC_IMPORT_LOOKUP_SIZE,
  sdGenericChunk,
  sdGenericImportColumns,
  sdGenericIsBlank,
  sdGenericLookupMap,
  sdGenericParseImportRow,
  sdGenericPlanUpsert,
  sdGenericPrimaryKey,
  sdGenericRelationInfo,
  sdGenericRunLimited,
  type SdGenericImportCellError,
  type SdGenericImportColumnInfo,
  type SdGenericImportOp,
} from '../core';
import type { SdGenericRecord, SdGenericSchema } from '../models';
import { SdGenericDataService } from './generic-data.service';

export interface SdGenericImportRowResult {
  index: number;
  status: 'created' | 'updated' | 'error';
  errors: SdGenericImportCellError[];
  /** Adapter error message of a failed save. */
  message?: string;
}

/** Runs one lookup per batch, at most five at a time; the first failed batch fails the import. */
const lookupBatches = async <T>(values: readonly unknown[], lookup: (batch: unknown[]) => Promise<T[]>): Promise<T[]> => {
  const settled = await sdGenericRunLimited(sdGenericChunk(values, SD_GENERIC_IMPORT_LOOKUP_SIZE), SD_GENERIC_IMPORT_CONCURRENCY, lookup);
  return settled.flatMap(outcome => {
    if (outcome.status === 'rejected') throw outcome.reason;
    return outcome.value;
  });
};

/**
 * Imports spreadsheet rows (INV-014): converts cells, looks up relations and existing records in batches, then
 * creates or updates through `SdGenericDataService` (so hooks apply) with at most five saves in flight.
 */
@Injectable()
export class SdGenericImportService {
  readonly #data = inject(SdGenericDataService);

  columns(schema: SdGenericSchema): SdGenericImportColumnInfo[] {
    return sdGenericImportColumns(schema);
  }

  async run(schema: SdGenericSchema, rows: readonly Record<string, unknown>[]): Promise<SdGenericImportRowResult[]> {
    const columns = this.columns(schema);
    const lookups = await this.#relationLookups(schema, columns, rows);
    const parsed = rows.map(row => sdGenericParseImportRow(row, columns, lookups));
    const results: SdGenericImportRowResult[] = parsed.map((row, index) => ({
      index,
      status: row.errors.length ? 'error' : 'created',
      errors: row.errors,
    }));
    const valid = parsed.flatMap((row, index) => (row.errors.length ? [] : [{ data: row.data, index }]));
    const data = valid.map(item => item.data);
    const upsertKey = schema.import?.upsertKey;
    const existing = upsertKey ? await this.#existing(schema, upsertKey, data) : new Map<string, unknown>();
    const ops: { op: SdGenericImportOp; index: number }[] = [];
    sdGenericPlanUpsert(data, upsertKey, existing).forEach((op, position) => {
      const { index } = valid[position];
      if (op) ops.push({ op, index });
      else
        results[index] = {
          index,
          status: 'error',
          errors: [{ key: upsertKey!, code: 'match-ambiguous', value: data[position][upsertKey!] }],
        };
    });
    const settled = await sdGenericRunLimited(ops, SD_GENERIC_IMPORT_CONCURRENCY, ({ op }) =>
      op.kind === 'create' ? this.#data.save(schema, 'create', op.data) : this.#data.save(schema, 'update', op.data, op.id)
    );
    settled.forEach((outcome, position) => {
      const { op, index } = ops[position];
      const result = results[index];
      if (outcome.status === 'fulfilled') result.status = op.kind === 'create' ? 'created' : 'updated';
      else {
        result.status = 'error';
        result.message = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      }
    });
    return results;
  }

  /** `property key -> cell text -> stored value` for each relation column, searched in batches. */
  async #relationLookups(
    schema: SdGenericSchema,
    columns: readonly SdGenericImportColumnInfo[],
    rows: readonly Record<string, unknown>[]
  ): Promise<Map<string, Map<string, unknown>>> {
    const lookups = new Map<string, Map<string, unknown>>();
    for (const column of columns.filter(item => item.property.dataType === 'relation')) {
      const info = sdGenericRelationInfo(column.property, schema.module);
      const matchField = column.matchField ?? info.displayField;
      const texts = [
        ...new Set(
          rows
            .map(row => row[column.key])
            .filter(value => !sdGenericIsBlank(value))
            .flatMap(value => (column.property.multiple ? String(value).split(',') : [String(value)]))
            .map(value => value.trim())
            .filter(Boolean)
        ),
      ];
      const records = await lookupBatches(texts, batch =>
        this.#data.search(info.module, info.entity, { values: batch, fields: [matchField], valueField: matchField })
      );
      lookups.set(column.key, sdGenericLookupMap(records.map(record => [String(record[matchField]), record[info.valueField]] as const)));
    }
    return lookups;
  }

  /** `upsert key value -> id` of the records that already exist, paging until each batch is complete. */
  async #existing(schema: SdGenericSchema, upsertKey: string, rows: readonly SdGenericRecord[]): Promise<Map<string, unknown>> {
    const values = [...new Set(rows.map(row => row[upsertKey]).filter(value => !sdGenericIsBlank(value)))];
    const primaryKey = sdGenericPrimaryKey(schema);
    const records = await lookupBatches(values, async batch => {
      const filters = [{ field: upsertKey, operator: 'IN' as const, data: batch as never }];
      const items: SdGenericRecord[] = [];
      for (let pageNumber = 0; ; pageNumber++) {
        const page = await this.#data.query(schema.module, schema.entity, { pageNumber, pageSize: batch.length, filters });
        items.push(...page.items);
        // why: a backend may cap the page size; keep reading until the reported total is reached.
        if (!page.items.length || items.length >= page.total) return items;
      }
    });
    return sdGenericLookupMap(records.map(record => [String(record[upsertKey]), String(record[primaryKey])] as const));
  }
}
