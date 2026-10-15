/** Problems reported by `validateSdGenericSchema`. */
export type SdGenericSchemaIssueCode =
  /** Not an object, or a required member is missing or has the wrong type. */
  | 'shape'
  /** `version` is not 1. */
  | 'version'
  | 'module-mismatch'
  | 'entity-mismatch'
  | 'property-key-duplicate'
  /** `dataType` is not one of the supported data types. */
  | 'property-type'
  /** A list column, filter, order, import column, upsert key or layout field points to a property that does not exist. */
  | 'reference-dangling'
  /** A form layout breaks the form-generic grammar (pages, then groups or fields). */
  | 'layout-grammar'
  /** A layout field type does not match the data type of its property. */
  | 'layout-type-mismatch'
  | 'upsert-key-multiple'
  /** The upsert key is not one of the import columns, so no row could ever match an existing record. */
  | 'upsert-key-not-imported'
  | 'create-not-insertable'
  | 'update-not-updatable'
  /** The list and create titles cannot contain `${...}` placeholders. */
  | 'title-placeholder-forbidden'
  /** A detail or update title references a property that does not exist. */
  | 'title-placeholder-unknown';

/** Every issue is an `error` for a save; `sdGenericBlocksLoad` decides which ones a load tolerates. */
export type SdGenericSchemaIssueSeverity = 'error' | 'warning';

export interface SdGenericSchemaIssue {
  code: SdGenericSchemaIssueCode;
  severity: SdGenericSchemaIssueSeverity;
  /** JSON path such as `list.columns[2].key`. */
  path: string;
  message: string;
}
