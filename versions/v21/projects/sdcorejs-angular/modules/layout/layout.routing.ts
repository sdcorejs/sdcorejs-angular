import { Route } from '@angular/router';
import { SD_PERMISSION_PUBLIC } from '@sdcorejs/angular/modules/permission';

// why: `SdPermissionGuard.canActivateChild` từ chối mọi route không khai báo `data.permission`. Ba
// trang built-in dưới đây là hạ tầng của layout (home / 404 / 403), ai đăng nhập cũng phải vào được —
// đặc biệt `forbidden`, vì `onForbiden` thường điều hướng chính vào nó: thiếu khai báo ở đây thì
// trang 403 tự bị chặn và app rơi vào vòng lặp redirect. Nói tường minh bằng `SD_PERMISSION_PUBLIC`.
// Route con `path: ''` trong từng module kế thừa `data` này (chiến lược `emptyOnly` mặc định).
const PUBLIC_ROUTE_DATA = { permission: SD_PERMISSION_PUBLIC } as const;

export const Routes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'not-found',
  },
  {
    path: 'home',
    data: PUBLIC_ROUTE_DATA,
    loadChildren: () => import('./modules/home').then(m => m.HomeModule),
  },
  {
    path: 'not-found',
    data: PUBLIC_ROUTE_DATA,
    loadChildren: () => import('./modules/not-found').then(m => m.NotFoundModule),
  },
  {
    path: 'forbidden',
    data: PUBLIC_ROUTE_DATA,
    loadChildren: () => import('./modules/forbidden').then(m => m.ForbiddenModule),
  },
];
