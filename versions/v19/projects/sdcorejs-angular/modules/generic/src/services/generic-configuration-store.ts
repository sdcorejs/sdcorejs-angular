import type { SdGenericSchema, SdGenericSchemaStore } from '../models';

/** `localStorage` key of the customized schema of one entity (A-005). */
export const sdGenericStorageKey = (module: string, entity: string): string => `sd-generic:configuration:${module}.${entity}`;

/**
 * Default schema store when the adapter has no `schemaStore`. It only lives in this browser, so real deployments
 * should give the adapter a `schemaStore` backed by the server.
 */
export class SdGenericLocalStore implements SdGenericSchemaStore {
  constructor(private readonly module: string) {}

  async get(entity: string): Promise<SdGenericSchema | null> {
    let raw: string | null;
    try {
      raw = localStorage.getItem(sdGenericStorageKey(this.module, entity));
    } catch {
      // why: no storage (server rendering, blocked site data) means no configuration yet, not a failed screen.
      return null;
    }
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as SdGenericSchema;
    } catch {
      // why: unreadable content is handed to the validator, which reports it as a shape error (fallback to default).
      return raw as unknown as SdGenericSchema;
    }
  }

  async set(entity: string, schema: SdGenericSchema): Promise<void> {
    localStorage.setItem(sdGenericStorageKey(this.module, entity), JSON.stringify(schema));
  }
}
