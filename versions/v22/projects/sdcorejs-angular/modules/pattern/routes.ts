import type { Routes } from '@angular/router';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';

/**
 * Routes of `/pattern`. Mount them with `provideSdPatterns()` in the providers of the same route:
 * the guard below is the route-level `SdPermissionGuard` of the sample roles, not the host's.
 */
export const SD_PATTERN_ROUTES: Routes = [
  {
    path: '',
    // Loads the permissions of the sample role before any pattern screen opens.
    canActivate: [SdPermissionGuard],
    loadComponent: () => import('./core/pattern-shell/shell/shell.component').then(module => module.PatternShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Pattern',
        loadComponent: () => import('./core/pattern-shell/index/index.component').then(module => module.PatternIndexComponent),
      },
      { path: 'product', loadChildren: () => import('./features/product/routes').then(module => module.routes) },
      { path: 'customer', loadChildren: () => import('./features/customer/routes').then(module => module.routes) },
      { path: 'order', loadChildren: () => import('./features/order/routes').then(module => module.routes) },
      { path: 'approval', loadChildren: () => import('./features/approval/routes').then(module => module.routes) },
      { path: 'category', loadChildren: () => import('./features/category/routes').then(module => module.routes) },
      { path: 'import', loadChildren: () => import('./features/import/routes').then(module => module.routes) },
      { path: 'partner', loadChildren: () => import('./features/partner/routes').then(module => module.routes) },
      { path: 'settings', loadChildren: () => import('./features/settings/routes').then(module => module.routes) },
    ],
  },
];
