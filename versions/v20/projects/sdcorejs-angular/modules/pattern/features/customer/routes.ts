import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { CustomerService } from './services/customer.service';

/**
 * Chi tiết, tạo và cập nhật mở trong drawer trên danh sách, không đổi URL. Hồ sơ 360° là trang, route con thay chỗ
 * danh sách; quay lại vẫn giữ bộ lọc, trang và vị trí cuộn. Guard rời trang hỏi trước khi bỏ thay đổi khi màn bị rời
 * lúc drawer còn thay đổi chưa lưu (Back của trình duyệt).
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
        canDeactivate: [sdPageFormLeaveGuard],
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: ':id/360',
            title: 'Hồ sơ khách hàng',
            data: { permission: 'PATTERN_CUSTOMER_R_DETAIL' },
            canDeactivate: [sdPageFormLeaveGuard],
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/profile/profile.component').then(module => module.ProfileComponent),
          },
        ],
      },
    ],
  },
];
