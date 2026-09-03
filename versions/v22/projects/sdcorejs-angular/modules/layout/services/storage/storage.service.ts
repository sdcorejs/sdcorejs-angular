import { InjectionToken, Injectable, inject } from '@angular/core';
import { SdStorage, SdStorageOption, SdStorageService } from '@sdcorejs/angular/services';
import { SdLayoutChildrenMenu, SdLayoutMenu } from '../menu/menu.model';
import { getMenuStableKey, resolveMenuKeys } from '../menu/menu.utils';

/**
 * Namespace áp cho toàn bộ state layout được persist — hằng chuỗi, hoặc hàm resolve lại mỗi lần đọc
 * (dùng cho danh tính chỉ biết được SAU khi đăng nhập, ví dụ id user hoặc tenant).
 */
export type SdLayoutStorageNamespace = string | (() => string | null | undefined);

/**
 * Namespace do consumer cung cấp cho toàn bộ state layout được persist (thường là id user hoặc tenant).
 *
 * why: các key dưới đây là UUID CỐ ĐỊNH, không gắn với ai cả. Trên máy dùng chung, user A đăng xuất
 * rồi user B đăng nhập thì `pinnedMenuKeys` / `recentMenuKeys` / `lastActiveMenuGroupId` của A vẫn
 * còn nguyên trong localStorage và B nhìn thấy đúng những module A đã ghim và vừa truy cập. Cấp
 * namespace theo user/tenant sẽ tách hẳn không gian lưu trữ.
 *
 * ⚠️ `SdLayoutStorageService` là singleton `providedIn: 'root'`, thường được khởi tạo TRƯỚC khi biết
 * người dùng là ai. Vì vậy hãy cấp một **hàm** — nó được gọi lại ở mỗi lần truy cập handle, nên khi
 * danh tính đến (hoặc đổi) thì cả bảy handle tự dựng lại trên namespace mới:
 *
 * ```ts
 * providers: [
 *   {
 *     provide: SD_LAYOUT_STORAGE_NAMESPACE,
 *     useFactory: () => {
 *       const auth = inject(SdAuthService);
 *       return () => auth.getAuthInfo?.()?.id;
 *     },
 *   },
 * ];
 * ```
 *
 * Đây là biện pháp bổ sung chứ không thay thế `SdLayoutStorageService.clear()` lúc signout.
 */
export const SD_LAYOUT_STORAGE_NAMESPACE = new InjectionToken<SdLayoutStorageNamespace>('sd.layout.storage.namespace');

interface SdLayoutStorageHandles {
  namespace: string | undefined;
  isShowSidebar: SdStorage<boolean>;
  menuLockStatus: SdStorage<boolean>;
  lastActiveMenuGroupId: SdStorage<string>;
  pinnedMenuGroup: SdStorage<SdLayoutChildrenMenu>;
  pinnedMenuKeys: SdStorage<string[]>;
  recentMenuKeys: SdStorage<string[]>;
  versionStates: SdStorage<Record<string, SdLayoutVersionState>>;
}

@Injectable({
  providedIn: 'root',
})
export class SdLayoutStorageService {
  readonly #sdStorageService = inject(SdStorageService);
  readonly #namespaceSource = inject(SD_LAYOUT_STORAGE_NAMESPACE, { optional: true });
  #handles?: SdLayoutStorageHandles;

  // why: đọc namespace bằng field initializer là vô nghĩa — service là singleton `providedIn: 'root'`
  // nên nó chạy ở lần inject đầu tiên, thường TRƯỚC khi đăng nhập xong, và factory theo user trả về
  // `undefined` cho cả phiên; biện pháp "pinned/recent của A không lộ sang B" quảng cáo trong doc khi
  // đó không bao giờ có hiệu lực. Giải quyết bằng cách resolve LƯỜI ở mỗi lần truy cập handle: khi
  // danh tính đến (hoặc đổi user trong cùng phiên SPA) thì bảy handle được dựng lại trên namespace mới.
  get isShowSidebar(): SdStorage<boolean> {
    return this.#resolveHandles().isShowSidebar;
  }

  get menuLockStatus(): SdStorage<boolean> {
    return this.#resolveHandles().menuLockStatus;
  }

  get lastActiveMenuGroupId(): SdStorage<string> {
    return this.#resolveHandles().lastActiveMenuGroupId;
  }

  get pinnedMenuGroup(): SdStorage<SdLayoutChildrenMenu> {
    return this.#resolveHandles().pinnedMenuGroup;
  }

  get pinnedMenuKeys(): SdStorage<string[]> {
    return this.#resolveHandles().pinnedMenuKeys;
  }

  get recentMenuKeys(): SdStorage<string[]> {
    return this.#resolveHandles().recentMenuKeys;
  }

  get versionStates(): SdStorage<Record<string, SdLayoutVersionState>> {
    return this.#resolveHandles().versionStates;
  }

  /**
   * Xoá toàn bộ state layout đã persist.
   *
   * **Consumer PHẢI gọi hàm này trong luồng signout, TRƯỚC khi danh tính bị xoá.** Nếu không,
   * pinned/recent/last-active của user vừa đăng xuất sẽ còn lại trên trình duyệt và hiện ra cho người
   * đăng nhập kế tiếp — rò rỉ tên module nội bộ mà người đó có thể không có quyền thấy.
   *
   * why: khi đã cấu hình `SD_LAYOUT_STORAGE_NAMESPACE` theo user, namespace được resolve NGAY LÚC GỌI.
   * Gọi `clear()` sau khi auth info về `undefined` sẽ xoá nhầm partition không-namespace, còn dữ liệu
   * của user vừa thoát thì vẫn nguyên.
   */
  clear(): void {
    const handles = this.#resolveHandles();
    for (const handle of this.#allHandles(handles)) handle.remove();
  }

  // why: namespace rỗng/space phải quy về undefined, nếu không mỗi chuỗi rác lại tạo ra một không
  // gian lưu trữ khác và state của chính user đó biến mất sau khi reload.
  #resolveNamespace(): string | undefined {
    const source = this.#namespaceSource;
    const raw = typeof source === 'function' ? source() : source;
    return typeof raw === 'string' ? raw.trim() || undefined : undefined;
  }

  #resolveHandles(): SdLayoutStorageHandles {
    const namespace = this.#resolveNamespace();
    const current = this.#handles;
    if (current && current.namespace === namespace) return current;
    // why: handle cũ phải `destroy()` (KHÔNG phải `remove()`) — chỉ gỡ facade và complete subject,
    // dữ liệu của namespace trước vẫn nằm nguyên để user đó quay lại còn đọc được.
    if (current) for (const handle of this.#allHandles(current)) handle.destroy();
    const next = this.#createHandles(namespace);
    this.#handles = next;
    return next;
  }

  #createHandles(namespace: string | undefined): SdLayoutStorageHandles {
    // why: `{ namespace: undefined }` cho ra đúng identity như khi không truyền option (`SdStorageService`
    // không áp namespace mặc định nào), nên app không cấu hình namespace vẫn đọc được state đã persist
    // từ trước — không mất pinned/recent khi nâng cấp thư viện.
    const option: SdStorageOption = { namespace };
    return {
      namespace,
      isShowSidebar: this.#sdStorageService.create('cb07c316-ed6d-4620-9e92-53dbef6aa983', option),
      menuLockStatus: this.#sdStorageService.create('2c2f4816-18b3-4ec3-8177-7b90bff036c3', option),
      lastActiveMenuGroupId: this.#sdStorageService.create('2e6961d0-3380-4a94-a6a1-38837560cd96', option),
      pinnedMenuGroup: this.#sdStorageService.create('e81da122-5dab-4250-b309-64197fb19d44', option),
      pinnedMenuKeys: this.#sdStorageService.create('4bdc7f80-9ff4-4fe0-908f-6c9f7fe4100a', option),
      recentMenuKeys: this.#sdStorageService.create('fb989dc1-f6e7-4b62-a611-861a8f214a51', option),
      versionStates: this.#sdStorageService.create('ca8e4261-fbd4-4209-af88-2dbe278c1a1b', option),
    };
  }

  #allHandles(handles: SdLayoutStorageHandles): readonly Pick<SdStorage, 'remove' | 'destroy'>[] {
    return [
      handles.isShowSidebar,
      handles.menuLockStatus,
      handles.lastActiveMenuGroupId,
      handles.pinnedMenuGroup,
      handles.pinnedMenuKeys,
      handles.recentMenuKeys,
      handles.versionStates,
    ];
  }

  readPinnedMenuKeys(menus: SdLayoutMenu[]): string[] {
    const storedKeys = this.pinnedMenuKeys.has() ? this.pinnedMenuKeys.get() : this.#getLegacyPinnedKeys();
    const validKeys = this.#resolveValidKeys(menus, storedKeys ?? []);
    if (!this.pinnedMenuKeys.has() || !this.#sameKeys(storedKeys ?? [], validKeys)) {
      this.pinnedMenuKeys.set(validKeys);
    }
    return validKeys;
  }

  writePinnedMenuKeys(keys: string[]): void {
    this.pinnedMenuKeys.set([...new Set(keys.filter(Boolean))]);
  }

  readRecentMenuKeys(menus: SdLayoutMenu[], maximum = 5): string[] {
    const storedKeys = this.recentMenuKeys.get() ?? [];
    const limit = Number.isFinite(maximum) && maximum > 0 ? Math.floor(maximum) : 5;
    const validKeys = this.#resolveValidKeys(menus, storedKeys).slice(0, limit);
    if (!this.#sameKeys(storedKeys, validKeys)) this.recentMenuKeys.set(validKeys);
    return validKeys;
  }

  writeRecentMenuKeys(keys: string[]): void {
    this.recentMenuKeys.set([...new Set(keys.filter(Boolean))]);
  }

  readVersionState(version: 1 | 2 | 3): SdLayoutVersionState {
    return this.versionStates.get()?.[String(version)] ?? {};
  }

  patchVersionState(version: 1 | 2 | 3, patch: SdLayoutVersionState): SdLayoutVersionState {
    const states = this.versionStates.get() ?? {};
    const nextState = { ...(states[String(version)] ?? {}), ...patch };
    this.versionStates.set({ ...states, [String(version)]: nextState });
    return nextState;
  }

  #getLegacyPinnedKeys(): string[] {
    const legacyGroup = this.pinnedMenuGroup.get();
    if (!legacyGroup || !Array.isArray(legacyGroup.children)) return [];
    return legacyGroup.children.map(menu => getMenuStableKey(menu)).filter(Boolean);
  }

  #resolveValidKeys(menus: SdLayoutMenu[], keys: string[]): string[] {
    return resolveMenuKeys(menus, keys)
      .map(menu => getMenuStableKey(menu))
      .filter(Boolean);
  }

  #sameKeys(left: string[], right: string[]): boolean {
    return left.length === right.length && left.every((key, index) => key === right[index]);
  }
}

export interface SdLayoutVersionState {
  activeGroupKey?: string;
  locked?: boolean;
  collapsed?: boolean;
}
