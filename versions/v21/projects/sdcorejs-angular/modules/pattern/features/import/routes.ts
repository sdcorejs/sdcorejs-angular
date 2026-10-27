import type { Routes } from '@angular/router';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { ImportService } from './services/import.service';

export const routes: Routes = [
  {
    path: '',
    providers: [ImportService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Nhập dữ liệu sản phẩm',
        data: { permission: 'PATTERN_IMPORT_C_IMPORT' },
        loadComponent: () => import('./pages/flow/flow.component').then(module => module.FlowComponent),
      },
    ],
  },
];
