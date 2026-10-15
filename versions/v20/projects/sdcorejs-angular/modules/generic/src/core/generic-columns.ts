import type { SdTableColumn, SdTableExternalFilter } from '@sdcorejs/angular/components/table';
import type { SdSearch } from '@sdcorejs/angular/forms/models';
import type { SdGenericListColumn, SdGenericProperty, SdGenericRecord, SdGenericSchema } from '../models';
import { sdGenericListColumns, sdGenericPropertyMap } from './generic-defaults';
import { sdGenericRelationInfo } from './generic-search';

/** Field added by the data service to related records when the relation has a display template. */
export const SD_GENERIC_LABEL_FIELD = '$label';

/** Lookups of relation columns and filters, provided by the data service so this file stays pure. */
export interface SdGenericColumnDeps {
  relationSearch(property: SdGenericProperty): SdSearch<SdGenericRecord>;
  relationViews(property: SdGenericProperty): (values: string[]) => Promise<SdGenericRecord[]>;
}

type Column = SdTableColumn<SdGenericRecord>;

const relationDisplayField = (property: SdGenericProperty, schema: SdGenericSchema): string => {
  const info = sdGenericRelationInfo(property, schema.module);
  return info.display ? SD_GENERIC_LABEL_FIELD : info.displayField;
};

const fileNames = (value: unknown): string =>
  (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value])
    .map(item => (item && typeof item === 'object' ? String((item as Record<string, unknown>)['name'] ?? '') : String(item)))
    .filter(Boolean)
    .join(', ');

const columnOf = (property: SdGenericProperty, schema: SdGenericSchema, deps: SdGenericColumnDeps): Column => {
  const base = { field: property.key, title: property.label };
  switch (property.dataType) {
    case 'number':
      return { ...base, type: 'number' };
    case 'boolean':
      return { ...base, type: 'boolean' };
    case 'date':
    case 'datetime':
      return { ...base, type: property.dataType };
    case 'time':
      return { ...base, type: 'time' };
    case 'enum': {
      const enums = property.enums ?? [];
      const styled = enums.some(option => option.color || option.icon);
      return {
        ...base,
        type: 'values',
        option: {
          items: enums,
          valueField: 'value',
          displayField: 'label',
          ...(property.multiple ? { selection: 'MULTIPLE' as const } : {}),
        },
        ...(styled
          ? {
              useBadge: (value: unknown) => {
                const option = enums.find(candidate => candidate.value === value);
                return { color: option?.color as never, icon: option?.icon };
              },
            }
          : {}),
      } as Column;
    }
    case 'relation': {
      const info = sdGenericRelationInfo(property, schema.module);
      return {
        ...base,
        type: 'lazy-values',
        option: {
          items: deps.relationSearch(property),
          valueField: info.valueField,
          displayField: relationDisplayField(property, schema),
          views: deps.relationViews(property),
          ...(property.multiple ? { selection: 'MULTIPLE' as const } : {}),
        },
      } as Column;
    }
    case 'json':
      return {
        ...base,
        type: 'string',
        transform: (value: unknown) => (value === undefined || value === null ? '' : JSON.stringify(value)),
      };
    case 'file':
      return { ...base, type: 'string', transform: (value: unknown) => fileNames(value) };
    default:
      return { ...base, type: 'string' };
  }
};

const withFlags = (column: Column, config: SdGenericListColumn): Column => ({
  ...column,
  ...(config.width ? { width: `${config.width}px` } : {}),
  ...(config.visible === false ? { invisible: true } : {}),
  ...(config.sortable !== undefined ? { sortable: config.sortable } : {}),
  ...(config.filterable === false ? { filter: { disabled: true } } : {}),
});

/**
 * sd-table columns of the list (INV-013); configured keys that no longer exist are skipped. With `open`, the first
 * visible column that is not a server field (else the first visible one) links to the record.
 */
export const sdGenericTableColumns = (
  schema: SdGenericSchema,
  deps: SdGenericColumnDeps,
  open?: (row: SdGenericRecord) => void
): Column[] => {
  const properties = sdGenericPropertyMap(schema);
  const configs = sdGenericListColumns(schema).filter(config => properties.has(config.key));
  const visible = configs.filter(config => config.visible !== false);
  const link = open ? (visible.find(config => !properties.get(config.key)!.system) ?? visible[0]) : undefined;
  return configs.map(config => {
    const column = withFlags(columnOf(properties.get(config.key)!, schema, deps), config);
    return config === link ? { ...column, click: (_value: unknown, row: SdGenericRecord) => open!(row) } : column;
  });
};

/** sd-table external filters of the list, shown by default; json and file properties cannot be filtered. */
export const sdGenericExternalFilters = (schema: SdGenericSchema, deps: SdGenericColumnDeps): SdTableExternalFilter[] => {
  const properties = sdGenericPropertyMap(schema);
  return (schema.list?.externalFilters ?? []).flatMap(config => {
    const property = properties.get(config.key);
    if (!property) return [];
    const base = {
      field: property.key,
      title: property.label,
      // why: a configured filter is shown right away; the list hides the toolbar that would let users pick it.
      defaultShowing: true,
      ...(config.required ? { required: true } : {}),
      ...(config.operator ? { defaultOperator: config.operator } : {}),
      ...(config.default !== undefined ? { default: config.default } : {}),
    };
    switch (property.dataType) {
      case 'string':
      case 'text':
      case 'time':
        return [{ ...base, type: 'string' } as SdTableExternalFilter];
      case 'number':
        return [{ ...base, type: 'number' } as SdTableExternalFilter];
      case 'boolean':
        return [{ ...base, type: 'boolean' } as SdTableExternalFilter];
      case 'date':
      case 'datetime':
        return [{ ...base, type: 'daterange', ...(property.dataType === 'datetime' ? { enableTime: true } : {}) } as SdTableExternalFilter];
      case 'enum':
        return [
          {
            ...base,
            type: 'values',
            option: { items: property.enums ?? [], valueField: 'value', displayField: 'label', selection: 'MULTIPLE' },
          } as SdTableExternalFilter,
        ];
      case 'relation': {
        const info = sdGenericRelationInfo(property, schema.module);
        return [
          {
            ...base,
            type: 'lazy-values',
            option: {
              items: deps.relationSearch(property),
              valueField: info.valueField,
              displayField: relationDisplayField(property, schema),
              selection: 'MULTIPLE',
            },
          } as SdTableExternalFilter,
        ];
      }
      default:
        return [];
    }
  });
};
