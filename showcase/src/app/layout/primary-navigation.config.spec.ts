import { buildPrimaryNavigation, isTabSwitch, resolvePrimaryNavigationId, routeCategory, routeHasSidebar } from './primary-navigation.config';

describe('primary documentation navigation', () => {
  it('builds the same version-aware destinations for the header and drawer', () => {
    expect(buildPrimaryNavigation('20.1.2')).toEqual([
      { id: 'docs', label: 'Docs', commands: ['/v', '20.1.2'] },
      { id: 'changelog', label: 'Changelog', commands: ['/v', '20.1.2', 'changelog'] },
      { id: 'about', label: 'About', commands: ['/about'] },
    ]);
  });

  it('keeps Docs active across versioned home and detail pages without masking Changelog', () => {
    expect(resolvePrimaryNavigationId('/')).toBe('docs');
    expect(resolvePrimaryNavigationId('/v/21.1.2')).toBe('docs');
    expect(resolvePrimaryNavigationId('/v/21.1.2/components/button/examples')).toBe('docs');
    expect(resolvePrimaryNavigationId('/v/21.1.2/changelog')).toBe('changelog');
    expect(resolvePrimaryNavigationId('/about')).toBe('about');
    expect(resolvePrimaryNavigationId('/not-found')).toBeNull();
  });

  it('knows which routes carry the catalog sidebar and their category', () => {
    expect(routeHasSidebar('/v/22.3.1/components/button/api')).toBeTrue();
    expect(routeHasSidebar('/v/22.3.1/getting-started')).toBeTrue();
    expect(routeCategory('/v/22.3.1/getting-started')).toBe('guides');
    expect(routeHasSidebar('/v/22.3.1')).toBeFalse();
    expect(routeHasSidebar('/v/22.3.1/changelog')).toBeFalse();
    expect(routeHasSidebar('/about')).toBeFalse();
  });

  it('detects a tab switch on the same page only', () => {
    expect(isTabSwitch('/v/22.3.1/components/button/overview', '/v/22.3.1/components/button/api')).toBeTrue();
    expect(isTabSwitch('/v/22.3.1/components/button/api', '/v/22.3.1/components/badge/api')).toBeFalse();
    expect(isTabSwitch('/v/22.3.1/components/button/api', '/v/21.3.1/components/button/overview')).toBeFalse();
    expect(isTabSwitch('/v/22.3.1/components/button/api#inputs', '/v/22.3.1/components/button/api')).toBeFalse();
  });
});
