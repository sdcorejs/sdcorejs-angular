import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { CustomerService } from '../customer/services/customer.service';
import { ProductService } from '../product/services/product.service';
import { entityResolver, updatableEntityResolver } from './entity.resolver';
import { OrderService } from './services/order.service';

/**
 * Chi tiết là route con của danh sách (drawer hoặc trang theo `detail`); tạo và cập nhật là trang thay chỗ danh sách
 * (`data.detail: 'page'`). CustomerService và ProductService được cấp ở đây cho `customer-select`, `product-select`
 * và các pipe relation: đơn hàng dùng wrapper của feature sở hữu entity, không tự gọi API của entity khác.
 */
export const routes: Routes = [
  {
    path: '',
    providers: [OrderService, CustomerService, ProductService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Đơn hàng',
        data: { permission: 'PATTERN_ORDER_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            title: 'Tạo mới đơn hàng',
            data: { permission: 'PATTERN_ORDER_C_CREATE', detail: 'page' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
          },
          {
            path: ':id/detail',
            title: 'Chi tiết đơn hàng',
            data: { permission: 'PATTERN_ORDER_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
          },
          {
            path: ':id/update',
            title: 'Cập nhật đơn hàng',
            data: { permission: 'PATTERN_ORDER_U_UPDATE', detail: 'page' },
            resolve: { entity: updatableEntityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent),
          },
        ],
      },
    ],
  },
];
