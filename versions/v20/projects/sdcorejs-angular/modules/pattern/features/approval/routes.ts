import type { Routes } from '@angular/router';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { ApprovalService } from './services/approval.service';

/** Chi tiết là route con `:id`, hiện trong panel phải của danh sách (pattern split). */
export const routes: Routes = [
  {
    path: '',
    providers: [ApprovalService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Phê duyệt',
        data: { permission: 'PATTERN_APPROVAL_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: ':id',
            data: { permission: 'PATTERN_APPROVAL_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
          },
        ],
      },
    ],
  },
];
