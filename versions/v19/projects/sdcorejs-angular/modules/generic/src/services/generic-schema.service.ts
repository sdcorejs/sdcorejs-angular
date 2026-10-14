import { Injectable, inject } from '@angular/core';
import { sdGenericBlocksLoad, sdGenericMergeSchema, validateSdGenericSchema } from '../core';
import type { SdGenericAdapter, SdGenericSchema, SdGenericSchemaIssue, SdGenericSchemaStore } from '../models';
import { SD_GENERIC_SCOPE } from '../registry';
import { SdGenericLocalStore } from './generic-configuration-store';

export interface SdGenericResolvedSchema {
  /** Effective schema used by every screen. */
  schema: SdGenericSchema;
  /** Default configuration: the adapter schema after `provideSdGenericEntity.schema`. */
  base: SdGenericSchema;
  /** The stored configuration was rejected and the default one is in use. */
  invalid: boolean;
  issues: SdGenericSchemaIssue[];
  /** Stored property keys that the backend no longer has. */
  removed: string[];
  /** Backend property keys that the stored configuration does not know yet. */
  added: string[];
}

/**
 * Owns the effective schema of each entity (INV-002): adapter schema -> entity schema function -> stored
 * configuration (validated, then merged). It is the only caller of `adapter.schema` and of the schema store.
 */
@Injectable()
export class SdGenericSchemaService {
  readonly #scope = inject(SD_GENERIC_SCOPE);
  readonly #cache = new Map<string, Promise<SdGenericResolvedSchema>>();

  resolve(module: string, entity: string): Promise<SdGenericResolvedSchema> {
    const key = `${module}.${entity}`;
    let pending = this.#cache.get(key);
    if (!pending) {
      pending = this.#load(module, entity);
      // why: a failed load must not stay cached, so the next navigation retries.
      pending.catch(() => this.#cache.delete(key));
      this.#cache.set(key, pending);
    }
    return pending;
  }

  /** Validates, stores and drops the cached schema of the entity; returns the issues when it refuses to save. */
  async save(module: string, entity: string, schema: SdGenericSchema): Promise<SdGenericSchemaIssue[]> {
    const { base } = await this.resolve(module, entity);
    const issues = validateSdGenericSchema(schema, base);
    if (issues.length) return issues;
    await this.#store(this.#adapter(module)).set(entity, schema);
    this.invalidate(module, entity);
    return [];
  }

  invalidate(module: string, entity: string): void {
    this.#cache.delete(`${module}.${entity}`);
  }

  async #load(module: string, entity: string): Promise<SdGenericResolvedSchema> {
    const adapter = this.#adapter(module);
    const config = this.#scope.entity(module, entity);
    let base = await adapter.schema(entity);
    if (config?.schema) base = await config.schema(structuredClone(base));
    const stored = await this.#store(adapter).get(entity);
    if (stored === null || stored === undefined) return { schema: base, base, invalid: false, issues: [], removed: [], added: [] };
    const issues = validateSdGenericSchema(stored, base);
    if (issues.some(sdGenericBlocksLoad)) {
      console.warn(`SdGeneric: the stored configuration of ${module}.${entity} is invalid; the default configuration is in use.`, issues);
      return { schema: base, base, invalid: true, issues, removed: [], added: [] };
    }
    try {
      const merged = sdGenericMergeSchema(stored, base);
      return { schema: merged.schema, base, invalid: false, issues, removed: merged.removed, added: merged.added };
    } catch (error) {
      // why: a configuration the validator did not foresee must still fall back to the default one (AC-007).
      const issue: SdGenericSchemaIssue = {
        code: 'shape',
        severity: 'error',
        path: '$',
        message: `The configuration cannot be merged: ${String(error)}`,
      };
      console.warn(`SdGeneric: the stored configuration of ${module}.${entity} is invalid; the default configuration is in use.`, [issue]);
      return { schema: base, base, invalid: true, issues: [...issues, issue], removed: [], added: [] };
    }
  }

  #adapter(module: string): SdGenericAdapter {
    const adapter = this.#scope.adapter(module);
    if (!adapter) throw new Error(`SdGeneric: no adapter is registered for the module "${module}".`);
    return adapter;
  }

  #store(adapter: SdGenericAdapter): SdGenericSchemaStore {
    return adapter.schemaStore ?? new SdGenericLocalStore(adapter.module);
  }
}
