import type { Filter, PagingReq, PagingRes } from '@sdcorejs/utils/models';
import type { SdGenericFormAction, SdGenericSchema } from './generic-schema.model';

/** A record as the adapter returns it. */
export type SdGenericRecord = Record<string, unknown>;

/** Request of a relation search: by `term`, or by `values` to resolve the labels of selected values. */
export interface SdGenericSearchReq {
  term?: string;
  values?: unknown[];
  /** Fields searched with `term`. */
  fields: string[];
  /** Field matched by `values`. */
  valueField: string;
  filters?: Filter[];
  limit?: number;
}

/** How a create / update / detail form is shown. */
export type SdGenericDisplay = 'page' | 'side-drawer';

export interface SdGenericDisplayArgs {
  schema: SdGenericSchema;
  action: SdGenericFormAction;
}

/**
 * Storage of the customized schema of an entity, edited on the configuration screen (server-wide or per user, as
 * the adapter decides). `get` returns `null` when nothing is stored yet.
 */
export interface SdGenericSchemaStore {
  get(entity: string): Promise<SdGenericSchema | null>;
  set(entity: string, schema: SdGenericSchema): Promise<void>;
}

/**
 * Connects one backend (`module`) to the generic module. The library never calls HTTP itself: every
 * request goes through the adapter, so transport, URLs and authentication stay in the consumer.
 */
export interface SdGenericAdapter {
  readonly module: string;
  /** Schema of an entity as the backend describes it (`general` is required). */
  schema(entity: string): Promise<SdGenericSchema>;
  query(entity: string, req: PagingReq): Promise<PagingRes<SdGenericRecord>>;
  detail(entity: string, id: string): Promise<SdGenericRecord>;
  create(entity: string, data: SdGenericRecord): Promise<SdGenericRecord>;
  update(entity: string, id: string, data: SdGenericRecord): Promise<SdGenericRecord>;
  delete(entity: string, id: string): Promise<void>;
  /** Dedicated search API; absent: `query` with `CONTAIN` / `IN` filters. */
  search?(entity: string, req: SdGenericSearchReq): Promise<SdGenericRecord[]>;
  /** Where customized schemas are stored. Absent: `localStorage` of this browser. */
  schemaStore?: SdGenericSchemaStore;
  /** Absent: `'page'`. */
  display?(args: SdGenericDisplayArgs): SdGenericDisplay;
}
