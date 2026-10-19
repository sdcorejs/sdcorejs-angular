import { createEnvironmentInjector, EnvironmentInjector, Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  SD_PERSISTENCE_STORAGE_ADAPTER,
  SdPersistenceStorageAdapter,
  SdPersistenceStorageArea,
  SdStorageService,
} from '@sdcorejs/angular/services';
import { SdLayoutContext } from '../../configurations';
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

/** Adapter trong bộ nhớ — tách spec khỏi localStorage thật và mô phỏng được lần ghi bị từ chối. */
class MemoryStorageAdapter implements SdPersistenceStorageAdapter {
  readonly local = new Map<string, string>();
  readonly session = new Map<string, string>();
  rejectWrites = false;

  getItem(area: SdPersistenceStorageArea, key: string): string | null {
    return this.#area(area).get(key) ?? null;
  }

  setItem(area: SdPersistenceStorageArea, key: string, value: string): boolean {
    if (this.rejectWrites) return false;
    this.#area(area).set(key, value);
    return true;
  }

  removeItem(area: SdPersistenceStorageArea, key: string): boolean {
    this.#area(area).delete(key);
    return true;
  }

  #area(area: SdPersistenceStorageArea): Map<string, string> {
    return area === 'local' ? this.local : this.session;
  }
}

describe('SdLayoutStorageService current context snapshot', () => {
  const hanoi: SdLayoutContext = { id: 'store-hn', title: 'Hà Nội', subtitle: 'Cửa hàng', avatar: 'https://cdn.example.com/hn.png' };
  const saigon: SdLayoutContext = { id: 'store-sg', title: 'Sài Gòn' };
  let adapter: MemoryStorageAdapter;

  afterEach(() => TestBed.resetTestingModule());

  function createFor(namespace?: SdLayoutStorageNamespace): SdLayoutStorageService {
    adapter = new MemoryStorageAdapter();
    const providers: Provider[] = [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }];
    if (namespace !== undefined) providers.push({ provide: SD_LAYOUT_STORAGE_NAMESPACE, useValue: namespace });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers });
    return TestBed.inject(SdLayoutStorageService);
  }

  // why: một SdStorageService riêng trên cùng adapter mô phỏng tab khác — nó giữ entry trong bộ nhớ riêng,
  // nên ghi ở đó không chạm entry dùng chung của service đang test.
  function createOtherTab(): { service: SdLayoutStorageService; destroy: () => void } {
    const injector = createEnvironmentInjector([SdStorageService, SdLayoutStorageService], TestBed.inject(EnvironmentInjector));
    return { service: injector.get(SdLayoutStorageService), destroy: () => injector.destroy() };
  }

  it('persists only id, title, subtitle and avatar and reads back an isolated copy', () => {
    const service = createFor();
    service.writeCurrentContext({ ...hanoi, role: 'owner', permissions: ['sale'] } as SdLayoutContext);

    expect(service.currentContext.get()).toEqual(hanoi);
    const read = service.readCurrentContext();
    expect(read).toEqual(hanoi);
    if (read) read.title = 'Mutated';
    expect(service.readCurrentContext()).toEqual(hanoi);
  });

  it('omits optional fields that are undefined', () => {
    const service = createFor();
    service.writeCurrentContext({ ...saigon, subtitle: undefined, avatar: undefined });

    expect(Object.keys(service.currentContext.get() ?? {})).toEqual(['id', 'title']);
    expect(service.readCurrentContext()).toEqual(saigon);
  });

  it('adds the currentContext entry as the only new persisted record', () => {
    const service = createFor();
    service.writeCurrentContext(hanoi);

    expect(adapter.local.size).toBe(1);
    expect(adapter.session.size).toBe(0);
    expect(service.pinnedMenuKeys.has()).toBeFalse();
    expect(service.versionStates.has()).toBeFalse();
  });

  it('reads malformed snapshots as null', () => {
    const service = createFor();
    const malformed: unknown[] = [
      null,
      'store-hn',
      42,
      [],
      {},
      { id: 'store-hn' },
      { title: 'Hà Nội' },
      { id: '   ', title: 'Hà Nội' },
      { id: 'store-hn', title: '' },
      { id: 7, title: 'Hà Nội' },
    ];

    for (const value of malformed) {
      service.currentContext.set(value as SdLayoutContext);
      expect(service.readCurrentContext()).withContext(JSON.stringify(value)).toBeNull();
      expect(service.refreshCurrentContext()).withContext(JSON.stringify(value)).toBeNull();
    }
  });

  it('drops non-string optional fields and unknown fields from a stored snapshot', () => {
    const service = createFor();
    service.currentContext.set({ id: 'store-hn', title: 'Hà Nội', subtitle: 3, avatar: null, extra: true } as unknown as SdLayoutContext);

    expect(service.readCurrentContext()).toEqual({ id: 'store-hn', title: 'Hà Nội' });
  });

  it('refreshes a snapshot written by another tab while the in-memory read stays stale', () => {
    const service = createFor();
    service.writeCurrentContext(hanoi);
    const other = createOtherTab();
    other.service.writeCurrentContext(saigon);

    expect(service.readCurrentContext()).toEqual(hanoi);
    expect(service.refreshCurrentContext()).toEqual(saigon);
    expect(service.readCurrentContext()).toEqual(saigon);
    other.destroy();
  });

  it('removes the snapshot on clear()', () => {
    const service = createFor();
    service.writeCurrentContext(hanoi);

    service.clear();

    expect(service.currentContext.get()).toBeUndefined();
    expect(service.readCurrentContext()).toBeNull();
    expect(service.refreshCurrentContext()).toBeNull();
    const other = createOtherTab();
    expect(other.service.readCurrentContext()).toBeNull();
    other.destroy();
  });

  it('isolates snapshots per namespace and reports the resolved namespace', () => {
    const userId = signal<string | undefined>('user-a');
    const service = createFor(() => userId());
    expect(service.resolvedNamespace()).toBe('user-a');
    service.writeCurrentContext(hanoi);

    userId.set('user-b');
    expect(service.resolvedNamespace()).toBe('user-b');
    expect(service.readCurrentContext()).toBeNull();
    expect(service.refreshCurrentContext()).toBeNull();
    service.writeCurrentContext(saigon);

    userId.set('user-a');
    expect(service.readCurrentContext()).toEqual(hanoi);

    userId.set('   ');
    expect(service.resolvedNamespace()).toBeUndefined();
    expect(service.readCurrentContext()).toBeNull();

    userId.set('user-b');
    expect(service.refreshCurrentContext()).toEqual(saigon);
  });

  it('resolves a constant namespace trimmed and a missing namespace as undefined', () => {
    expect(createFor(' tenant-1 ').resolvedNamespace()).toBe('tenant-1');
    expect(createFor().resolvedNamespace()).toBeUndefined();
  });

  it('refreshes to null when the snapshot could not be persisted', () => {
    const service = createFor();
    adapter.rejectWrites = true;
    service.writeCurrentContext(hanoi);
    adapter.rejectWrites = false;

    expect(service.readCurrentContext()).toEqual(hanoi);
    expect(service.refreshCurrentContext()).toBeNull();
  });
});
