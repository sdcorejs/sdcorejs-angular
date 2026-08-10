import { inject, Injectable, isDevMode } from '@angular/core';
import { SdCache, SdCacheService } from '@sdcorejs/angular/services/cache';
import { ArrayUtilities } from '@sdcorejs/angular/utilities/extensions';
import { ISdPermissionConfiguration, SD_PERMISSION_CONFIGURATION } from '../configurations';
import { MaybeAsync, resolveMaybeAsync } from '@sdcorejs/utils/models';

/**
 * Opt-out TƯỜNG MINH: "chỗ này cố ý không yêu cầu quyền nào".
 *
 * Dùng cho `route.data.permission`, `[sdPermission]` hoặc `hasPermission(...)` khi một route/phần tử
 * thật sự công khai. Mọi giá trị rỗng khác (`undefined`, `null`, `''`, `[]`) đều bị coi là CẤU HÌNH
 * THIẾU và bị từ chối — xem `SdPermissionService.hasPermission`.
 */
export const SD_PERMISSION_PUBLIC = '__SD_PERMISSION_PUBLIC__';

/** Kiểu đầu vào cho `hasPermission` / `[sdPermission]`. */
export type SdPermissionInput = string | string[] | null | undefined;

/**
 * why: khoá cache cũ là một UUID cố định (`212a51fa-…`) dùng chung cho MỌI key, nên một entry
 * sessionStorage duy nhất chứa quyền của tất cả profile. Đổi sang prefix có namespace + tách theo key
 * để `invalidate(key)` xoá đúng phần của nó và không đụng key khác.
 */
const PERSISTED_CACHE_PREFIX = 'sd-permission.codes.';

@Injectable({ providedIn: 'root' })
export class SdPermissionService {
  #permissionMapByKey: Record<string, Record<string, boolean>> = {};
  // why: danh sách quyền đã resolve giờ CHỈ sống trong bộ nhớ. Trước đây nó luôn được mirror xuống
  // sessionStorage, tức mọi script trên cùng origin đọc/ghi được — chỉ cần chạy được một dòng JS là
  // tự cấp cho mình quyền trên UI. Tệ hơn: `#loadedKeys` vốn nằm trong bộ nhớ nên sau reload service
  // vẫn gọi lại `loadPermissions()`, entry sessionStorage kia gần như không mang lại lợi ích gì mà
  // chỉ là bề mặt tấn công. Ai thật sự cần cache qua reload thì bật `persistCache` cho từng key.
  #permissionsByKey: Record<string, string[]> = {};
  readonly #configuration = inject<ISdPermissionConfiguration | ISdPermissionConfiguration[]>(SD_PERMISSION_CONFIGURATION);
  readonly #cacheService = inject(SdCacheService);
  readonly #persistedCaches = new Map<string, SdCache<string[]>>();
  readonly #loadedKeys = new Set<string>();

  constructor() {
    this.#validateDuplicateConfigKeys();
  }

  #getConfigurations = (): ISdPermissionConfiguration[] => {
    const config = this.#configuration;
    if (!config) {
      return [];
    }
    return Array.isArray(config) ? config : [config];
  };

  #normalizeKey = (key?: string): string => {
    return key === undefined ? '__undefined__' : key;
  };

  #validateDuplicateConfigKeys = (): void => {
    const seen = new Set<string>();
    for (const config of this.#getConfigurations()) {
      const normalizedKey = this.#normalizeKey(config.key);
      if (seen.has(normalizedKey)) {
        const keyLabel = config.key === undefined ? 'undefined' : config.key;
        throw new Error(`[Permission] Duplicate permission configuration key: ${keyLabel}`);
      }
      seen.add(normalizedKey);
    }
  };

  #getConfigurationByKey = (key?: string): ISdPermissionConfiguration | undefined => {
    return this.#getConfigurations().find(config => config.key === key);
  };

  #getEffectivePermissionKey = (key?: string): string | undefined => {
    if (this.#getConfigurationByKey(key)) {
      return key;
    }

    // Portal-level config uses key = undefined and acts as default fallback
    if (key !== undefined && this.#getConfigurationByKey(undefined)) {
      return undefined;
    }

    return key;
  };

  /**
   * Chỉ tạo handle cache khi key đó bật `persistCache`. Handle được memo hoá để `reset()` /
   * `invalidate()` gọi được `remove()` lên đúng entry đã ghi.
   */
  #getPersistedCache = (normalizedKey: string): SdCache<string[]> => {
    const existing = this.#persistedCaches.get(normalizedKey);
    if (existing) {
      return existing;
    }

    const handle = this.#cacheService.create<string[]>(`${PERSISTED_CACHE_PREFIX}${normalizedKey}`, {
      type: 'session',
      default: [],
    });
    this.#persistedCaches.set(normalizedKey, handle);
    return handle;
  };

  #setPermissionsForKey = (normalizedKey: string, permissions: string[], persist: boolean): void => {
    const distinctPermissions = ArrayUtilities.distinct(permissions || []);
    this.#permissionsByKey[normalizedKey] = distinctPermissions;

    const permissionMap: Record<string, boolean> = {};
    distinctPermissions.forEach(permission => {
      permissionMap[permission] = true;
    });
    this.#permissionMapByKey[normalizedKey] = permissionMap;

    if (persist) {
      this.#getPersistedCache(normalizedKey).set(distinctPermissions);
    }
  };

  loadPermissions = async (key?: string): Promise<string[]> => {
    const effectiveKey = this.#getEffectivePermissionKey(key);
    const normalizedKey = this.#normalizeKey(effectiveKey);
    if (this.#loadedKeys.has(normalizedKey)) {
      return this.#permissionsByKey[normalizedKey] ?? [];
    }

    const configuration = this.#getConfigurationByKey(effectiveKey);
    if (!configuration) {
      this.#setPermissionsForKey(normalizedKey, [], false);
      this.#loadedKeys.add(normalizedKey);
      return [];
    }

    const persist = configuration.persistCache === true;
    if (persist) {
      // why: chỉ khi consumer bật `persistCache` mới đọc lại bản mirror — mặc định không chạm storage.
      const cached = this.#getPersistedCache(normalizedKey).get();
      if (cached?.length) {
        this.#setPermissionsForKey(normalizedKey, cached, false);
        this.#loadedKeys.add(normalizedKey);
        return this.#permissionsByKey[normalizedKey] ?? [];
      }
    }

    try {
      const permissions: string[] = await resolveMaybeAsync(configuration.loadPermissions());
      this.#setPermissionsForKey(normalizedKey, permissions || [], persist);
    } catch (err) {
      console.error(err);
      this.#setPermissionsForKey(normalizedKey, [], false);
    } finally {
      this.#loadedKeys.add(normalizedKey);
    }

    return this.#permissionsByKey[normalizedKey] ?? [];
  };

  loadAllPermissions = async (): Promise<void> => {
    const configurations = this.#getConfigurations();
    if (!configurations.length) {
      await this.loadPermissions(undefined);
      return;
    }

    await Promise.all(configurations.map(config => this.loadPermissions(config.key)));
  };

  /**
   * Xoá TOÀN BỘ quyền đã nạp (mọi key) — cả map trong bộ nhớ, cờ "đã nạp" lẫn bản mirror
   * `sessionStorage` của các key bật `persistCache`.
   *
   * ⚠️ BẮT BUỘC gọi khi signout. Service là singleton `providedIn: 'root'`, nên trong một SPA
   * signout → signin (không reload trang) mà không reset thì `loadPermissions()` sẽ short-circuit
   * theo key đã cache và user MỚI thừa hưởng nguyên bộ quyền của user CŨ.
   *
   * ```ts
   * auth.signout$?.subscribe(() => permissionService.reset());
   * ```
   */
  reset = (): void => {
    // why: sau reload, service chưa tạo handle cho key nào cả nhưng entry sessionStorage của phiên
    // trước vẫn còn. Tạo handle cho mọi key có `persistCache` trước khi remove để reset thật sự sạch.
    this.#getConfigurations()
      .filter(config => config.persistCache === true)
      .forEach(config => this.#getPersistedCache(this.#normalizeKey(config.key)));

    this.#persistedCaches.forEach(cache => cache.remove());
    this.#persistedCaches.clear();
    this.#loadedKeys.clear();
    this.#permissionMapByKey = {};
    this.#permissionsByKey = {};
  };

  /**
   * Xoá quyền đã nạp của MỘT key (mặc định là key portal `undefined`), buộc lần
   * `loadPermissions(key)` kế tiếp gọi lại loader. Dùng khi chỉ một profile/tenant đổi quyền;
   * signout thì dùng {@link reset}.
   */
  invalidate = (key?: string): void => {
    const effectiveKey = this.#getEffectivePermissionKey(key);
    const normalizedKey = this.#normalizeKey(effectiveKey);

    this.#loadedKeys.delete(normalizedKey);
    delete this.#permissionMapByKey[normalizedKey];
    delete this.#permissionsByKey[normalizedKey];

    // why: tạo handle nếu chưa có, để xoá được cả entry còn sót lại từ phiên trước khi reload.
    if (this.#getConfigurationByKey(effectiveKey)?.persistCache === true) {
      this.#getPersistedCache(normalizedKey).remove();
    }
    this.#persistedCaches.delete(normalizedKey);
  };

  /**
   * Kiểm tra quyền (OR cho mảng).
   *
   * ⚠️ BREAKING: đầu vào rỗng (`undefined` / `null` / `''` / `[]`) giờ trả `false`.
   * Muốn "không yêu cầu quyền" thì phải nói ra bằng {@link SD_PERMISSION_PUBLIC}.
   */
  hasPermission = (permission: SdPermissionInput, key?: string): boolean => {
    const effectiveKey = this.#getEffectivePermissionKey(key);
    const configuration = this.#getConfigurationByKey(effectiveKey);
    if (configuration?.disabled) {
      return true;
    }

    const requested = (Array.isArray(permission) ? permission : [permission]).filter(
      (value): value is string => typeof value === 'string' && value.trim() !== ''
    );

    // why: opt-out phải TƯỜNG MINH. Chỉ sentinel này mới nghĩa là "cố ý công khai".
    if (requested.includes(SD_PERMISSION_PUBLIC)) {
      return true;
    }

    if (!requested.length) {
      // why: code cũ trả `true` cho mọi đầu vào rỗng, nên một route gõ sai key `data` (`permision`),
      // một `[sdPermission]` bind nhầm sang biến undefined, hay một mã quyền rỗng do API trả về đều
      // được cấp quyền âm thầm — không phân biệt được "cố ý không giới hạn" với "cấu hình hỏng".
      // Giờ mặc định là TỪ CHỐI; ca công khai thật sự phải dùng `SD_PERMISSION_PUBLIC`.
      if (isDevMode()) {
        console.error(
          '[Permission] Access denied: an empty permission was checked. ' +
            'Pass a real permission code, or SD_PERMISSION_PUBLIC if this route/element is intentionally public.',
          { permission, key }
        );
      }
      return false;
    }

    const normalizedKey = this.#normalizeKey(effectiveKey);
    const permissionMap = this.#permissionMapByKey[normalizedKey] || {};
    return requested.some(value => permissionMap[value] === true);
  };

  getToken = async (key?: string) => {
    const effectiveKey = this.#getEffectivePermissionKey(key);
    const getToken = this.#getConfigurationByKey(effectiveKey)?.getToken as (() => MaybeAsync<string | undefined | null>) | undefined;
    if (!getToken) {
      throw new Error('[Permission] Method getToken');
    }

    const token = await resolveMaybeAsync(getToken());
    if (token === '') {
      return undefined;
    }
    return token;
  };

  /**
   * Giải mã phần payload của JWT hiện tại và trả về claim **CHƯA ĐƯỢC XÁC THỰC**.
   *
   * ⚠️ KHÔNG kiểm chữ ký, KHÔNG kiểm `exp`/`nbf`/`aud`/`iss`. Đây thuần tuý là base64url-decode: bất
   * kỳ ai cũng tự tạo được một token có claim tuỳ ý và hàm này sẽ vui vẻ trả về. Vì vậy kết quả CHỈ
   * dùng cho mục đích hiển thị (tên, avatar, tenant đang chọn…) và TUYỆT ĐỐI không được dùng để ra
   * quyết định phân quyền — quyền phải do backend xác thực chữ ký rồi trả về.
   *
   * Trả `null` khi không có token hoặc payload hỏng.
   */
  readUnverifiedTokenClaims = async <T>(key?: string): Promise<T | null> => {
    const token = await this.getToken(key);
    if (!token) {
      return null;
    }
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  };

  /**
   * @deprecated Tên `decodeToken` gợi ý một thao tác đã được kiểm chứng, trong khi thực tế payload
   * hoàn toàn KHÔNG được xác thực. Dùng {@link readUnverifiedTokenClaims} — alias này chỉ còn để
   * consumer cũ không vỡ và sẽ bị gỡ ở release sau.
   */
  decodeToken = async <T>(key?: string): Promise<T | null> => {
    return this.readUnverifiedTokenClaims<T>(key);
  };
}
