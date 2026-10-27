import { Routes } from '@angular/router';
import { provideSdPatterns } from '@sdcorejs/angular/modules/pattern';
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
    // Live sd-tab-router-outlet of the Tab Router page: child routes are screens decorated with @SdTabComponent.
    path: 'demo/tab-router',
    title: `Tab router demo | ${PACKAGE_TITLE}`,
    loadComponent: () => import('./pages/components/tab-router/live/tab-router-live.component').then(m => m.TabRouterLiveComponent),
    loadChildren: () => import('./pages/components/tab-router/live/tab-router-live.pages').then(m => m.TAB_ROUTER_LIVE_ROUTES),
  },
  {
    // @sdcorejs/angular/modules/pattern: sample screens by entity over its mock API, as a portal mounts them.
    path: 'pattern',
    title: `Pattern | ${PACKAGE_TITLE}`,
    providers: [provideSdPatterns({ forbiddenUrl: '/pattern-error/forbidden' })],
    loadComponent: () => import('./pages/pattern/pattern-host.component').then(m => m.PatternHostComponent),
    loadChildren: () => import('@sdcorejs/angular/modules/pattern').then(m => m.SD_PATTERN_ROUTES),
  },
  {
    // Error page of the host for /pattern: 404/timeout of a resolver (pattern-navigation-error.ts) and 403 of the guard.
    path: 'pattern-error/:kind',
    title: `Pattern | ${PACKAGE_TITLE}`,
    loadComponent: () => import('./pages/pattern/pattern-error.component').then(m => m.PatternErrorComponent),
  },
  {
    // Live generic module screens of the Generic CRUD page, backed by an in-memory adapter.
    path: 'demo',
    title: `Generic CRUD demo | ${PACKAGE_TITLE}`,
    loadChildren: () => import('./pages/modules/generic/generic-demo.routes').then(m => m.GENERIC_DEMO_ROUTES),
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
