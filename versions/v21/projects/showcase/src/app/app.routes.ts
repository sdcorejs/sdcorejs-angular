import { Routes } from '@angular/router';
import { legacyDocsRedirectGuard } from './docs/core/docs-route.guards';
import { DocCategory } from './docs/core/documentation.models';
import { findDocPage } from './docs/core/documentation.registry';

const PACKAGE_TITLE = '@sdcorejs/angular documentation';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: PACKAGE_TITLE,
    loadComponent: () => import('./docs/pages/home/docs-home.component').then((module) => module.DocsHomeComponent),
  },
  {
    path: 'about',
    title: `About | ${PACKAGE_TITLE}`,
    loadComponent: () => import('./docs/pages/about/about.component').then((module) => module.AboutComponent),
  },
  {
    path: 'not-found',
    title: `Not found | ${PACKAGE_TITLE}`,
    loadComponent: () => import('./docs/pages/not-found/docs-not-found.component').then((module) => module.DocsNotFoundComponent),
  },
  {
    path: 'v/:version',
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: PACKAGE_TITLE,
        loadComponent: () => import('./docs/pages/home/docs-home.component').then((module) => module.DocsHomeComponent),
      },
      {
        path: 'changelog',
        title: `Changelog | ${PACKAGE_TITLE}`,
        loadComponent: () => import('./docs/pages/changelog/changelog.component').then((module) => module.ChangelogComponent),
      },
      {
        path: ':category/:slug',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'overview' },
          {
            path: ':tab',
            title: (route) => {
              const page = findDocPage(route.paramMap.get('category') as DocCategory, route.paramMap.get('slug') ?? '');
              const tab = route.paramMap.get('tab');
              return page ? `${page.title}${tab ? ` · ${tab}` : ''} | ${PACKAGE_TITLE}` : `Not found | ${PACKAGE_TITLE}`;
            },
            loadComponent: () => import('./docs/pages/page/docs-page.component').then((module) => module.DocsPageComponent),
          },
        ],
      },
    ],
  },
  {
    path: ':category/:slug',
    canActivate: [legacyDocsRedirectGuard],
    loadComponent: () => import('./docs/pages/not-found/docs-not-found.component').then((module) => module.DocsNotFoundComponent),
  },
  {
    path: '**',
    title: `Not found | ${PACKAGE_TITLE}`,
    loadComponent: () => import('./docs/pages/not-found/docs-not-found.component').then((module) => module.DocsNotFoundComponent),
  },
];
