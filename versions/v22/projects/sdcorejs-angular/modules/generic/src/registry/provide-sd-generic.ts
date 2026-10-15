import {
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  type EnvironmentProviders,
  type Provider,
  type Type,
} from '@angular/core';
import type { SdGenericAdapter, SdGenericConfiguration, SdGenericEntityConfiguration } from '../models';
import {
  SD_GENERIC_ADAPTERS,
  SD_GENERIC_ENTITIES,
  SD_GENERIC_PERMISSION_OPTION,
  SD_GENERIC_SCOPE,
  sdGenericScopeFactory,
} from './generic-registry';

const scopeProviders = (): (Provider | EnvironmentProviders)[] => [
  { provide: SD_GENERIC_SCOPE, useFactory: sdGenericScopeFactory },
  // why: build the scope as soon as the injector exists, so a duplicate module throws at bootstrap / route
  // activation instead of on the first generic screen (AC-003).
  provideEnvironmentInitializer(() => inject(SD_GENERIC_SCOPE)),
];

/**
 * Registers backend adapters for the generic module. Call it at the root and/or in the `providers` of lazy
 * routes: lookups use the nearest injector first, then its parents. Adapter classes are created by DI.
 *
 * @example
 * provideSdGeneric({ adapters: [TmsAdapter] });
 */
export function provideSdGeneric(configuration: SdGenericConfiguration): EnvironmentProviders {
  const classes = configuration.adapters.filter((adapter): adapter is Type<SdGenericAdapter> => typeof adapter === 'function');
  return makeEnvironmentProviders([
    ...classes.map(adapter => ({ provide: adapter, useClass: adapter })),
    { provide: SD_GENERIC_ADAPTERS, multi: true, useValue: configuration.adapters },
    { provide: SD_GENERIC_PERMISSION_OPTION, multi: true, useValue: configuration.permission },
    ...scopeProviders(),
  ]);
}

/**
 * Code-level customization of one entity: schema adjustments, dedicated search, display mode, save hooks and
 * custom actions. Same scoping rules as `provideSdGeneric`.
 */
export function provideSdGenericEntity(configuration: SdGenericEntityConfiguration): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SD_GENERIC_ENTITIES, multi: true, useValue: configuration }, ...scopeProviders()]);
}
