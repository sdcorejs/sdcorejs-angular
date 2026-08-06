import { buildPrimaryNavigation, resolvePrimaryNavigationId } from './primary-navigation.config';

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
});
