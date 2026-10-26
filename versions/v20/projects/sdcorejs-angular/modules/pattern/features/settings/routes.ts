import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { SettingsService } from './services/settings.service';
import { settingsResolver } from './settings.resolver';

/** Một bản ghi: vào thẳng trang cập nhật; người chỉ có quyền xem thấy form ở chế độ xem. */
export const routes: Routes = [
  {
    path: '',
    providers: [SettingsService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Cài đặt',
        data: { permission: 'PATTERN_SETTINGS_R_DETAIL' },
        resolve: { entity: settingsResolver },
        canDeactivate: [sdPageFormLeaveGuard],
        loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent),
      },
    ],
  },
];
