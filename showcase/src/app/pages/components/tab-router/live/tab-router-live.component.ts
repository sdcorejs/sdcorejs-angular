import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTabRouterOutletComponent, SdTabRouterService } from '@sdcorejs/angular/components/tab-router';
import { filter, firstValueFrom, timeout } from 'rxjs';

/** Route sống của trang Tab Router, mount bởi `app.routes.ts`. */
export const TAB_ROUTER_DEMO_BASE = '/demo/tab-router';

/** Năm màn khác nhau, sau đó là các đơn hàng — đủ để thanh tab tràn khi mở 16 tab. */
const TAB_URLS = [
  'overview',
  'orders/10234',
  'customers',
  'contracts/HD-2026-118',
  'reports',
  ...Array.from({ length: 11 }, (_, i) => `orders/${10235 + i}`),
].map(path => `${TAB_ROUTER_DEMO_BASE}/${path}`);

@Component({
  selector: 'app-tab-router-live',
  standalone: true,
  imports: [RouterLink, SdButton, SdTabRouterOutletComponent],
  template: `
    <div class="tab-live">
      <header class="tab-live__header">
        <a class="tab-live__back" routerLink="/v/latest/components/tab-router/examples">← Tab Router</a>
        <div class="tab-live__actions" data-tab-live="actions">
          <sd-button data-tab-live="next" prefixIcon="add" title="Mở thêm một tab" (click)="openNext()"></sd-button>
          <sd-button data-tab-live="five" title="Mở 5 tab" (click)="openMany(5)"></sd-button>
          <sd-button data-tab-live="sixteen" title="Mở 16 tab" (click)="openMany(16)"></sd-button>
          <sd-button data-tab-live="reset" prefixIcon="restart_alt" title="Về một tab" (click)="reset()"></sd-button>
        </div>
        <p class="tab-live__hint">
          Một tab thì thanh tab ẩn; mở tab thứ hai thì thanh hiện ra. Kéo tab để đổi thứ tự; chuột phải vào tab để đóng tab
          hoặc đóng các tab khác. Bàn phím: Tab vào thanh, ←/→ chuyển, Enter mở, Delete đóng, Shift+F10 mở menu.
        </p>
      </header>
      @if (alive()) {
        <!-- Ví dụ trong sd-tab-router.md: inline style thắng :host { height: 100dvh } của outlet. -->
        <sd-tab-router-outlet class="tab-live__outlet" style="height: 560px"></sd-tab-router-outlet>
      }
    </div>
  `,
  styles: [
    `
      .tab-live {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 24px;
      }
      .tab-live__header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 16px;
      }
      .tab-live__back {
        font-weight: 500;
      }
      .tab-live__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .tab-live__hint {
        flex-basis: 100%;
        margin: 0;
        font-size: 13px;
        color: var(--sd-text-secondary);
      }
      .tab-live__outlet {
        border: 1px solid var(--sd-border);
        border-radius: 12px;
        overflow: hidden;
        background: var(--sd-surface);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabRouterLiveComponent {
  readonly #router = inject(Router);
  readonly #tabRouter = inject(SdTabRouterService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly alive = signal(true);
  #next = 1;
  // why: mỗi nút xếp hàng sau nút trước, để "Về một tab" bấm giữa lúc đang mở 16 tab không chen vào giữa chừng.
  #queue: Promise<void> = Promise.resolve();

  openNext = (): Promise<void> =>
    this.#enqueue(async () => {
      await this.#open(TAB_URLS[this.#next % TAB_URLS.length]);
      this.#next++;
    });

  openMany = (count: number): Promise<void> =>
    this.#enqueue(async () => {
      for (const url of TAB_URLS.slice(0, count)) await this.#open(url);
      this.#next = count;
    });

  // why: tab đang mở cuối cùng không đóng được bằng giao diện (thanh ẩn khi còn 1 tab). Dựng lại outlet ở màn đầu
  // là cách gọn nhất để về một tab.
  reset = (): Promise<void> =>
    this.#enqueue(async () => {
      this.alive.set(false);
      // why: huỷ outlet ngay, không đợi lượt change detection kế — bật lại trong cùng lượt thì @if giữ outlet cũ.
      this.#cdr.detectChanges();
      await this.#router.navigateByUrl(TAB_URLS[0]);
      this.#next = 1;
      this.alive.set(true);
    });

  #enqueue = (task: () => Promise<void>): Promise<void> => (this.#queue = this.#queue.then(task).catch(() => undefined));

  // why: outlet dựng tab bất đồng bộ sau NavigationEnd và đọc routerState lúc đó. Điều hướng tiếp trước khi tab mở
  // xong thì tab cũ nhận nhầm màn của URL sau, nên đợi outlet báo tab hiện tại đúng URL rồi mới đi tiếp.
  #open = async (url: string): Promise<void> => {
    const opened = firstValueFrom(
      this.#tabRouter.currentTabChanges.pipe(
        filter(tab => tab?.url === url),
        timeout({ first: 3000 })
      )
    ).catch(() => undefined);
    await this.#router.navigateByUrl(url);
    await opened;
  };
}
