import type { Filter, PagingReq } from '@sdcorejs/utils/models';
import type { SdGenericProperty, SdGenericRecord, SdGenericSearchReq } from '../models';
import { sdGenericRenderTitle } from './generic-title';

const DEFAULT_LIMIT = 20;

/** Relation of a property with its defaults resolved. */
export interface SdGenericRelationInfo {
  module: string;
  entity: string;
  valueField: string;
  displayField: string;
  searchFields: string[];
  display?: string;
}

/** Relation defaults: the schema module, `valueField` `id`, `displayField` the value field, search on the display field. */
export const sdGenericRelationInfo = (property: SdGenericProperty, module: string): SdGenericRelationInfo => {
  const relation = property.relation ?? { entity: '' };
  const valueField = relation.valueField || 'id';
  const displayField = relation.displayField || valueField;
  const info: SdGenericRelationInfo = {
    module: relation.module || module,
    entity: relation.entity,
    valueField,
    displayField,
    searchFields: relation.searchFields?.length ? [...relation.searchFields] : [displayField],
  };
  if (relation.display) info.display = relation.display;
  return info;
};

/** `query` request used when neither the entity nor the adapter has a search: `IN` for values, `CONTAIN` for a term. */
export const sdGenericSearchPagingReq = (req: SdGenericSearchReq): PagingReq => {
  const filters: Filter[] = [...(req.filters ?? [])];
  if (req.values?.length) {
    filters.push({ field: req.valueField, operator: 'IN', data: [...req.values] as never });
  } else if (req.term) {
    filters.push({ operator: 'OR', data: req.fields.map(field => ({ field, operator: 'CONTAIN', data: req.term })) } as Filter);
  }
  return { pageNumber: 0, pageSize: req.values?.length || req.limit || DEFAULT_LIMIT, filters };
};

/** Text label of a related record: the display template, then the display field, then the value field. */
export const sdGenericRecordLabel = (record: SdGenericRecord, info: SdGenericRelationInfo): string => {
  if (info.display) return sdGenericRenderTitle(info.display, record);
  const value = record[info.displayField] ?? record[info.valueField];
  return value === undefined || value === null ? '' : String(value);
};

/** form-generic option values are strings; this restores the original value (a numeric id stays a number). */
export const sdGenericCoerceValue = (raw: unknown, known: ReadonlyMap<string, unknown>): unknown => {
  if (Array.isArray(raw)) return raw.map(item => sdGenericCoerceValue(item, known));
  if (typeof raw === 'string' && known.has(raw)) return known.get(raw);
  return raw;
};
