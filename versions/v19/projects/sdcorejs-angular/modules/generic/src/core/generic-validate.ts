import type { SdGenericProperty, SdGenericSchema, SdGenericSchemaIssue, SdGenericSchemaIssueCode } from '../models';
import { sdGenericCanInsert, sdGenericCanUpdate, sdGenericImportable } from './generic-defaults';
import { sdGenericAllowedFieldTypes } from './generic-form';
import { sdGenericMergeProperty } from './generic-merge';
import { sdGenericTitleIssues } from './generic-title';

type JsonRecord = Record<string, unknown>;

const DATA_TYPES = new Set(['string', 'text', 'number', 'boolean', 'date', 'datetime', 'time', 'enum', 'relation', 'json', 'file']);

/**
 * Issues a load tolerates because a backend change can cause them and the merge or the form builder already
 * handles them: dangling references are dropped (D-013), unknown title placeholders render empty, and fields whose
 * type or create / update flag no longer fits are rebuilt or left out of the form. A save still refuses them.
 */
const TOLERATED_AT_LOAD = new Set<SdGenericSchemaIssueCode>([
  'reference-dangling',
  'title-placeholder-unknown',
  'layout-type-mismatch',
  'create-not-insertable',
  'update-not-updatable',
]);

const isRecord = (value: unknown): value is JsonRecord => !!value && typeof value === 'object' && !Array.isArray(value);
const isStringList = (value: unknown): boolean => Array.isArray(value) && value.every(item => typeof item === 'string');

/** Whether an issue must replace the stored configuration with the default one. */
export const sdGenericBlocksLoad = (issue: SdGenericSchemaIssue): boolean => !TOLERATED_AT_LOAD.has(issue.code);

/** Members of a stored property that the merge reads, checked so that a merge never meets a wrong type. */
const propertyShapeIssue = (value: JsonRecord): string | null => {
  for (const member of ['multiple', 'insertable', 'updatable', 'system'] as const) {
    if (value[member] !== undefined && typeof value[member] !== 'boolean') return `${member} must be a boolean.`;
  }
  if (value['format'] !== undefined && typeof value['format'] !== 'string') return 'format must be a string.';
  if (value['validation'] !== undefined && !isRecord(value['validation'])) return 'validation must be an object.';
  const enums = value['enums'];
  if (enums !== undefined && (!Array.isArray(enums) || !enums.every(option => isRecord(option) && typeof option['value'] === 'string')))
    return 'enums must be a list of options with a value.';
  const relation = value['relation'];
  if (relation === undefined) return null;
  if (!isRecord(relation)) return 'relation must be an object.';
  for (const member of ['displayField', 'display'] as const) {
    if (relation[member] !== undefined && typeof relation[member] !== 'string') return `relation.${member} must be a string.`;
  }
  if (relation['searchFields'] !== undefined && !isStringList(relation['searchFields']))
    return 'relation.searchFields must be a list of strings.';
  return null;
};

/**
 * Validates a stored configuration against the current schema of the entity (INV-003). The same function guards
 * the load and the configuration screen; an empty list means valid.
 */
export function validateSdGenericSchema(stored: unknown, base: SdGenericSchema): SdGenericSchemaIssue[] {
  const issues: SdGenericSchemaIssue[] = [];
  const report = (code: SdGenericSchemaIssueCode, path: string, message: string) => issues.push({ code, severity: 'error', path, message });
  /** Items of an optional list member; a present member that is not a list is a `shape` issue. */
  const listAt = (container: JsonRecord, member: string, path: string): unknown[] => {
    const value = container[member];
    if (value === undefined) return [];
    if (Array.isArray(value)) return value;
    report('shape', path, `${path} must be a list.`);
    return [];
  };

  if (!isRecord(stored)) {
    report('shape', '$', 'The configuration must be an object.');
    return issues;
  }
  if (stored['version'] !== 1) report('version', 'version', `Unsupported configuration version ${String(stored['version'])}; expected 1.`);
  for (const member of ['module', 'entity'] as const) {
    const value = stored[member];
    if (typeof value !== 'string') report('shape', member, `${member} must be a string.`);
    else if (value !== base[member])
      report(member === 'module' ? 'module-mismatch' : 'entity-mismatch', member, `${member} "${value}" does not match "${base[member]}".`);
  }
  const general = stored['general'];
  if (!isRecord(general) || typeof general['label'] !== 'string' || !Array.isArray(general['properties'])) {
    report('shape', 'general', 'general must have a label and a properties array.');
    return issues;
  }

  const current = new Map(base.general.properties.map(property => [property.key, property]));
  const keys = new Set(current.keys());
  const storedProperties = new Map<string, SdGenericProperty>();
  general['properties'].forEach((value: unknown, index: number) => {
    const path = `general.properties[${index}]`;
    if (!isRecord(value) || typeof value['key'] !== 'string' || !value['key'] || typeof value['label'] !== 'string') {
      report('shape', path, `${path} must have a key and a label.`);
      return;
    }
    const key = value['key'];
    if (storedProperties.has(key)) report('property-key-duplicate', `${path}.key`, `The property key "${key}" is used twice.`);
    if (!DATA_TYPES.has(value['dataType'] as string))
      report('property-type', `${path}.dataType`, `Unknown data type "${String(value['dataType'])}".`);
    if (!keys.has(key)) report('reference-dangling', `${path}.key`, `The property "${key}" no longer exists.`);
    const shapeIssue = propertyShapeIssue(value);
    if (shapeIssue) {
      report('shape', path, `${path}: ${shapeIssue}`);
      return;
    }
    storedProperties.set(key, value as unknown as SdGenericProperty);
  });
  const effective = (key: string): SdGenericProperty | undefined => {
    const property = current.get(key);
    return property && sdGenericMergeProperty(property, storedProperties.get(key));
  };
  const reference = (key: unknown, path: string): SdGenericProperty | undefined => {
    const property = typeof key === 'string' ? effective(key) : undefined;
    if (!property) report('reference-dangling', path, `"${String(key)}" is not a property of ${base.module}.${base.entity}.`);
    return property;
  };

  const list = stored['list'];
  if (list !== undefined) {
    if (!isRecord(list)) report('shape', 'list', 'list must be an object.');
    else {
      listAt(list, 'columns', 'list.columns').forEach((column, index) =>
        reference(isRecord(column) ? column['key'] : undefined, `list.columns[${index}].key`)
      );
      listAt(list, 'externalFilters', 'list.externalFilters').forEach((filter, index) =>
        reference(isRecord(filter) ? filter['key'] : undefined, `list.externalFilters[${index}].key`)
      );
      listAt(list, 'orders', 'list.orders').forEach((order, index) =>
        reference(isRecord(order) ? order['field'] : undefined, `list.orders[${index}].field`)
      );
      const pageSize = list['pageSize'];
      if (pageSize !== undefined && !(Number.isInteger(pageSize) && (pageSize as number) > 0))
        report('shape', 'list.pageSize', 'list.pageSize must be a positive integer.');
    }
  }

  const importSection = stored['import'];
  if (importSection !== undefined) {
    if (!isRecord(importSection)) report('shape', 'import', 'import must be an object.');
    else {
      const columns = importSection['columns'];
      const imported = new Set<string>();
      listAt(importSection, 'columns', 'import.columns').forEach((column, index) => {
        const property = reference(isRecord(column) ? column['key'] : undefined, `import.columns[${index}].key`);
        if (property) imported.add(property.key);
      });
      if (!Array.isArray(columns)) {
        for (const key of keys) if (sdGenericImportable(effective(key)!)) imported.add(key);
      }
      if (importSection['upsertKey'] !== undefined) {
        const property = reference(importSection['upsertKey'], 'import.upsertKey');
        if (property?.multiple)
          report('upsert-key-multiple', 'import.upsertKey', `The upsert key "${property.key}" cannot hold several values.`);
        else if (property && !imported.has(property.key))
          report('upsert-key-not-imported', 'import.upsertKey', `The upsert key "${property.key}" is not one of the import columns.`);
      }
    }
  }

  for (const action of ['detail', 'create', 'update'] as const) {
    const section = stored[action];
    if (section === undefined) continue;
    if (!isRecord(section)) {
      report('shape', action, `${action} must be an object.`);
      continue;
    }
    if (section['form'] === undefined) continue;
    const fields = layoutFields(section['form']);
    if (!fields) {
      report('layout-grammar', `${action}.form`, `${action}.form must be pages of groups and fields, with no nested group.`);
      continue;
    }
    for (const { node, path } of fields) {
      if (node['type'] === 'html') continue;
      const property = reference(node['key'], `${action}.form.${path}.key`);
      if (!property) continue;
      if (!sdGenericAllowedFieldTypes(property).includes(node['type'] as never)) {
        report(
          'layout-type-mismatch',
          `${action}.form.${path}.type`,
          `"${property.key}" (${property.dataType}) cannot use a ${String(node['type'])} field.`
        );
      } else if (action === 'create' && !sdGenericCanInsert(property)) {
        report('create-not-insertable', `create.form.${path}.key`, `"${property.key}" cannot be set on create.`);
      } else if (action === 'update' && !sdGenericCanUpdate(property)) {
        report('update-not-updatable', `update.form.${path}.key`, `"${property.key}" cannot be changed on update.`);
      }
    }
  }

  for (const section of ['list', 'create', 'detail', 'update'] as const) {
    const value = stored[section];
    if (isRecord(value)) issues.push(...sdGenericTitleIssues(section, value['title'], keys));
  }
  return issues;
}

/** Field nodes of a layout with their paths, or `null` when the layout breaks the form-generic grammar. */
const layoutFields = (form: unknown): { node: JsonRecord; path: string }[] | null => {
  if (!isRecord(form) || !Array.isArray(form['pages'])) return null;
  const fields: { node: JsonRecord; path: string }[] = [];
  for (const [pageIndex, page] of form['pages'].entries()) {
    if (!isRecord(page) || !Array.isArray(page['elements'])) return null;
    for (const [index, element] of page['elements'].entries()) {
      const path = `pages[${pageIndex}].elements[${index}]`;
      if (!isRecord(element)) return null;
      if (element['type'] !== 'group') {
        fields.push({ node: element, path });
        continue;
      }
      if (!Array.isArray(element['elements'])) return null;
      for (const [childIndex, child] of element['elements'].entries()) {
        if (!isRecord(child) || child['type'] === 'group') return null;
        fields.push({ node: child, path: `${path}.elements[${childIndex}]` });
      }
    }
  }
  return fields;
};
