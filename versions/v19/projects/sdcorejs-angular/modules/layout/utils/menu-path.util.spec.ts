import { SdLayoutMenu } from '../services/menu/menu.model';

import { collectMatchedMenuPaths, containsMenuPath, isMenuPathMatch, resolveActiveMenuPath } from './menu-path.util';

describe('menu path matching', () => {
  const menus: SdLayoutMenu[] = [
    {
      id: 'group-1',
      title: 'Nhóm 1',
      children: [
        { id: 'appointment', path: '/appointment', title: 'Lịch hẹn', permission: true },
        {
          id: 'appointment-group',
          title: 'Lịch hẹn CS',
          children: [{ id: 'appointment-cs', path: '/appointment/cs', title: 'CS', permission: true }],
        },
      ],
    },
  ];

  describe('isMenuPathMatch', () => {
    it('matches the exact route', () => {
      expect(isMenuPathMatch('/appointment', '/appointment')).toBeTrue();
    });

    it('matches a child route by segment', () => {
      expect(isMenuPathMatch('/appointment/cs', '/appointment')).toBeTrue();
    });

    it('does not match a path that only shares a text prefix', () => {
      expect(isMenuPathMatch('/appointments', '/appointment')).toBeFalse();
    });

    it('returns false for empty input', () => {
      expect(isMenuPathMatch('', '/appointment')).toBeFalse();
      expect(isMenuPathMatch('/appointment', '')).toBeFalse();
    });
  });

  describe('collectMatchedMenuPaths', () => {
    it('collects every matching path across the whole tree', () => {
      expect(collectMatchedMenuPaths(menus, '/appointment/cs')).toEqual(['/appointment', '/appointment/cs']);
    });

    it('returns an empty list when nothing matches', () => {
      expect(collectMatchedMenuPaths(menus, '/order')).toEqual([]);
      expect(collectMatchedMenuPaths(undefined, '/appointment')).toEqual([]);
    });
  });

  describe('resolveActiveMenuPath', () => {
    it('prefers the most exact path when several menus match', () => {
      expect(resolveActiveMenuPath(menus, '/appointment/cs')).toBe('/appointment/cs');
    });

    it('keeps the parent path active on the parent route', () => {
      expect(resolveActiveMenuPath(menus, '/appointment')).toBe('/appointment');
    });

    it('keeps the closest ancestor active for a route with no menu of its own', () => {
      expect(resolveActiveMenuPath(menus, '/appointment/cs/123')).toBe('/appointment/cs');
    });

    it('returns null when no menu matches', () => {
      expect(resolveActiveMenuPath(menus, '/order')).toBeNull();
      expect(resolveActiveMenuPath(menus, '')).toBeNull();
    });
  });

  describe('containsMenuPath', () => {
    it('is true for the menu owning the path', () => {
      expect(containsMenuPath(menus[0], '/appointment/cs')).toBeTrue();
    });

    it('finds a path nested deeper than the direct children', () => {
      expect(containsMenuPath({ id: 'root', title: 'Root', children: menus }, '/appointment/cs')).toBeTrue();
    });

    it('is false when the path is outside the branch', () => {
      expect(containsMenuPath(menus[0], '/order')).toBeFalse();
    });
  });
});
