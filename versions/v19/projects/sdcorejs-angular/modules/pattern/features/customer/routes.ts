import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { CustomerService } from './services/customer.service';

/**
 * Chi tiết, tạo và cập nhật mở trong drawer (route con của danh sách); hồ sơ 360° là trang thay chỗ danh sách
 * (`data.detail: 'page'`). Đóng drawer hay quay lại đều giữ bộ lọc, trang và vị trí cuộn của danh sách.
 */
export const routes: Routes = [
  {
    path: '',
    providers: [CustomerService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Khách hàng',
        data: { permission: 'PATTERN_CUSTOMER_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            data: { permission: 'PATTERN_CUSTOMER_C_CREATE' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/create-side-drawer/create-side-drawer.component').then(module => module.CreateSideDrawerComponent),
          },
          {
            path: ':id/detail',
            data: { permission: 'PATTERN_CUSTOMER_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () =>
              import('./components/detail-side-drawer/detail-side-drawer.component').then(module => module.DetailSideDrawerComponent),
          },
          {
            path: ':id/update',
            data: { permission: 'PATTERN_CUSTOMER_U_UPDATE' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/update-side-drawer/update-side-drawer.component').then(module => module.UpdateSideDrawerComponent),
          },
          {
            path: ':id/360',
            title: 'Hồ sơ khách hàng',
            data: { permission: 'PATTERN_CUSTOMER_R_DETAIL', detail: 'page' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/profile/profile.component').then(module => module.ProfileComponent),
          },
        ],
      },
    ],
  },
];
