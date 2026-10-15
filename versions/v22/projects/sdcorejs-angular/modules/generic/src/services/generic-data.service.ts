import { Injectable, inject } from '@angular/core';
import type { SdFormGenericCatalogItem } from '@sdcorejs/angular/components/form-generic';
import type { SdSearch } from '@sdcorejs/angular/forms/models';
import type { PagingReq, PagingRes } from '@sdcorejs/utils/models';
import {
  SD_GENERIC_LABEL_FIELD,
  sdGenericCoerceValue,
  sdGenericFormPayload,
  sdGenericRecordLabel,
  sdGenericRelationInfo,
  sdGenericSearchPagingReq,
  type SdGenericColumnDeps,
  type SdGenericRelationInfo,
} from '../core';
import type { SdGenericAdapter, SdGenericProperty, SdGenericRecord, SdGenericSchema, SdGenericSearchReq } from '../models';
import { SD_GENERIC_SCOPE } from '../registry';

const DEFAULT_LIMIT = 20;
/** Option strings remembered per relation; the oldest are forgotten first. */
const KNOWN_LIMIT = 500;

const text = (value: unknown): string => (value === undefined || value === null ? '' : String(value));

/** Records `option string -> original value`, keeping at most `KNOWN_LIMIT` entries (least recently set first out). */
const remember = (known: Map<string, unknown>, option: string, value: unknown): void => {
  known.delete(option);
  known.set(option, value);
  if (known.size > KNOWN_LIMIT) known.delete(known.keys().next().value as string);
};

/** Relation info carried by the constant params of the relation catalog (D-022). */
const infoFromParams = (params: Readonly<Record<string, unknown>>): SdGenericRelationInfo => {
  const info: SdGenericRelationInfo = {
    module: text(params['module']),
    entity: text(params['entity']),
    valueField: text(params['valueField']) || 'id',
    displayField: text(params['displayField']) || text(params['valueField']) || 'id',
    searchFields: text(params['searchFields'])
      .split(',')
      .map(field => field.trim())
      .filter(Boolean),
  };
  if (!info.searchFields.length) info.searchFields = [info.displayField];
  if (text(params['display'])) info.display = text(params['display']);
  return info;
};

/**
 * The only caller of the data methods of the adapters (INV-008): applies the save hooks, the search order
 * (entity search -> adapter search -> `query`) and keeps relation values in their original type.
 */
@Injectable()
export class SdGenericDataService {
  readonly #scope = inject(SD_GENERIC_SCOPE);
  /** `module.entity.valueField` -> option string -> original value. */
  readonly #known = new Map<string, Map<string, unknown>>();

  async query(module: string, entity: string, req: PagingReq): Promise<PagingRes<SdGenericRecord>> {
    return this.#adapter(module).query(entity, req);
  }

  async detail(module: string, entity: string, id: string): Promise<SdGenericRecord> {
    return this.#adapter(module).detail(entity, id);
  }

  async delete(module: string, entity: string, id: string): Promise<void> {
    await this.#adapter(module).delete(entity, id);
  }

  async search(module: string, entity: string, req: SdGenericSearchReq): Promise<SdGenericRecord[]> {
    const own = this.#scope.entity(module, entity)?.search;
    if (own) return own(req);
    const adapter = this.#adapter(module);
    if (adapter.search) return adapter.search(entity, req);
    return (await adapter.query(entity, sdGenericSearchPagingReq(req))).items;
  }

  /** Saves through the adapter: allowed fields only, relation values restored, then `beforeSave` / `afterSave`. */
  async save(
    schema: SdGenericSchema,
    action: 'create' | 'update',
    value: Readonly<SdGenericRecord>,
    id?: string
  ): Promise<SdGenericRecord> {
    const adapter = this.#adapter(schema.module);
    const hooks = this.#scope.entity(schema.module, schema.entity)?.hooks;
    let data = this.#restoreRelations(schema, sdGenericFormPayload(schema, action, value));
    if (hooks?.beforeSave) data = await hooks.beforeSave({ action, data, schema, ...(id === undefined ? {} : { id }) });
    const result = action === 'create' ? await adapter.create(schema.entity, data) : await adapter.update(schema.entity, id ?? '', data);
    await hooks?.afterSave?.({ action, data, schema, result, ...(id === undefined ? {} : { id }) });
    return result;
  }

  /** Record prepared for `sd-form-render`: relation values become the option strings of the relation catalog. */
  toFormValue(schema: SdGenericSchema, record: Readonly<SdGenericRecord>): SdGenericRecord {
    const value: SdGenericRecord = { ...record };
    for (const property of schema.general.properties) {
      if (property.dataType !== 'relation' || value[property.key] === undefined || value[property.key] === null) continue;
      const known = this.#knownFor(sdGenericRelationInfo(property, schema.module));
      const toText = (item: unknown) => {
        remember(known, String(item), item);
        return String(item);
      };
      const current = value[property.key];
      value[property.key] = Array.isArray(current) ? current.map(toText) : toText(current);
    }
    return value;
  }

  /** Options of the relation catalog, by term, by values, or the first page. */
  async relationItems(
    params: Readonly<Record<string, unknown>>,
    request: { term?: string; values?: string[] }
  ): Promise<SdFormGenericCatalogItem[]> {
    const info = infoFromParams(params);
    const known = this.#knownFor(info);
    const records = await this.search(info.module, info.entity, {
      fields: info.searchFields,
      valueField: info.valueField,
      // why: option strings go back to their original type (a numeric id stays a number) before reaching the adapter.
      ...(request.values
        ? { values: request.values.map(value => (known.has(value) ? known.get(value) : value)) }
        : { term: request.term ?? '', limit: DEFAULT_LIMIT }),
    });
    return records.map(record => {
      remember(known, text(record[info.valueField]), record[info.valueField]);
      return { value: text(record[info.valueField]), label: sdGenericRecordLabel(record, info), data: record };
    });
  }

  /** Search function of a relation column or filter of `sd-table`. */
  relationSearch(schema: SdGenericSchema, property: SdGenericProperty): SdSearch<SdGenericRecord> {
    const info = sdGenericRelationInfo(property, schema.module);
    return async args => {
      const values = args.type === 'VALUE' ? ([] as unknown[]).concat(args.value ?? []) : undefined;
      const records = await this.search(info.module, info.entity, {
        fields: args.searchFields?.length ? args.searchFields : info.searchFields,
        valueField: info.valueField,
        ...(values ? { values } : { term: args.searchText ?? '', limit: DEFAULT_LIMIT }),
      });
      return this.#labelled(records, info);
    };
  }

  /** Related records of displayed values for a relation column of `sd-table`. */
  relationViews(schema: SdGenericSchema, property: SdGenericProperty): (values: string[]) => Promise<SdGenericRecord[]> {
    const info = sdGenericRelationInfo(property, schema.module);
    const known = this.#knownFor(info);
    return async values =>
      this.#labelled(
        await this.search(info.module, info.entity, {
          values: values.map(value => (known.has(value) ? known.get(value) : value)),
          fields: info.searchFields,
          valueField: info.valueField,
        }),
        info
      );
  }

  /** Lookups of the table columns and filters of a schema. */
  columnDeps(schema: SdGenericSchema): SdGenericColumnDeps {
    return {
      relationSearch: property => this.relationSearch(schema, property),
      relationViews: property => this.relationViews(schema, property),
    };
  }

  #labelled(records: SdGenericRecord[], info: SdGenericRelationInfo): SdGenericRecord[] {
    return info.display ? records.map(record => ({ ...record, [SD_GENERIC_LABEL_FIELD]: sdGenericRecordLabel(record, info) })) : records;
  }

  #restoreRelations(schema: SdGenericSchema, data: SdGenericRecord): SdGenericRecord {
    for (const property of schema.general.properties) {
      if (property.dataType === 'relation' && Object.hasOwn(data, property.key)) {
        data[property.key] = sdGenericCoerceValue(data[property.key], this.#knownFor(sdGenericRelationInfo(property, schema.module)));
      }
    }
    return data;
  }

  #knownFor(info: SdGenericRelationInfo): Map<string, unknown> {
    const key = `${info.module}.${info.entity}.${info.valueField}`;
    let known = this.#known.get(key);
    if (!known) this.#known.set(key, (known = new Map()));
    return known;
  }

  #adapter(module: string): SdGenericAdapter {
    const adapter = this.#scope.adapter(module);
    if (!adapter) throw new Error(`SdGeneric: no adapter is registered for the module "${module}".`);
    return adapter;
  }
}
