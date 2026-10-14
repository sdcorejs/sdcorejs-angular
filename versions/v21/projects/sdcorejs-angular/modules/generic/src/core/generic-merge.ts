import type { SdFormGenericSchema } from '@sdcorejs/angular/components/form-generic';
import type { SdGenericFormSection, SdGenericProperty, SdGenericSchema } from '../models';

export interface SdGenericMergeResult {
  schema: SdGenericSchema;
  /** Stored property keys that the current schema no longer has. */
  removed: string[];
  /** Current property keys that the stored configuration does not know yet. */
  added: string[];
}

type JsonRecord = Record<string, unknown>;

/**
 * One property: structure (`key`, `dataType`, `multiple`, `system`, `enums[].value`, `relation.entity`) from the
 * current schema, display and form settings from the stored one.
 */
export const sdGenericMergeProperty = (current: SdGenericProperty, stored: SdGenericProperty | undefined): SdGenericProperty => {
  if (!stored) return current;
  const merged: SdGenericProperty = { ...current };
  if (typeof stored.label === 'string') merged.label = stored.label;
  if (stored.format !== undefined) merged.format = stored.format;
  if (stored.validation !== undefined) merged.validation = stored.validation;
  if (Object.hasOwn(stored, 'defaultValue')) merged.defaultValue = stored.defaultValue;
  // why: a configuration may only narrow what the backend allows; it never reopens a field the adapter locked.
  if (stored.insertable === false) merged.insertable = false;
  if (stored.updatable === false) merged.updatable = false;
  if (current.enums) {
    merged.enums = current.enums.map(option => {
      const saved = stored.enums?.find(candidate => candidate.value === option.value);
      if (!saved) return option;
      return {
        ...option,
        ...(typeof saved.label === 'string' ? { label: saved.label } : {}),
        ...(saved.color !== undefined ? { color: saved.color } : {}),
        ...(saved.icon !== undefined ? { icon: saved.icon } : {}),
      };
    });
  }
  if (current.relation) {
    const saved = stored.relation;
    merged.relation = {
      ...current.relation,
      ...(saved?.displayField !== undefined ? { displayField: saved.displayField } : {}),
      ...(saved?.display !== undefined ? { display: saved.display } : {}),
      ...(saved?.searchFields !== undefined ? { searchFields: saved.searchFields } : {}),
    };
  }
  return merged;
};

/** Removes fields whose key is not in `keys`; groups and html elements stay. */
export const sdGenericPruneLayout = (form: SdFormGenericSchema, keys: ReadonlySet<string>): SdFormGenericSchema => {
  const prune = (elements: unknown): unknown[] =>
    (Array.isArray(elements) ? elements : []).flatMap((element): unknown[] => {
      const node = element as JsonRecord;
      if (node['type'] === 'group') return [{ ...node, elements: prune(node['elements']) }];
      if (node['type'] === 'html') return [node];
      return keys.has(node['key'] as string) ? [node] : [];
    });
  return { ...form, pages: form.pages.map(page => ({ ...page, elements: prune(page.elements) })) } as SdFormGenericSchema;
};

const mergeSection = (section: SdGenericFormSection | undefined, keys: ReadonlySet<string>): SdGenericFormSection | undefined =>
  section && { ...section, ...(section.form ? { form: sdGenericPruneLayout(section.form, keys) } : {}) };

/**
 * Lays a stored configuration over the current schema (INV-002). Dangling references are dropped; new properties
 * join `general` and the configured columns (hidden) but never a stored form layout.
 */
export const sdGenericMergeSchema = (storedInput: SdGenericSchema, currentInput: SdGenericSchema): SdGenericMergeResult => {
  const stored = structuredClone(storedInput);
  const current = structuredClone(currentInput);
  const currentByKey = new Map(current.general.properties.map(property => [property.key, property]));
  const storedByKey = new Map(stored.general.properties.map(property => [property.key, property]));
  const keys = new Set(currentByKey.keys());
  const removed = stored.general.properties.map(property => property.key).filter(key => !keys.has(key));
  const added = current.general.properties.map(property => property.key).filter(key => !storedByKey.has(key));

  const properties = [
    ...stored.general.properties
      .filter(property => keys.has(property.key))
      .map(property => sdGenericMergeProperty(currentByKey.get(property.key)!, property)),
    ...added.map(key => currentByKey.get(key)!),
  ];

  const schema: SdGenericSchema = {
    version: 1,
    module: current.module,
    entity: current.entity,
    general: { ...current.general, label: stored.general.label || current.general.label, properties },
  };

  const list = stored.list ?? current.list;
  if (list) {
    schema.list = { ...list };
    if (list.columns) {
      const columns = list.columns.filter(column => keys.has(column.key));
      const listed = new Set(columns.map(column => column.key));
      schema.list.columns = [...columns, ...added.filter(key => !listed.has(key)).map(key => ({ key, visible: false }))];
    }
    if (list.externalFilters) schema.list.externalFilters = list.externalFilters.filter(filter => keys.has(filter.key));
    if (list.orders) schema.list.orders = list.orders.filter(order => keys.has(order.field as string));
  }
  for (const action of ['detail', 'create', 'update'] as const) {
    const section = mergeSection(stored[action] ?? current[action], keys);
    if (section) schema[action] = section;
  }
  const importSection = stored.import ?? current.import;
  if (importSection) {
    schema.import = { ...importSection };
    if (importSection.columns) schema.import.columns = importSection.columns.filter(column => keys.has(column.key));
    if (importSection.upsertKey && !keys.has(importSection.upsertKey)) delete schema.import.upsertKey;
  }
  return { schema, removed, added };
};
