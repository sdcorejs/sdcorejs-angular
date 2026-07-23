import { TestBed } from '@angular/core/testing';
import { SdLayoutMenu, SdLayoutRootMenu } from '../menu/menu.model';
import { SdLayoutNavigationStateService } from './navigation-state.service';

const dashboard: SdLayoutRootMenu = { id: 'dashboard', title: 'Dashboard', path: '/dashboard', permission: true };
const reports: SdLayoutRootMenu = { id: 'reports', title: 'Reports', path: '/reports', permission: true };
const settings: SdLayoutRootMenu = { id: 'settings', title: 'Settings', path: '/settings', permission: true };
const menus: SdLayoutMenu[] = [{ id: 'root', title: 'Root', children: [dashboard, reports, settings] }];

describe('SdLayoutNavigationStateService', () => {
  let service: SdLayoutNavigationStateService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdLayoutNavigationStateService);
    service.hydrate(menus);
  });

  it('shares deduplicated pinned keys across sidebar versions', () => {
    service.togglePinned(dashboard);
    service.togglePinned(dashboard);
    service.togglePinned(dashboard);

    expect(service.pinnedKeys()).toEqual(['id:dashboard']);
    expect(service.pinnedMenus().map(menu => menu.title)).toEqual(['Dashboard']);
  });

  it('orders and limits recent routes while respecting disabled mode', () => {
    service.recordRecent(dashboard, { enabled: true, maxItems: 2 });
    service.recordRecent(reports, { enabled: true, maxItems: 2 });
    service.recordRecent(dashboard, { enabled: true, maxItems: 2 });
    service.recordRecent(settings, { enabled: false, maxItems: 2 });

    expect(service.recentKeys()).toEqual(['id:dashboard', 'id:reports']);
  });

  it('namespaces durable UI state by sidebar version', () => {
    service.patchVersionState(2, { activeGroupKey: 'id:work', locked: true });
    service.patchVersionState(3, { collapsed: true });

    expect(service.versionState(2)).toEqual({ activeGroupKey: 'id:work', locked: true });
    expect(service.versionState(3)).toEqual({ collapsed: true });
    expect(service.versionState(1)).toEqual({});
  });
});
