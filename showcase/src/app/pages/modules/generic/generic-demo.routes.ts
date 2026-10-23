import type { Routes } from '@angular/router';
import { provideSdGeneric, sdGenericRoutes } from '@sdcorejs/angular/modules/generic';
import { GenericDemoMockAdapter } from './generic-demo.mock-adapter';

// Keep the generic providers and their form components out of the documentation shell's initial bundle.
export const GENERIC_DEMO_ROUTES: Routes = [
  {
    path: '',
    providers: [provideSdGeneric({ adapters: [GenericDemoMockAdapter], permission: false })],
    children: sdGenericRoutes(),
  },
];
