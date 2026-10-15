import { EnvironmentInjector, inject, provideEnvironmentInitializer } from '@angular/core';
import type { Route, Routes } from '@angular/router';
import { provideSdFormGeneric } from '@sdcorejs/angular/components/form-generic';
import { SD_PERMISSION_PUBLIC } from '@sdcorejs/angular/modules/permission';
import type { SdGenericAction, SdGenericFormAction } from '../models';
import {
  SdGenericCatalogBridge,
  SdGenericDataService,
  SdGenericPermissionService,
  SdGenericSchemaService,
  sdGenericRelationCatalog,
} from '../services';
import { sdGenericPermissionGuard, sdGenericSchemaResolver } from './generic-route.guards';

/**
 * Routes of the generic module:
 * `generic/:module/:entity` (list), `create`, `:id/detail`, `:id/update` (page or side drawer over the list)
 * and `configuration`. Mount them where the adapters of the module are provided (root or the lazy route).
 *
 * @example
 * { path: 'tms', providers: [provideSdGeneric({ adapters: [TmsAdapter] })], children: sdGenericRoutes() }
 */
export function sdGenericRoutes(): Routes {
  const bridge = new SdGenericCatalogBridge();
  // why: a portal SdPermissionGuard denies routes without data.permission; the generic guards check the real
  // codes, which depend on :module/:entity and cannot be static route data (D-024).
  const data = (action?: SdGenericAction) => ({ permission: SD_PERMISSION_PUBLIC, ...(action ? { sdGenericAction: action } : {}) });
  const form = (action: SdGenericFormAction): Route => ({
    path: action === 'create' ? 'create' : `:id/${action}`,
    data: data(action),
    canActivate: [sdGenericPermissionGuard(action)],
    loadComponent: () => import('../pages/form/generic-form-host.page').then(m => m.GenericFormHostPage),
  });
  return [
    {
      path: 'generic/:module/:entity',
      data: data(),
      providers: [
        SdGenericSchemaService,
        SdGenericDataService,
        SdGenericPermissionService,
        provideSdFormGeneric({ catalogs: [sdGenericRelationCatalog(bridge)] }),
        provideEnvironmentInitializer(() => bridge.attach(inject(EnvironmentInjector))),
      ],
      children: [
        {
          path: 'configuration',
          data: data('configuration'),
          canActivate: [sdGenericPermissionGuard('configuration')],
          resolve: { generic: sdGenericSchemaResolver },
          loadComponent: () => import('../pages/configuration/generic-configuration.page').then(m => m.GenericConfigurationPage),
        },
        {
          path: '',
          data: data('list'),
          canActivate: [sdGenericPermissionGuard('list')],
          resolve: { generic: sdGenericSchemaResolver },
          loadComponent: () => import('../pages/list/generic-list.page').then(m => m.GenericListPage),
          children: [form('create'), form('detail'), form('update')],
        },
      ],
    },
  ];
}
