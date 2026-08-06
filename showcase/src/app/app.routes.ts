import { Routes } from '@angular/router';
import { docsVersionGuard, legacyDocsRedirectGuard } from './docs/core/docs-route.guards';
import { isDocCategory } from './docs/core/documentation.models';
import { findDocNavigationGroup, findDocPage } from './docs/core/documentation.registry';

const PACKAGE_TITLE = '@sdcorejs/angular — Documentation & Live Examples';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: PACKAGE_TITLE,
    loadComponent: () => import('./docs/pages/home/docs-home.component').then(module => module.DocsHomeComponent),
  },
  {
    path: 'about',
    title: `About | ${PACKAGE_TITLE}`,
    loadComponent: () => import('./docs/pages/about/about.component').then(module => module.AboutComponent),
  },
  {
    path: 'not-found',
    title: `Not found | ${PACKAGE_TITLE}`,
    loadComponent: () => import('./docs/pages/not-found/docs-not-found.component').then(module => module.DocsNotFoundComponent),
  },
  {
    path: 'v/:version',
    canActivate: [docsVersionGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: PACKAGE_TITLE,
        loadComponent: () => import('./docs/pages/home/docs-home.component').then(module => module.DocsHomeComponent),
      },
      {
        path: 'changelog',
        title: `Changelog | ${PACKAGE_TITLE}`,
        loadComponent: () => import('./docs/pages/changelog/changelog.component').then(module => module.ChangelogComponent),
      },
      {
        path: 'getting-started',
        title: `Getting started | ${PACKAGE_TITLE}`,
        loadComponent: () =>
          import('./docs/pages/getting-started/getting-started.component').then(module => module.GettingStartedComponent),
      },
      {
        path: ':category',
        pathMatch: 'full',
        title: route => {
          const group = findDocNavigationGroup(route.paramMap.get('category'));
          return group ? `${group.title} | ${PACKAGE_TITLE}` : `Not found | ${PACKAGE_TITLE}`;
        },
        loadComponent: () => import('./docs/pages/category/docs-category.component').then(module => module.DocsCategoryComponent),
      },
      {
        path: ':category/:slug',
        data: {
          breadcrumb: (route: import('@angular/router').ActivatedRouteSnapshot) => {
            const category = route.paramMap.get('category');
            const page = isDocCategory(category) ? findDocPage(category, route.paramMap.get('slug') ?? '') : undefined;
            return page?.title ?? route.paramMap.get('slug');
          },
        },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'overview' },
          {
            path: ':tab',
            data: {
              breadcrumb: (route: import('@angular/router').ActivatedRouteSnapshot) => route.paramMap.get('tab'),
            },
            title: route => {
              const category = route.paramMap.get('category');
              const page = isDocCategory(category) ? findDocPage(category, route.paramMap.get('slug') ?? '') : undefined;
              const tab = route.paramMap.get('tab');
              return page ? `${page.title}${tab ? ` · ${tab}` : ''} | ${PACKAGE_TITLE}` : `Not found | ${PACKAGE_TITLE}`;
            },
            loadComponent: () => import('./docs/pages/page/docs-page.component').then(module => module.DocsPageComponent),
          },
        ],
      },
    ],
  },
  {
    path: ':category/:slug',
    canActivate: [legacyDocsRedirectGuard],
    loadComponent: () => import('./docs/pages/not-found/docs-not-found.component').then(module => module.DocsNotFoundComponent),
  },
  {
    path: '**',
    title: `Not found | ${PACKAGE_TITLE}`,
    loadComponent: () => import('./docs/pages/not-found/docs-not-found.component').then(module => module.DocsNotFoundComponent),
  },
];
