import type { Routes } from '@angular/router';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { PartnerService } from './services/partner.service';

export const routes: Routes = [
  {
    path: '',
    providers: [PartnerService],
    canActivateChild: [SdPermissionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'create' },
      {
        path: 'create',
        title: 'Tạo đối tác',
        data: { permission: 'PATTERN_PARTNER_C_CREATE' },
        loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
      },
    ],
  },
];
