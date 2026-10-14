import type { SdFormGenericField, SdFormGenericFieldValidation, SdFormGenericSchema } from '@sdcorejs/angular/components/form-generic';
import type { SdGenericFormAction, SdGenericProperty, SdGenericRecord, SdGenericSchema } from '../models';
import { sdGenericCanInsert, sdGenericCanUpdate, sdGenericPropertyMap } from './generic-defaults';
import { sdGenericRelationInfo } from './generic-search';

/** Id of the form-generic catalog that serves every relation select (D-022). */
export const SD_GENERIC_RELATION_CATALOG = 'sd-generic-relation';

type FieldType = SdFormGenericField['type'];
type JsonRecord = Record<string, unknown>;

const STRING_FORMATS = new Set(['email', 'phone', 'url', 'password']);
const NUMBER_FORMATS = new Set(['integer', 'decimal', 'currency', 'percent']);
/** Layout-only members of a stored field; everything else comes from `general` (INV-007). */
const LAYOUT_MEMBERS = ['layout', 'rules', 'helperText', 'placeholder', 'hidden', 'disabled', 'viewed', 'hyperlink', 'direction'] as const;

/** form-generic field type generated for a property. */
export const sdGenericFieldType = (property: SdGenericProperty): FieldType => {
  switch (property.dataType) {
    case 'string':
      return property.multiple ? 'chip-string' : 'textfield';
    case 'text':
      return 'textarea';
    case 'number':
      return 'number';
    case 'boolean':
      return 'checkbox';
    case 'date':
    case 'datetime':
      return 'datetime';
    case 'time':
      return 'time';
    case 'enum':
    case 'relation':
      return 'select';
    case 'json':
      return 'json';
    case 'file':
      return 'upload';
  }
};

/** Field types a stored layout may use for a property: a single enum may also be a radio group. */
export const sdGenericAllowedFieldTypes = (property: SdGenericProperty): FieldType[] =>
  property.dataType === 'enum' && !property.multiple ? ['select', 'radio'] : [sdGenericFieldType(property)];

const validationOf = (property: SdGenericProperty): SdFormGenericFieldValidation | undefined => {
  const source = property.validation;
  if (!source) return undefined;
  const validation: SdFormGenericFieldValidation = {};
  if (source.required) validation.required = true;
  if (source.min !== undefined) validation.min = source.min;
  if (source.max !== undefined) validation.max = source.max;
  if (source.minLength !== undefined) validation.minLength = source.minLength;
  if (source.maxLength !== undefined) validation.maxLength = source.maxLength;
  if (source.pattern) validation.pattern = { value: source.pattern };
  return Object.keys(validation).length ? validation : undefined;
};

const optionsOf = (property: SdGenericProperty, schema: SdGenericSchema): JsonRecord | undefined => {
  if (property.dataType === 'enum') {
    return { source: 'static', items: (property.enums ?? []).map(option => ({ value: option.value, label: option.label })) };
  }
  if (property.dataType === 'relation') {
    const info = sdGenericRelationInfo(property, schema.module);
    const param = (name: string, value: string) => ({ name, value: { value } });
    return {
      source: 'catalog',
      catalog: SD_GENERIC_RELATION_CATALOG,
      // why: constant params make the form-generic cache key unique per relation, not per entity.
      params: [
        param('module', info.module),
        param('entity', info.entity),
        param('valueField', info.valueField),
        param('displayField', info.displayField),
        param('searchFields', info.searchFields.join(',')),
        param('display', info.display ?? ''),
      ],
    };
  }
  return undefined;
};

/**
 * A full form-generic field: data from the property, layout members from the stored field when there is one. The
 * default value only fills a create form; on detail / update it would replace a value the record left empty.
 */
const hydrate = (
  property: SdGenericProperty,
  schema: SdGenericSchema,
  action: SdGenericFormAction,
  stored?: JsonRecord
): SdFormGenericField => {
  const allowed = sdGenericAllowedFieldTypes(property);
  const type = stored && allowed.includes(stored['type'] as FieldType) ? (stored['type'] as FieldType) : sdGenericFieldType(property);
  const field: JsonRecord = {
    id: typeof stored?.['id'] === 'string' ? stored['id'] : property.key,
    key: property.key,
    type,
    label: property.label,
  };
  for (const member of LAYOUT_MEMBERS) if (stored && stored[member] !== undefined) field[member] = stored[member];
  const validation = validationOf(property);
  if (validation) field['validation'] = validation;
  if (action === 'create' && property.defaultValue !== undefined) field['defaultValue'] = property.defaultValue;
  if (type === 'textfield' && property.format && STRING_FORMATS.has(property.format)) field['subtype'] = property.format;
  if (type === 'number' && property.format && NUMBER_FORMATS.has(property.format)) field['subtype'] = property.format;
  if (type === 'datetime') field['subtype'] = property.dataType === 'datetime' ? 'datetime' : 'date';
  if (type === 'select' || type === 'radio') field['options'] = optionsOf(property, schema);
  if (type === 'select') field['multiple'] = !!property.multiple;
  if (type === 'upload' && !property.multiple) field['maxFiles'] = 1;
  return field as unknown as SdFormGenericField;
};

const isAllowed =
  (action: SdGenericFormAction) =>
  (property: SdGenericProperty): boolean =>
    action === 'create' ? sdGenericCanInsert(property) : action === 'update' ? sdGenericCanUpdate(property) : true;

/**
 * Form of one action: the action layout, then the detail layout, then a generated one-page layout. Stored fields
 * keep only their layout; type, label, options and validation always come from `general` (INV-007).
 */
export const sdGenericBuildForm = (schema: SdGenericSchema, action: SdGenericFormAction): SdFormGenericSchema => {
  const allowed = isAllowed(action);
  const properties = sdGenericPropertyMap(schema);
  const layout = schema[action]?.form ?? (action === 'detail' ? undefined : schema.detail?.form);
  if (!layout) {
    return {
      pages: [{ id: 'main', elements: schema.general.properties.filter(allowed).map(property => hydrate(property, schema, action)) }],
    };
  }
  const elementsOf = (elements: unknown): unknown[] =>
    (Array.isArray(elements) ? elements : []).flatMap((element): unknown[] => {
      const node = element as JsonRecord;
      if (node['type'] === 'group') return [{ ...node, elements: elementsOf(node['elements']) }];
      if (node['type'] === 'html') return [node];
      const property = properties.get(node['key'] as string);
      return property && allowed(property) ? [hydrate(property, schema, action, node)] : [];
    });
  return { ...layout, pages: layout.pages.map(page => ({ ...page, elements: elementsOf(page.elements) })) } as SdFormGenericSchema;
};

/** Payload of a save: only insertable values on create, only updatable values on update (INV-007). */
export const sdGenericFormPayload = (
  schema: SdGenericSchema,
  action: 'create' | 'update',
  value: Readonly<SdGenericRecord>
): SdGenericRecord => {
  const allowed = isAllowed(action);
  const payload: SdGenericRecord = {};
  for (const property of schema.general.properties) {
    if (allowed(property) && Object.hasOwn(value, property.key)) payload[property.key] = value[property.key];
  }
  return payload;
};
