import { TestBed } from '@angular/core/testing';
import { SdLayoutChildrenMenu, SdLayoutMenu, SdLayoutRootMenu } from '../menu/menu.model';
import { SdLayoutStorageService } from './storage.service';

const dashboard: SdLayoutRootMenu = { id: 'dashboard', title: 'Dashboard', path: '/dashboard', permission: true };
const reports: SdLayoutRootMenu = { title: 'Reports', path: '/reports', permission: true };
const menus: SdLayoutMenu[] = [{ id: 'work', title: 'Work', children: [dashboard, reports] }];

describe('SdLayoutStorageService navigation persistence', () => {
  let service: SdLayoutStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdLayoutStorageService);
  });

  it('lazily migrates legacy pinned menu objects to stable keys', () => {
    service.pinnedMenuGroup.set({ id: 'pinned-menu-group', children: [dashboard, reports] });

    expect(service.readPinnedMenuKeys(menus)).toEqual(['id:dashboard', 'path:/reports']);
    expect(service.pinnedMenuKeys.get()).toEqual(['id:dashboard', 'path:/reports']);
  });

  it('drops stale legacy pinned entries during migration', () => {
    const stale: SdLayoutRootMenu = { id: 'removed', title: 'Removed', path: '/removed', permission: true };
    service.pinnedMenuGroup.set({ children: [dashboard, stale] } as SdLayoutChildrenMenu);

    expect(service.readPinnedMenuKeys(menus)).toEqual(['id:dashboard']);
  });

  it('reads malformed legacy data without throwing', () => {
    service.pinnedMenuGroup.set({ children: [null, { title: 'Unknown' }] } as unknown as SdLayoutChildrenMenu);

    expect(() => service.readPinnedMenuKeys(menus)).not.toThrow();
    expect(service.readPinnedMenuKeys(menus)).toEqual([]);
  });
});
