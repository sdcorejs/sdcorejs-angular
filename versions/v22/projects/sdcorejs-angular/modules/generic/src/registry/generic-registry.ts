import { InjectionToken, Injector, inject, type Type } from '@angular/core';
import type { SdGenericAdapter, SdGenericConfiguration, SdGenericDisplay, SdGenericEntityConfiguration } from '../models';

/** What a form shown inside the list outlet needs from the list (D-024). */
export interface SdGenericListHost {
  reload(): void;
  /** The form reports its display mode: a page form takes the place of the list, a side drawer keeps it visible. */
  setFormDisplay(display: SdGenericDisplay): void;
}

/** Provided by the list page for the form pages of its outlet. */
export const SD_GENERIC_LIST_HOST = new InjectionToken<SdGenericListHost>('SD_GENERIC_LIST_HOST');

/** Adapter lists of every `provideSdGeneric` call in one injector. */
export const SD_GENERIC_ADAPTERS = new InjectionToken<SdGenericConfiguration['adapters'][]>('SD_GENERIC_ADAPTERS');
/** Entity configurations of every `provideSdGenericEntity` call in one injector. */
export const SD_GENERIC_ENTITIES = new InjectionToken<SdGenericEntityConfiguration[]>('SD_GENERIC_ENTITIES');
/** `permission` option of every `provideSdGeneric` call in one injector. */
export const SD_GENERIC_PERMISSION_OPTION = new InjectionToken<(boolean | undefined)[]>('SD_GENERIC_PERMISSION_OPTION');

const entityKey = (module: string, entity: string) => `${module}.${entity}`;

/**
 * Registrations of one injector plus a link to the scope of the parent injector. Lookups walk from the nearest
 * scope to the root, so a lazy route can override what the root declares (INV-001).
 */
export class SdGenericScope {
  constructor(
    readonly adapters: ReadonlyMap<string, SdGenericAdapter>,
    readonly entities: ReadonlyMap<string, SdGenericEntityConfiguration>,
    readonly permission: boolean | undefined,
    readonly parent: SdGenericScope | null
  ) {}

  adapter(module: string): SdGenericAdapter | undefined {
    return this.adapters.get(module) ?? this.parent?.adapter(module);
  }

  entity(module: string, entity: string): SdGenericEntityConfiguration | undefined {
    return this.entities.get(entityKey(module, entity)) ?? this.parent?.entity(module, entity);
  }

  /** `permission` of the nearest scope that declares it; `true` when none does. */
  permissionEnabled(): boolean {
    return this.permission ?? this.parent?.permissionEnabled() ?? true;
  }
}

/** Scope of the current injector. Every generic screen reads adapters and entity settings only through it. */
export const SD_GENERIC_SCOPE = new InjectionToken<SdGenericScope>('SD_GENERIC_SCOPE', {
  providedIn: 'root',
  factory: () => new SdGenericScope(new Map(), new Map(), undefined, null),
});

const isAdapterClass = (value: Type<SdGenericAdapter> | SdGenericAdapter): value is Type<SdGenericAdapter> => typeof value === 'function';

/** Factory of the scope of one injector: reads that injector's own registrations, links the parent scope. */
export const sdGenericScopeFactory = (): SdGenericScope => {
  const injector = inject(Injector);
  const adapters = new Map<string, SdGenericAdapter>();
  for (const value of (inject(SD_GENERIC_ADAPTERS, { self: true, optional: true }) ?? []).flat()) {
    const adapter = isAdapterClass(value) ? injector.get(value) : value;
    // why: two adapters for one module in the same injector are ambiguous (D-020); fail while the injector is created.
    if (adapters.has(adapter.module))
      throw new Error(`SdGeneric: the module "${adapter.module}" is registered twice in the same injector.`);
    adapters.set(adapter.module, adapter);
  }
  const entities = new Map<string, SdGenericEntityConfiguration>();
  for (const entity of inject(SD_GENERIC_ENTITIES, { self: true, optional: true }) ?? []) {
    const key = entityKey(entity.module, entity.entity);
    if (entities.has(key)) throw new Error(`SdGeneric: the entity "${key}" is configured twice in the same injector.`);
    entities.set(key, entity);
  }
  const permission = (inject(SD_GENERIC_PERMISSION_OPTION, { self: true, optional: true }) ?? [])
    .filter(value => value !== undefined)
    .pop();
  const parent = inject(SD_GENERIC_SCOPE, { skipSelf: true, optional: true });
  return new SdGenericScope(adapters, entities, permission, parent);
};
