import type { Type } from '@angular/core';
import type {
  SdGenericAdapter,
  SdGenericDisplay,
  SdGenericDisplayArgs,
  SdGenericRecord,
  SdGenericSearchReq,
} from './generic-adapter.model';
import type { SdGenericSchema } from './generic-schema.model';

/** Context handed to a custom action. */
export interface SdGenericActionContext {
  schema: SdGenericSchema;
  /** The row of a row command or the record of a detail action. */
  row?: SdGenericRecord;
  /** The selected rows of a bulk action. */
  rows?: SdGenericRecord[];
  /** Reloads the list (and the detail record when shown). */
  reload(): void;
}

/** A custom button declared by code; JSON configuration can only hide it by `id`. */
export interface SdGenericCustomAction {
  id: string;
  label: string;
  icon?: string;
  /** Permission code checked with `SdPermissionService`. */
  permission?: string;
  visible?(context: SdGenericActionContext): boolean;
  run(context: SdGenericActionContext): void | Promise<void>;
}

export interface SdGenericSaveContext {
  action: 'create' | 'update';
  /** Payload about to be sent to the adapter. */
  data: SdGenericRecord;
  schema: SdGenericSchema;
  /** Id of the updated record. */
  id?: string;
}

export interface SdGenericAfterSaveContext extends SdGenericSaveContext {
  /** Record returned by the adapter. */
  result: SdGenericRecord;
}

export interface SdGenericHooks {
  /** Returns the payload sent to the adapter. */
  beforeSave?(context: SdGenericSaveContext): SdGenericRecord | Promise<SdGenericRecord>;
  /** Runs once after a successful save. */
  afterSave?(context: SdGenericAfterSaveContext): void | Promise<void>;
}

/** Built-in actions that `hiddenDefaults` can hide. */
export type SdGenericDefaultAction = 'create' | 'import' | 'export' | 'detail' | 'update' | 'delete';

/** What the consumer configures for one entity through `provideSdGenericEntity`: code-level customization. */
export interface SdGenericEntityConfiguration {
  module: string;
  entity: string;
  /** Adjusts the schema returned by the adapter; the result is the default configuration of the entity. */
  schema?(base: SdGenericSchema): SdGenericSchema | Promise<SdGenericSchema>;
  /** Dedicated search API of this entity; wins over the adapter search. */
  search?(req: SdGenericSearchReq): Promise<SdGenericRecord[]>;
  /** Wins over the adapter `display`. */
  display?(args: SdGenericDisplayArgs): SdGenericDisplay;
  hooks?: SdGenericHooks;
  /** Header buttons of the list. */
  listActions?: SdGenericCustomAction[];
  /** Commands of each row. */
  rowCommands?: SdGenericCustomAction[];
  /** Actions on the selected rows. */
  bulkActions?: SdGenericCustomAction[];
  /** Buttons of the detail page or drawer. */
  detailActions?: SdGenericCustomAction[];
  hiddenDefaults?: SdGenericDefaultAction[];
}

/** What the consumer configures for the generic module through `provideSdGeneric`: adapters and the permission switch. */
export interface SdGenericConfiguration {
  /** Adapter classes (created by DI, so they can inject the HTTP client of the app) or instances. */
  adapters: (Type<SdGenericAdapter> | SdGenericAdapter)[];
  /** `false` turns every permission check off (development). Defaults to `true`. */
  permission?: boolean;
}
