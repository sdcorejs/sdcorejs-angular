import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver, parentResolver } from './entity.resolver';
import { CategoryService } from './services/category.service';

/** Tạo và cập nhật mở trong drawer (route con của bảng cây). */
export const routes: Routes = [
  {
    path: '',
    providers: [CategoryService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Danh mục',
        data: { permission: 'PATTERN_CATEGORY_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            data: { permission: 'PATTERN_CATEGORY_C_CREATE' },
            resolve: { parent: parentResolver },
            runGuardsAndResolvers: 'paramsOrQueryParamsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/create-side-drawer/create-side-drawer.component').then(module => module.CreateSideDrawerComponent),
          },
          {
            path: ':id/update',
            data: { permission: 'PATTERN_CATEGORY_U_UPDATE' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/update-side-drawer/update-side-drawer.component').then(module => module.UpdateSideDrawerComponent),
          },
        ],
      },
    ],
  },
];
