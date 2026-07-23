import { SdLayoutChildrenMenu, SdLayoutMenu, SdLayoutRootMenu } from './menu.model';
import { getMenuStableKey, resolveMenuKeys, searchMenuLeaves, selectPrimaryMenuGroups } from './menu.utils';

const dashboard: SdLayoutRootMenu = { id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true };
const reports: SdLayoutRootMenu = { title: 'Báo cáo bán hàng', tooltipTitle: 'Doanh số', path: '/reports', permission: true };
const admin: SdLayoutChildrenMenu = { id: 'admin', title: 'Quản trị', children: [reports] };
const menus: SdLayoutMenu[] = [
  dashboard,
  admin,
  { id: 'help', title: 'Trợ giúp', children: [dashboard] },
  { id: 'more', title: 'Khác', children: [reports] },
];

describe('layout menu utilities', () => {
  it('prefers explicit ids and paths for stable menu keys', () => {
    expect(getMenuStableKey(dashboard)).toBe('id:dashboard');
    expect(getMenuStableKey(reports)).toBe('path:/reports');
    expect(getMenuStableKey({ title: 'Group', children: [] }, ['root'])).toBe('group:root/group');
  });

  it('searches permitted leaf menus without case or accent sensitivity', () => {
    expect(searchMenuLeaves(menus, 'bao cao').map(menu => menu.path)).toEqual(['/reports', '/reports']);
    expect(searchMenuLeaves(menus, 'DOANH SO').map(menu => menu.path)).toEqual(['/reports', '/reports']);
  });

  it('deduplicates requested primary ids and fills missing slots in menu order', () => {
    expect(selectPrimaryMenuGroups(menus, ['admin', 'missing', 'admin']).map(menu => menu.id)).toEqual(['admin', 'dashboard', 'help']);
  });

  it('resolves only keys that still exist in the permitted menu tree', () => {
    expect(resolveMenuKeys(menus, ['path:/reports', 'id:missing', 'id:dashboard']).map(menu => menu.title)).toEqual([
      'Báo cáo bán hàng',
      'Tổng quan',
    ]);
  });
});
