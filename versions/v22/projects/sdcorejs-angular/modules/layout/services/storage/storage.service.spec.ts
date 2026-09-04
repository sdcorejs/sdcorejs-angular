import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SdStorageService } from '@sdcorejs/angular/services';
import { SdLayoutChildrenMenu, SdLayoutMenu, SdLayoutRootMenu } from '../menu/menu.model';
import { SD_LAYOUT_STORAGE_NAMESPACE, SdLayoutStorageNamespace, SdLayoutStorageService } from './storage.service';

/** UUID của `pinnedMenuKeys` — cố định trong `SdLayoutStorageService`, trích ra để spec ghi được ĐÚNG key cũ. */
const PINNED_MENU_KEYS_UUID = '4bdc7f80-9ff4-4fe0-908f-6c9f7fe4100a';

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

  it('clears every persisted layout entry so a signed-out user leaves nothing behind', () => {
    service.writePinnedMenuKeys(['id:dashboard']);
    service.writeRecentMenuKeys(['path:/reports']);
    service.lastActiveMenuGroupId.set('work');
    service.menuLockStatus.set(false);
    service.isShowSidebar.set(true);
    service.pinnedMenuGroup.set({ id: 'pinned-menu-group', children: [dashboard] });
    service.patchVersionState(3, { collapsed: true });

    service.clear();

    expect(service.pinnedMenuKeys.get()).toBeUndefined();
    expect(service.recentMenuKeys.get()).toBeUndefined();
    expect(service.lastActiveMenuGroupId.get()).toBeUndefined();
    expect(service.menuLockStatus.get()).toBeUndefined();
    expect(service.isShowSidebar.get()).toBeUndefined();
    expect(service.pinnedMenuGroup.get()).toBeUndefined();
    expect(service.readVersionState(3)).toEqual({});
    expect(service.readPinnedMenuKeys(menus)).toEqual([]);
  });
});

describe('SdLayoutStorageService user namespacing', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => TestBed.resetTestingModule());

  function createFor(namespace?: SdLayoutStorageNamespace): SdLayoutStorageService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: namespace === undefined ? [] : [{ provide: SD_LAYOUT_STORAGE_NAMESPACE, useValue: namespace }],
    });
    return TestBed.inject(SdLayoutStorageService);
  }

  /**
   * Ghi thẳng qua `SdStorageService` KHÔNG kèm option — đúng identity mà thư viện dùng trước khi có
   * `SD_LAYOUT_STORAGE_NAMESPACE`. Đây là điều kiện tiên quyết để spec "nâng cấp không mất state"
   * thật sự kiểm tra được gì đó, thay vì so hai handle đều đã ở phiên bản mới.
   */
  function writeUnderPreviousIdentity(keys: string[]): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [] });
    TestBed.inject(SdStorageService).create<string[]>(PINNED_MENU_KEYS_UUID).set(keys);
    TestBed.resetTestingModule();
  }

  it('keeps two namespaces from seeing each other pinned and recent modules', () => {
    // why: trước đây key là UUID cố định, nên trên máy dùng chung user B thấy nguyên pinned/recent của A.
    const userA = createFor('user-a');
    userA.writePinnedMenuKeys(['id:dashboard']);
    userA.writeRecentMenuKeys(['path:/reports']);
    userA.lastActiveMenuGroupId.set('work');

    const userB = createFor('user-b');

    expect(userB.pinnedMenuKeys.get()).toBeUndefined();
    expect(userB.recentMenuKeys.get()).toBeUndefined();
    expect(userB.lastActiveMenuGroupId.get()).toBeUndefined();

    expect(createFor('user-a').pinnedMenuKeys.get()).toEqual(['id:dashboard']);
  });

  it('still reads state written under the PREVIOUS identity when no namespace is configured', () => {
    // why: đây mới là bài kiểm tra thật cho "nâng cấp thư viện không mất pinned/recent" — giá trị được
    // ghi bằng `SdStorageService.create(uuid)` trần, đúng như bản chưa có namespace token.
    writeUnderPreviousIdentity(['id:dashboard']);

    expect(createFor().pinnedMenuKeys.get()).toEqual(['id:dashboard']);
  });

  it('treats a blank namespace exactly like the previous identity', () => {
    writeUnderPreviousIdentity(['id:dashboard']);

    expect(createFor('   ').pinnedMenuKeys.get()).toEqual(['id:dashboard']);
  });

  it('leaves the previous identity untouched once a real namespace is configured', () => {
    writeUnderPreviousIdentity(['id:dashboard']);

    expect(createFor('user-a').pinnedMenuKeys.get()).toBeUndefined();
    expect(createFor().pinnedMenuKeys.get()).toEqual(['id:dashboard']);
  });

  it('rebuilds every handle when the namespace resolver reports a new identity', () => {
    // why: service là singleton `providedIn: 'root'` và thường được dựng TRƯỚC khi đăng nhập xong.
    // Đọc namespace một lần trong field initializer sẽ khoá cả phiên vào `undefined`, tức biện pháp
    // "pinned/recent của A không lộ sang B" không bao giờ chạy. Namespace phải resolve lười.
    const userId = signal<string | undefined>(undefined);
    const service = createFor(() => userId());

    // Chưa đăng nhập: rơi về partition không-namespace.
    service.writePinnedMenuKeys(['id:anonymous']);

    userId.set('user-a');
    expect(service.pinnedMenuKeys.get()).toBeUndefined();
    service.writePinnedMenuKeys(['id:dashboard']);
    service.lastActiveMenuGroupId.set('work');

    userId.set('user-b');
    expect(service.pinnedMenuKeys.get()).toBeUndefined();
    expect(service.lastActiveMenuGroupId.get()).toBeUndefined();

    userId.set('user-a');
    expect(service.pinnedMenuKeys.get()).toEqual(['id:dashboard']);
    expect(service.lastActiveMenuGroupId.get()).toBe('work');

    userId.set(undefined);
    expect(service.pinnedMenuKeys.get()).toEqual(['id:anonymous']);
  });

  it('clears only the partition of the identity that is signing out', () => {
    const userId = signal<string | undefined>('user-a');
    const service = createFor(() => userId());
    service.writePinnedMenuKeys(['id:dashboard']);

    userId.set('user-b');
    service.writePinnedMenuKeys(['id:reports']);
    service.clear();

    expect(service.pinnedMenuKeys.get()).toBeUndefined();
    userId.set('user-a');
    expect(service.pinnedMenuKeys.get()).toEqual(['id:dashboard']);
  });
});
