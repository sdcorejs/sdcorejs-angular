import type { EnvironmentInjector } from '@angular/core';
import type { SdFormGenericCatalog } from '@sdcorejs/angular/components/form-generic';
import { SD_GENERIC_RELATION_CATALOG } from '../core';
import { SdGenericDataService } from './generic-data.service';

/**
 * Holds the environment injector of a generic route. form-generic catalogs are plain objects created before any
 * injector exists, so `sdGenericRoutes()` attaches the route injector here once Angular creates it (D-022).
 */
export class SdGenericCatalogBridge {
  #injector: EnvironmentInjector | undefined;

  attach(injector: EnvironmentInjector): void {
    this.#injector = injector;
  }

  data(): SdGenericDataService {
    if (!this.#injector) throw new Error('SdGeneric: the relation catalog is only available inside a generic route.');
    return this.#injector.get(SdGenericDataService);
  }
}

const param = (name: string) => ({ name, label: name, required: name === 'module' || name === 'entity' });

/** The single form-generic catalog behind every relation select; params identify the relation. */
export const sdGenericRelationCatalog = (bridge: SdGenericCatalogBridge): SdFormGenericCatalog => ({
  id: SD_GENERIC_RELATION_CATALOG,
  label: 'Generic relation',
  params: ['module', 'entity', 'valueField', 'displayField', 'searchFields', 'display'].map(param),
  load: async params => bridge.data().relationItems(params, {}),
  search: async (term, params) => bridge.data().relationItems(params, { term }),
  labels: async (values, params) => bridge.data().relationItems(params, { values }),
});
