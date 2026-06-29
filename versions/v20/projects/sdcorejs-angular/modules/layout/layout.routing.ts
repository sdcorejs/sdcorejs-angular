import { Route } from '@angular/router';

export const Routes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'not-found',
  },
  {
    path: 'home',
    loadChildren: () => import('./modules/home').then(m => m.HomeModule),
  },
  {
    path: 'not-found',
    loadChildren: () => import('./modules/not-found').then(m => m.NotFoundModule),
  },
  {
    path: 'forbidden',
    loadChildren: () => import('./modules/forbidden').then(m => m.ForbiddenModule),
  },
];
