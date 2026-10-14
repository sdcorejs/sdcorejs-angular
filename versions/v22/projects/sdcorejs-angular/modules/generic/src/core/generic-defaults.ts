import type { SdGenericListColumn, SdGenericProperty, SdGenericSchema } from '../models';

export const SD_GENERIC_DEFAULT_PAGE_SIZE = 20;

/** Data types that get no list column unless one is configured, and are never imported. */
const NOT_LISTED = new Set(['json', 'file']);

/** Configured columns, or every property except `json` and `file`. */
export const sdGenericListColumns = (schema: SdGenericSchema): SdGenericListColumn[] =>
  schema.list?.columns ??
  schema.general.properties.filter(property => !NOT_LISTED.has(property.dataType)).map(property => ({ key: property.key }));

export const sdGenericPageSize = (schema: SdGenericSchema): number => schema.list?.pageSize ?? SD_GENERIC_DEFAULT_PAGE_SIZE;

export const sdGenericPrimaryKey = (schema: SdGenericSchema): string => schema.general.primaryKey || 'id';

/** Whether a create form may contain the property. */
export const sdGenericCanInsert = (property: SdGenericProperty): boolean => !property.system && property.insertable !== false;

/** Whether an update form may contain the property. */
export const sdGenericCanUpdate = (property: SdGenericProperty): boolean => !property.system && property.updatable !== false;

/** Whether the default import columns contain the property: insertable, and neither `json` nor `file`. */
export const sdGenericImportable = (property: SdGenericProperty): boolean =>
  sdGenericCanInsert(property) && !NOT_LISTED.has(property.dataType);

/** Properties indexed by key. */
export const sdGenericPropertyMap = (schema: SdGenericSchema): Map<string, SdGenericProperty> =>
  new Map(schema.general.properties.map(property => [property.key, property]));
