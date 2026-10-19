import { SdLayoutChildrenMenu, SdLayoutMenu, SdLayoutMenuStatus, SdLayoutRootMenu } from './menu.model';
import {
  getMenuStableKey,
  groupMenusBySection,
  resolveMenuKeys,
  resolveMenuTrailing,
  searchAvailableMenuLeaves,
  searchMenuLeaves,
  selectPrimaryMenuGroups,
} from './menu.utils';

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

describe('layout menu utilities for sidebar V4', () => {
  const approvals: SdLayoutRootMenu = { id: 'approvals', title: 'Duyệt đơn nghỉ', path: '/approvals', permission: true };
  const orders: SdLayoutRootMenu = { title: 'Đơn hàng', tooltipTitle: 'Bán lẻ', path: '/orders', permission: true };
  const forecast: SdLayoutRootMenu = { title: 'Dự báo duyệt', path: '/forecast', permission: true, comingSoon: true };
  const audit: SdLayoutRootMenu = { title: 'Nhật ký duyệt', path: '/audit', permission: true };
  const labPage: SdLayoutRootMenu = { title: 'Phòng duyệt thử', path: '/lab', permission: true };
  const lab: SdLayoutChildrenMenu = { id: 'lab', title: 'Thử nghiệm', comingSoon: true, children: [audit, labPage] };
  const operations: SdLayoutChildrenMenu = { id: 'operations', title: 'Vận hành', children: [forecast, orders] };
  const v4Menus: SdLayoutMenu[] = [approvals, operations, lab, audit];

  it('keeps searchMenuLeaves returning comingSoon leaves and comingSoon group descendants', () => {
    expect(searchMenuLeaves(v4Menus, 'duyet').map(menu => menu.path)).toEqual(['/approvals', '/forecast', '/audit', '/lab', '/audit']);
    expect(searchMenuLeaves(v4Menus, '').map(menu => menu.path)).toEqual([
      '/approvals',
      '/forecast',
      '/orders',
      '/audit',
      '/lab',
      '/audit',
    ]);
  });

  it('searchAvailableMenuLeaves excludes comingSoon leaves and descendants of a comingSoon group', () => {
    expect(searchAvailableMenuLeaves(v4Menus, '')).toEqual([approvals, orders, audit]);
    expect(searchAvailableMenuLeaves(v4Menus, '   ')).toEqual([approvals, orders, audit]);
    expect(searchAvailableMenuLeaves(v4Menus, 'duyet')).toEqual([approvals, audit]);
    expect(searchAvailableMenuLeaves(v4Menus, 'phong')).toEqual([]);
    expect(searchAvailableMenuLeaves(v4Menus, 'du bao')).toEqual([]);
  });

  it('searchAvailableMenuLeaves matches titles and tooltips without case or accent sensitivity', () => {
    expect(searchAvailableMenuLeaves(v4Menus, 'DUYET DON')).toEqual([approvals]);
    expect(searchAvailableMenuLeaves(v4Menus, '  Duyệt đơn  ')).toEqual([approvals]);
    expect(searchAvailableMenuLeaves(v4Menus, 'don hang')).toEqual([orders]);
    expect(searchAvailableMenuLeaves(v4Menus, 'ban le')).toEqual([orders]);
  });

  it('groups top-level menus by section in order of first appearance', () => {
    const home: SdLayoutRootMenu = { title: 'Trang chủ', path: '/home', permission: true };
    const inbox: SdLayoutRootMenu = { title: 'Hộp thư', path: '/inbox', permission: true, section: 'Công việc' };
    const users: SdLayoutRootMenu = { title: 'Người dùng', path: '/users', permission: true, section: 'Quản trị' };
    const nested: SdLayoutRootMenu = { title: 'Lồng', path: '/nested', permission: true, section: 'Bị bỏ qua' };
    const tasks: SdLayoutChildrenMenu = { title: 'Nhiệm vụ', section: ' Công việc ', children: [nested] };
    const help: SdLayoutRootMenu = { title: 'Trợ giúp', path: '/help', permission: true };
    const about: SdLayoutRootMenu = { title: 'Giới thiệu', path: '/about', permission: true, section: '  ' };
    const settings: SdLayoutRootMenu = { title: 'Cài đặt', path: '/settings', permission: true, section: 'Công việc' };

    expect(groupMenusBySection([home, inbox, users, tasks, help, about, settings])).toEqual([
      { section: null, menus: [home] },
      { section: 'Công việc', menus: [inbox, tasks, settings] },
      { section: 'Quản trị', menus: [users] },
      { section: null, menus: [help, about] },
    ]);
  });

  it('joins an unsectioned menu to the immediately preceding output group only when that group is unsectioned', () => {
    const first: SdLayoutRootMenu = { title: 'Một', path: '/one', permission: true };
    const second: SdLayoutRootMenu = { title: 'Hai', path: '/two', permission: true };
    const sectioned: SdLayoutRootMenu = { title: 'Ba', path: '/three', permission: true, section: 'Khác' };
    const later: SdLayoutRootMenu = { title: 'Bốn', path: '/four', permission: true, section: 'Khác' };

    expect(groupMenusBySection([first, second])).toEqual([{ section: null, menus: [first, second] }]);
    expect(groupMenusBySection([first, sectioned, second])).toEqual([
      { section: null, menus: [first] },
      { section: 'Khác', menus: [sectioned] },
      { section: null, menus: [second] },
    ]);
    expect(groupMenusBySection([sectioned, first, later, second])).toEqual([
      { section: 'Khác', menus: [sectioned, later] },
      { section: null, menus: [first, second] },
    ]);
    expect(groupMenusBySection([])).toEqual([]);
  });

  describe('trailing slot', () => {
    const leaf: SdLayoutRootMenu = { title: 'Phê duyệt', path: '/approve', permission: true };
    const running: SdLayoutMenuStatus = { label: '1 running', tone: 'success', live: true };

    it('renders only one trailing element in the order comingSoon, badge, status', () => {
      expect(resolveMenuTrailing({ ...leaf, comingSoon: true, badge: { value: 3, tone: 'warning' }, status: running })).toEqual({
        kind: 'soon',
      });
      expect(resolveMenuTrailing({ ...leaf, badge: { value: 3, tone: 'error' }, status: running })).toEqual({
        kind: 'badge',
        value: 3,
        tone: 'error',
      });
      expect(resolveMenuTrailing({ ...leaf, status: running })).toEqual({
        kind: 'status',
        label: '1 running',
        tone: 'success',
        live: true,
      });
      expect(resolveMenuTrailing({ ...leaf, status: { label: 'Connected', tone: 'success' } })).toEqual({
        kind: 'status',
        label: 'Connected',
        tone: 'success',
        live: false,
      });
      expect(resolveMenuTrailing({ title: 'Nhóm', comingSoon: true, children: [] })).toEqual({ kind: 'soon' });
      expect(resolveMenuTrailing({ ...leaf, comingSoon: false, badge: { value: 2 } })).toEqual({ kind: 'count', value: 2 });
      expect(resolveMenuTrailing(leaf)).toBeNull();
      expect(resolveMenuTrailing(null)).toBeNull();
    });

    it('maps neutral badges to count text and warning or error badges to pills', () => {
      expect(resolveMenuTrailing({ ...leaf, badge: { value: 19 } })).toEqual({ kind: 'count', value: 19 });
      expect(resolveMenuTrailing({ ...leaf, badge: { value: '99+', tone: 'neutral' } })).toEqual({ kind: 'count', value: '99+' });
      expect(resolveMenuTrailing({ ...leaf, badge: { value: 0 } })).toEqual({ kind: 'count', value: 0 });
      expect(resolveMenuTrailing({ ...leaf, badge: { value: 3, tone: 'warning' } })).toEqual({ kind: 'badge', value: 3, tone: 'warning' });
      expect(resolveMenuTrailing({ ...leaf, badge: { value: '7', tone: 'error' } })).toEqual({ kind: 'badge', value: '7', tone: 'error' });
    });

    it('ignores empty badge values and empty status labels', () => {
      expect(resolveMenuTrailing({ ...leaf, badge: { value: '' }, status: running })).toEqual({
        kind: 'status',
        label: '1 running',
        tone: 'success',
        live: true,
      });
      expect(resolveMenuTrailing({ ...leaf, badge: { value: '   ', tone: 'error' } })).toBeNull();
      expect(resolveMenuTrailing({ ...leaf, badge: { value: null as unknown as number, tone: 'warning' } })).toBeNull();
      expect(resolveMenuTrailing({ ...leaf, status: { label: '', tone: 'error' } })).toBeNull();
      expect(resolveMenuTrailing({ ...leaf, status: { label: '  ', tone: 'warning', live: true } })).toBeNull();
    });
  });
});
