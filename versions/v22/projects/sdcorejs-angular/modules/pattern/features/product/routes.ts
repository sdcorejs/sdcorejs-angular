import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { ProductService } from './services/product.service';

/** Detail, create và update là route con của danh sách: quay lại vẫn giữ bộ lọc, trang và vị trí cuộn. */
export const routes: Routes = [
  {
    path: '',
    providers: [ProductService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Sản phẩm',
        data: { permission: 'PATTERN_PRODUCT_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            title: 'Tạo sản phẩm',
            data: { permission: 'PATTERN_PRODUCT_C_CREATE' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
          },
          {
            path: ':id/detail',
            title: 'Chi tiết sản phẩm',
            data: { permission: 'PATTERN_PRODUCT_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
          },
          {
            path: ':id/update',
            title: 'Cập nhật sản phẩm',
            data: { permission: 'PATTERN_PRODUCT_U_UPDATE' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent),
          },
        ],
      },
    ],
  },
];
