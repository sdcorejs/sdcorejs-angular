import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { CategoryService } from './services/category.service';

/**
 * Tạo và cập nhật mở trong drawer trên bảng cây, không đổi URL. Guard rời trang hỏi trước khi bỏ thay đổi khi màn bị
 * rời lúc drawer còn thay đổi chưa lưu (Back của trình duyệt).
 */
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
        canDeactivate: [sdPageFormLeaveGuard],
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
      },
    ],
  },
];
