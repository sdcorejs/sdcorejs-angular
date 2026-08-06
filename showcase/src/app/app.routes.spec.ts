import { routes } from './app.routes';

describe('showcase documentation routes', () => {
  it('exposes version-aware getting started, category landings, changelog and deep-linkable tabs', () => {
    const versionRoute = routes.find(route => route.path === 'v/:version');
    const docsRoute = versionRoute?.children?.find(route => route.path === ':category/:slug');

    expect(versionRoute?.canActivate?.length).toBeGreaterThan(0);
    expect(versionRoute?.children?.some(route => route.path === 'changelog')).toBeTrue();
    expect(versionRoute?.children?.find(route => route.path === 'getting-started')?.loadComponent).toBeDefined();
    expect(versionRoute?.children?.find(route => route.path === ':category')?.loadComponent).toBeDefined();
    expect(docsRoute?.children?.find(route => route.path === '')?.redirectTo).toBe('overview');
    expect(docsRoute?.children?.some(route => route.path === ':tab' && !!route.loadComponent)).toBeTrue();
    expect(typeof docsRoute?.children?.find(route => route.path === ':tab')?.title).toBe('function');
  });

  it('preserves legacy category/slug URLs through a redirect guard', () => {
    const legacy = routes.find(route => route.path === ':category/:slug');
    expect(legacy?.canActivate?.length).toBeGreaterThan(0);
  });

  it('renders a documentation not-found page instead of silently redirecting home', () => {
    const wildcard = routes.find(route => route.path === '**');
    expect(wildcard?.redirectTo).toBeUndefined();
    expect(wildcard?.loadComponent).toBeDefined();
  });
});
