import type { SdFormGenericSchema } from '@sdcorejs/angular/components/form-generic';
import type { Operator, Order } from '@sdcorejs/utils/models';

/** Backend-neutral data type of a property. It decides the list column and the form field. */
export type SdGenericDataType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'enum'
  | 'relation'
  | 'json'
  | 'file';

/** Input preset of a `string` property. */
export type SdGenericStringFormat = 'email' | 'phone' | 'url' | 'password';

/** Display preset of a `number` property. */
export type SdGenericNumberFormat = 'integer' | 'decimal' | 'currency' | 'percent';

/** One option of an `enum` property. `value` is structural (owned by the backend); the rest is display. */
export interface SdGenericEnumOption {
  value: string;
  label: string;
  /** Badge color in the list (a Core UI color token or CSS color). */
  color?: string;
  /** Material icon shown next to the badge. */
  icon?: string;
}

/** Link of a `relation` property to another entity, resolved through that entity's adapter. */
export interface SdGenericRelation {
  /** Module of the related entity; defaults to the module of the schema. */
  module?: string;
  entity: string;
  /** Field stored in this record; defaults to `'id'`. */
  valueField?: string;
  /** Field shown for a related record when `display` is absent. */
  displayField?: string;
  /** Text template such as `'${code} - ${name}'`; rendered as plain text. */
  display?: string;
  /** Fields searched by the relation select; defaults to `[displayField]`. */
  searchFields?: string[];
}

export interface SdGenericPropertyValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  /** Regular expression source. */
  pattern?: string;
}

/** One field of an entity. `general.properties` is the only source of field data. */
export interface SdGenericProperty {
  key: string;
  label: string;
  dataType: SdGenericDataType;
  /** Several values: chips for `string`, multi-select for `enum` / `relation`, several files for `file`. */
  multiple?: boolean;
  format?: SdGenericStringFormat | SdGenericNumberFormat;
  enums?: SdGenericEnumOption[];
  relation?: SdGenericRelation;
  validation?: SdGenericPropertyValidation;
  defaultValue?: unknown;
  /** Defaults to `true`. */
  insertable?: boolean;
  /** Defaults to `true`. */
  updatable?: boolean;
  /** Server field such as `id` or `createdAt`: shown in the list and detail, never in create / update. */
  system?: boolean;
}

export interface SdGenericGeneral {
  /** Name of the entity, used by the default titles. */
  label: string;
  /** Defaults to `'id'`. */
  primaryKey?: string;
  properties: SdGenericProperty[];
}

export interface SdGenericListColumn {
  key: string;
  width?: number;
  /** `false` hides the column by default; the user can show it again from the column settings. */
  visible?: boolean;
  sortable?: boolean;
  filterable?: boolean;
}

export interface SdGenericExternalFilter {
  key: string;
  operator?: Operator;
  default?: unknown;
  required?: boolean;
}

export interface SdGenericListSection {
  /** Plain text title; placeholders are not allowed. */
  title?: string;
  /** Absent: every property except `json` and `file`. */
  columns?: SdGenericListColumn[];
  externalFilters?: SdGenericExternalFilter[];
  /** Default sort. */
  orders?: Order[];
  /** Defaults to 20. */
  pageSize?: number;
  /** Client-side Excel export of the table. */
  export?: boolean;
}

export interface SdGenericFormSection {
  /** Title template; `${key}` placeholders are allowed only in detail / update. */
  title?: string;
  /** Layout only: fields reference properties by `key` and get their data from `general`. */
  form?: SdFormGenericSchema;
}

export interface SdGenericImportColumn {
  key: string;
  /** Relation column: field of the related record matched against the cell; defaults to `relation.displayField`. */
  matchField?: string;
}

export interface SdGenericImportSection {
  /** Absent: every insertable property except `system`, `json` and `file`. */
  columns?: SdGenericImportColumn[];
  /** Existing records matching this key are updated; the others are created. Absent: always create. */
  upsertKey?: string;
}

/** Schema of one entity of one module. Version 1 is plain JSON so it can be stored by `schemaStore.set`. */
export interface SdGenericSchema {
  version: 1;
  module: string;
  entity: string;
  general: SdGenericGeneral;
  list?: SdGenericListSection;
  detail?: SdGenericFormSection;
  /** `form` absent: the detail layout, then a generated one. */
  create?: SdGenericFormSection;
  /** `form` absent: the detail layout, then a generated one. */
  update?: SdGenericFormSection;
  import?: SdGenericImportSection;
}

/** Actions guarded by a permission code. */
export type SdGenericAction = 'list' | 'detail' | 'create' | 'update' | 'delete' | 'import' | 'configuration';

/** Actions that open a form. */
export type SdGenericFormAction = 'create' | 'update' | 'detail';
