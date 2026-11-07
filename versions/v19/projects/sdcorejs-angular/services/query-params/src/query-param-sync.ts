import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Event as RouterEvent,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  Router,
} from '@angular/router';
import { NEVER, Observable, merge, timer } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, take } from 'rxjs/operators';

const isNavigationDone = (event: RouterEvent): boolean =>
  event instanceof NavigationEnd ||
  event instanceof NavigationCancel ||
  event instanceof NavigationError ||
  event instanceof NavigationSkipped;

/**
 * Đọc/ghi một query param làm nơi giữ state của component (`syncQueryParams` của `sd-table`, `sd-tab-group`,
 * `sd-anchor`). Nội bộ: tên và hình dạng có thể đổi mà không báo trước.
 */
export interface ɵSdQueryParamSync {
  /** `false` khi app không có Router: mọi hàm khác là no-op. */
  readonly available: boolean;
  /** Giá trị hiện tại của `name` trên route của component, `null` khi không có. */
  value(name: string): string | null;
  /** Phát giá trị hiện tại rồi mỗi lần `name` đổi (không phát trùng). Không có Router thì không phát. */
  changes(name: string): Observable<string | null>;
  /** Ghi `value` (`null` xoá param). Ghi trong cùng lượt được gộp vào một navigation `replaceUrl`. */
  write(name: string, value: string | null): void;
}

interface PendingWrite {
  value: string | null;
  route: ActivatedRoute | null;
  owner: object;
}

/** Hàng đợi ghi dùng chung cho cả app: một navigation cho mọi param ghi trong cùng lượt. */
@Injectable({ providedIn: 'root' })
export class ɵSdQueryParamWriter {
  readonly #router = inject(Router, { optional: true });
  readonly #pending = new Map<string, PendingWrite>();
  #scheduled = false;
  #waiting = false;

  queue(owner: object, route: ActivatedRoute | null, name: string, value: string | null): void {
    if (!this.#router) return;
    this.#pending.set(name, { value, route, owner });
    this.#schedule();
  }

  cancel(owner: object): void {
    for (const [name, write] of this.#pending) {
      if (write.owner === owner) this.#pending.delete(name);
    }
  }

  #schedule(): void {
    if (this.#scheduled) return;
    this.#scheduled = true;
    queueMicrotask(() => {
      this.#scheduled = false;
      this.#flush();
    });
  }

  #flush(): void {
    const router = this.#router;
    if (!router || !this.#pending.size) return;
    // why: navigate() lúc router đang chạy một navigation khác sẽ huỷ navigation đó (vd người dùng vừa bấm menu).
    // Chờ nó xong rồi xét lại: route của component có thể đã không còn trên màn hình. Chờ sự kiện kết thúc navigation
    // (không poll liên tục — một guard hỏi xác nhận có thể giữ navigation rất lâu); 100ms là lưới an toàn cho trường hợp
    // sự kiện đó đã phát trước khi navigation được dọn.
    if (router.getCurrentNavigation()) {
      if (!this.#waiting) {
        this.#waiting = true;
        merge(router.events.pipe(filter(isNavigationDone)), timer(100))
          .pipe(take(1))
          .subscribe(() => {
            this.#waiting = false;
            this.#schedule();
          });
      }
      return;
    }
    const current = router.parseUrl(router.url).queryParamMap;
    const queryParams: Record<string, string | null> = {};
    let changed = false;
    for (const [name, write] of this.#pending) {
      if (write.route && !isRouteActive(router, write.route.snapshot)) continue;
      if (current.get(name) === write.value) continue;
      queryParams[name] = write.value;
      changed = true;
    }
    this.#pending.clear();
    if (!changed) return;
    void router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true, preserveFragment: true });
  }
}

/** Snapshot nằm trong cây router state hiện tại: route đó đang hiển thị (không phải tab nền hay trang đã rời). */
const isRouteActive = (router: Router, snapshot: ActivatedRouteSnapshot): boolean => {
  const stack: ActivatedRouteSnapshot[] = [router.routerState.snapshot.root];
  while (stack.length) {
    const node = stack.pop()!;
    if (node === snapshot) return true;
    stack.push(...node.children);
  }
  return false;
};

/**
 * Tạo binding đọc/ghi query param cho component hiện tại. Gọi trong injection context. Ghi đang chờ bị huỷ khi
 * component huỷ; ghi của route không còn hiển thị bị bỏ.
 */
export const ɵsdQueryParamSync = (): ɵSdQueryParamSync => {
  const router = inject(Router, { optional: true });
  const route = inject(ActivatedRoute, { optional: true });
  const writer = inject(ɵSdQueryParamWriter);
  const owner = {};
  let destroyed = false;
  inject(DestroyRef).onDestroy(() => {
    destroyed = true;
    writer.cancel(owner);
  });

  // why: Router là `providedIn: 'root'` nên luôn inject được, kể cả app không gọi `provideRouter`. Không có route nào
  // thì coi như app không dùng router: ghi URL lúc đó chỉ sinh navigation vô nghĩa.
  if (!router || !router.config.length) {
    return { available: false, value: () => null, changes: () => NEVER, write: () => undefined };
  }

  const value = (name: string): string | null =>
    route ? route.snapshot.queryParamMap.get(name) : router.parseUrl(router.url).queryParamMap.get(name);

  const changes = (name: string): Observable<string | null> =>
    (route
      ? route.queryParamMap.pipe(map(params => params.get(name)))
      : router.events.pipe(
          filter(event => event instanceof NavigationEnd),
          startWith(null),
          map(() => router.parseUrl(router.url).queryParamMap.get(name))
        )
    ).pipe(distinctUntilChanged());

  return {
    available: true,
    value,
    changes,
    write: (name, next) => {
      if (!destroyed) writer.queue(owner, route, name, next);
    },
  };
};

export interface ɵSdQueryParamStateOptions {
  /** Selector dùng trong cảnh báo, vd `'sd-table'`. */
  selector: string;
  /** Tiền tố tên param: tên là `<prefix>-<autoId>`. */
  prefix: string;
  /** Input `syncQueryParams`. */
  enabled: () => boolean;
  /** Giá trị `autoId` consumer truyền (không phải autoId đã thêm tiền tố). */
  autoId: () => string | null | undefined;
  /** `false` khi component chưa đủ dữ liệu để đọc/ghi (vd tab chưa render): không áp dụng, không ghi. */
  ready?: () => boolean;
  /** State hiện tại đã serialize; `null` là mặc định (param bị xoá). Phải đọc signal để theo dõi được. */
  state: () => string | null;
  /**
   * URL mang giá trị khác state: áp dụng nó. Giá trị không hợp lệ thì bỏ qua — state giữ nguyên và URL được ghi lại.
   * Trả `false` khi giá trị hợp lệ nhưng đích chưa render (tab/mục đến sau): param được giữ và thử lại khi dữ liệu mà
   * `ready`/`state` đọc thay đổi, cho tới khi áp được hoặc người dùng tự đổi state.
   */
  apply: (value: string) => boolean | void;
}

export interface ɵSdQueryParamState {
  /** Giá trị param hiện trên URL; `null` khi tắt, thiếu `autoId` hoặc không có param. Dùng để áp state trước lần đọc đầu. */
  value(): string | null;
}

/**
 * Nối state của component với query param `<prefix>-<autoId>` khi `syncQueryParams` bật. Gọi trong injection context.
 *
 * - URL có param khác state (lúc mở hay đổi từ ngoài) → `apply`.
 * - State đổi → ghi (mặc định thì xoá param). Lần URL đổi do chính binding này ghi không bị áp dụng lại.
 * - Param biến mất (vd bấm menu không có query) → giữ state và ghi lại.
 * - Bật mà thiếu `autoId` → không làm gì, cảnh báo một lần (chỉ khi app có route).
 */
export const ɵsdQueryParamState = (options: ɵSdQueryParamStateOptions): ɵSdQueryParamState => {
  const sync = ɵsdQueryParamSync();
  const value = signal<string | null | undefined>(undefined);
  // why: giá trị mình đã ghi nhưng URL chưa phản hồi. URL phát lại đúng giá trị đó là "tiếng vọng", không phải thay đổi
  // từ ngoài — áp dụng lại sẽ giật state về giá trị cũ khi người dùng thao tác nhanh hơn navigation. Ghi có thể bị gộp
  // hoặc bỏ (route không hiển thị), nên khi URL đã khớp state thì danh sách này được xoá.
  const echoes: (string | null)[] = [];
  let processed: string | null | undefined;
  // State lúc `apply` báo đích chưa có; `undefined` khi không có giá trị nào đang chờ.
  let pendingState: string | null | undefined;
  let warned = false;

  const name = (): string | null => {
    if (!options.enabled() || !sync.available) return null;
    const autoId = options.autoId();
    if (!autoId) {
      if (!warned) {
        warned = true;
        console.warn(`[${options.selector}] syncQueryParams needs autoId: the state is not written to the URL.`);
      }
      return null;
    }
    return `${options.prefix}-${autoId}`;
  };

  effect(onCleanup => {
    const param = name();
    value.set(undefined);
    processed = undefined;
    pendingState = undefined;
    echoes.length = 0;
    if (!param) return;
    const subscription = sync.changes(param).subscribe(next => value.set(next));
    onCleanup(() => subscription.unsubscribe());
  });

  effect(() => {
    const param = untracked(name);
    const current = value();
    // why: thoát trước khi đọc state — bảng tắt sync không phải serialize state mỗi lần lọc.
    if (!param || current === undefined) return;
    const ready = options.ready ? options.ready() : true;
    const state = options.state();
    if (!ready) return;
    untracked(() => {
      if (current !== processed) {
        const echo = echoes.lastIndexOf(current);
        if (echo >= 0) {
          echoes.splice(0, echo + 1);
        } else if (current !== null && current !== state) {
          // Đang chờ đích mà người dùng đã tự đổi state: bỏ giá trị chờ, ghi state.
          if (pendingState === undefined || pendingState === state) {
            const result = options.apply(current);
            if (options.state() !== state) {
              // Đã áp dụng: state đổi và effect chạy lại.
              processed = current;
              pendingState = undefined;
              return;
            }
            if (result === false) {
              pendingState = state;
              return;
            }
          }
        }
        processed = current;
        pendingState = undefined;
      }
      if (state === current) {
        echoes.length = 0;
        return;
      }
      if (echoes[echoes.length - 1] !== state) {
        echoes.push(state);
        sync.write(param, state);
      }
    });
  });

  return {
    value: () => {
      const param = untracked(name);
      return param ? sync.value(param) : null;
    },
  };
};
