import { DestroyRef, Injectable, inject, isDevMode, signal } from '@angular/core';
import { SdLayoutContext } from '../../configurations';
import { SdLayoutStorageService } from '../storage/storage.service';
import { SD_LAYOUT_CONTEXT_RUNTIME } from './context.runtime';

/**
 * Owns the current layout context (for example a store or a legal entity) and its persisted snapshot.
 *
 * The snapshot is captured once, when the service is first injected, so `SD_LAYOUT_STORAGE_NAMESPACE`
 * must already resolve at that moment (see `sd-layout.md`). Switching reloads the page — there is no
 * change event. Read the context during bootstrap:
 *
 * ```ts
 * provideAppInitializer(() => {
 *   const context = inject(SdLayoutContextService).getCurrentContext();
 *   inject(ApiContextHeader).set(context?.id);
 * });
 * ```
 *
 * The service works without `SD_LAYOUT_CONFIGURATION`; the context switcher passes the configured items to
 * `syncItems()`, which reconciles the snapshot. A reconcile reload happens at most once per target id
 * while the per-tab marker holds that id.
 */
@Injectable({ providedIn: 'root' })
export class SdLayoutContextService {
  readonly #storage = inject(SdLayoutStorageService);
  readonly #runtime = inject(SD_LAYOUT_CONTEXT_RUNTIME);
  readonly #destroyRef = inject(DestroyRef);

  // why: chụp một lần lúc khởi tạo (D-008) — id này quyết định có cần reload đối chiếu hay không,
  // còn namespace lúc chụp giúp nhận ra partition lưu trữ đã đổi (đăng nhập/đăng xuất trong SPA).
  readonly #loadTimeId: string | null;
  #capturedNamespace: string | undefined;
  #stopListening?: () => void;
  // why: đã xin reload thì trang sắp tải lại — mọi lời gọi sau trong lần load này bỏ qua, tránh ghi đè
  // đích đang chờ, reload lần hai hay cảnh báo marker giả.
  #reloadRequested = false;
  #markerWarned = false;

  readonly #current = signal<SdLayoutContext | null>(null);
  readonly #items = signal<readonly SdLayoutContext[]>([]);
  readonly #switchingId = signal<string | null>(null);
  readonly #switchFailed = signal(false);
  readonly #changedElsewhere = signal(false);

  /** Context of this page load; title, subtitle and avatar may refresh from the configured items. */
  readonly current = this.#current.asReadonly();
  /** Valid items last passed to `syncItems()` (entries without `id`/`title` and duplicate ids are dropped). */
  readonly items = this.#items.asReadonly();
  /** Id of the context being switched to, or `null`. */
  readonly switchingId = this.#switchingId.asReadonly();
  /** `true` when the last switch could not be persisted (no reload happened). */
  readonly switchFailed = this.#switchFailed.asReadonly();
  /** `true` when another tab switched the stored context; this tab keeps its context until reloaded. */
  readonly changedElsewhere = this.#changedElsewhere.asReadonly();

  constructor() {
    const snapshot = this.#storage.readCurrentContext();
    this.#loadTimeId = snapshot?.id ?? null;
    this.#capturedNamespace = this.#storage.resolvedNamespace();
    this.#current.set(snapshot);
  }

  /** Returns a copy of the current context, or `null` before any context was stored. */
  getCurrentContext(): SdLayoutContext | null {
    const current = this.#current();
    return current ? { ...current } : null;
  }

  /**
   * Switches to the item with `id`, then reloads the page once the snapshot is confirmed in storage.
   * Ignored for the active id, before `syncItems()`, for ids that are not in `items` and once a reload
   * was requested in this page load.
   */
  setCurrentContext(id: string): void {
    if (this.#reloadRequested || id === this.#current()?.id) return;
    const item = this.#items().find(entry => entry.id === id);
    if (!item) return;

    this.#switchingId.set(id);
    this.#switchFailed.set(false);
    if (this.#persist(toSnapshot(item))) {
      // why: ghi marker = đích để namespace resolve trễ không tốn thêm một reload đối chiếu ở lần load sau;
      // ghi lỗi không chặn — người dùng chủ động chuyển nên vẫn reload.
      this.#runtime.writeMarker(id);
      this.#requestReload();
      return;
    }
    this.#switchingId.set(null);
    this.#switchFailed.set(true);
  }

  /**
   * Reconciles the stored snapshot with the configured items: a valid id only refreshes its metadata;
   * a missing or stale id falls back to `items[0]` and reloads, unless the per-tab marker already holds
   * that target. Empty items store nothing. While the load-time context is still in `items`, a different
   * stored id only raises `changedElsewhere` and a removed snapshot keeps the context in memory.
   * Repeated calls with the same items neither write nor reload again.
   */
  syncItems(items: readonly SdLayoutContext[] | null | undefined): void {
    if (this.#reloadRequested) return;
    const validItems = normalizeItems(items);
    this.#items.set(validItems);
    // why: listener chỉ đăng ký ở lần gọi đầu (D-021) — app không cấu hình `context` không tạo listener.
    this.#listenToStorage();
    if (!validItems.length) return;

    const namespace = this.#storage.resolvedNamespace();
    const namespaceChanged = namespace !== this.#capturedNamespace;
    if (namespaceChanged) this.#recapture(namespace);

    const fresh = this.#storage.refreshCurrentContext();
    const current = this.#current();
    const currentItem = !namespaceChanged && current ? validItems.find(item => item.id === current.id) : undefined;
    // why: INV-004/D-011/D-026 đứng trên D-025 bước 4 — context của lần load còn hợp lệ thì không bị thay:
    // storage giữ id khác nghĩa là tab khác đã chuyển → chỉ báo; snapshot mất (clear() ở tab khác, hoặc
    // lần chuyển ghi lỗi) → giữ context, chỉ làm mới metadata trong bộ nhớ. Không ghi, không marker, không reload.
    if (currentItem && fresh?.id !== currentItem.id) {
      if (fresh) this.#changedElsewhere.set(true);
      else this.#current.set(toSnapshot(currentItem));
      return;
    }
    const target = toSnapshot(validItems.find(item => item.id === fresh?.id) ?? validItems[0]);
    if (!sameContext(target, fresh) && !this.#persist(target)) {
      this.#current.set(target);
      // @i18n-ignore
      this.#warn('Could not persist the current context; it is kept in memory and the page is not reloaded.');
      return;
    }
    this.#current.set(target);

    if (target.id === this.#loadTimeId) {
      this.#runtime.writeMarker(null);
      return;
    }
    // why: marker phiên chặn vòng lặp reload khi namespace theo user resolve SAU getCurrentContext() —
    // mỗi lần load đều thấy id lúc load khác đích; marker cho tối đa một reload đối chiếu mỗi id đích
    // trong lúc nó còn giữ id đó (D-025).
    const marker = this.#runtime.readMarker();
    if (marker === undefined || marker === target.id || !this.#runtime.writeMarker(target.id)) {
      this.#warnMarkerBlocked();
      return;
    }
    this.#requestReload();
  }

  /** Reloads the page, for example from the "changed in another tab" notice. Does nothing once a reload was requested. */
  reload(): void {
    this.#requestReload();
  }

  #requestReload(): void {
    if (this.#reloadRequested) return;
    this.#reloadRequested = true;
    this.#runtime.reload();
  }

  // why: cảnh báo một lần mỗi instance — lời gọi lặp của switcher không làm ngập console.
  #warnMarkerBlocked(): void {
    if (this.#markerWarned) return;
    this.#markerWarned = true;
    this.#warn(
      // @i18n-ignore
      'Skipped the context reconcile reload to avoid a reload loop: the per-tab marker already holds the target or is unavailable. ' +
        // @i18n-ignore
        'Make SD_LAYOUT_STORAGE_NAMESPACE resolvable before SdLayoutContextService is first injected (see sd-layout.md).'
    );
  }

  #persist(snapshot: SdLayoutContext): boolean {
    this.#storage.writeCurrentContext(snapshot);
    // why: `set()` cập nhật bộ nhớ trước và không báo ghi lỗi — chỉ đọc lại từ storage mới xác nhận được (D-019).
    return this.#storage.refreshCurrentContext()?.id === snapshot.id;
  }

  // why: đổi namespace (đăng nhập/đăng xuất trong SPA) là partition khác, không phải đổi ở tab khác → tắt thông báo.
  #recapture(namespace: string | undefined): void {
    this.#capturedNamespace = namespace;
    this.#current.set(this.#storage.refreshCurrentContext());
    this.#changedElsewhere.set(false);
  }

  #listenToStorage(): void {
    if (this.#stopListening) return;
    this.#stopListening = this.#runtime.onStorage(() => this.#onStorage());
    this.#destroyRef.onDestroy(() => this.#stopListening?.());
  }

  // why: key thật là digest nên không lọc theo key được — mọi sự kiện đều đọc lại rồi so id (D-020).
  #onStorage(): void {
    if (this.#reloadRequested) return;
    const namespace = this.#storage.resolvedNamespace();
    if (namespace !== this.#capturedNamespace) {
      this.#recapture(namespace);
      return;
    }
    const fresh = this.#storage.refreshCurrentContext();
    // why: tính lại cả hai chiều để cờ tắt khi tab khác chuyển về; snapshot bị xoá (signout nơi khác) giữ nguyên cờ.
    if (fresh) this.#changedElsewhere.set(fresh.id !== this.#current()?.id);
  }

  #warn(message: string): void {
    if (!isDevMode()) return;
    // @i18n-ignore dev-facing console.warn — không cần dịch
    console.warn(`[SdLayoutContextService] ${message}`);
  }
}

// why: chỉ giữ đúng 4 field của snapshot và bỏ field tuỳ chọn không phải chuỗi — khớp cách
// `SdLayoutStorageService` đọc lại, nên so sánh ổn định và lời gọi lặp không ghi lại.
function toSnapshot(item: SdLayoutContext): SdLayoutContext {
  const { id, title, subtitle, avatar } = item;
  return {
    id,
    title,
    ...(typeof subtitle === 'string' ? { subtitle } : {}),
    ...(typeof avatar === 'string' ? { avatar } : {}),
  };
}

function sameContext(left: SdLayoutContext, right: SdLayoutContext | null): boolean {
  return !!right && left.id === right.id && left.title === right.title && left.subtitle === right.subtitle && left.avatar === right.avatar;
}

function normalizeItems(items: readonly SdLayoutContext[] | null | undefined): readonly SdLayoutContext[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: SdLayoutContext[] = [];
  for (const item of items as readonly unknown[]) {
    if (typeof item !== 'object' || item === null) continue;
    const { id, title } = item as Partial<Record<keyof SdLayoutContext, unknown>>;
    // why: cùng luật hợp lệ với `SdLayoutStorageService` (chuỗi không rỗng sau trim) — mục nào ghi được thì đọc lại được.
    if (!isFilledString(id) || !isFilledString(title) || seen.has(id)) continue;
    seen.add(id);
    result.push(item as SdLayoutContext);
  }
  return result;
}

function isFilledString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
