import { A11yModule } from '@angular/cdk/a11y';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ConnectedPosition, FlexibleConnectedPositionStrategyOrigin, OverlayModule } from '@angular/cdk/overlay';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  model,
  NgZone,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdTabRouterTab } from '../../models/tab-router.model';
import { SdTabRouterService } from '../../services/tab-router.service';
import { SdTabRouterItemComponent } from '../tab-router-item/tab-router-item.component';
import { SdTabRouterListItemComponent } from '../tab-router-list-item/tab-router-list-item.component';

/** Bề rộng lớp mờ ở cạnh thanh; tab đang mở được cuộn ra khỏi vùng này. */
const FADE_WIDTH = 32;

/** Menu chuột phải đang mở: tab của nó và chỗ treo (con trỏ, hoặc chính tab khi mở bằng bàn phím). */
interface SdTabRouterContextMenu {
  tab: SdTabRouterTab;
  origin: FlexibleConnectedPositionStrategyOrigin;
  positions: ConnectedPosition[];
  /** Mở bằng Shift+F10 / phím Menu: sự kiện `contextmenu` trình duyệt phát ngay sau đó không mở lại menu. */
  byKeyboard: boolean;
}

@Component({
  selector: 'sd-tab-router-nav',
  templateUrl: './tab-router-nav.component.html',
  styleUrl: './tab-router-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [A11yModule, DragDropModule, OverlayModule, SdIcon, SdTabRouterItemComponent, SdTabRouterListItemComponent, SdTranslatePipe],
})
export class SdTabRouterNavComponent {
  readonly #router = inject(Router);
  readonly #tabRouterService = inject(SdTabRouterService);
  readonly #injector = inject(Injector);
  readonly #zone = inject(NgZone);

  // why: model, không phải input — kéo thả phát một mảng mới qua `tabsChange` (outlet bind `[(tabs)]`) thay vì sửa thẳng
  // mảng outlet đang giữ.
  readonly tabs = model<SdTabRouterTab[]>([]);
  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  readonly listButton = viewChild<ElementRef<HTMLButtonElement>>('listButton');
  readonly contextMenu = viewChild<ElementRef<HTMLElement>>('contextMenu');

  /** Tổng `min-width` của các tab vượt bề rộng thanh: thanh cuộn ngang và có nút danh sách tab. */
  readonly overflowing = signal(false);
  /** Còn tab khuất ở cạnh đầu / cạnh cuối: hiện lớp mờ ở cạnh đó. */
  readonly fadeStart = signal(false);
  readonly fadeEnd = signal(false);
  readonly listOpen = signal(false);
  readonly menu = signal<SdTabRouterContextMenu | null>(null);

  /** Tab vừa nhận focus bằng phím mũi tên; `null` khi focus đã rời thanh. */
  readonly #focusKey = signal<string | null>(null);
  /**
   * Roving tabindex: điểm dừng Tab duy nhất của thanh. Là tab đang có focus khi người dùng di chuyển bằng phím, nếu
   * không thì tab đang mở (focus vào lại thanh luôn rơi vào tab đang mở).
   */
  readonly tabStopKey = computed(() => {
    const tabs = this.tabs();
    const key = this.#focusKey();
    if (key && tabs.some(tab => tab.key === key)) return key;
    return (tabs.find(tab => tab.isActive) ?? tabs[0])?.key ?? null;
  });

  // why: menu treo dưới cả khối nút (cao bằng thanh 40px) cách 4px, mép phải thẳng mép phải nút (khối có đệm phải 6px).
  readonly listPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetX: -6, offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetX: -6, offsetY: -4 },
  ];
  /** Menu chuột phải mở bằng bàn phím: dưới tab, thẳng mép trái. */
  readonly menuAtTab: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];
  /** Menu chuột phải mở bằng chuột: góc trên trái tại con trỏ, lật khi chạm mép màn hình. */
  readonly #menuAtPointer: ConnectedPosition[] = [
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
    { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
  ];

  #activeKey?: string;
  // Focus trong thanh: tab cuối cùng có focus, và focus còn ở trong thanh hay không. Khi tab đó bị gỡ khỏi DOM (đóng
  // bằng Delete, menu, nút đóng) trình duyệt đưa focus về body — thanh đưa focus sang tab kế bên.
  #lastFocusedKey?: string;
  #focusWithin = false;
  #previousTabs: SdTabRouterTab[] = [];

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const scroller = this.scroller().nativeElement;
      // why: scroll và wheel chạy liên tục — nghe ngoài zone, chỉ ghi signal khi giá trị đổi.
      this.#zone.runOutsideAngular(() => {
        scroller.addEventListener('scroll', this.#measure, { passive: true });
        scroller.addEventListener('wheel', this.#onWheel, { passive: false });
      });
      // why: bề rộng vùng cuộn đổi (cửa sổ, sidebar, hay nút danh sách vừa hiện sau lần đo đầu) — đo lại và giữ tab đang
      // mở trong tầm nhìn.
      const resize =
        typeof ResizeObserver === 'undefined'
          ? undefined
          : new ResizeObserver(() => {
              this.#measure();
              this.#revealActive(this.tabs(), true);
            });
      resize?.observe(scroller);
      destroyRef.onDestroy(() => {
        scroller.removeEventListener('scroll', this.#measure);
        scroller.removeEventListener('wheel', this.#onWheel);
        resize?.disconnect();
      });
    });

    // Danh sách tab đổi: đo lại sau khi DOM đã có tab mới, rồi cuộn tới tab đang mở nếu nó vừa đổi. Tab đang có focus
    // vừa bị đóng thì focus sang tab bên phải nó, không có thì bên trái.
    effect(() => {
      const tabs = this.tabs();
      untracked(() => {
        const refocus = this.#neighbourOfClosedFocus(tabs);
        afterNextRender(
          () => {
            this.#measure();
            this.#revealActive(tabs);
            if (refocus) this.#refocus(refocus);
          },
          { injector: this.#injector }
        );
      });
    });
  }

  toggleList = (): void => {
    this.listOpen.update(open => !open);
  };

  closeList = (restoreFocus = true): void => {
    if (!this.listOpen()) return;
    this.listOpen.set(false);
    if (restoreFocus) this.listButton()?.nativeElement.focus();
  };

  onListKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' && event.key !== 'Esc') return;
    event.preventDefault();
    this.closeList();
  };

  /** Chọn một tab trong menu: đóng menu (focus về nút) rồi chuyển tab như khi bấm tab trên thanh. */
  pickTab = (tab: SdTabRouterTab): void => {
    this.closeList();
    this.#router.navigate([tab.url], {
      queryParams: tab.queryParams,
      state: { switchTab: true },
    });
  };

  closeTab = (tab: SdTabRouterTab): void => {
    this.#tabRouterService.close(tab);
  };

  onDrop = (event: CdkDragDrop<SdTabRouterTab[]>) => {
    if (event.previousIndex === event.currentIndex) return;
    const tabs = [...this.tabs()];
    moveItemInArray(tabs, event.previousIndex, event.currentIndex);
    this.tabs.set(tabs);
  };

  // Bàn phím của tablist (WAI-ARIA tabs, kích hoạt thủ công): ←/→ chuyển focus (quay vòng ở hai đầu), Home/End về
  // đầu/cuối, Delete đóng, Shift+F10 / phím Menu mở menu chuột phải. Enter/Space mở tab nằm trên chính tab.
  onKeydown = (event: KeyboardEvent): void => {
    const index = this.#indexOf(event.target);
    const tabs = this.tabs();
    if (index < 0 || !tabs[index]) return;
    const last = tabs.length - 1;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = index === last ? 0 : index + 1;
        break;
      case 'ArrowLeft':
        next = index === 0 ? last : index - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      case 'Delete':
        event.preventDefault();
        this.#tabRouterService.close(tabs[index]);
        return;
      case 'ContextMenu':
      case 'F10':
        if (event.key === 'F10' && !event.shiftKey) return;
        event.preventDefault();
        this.#openMenuAtTab(index);
        return;
      default:
        return;
    }
    event.preventDefault();
    this.#focusTab(next);
  };

  onFocusin = (event: FocusEvent): void => {
    const tab = this.tabs()[this.#indexOf(event.target)];
    if (!tab) return;
    this.#focusKey.set(tab.key);
    this.#lastFocusedKey = tab.key;
    this.#focusWithin = true;
  };

  // why: focus rời thanh (sang phần tử khác) thì điểm dừng Tab trở về tab đang mở. `relatedTarget` null là focus về
  // body — có thể vì chính tab đang focus vừa bị gỡ khỏi DOM, nên vẫn nhớ tab đó để đưa focus sang tab kế bên.
  onFocusout = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    if (next && this.scroller().nativeElement.contains(next)) return;
    this.#focusKey.set(null);
    if (next) this.#focusWithin = false;
  };

  onContextmenu = (event: MouseEvent): void => {
    const index = this.#indexOf(event.target);
    const tab = this.tabs()[index];
    if (!tab) return;
    event.preventDefault();
    // why: Shift+F10 / phím Menu đã mở menu ở `keydown`; `contextmenu` trình duyệt phát tiếp theo không mở lại.
    const open = this.menu();
    if (open?.byKeyboard && open.tab.key === tab.key && event.button !== 2) return;
    if (event.button !== 2) {
      this.#openMenuAtTab(index);
      return;
    }
    this.menu.set({ tab, origin: { x: event.clientX, y: event.clientY }, positions: this.#menuAtPointer, byKeyboard: false });
  };

  /** Menu vừa gắn vào overlay: focus mục đầu. */
  focusMenu = (): void => {
    afterNextRender(() => this.#menuItems()[0]?.focus(), { injector: this.#injector });
  };

  closeMenu = (restoreFocus = true): void => {
    const open = this.menu();
    if (!open) return;
    this.menu.set(null);
    if (restoreFocus) this.#focusTab(this.tabs().findIndex(tab => tab.key === open.tab.key));
  };

  // ↑/↓ (quay vòng), Home/End giữa các mục; Esc hoặc Tab đóng menu và trả focus về tab.
  onMenuKeydown = (event: KeyboardEvent): void => {
    const items = this.#menuItems();
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = index + 1 >= items.length ? 0 : index + 1;
        break;
      case 'ArrowUp':
        next = index <= 0 ? items.length - 1 : index - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = items.length - 1;
        break;
      case 'Escape':
      case 'Esc':
      case 'Tab':
        event.preventDefault();
        this.closeMenu();
        return;
      default:
        return;
    }
    event.preventDefault();
    items[next]?.focus();
  };

  closeFromMenu = (): void => {
    const tab = this.menu()?.tab;
    this.closeMenu();
    if (tab) this.#tabRouterService.close(tab);
  };

  closeOthersFromMenu = (): void => {
    const tab = this.menu()?.tab;
    this.closeMenu();
    if (tab) this.#tabRouterService.closeOthers(tab);
  };

  #tabElements = (): HTMLElement[] => Array.from(this.scroller().nativeElement.querySelectorAll<HTMLElement>('[role="tab"]'));

  // why: chỉ số của tab chứa `target` (chính tab hoặc nút đóng bên trong). Thứ tự DOM trùng thứ tự `tabs` — CDK chỉ dời
  // tab bằng transform trong lúc kéo.
  #indexOf = (target: EventTarget | null): number => {
    const tab = target instanceof Element ? target.closest('[role="tab"]') : null;
    return tab ? this.#tabElements().indexOf(tab as HTMLElement) : -1;
  };

  #menuItems = (): HTMLElement[] => Array.from(this.contextMenu()?.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  #openMenuAtTab = (index: number): void => {
    const tab = this.tabs()[index];
    const element = this.#tabElements()[index];
    if (!tab || !element) return;
    this.menu.set({ tab, origin: element, positions: this.menuAtTab, byKeyboard: true });
  };

  #focusTab = (index: number): void => {
    const tab = this.tabs()[index];
    const element = this.#tabElements()[index];
    if (!tab || !element) return;
    this.#focusKey.set(tab.key);
    element.focus({ preventScroll: true });
    this.#reveal(element.closest('sd-tab-router-item') as HTMLElement | null);
  };

  /** Tab đang có focus vừa bị đóng: key của tab bên phải nó còn lại, không có thì bên trái. */
  #neighbourOfClosedFocus = (tabs: SdTabRouterTab[]): string | null => {
    const previous = this.#previousTabs;
    this.#previousTabs = tabs;
    const lost = this.#lastFocusedKey;
    if (!lost || !this.#focusWithin || tabs.some(tab => tab.key === lost)) return null;
    const index = previous.findIndex(tab => tab.key === lost);
    if (index < 0) return null;
    const remains = (tab: SdTabRouterTab) => tabs.some(({ key }) => key === tab.key);
    const neighbour = previous.slice(index + 1).find(remains) ?? previous.slice(0, index).reverse().find(remains);
    if (!neighbour) this.#focusWithin = false;
    return neighbour?.key ?? null;
  };

  // why: chỉ lấy lại focus khi nó đã rơi về body (tab đang focus bị gỡ) — người dùng đã chuyển focus đi chỗ khác thì thôi.
  #refocus = (key: string): void => {
    const active = document.activeElement;
    if (active && active !== document.body && !this.scroller().nativeElement.contains(active)) return;
    this.#focusTab(this.tabs().findIndex(tab => tab.key === key));
  };

  #measure = (): void => {
    const scroller = this.scroller().nativeElement;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const overflowing = max > 1;
    this.overflowing.set(overflowing);
    this.fadeStart.set(overflowing && scroller.scrollLeft > 1);
    this.fadeEnd.set(overflowing && scroller.scrollLeft < max - 1);
    // why: hết tràn thì nút danh sách biến mất — menu treo vào nút đó cũng phải đóng.
    if (!overflowing) this.listOpen.set(false);
  };

  // why: chuột thường chỉ có lăn dọc. Chỉ đổi khi thanh tràn và lăn dọc là chính (touchpad đã có lăn ngang); hết chỗ
  // cuộn thì để trang nhận cú lăn.
  #onWheel = (event: WheelEvent): void => {
    const scroller = this.scroller().nativeElement;
    if (scroller.scrollWidth - scroller.clientWidth <= 1 || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const unit =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? scroller.clientWidth : 1;
    const before = scroller.scrollLeft;
    scroller.scrollLeft = before + event.deltaY * unit;
    if (scroller.scrollLeft !== before) event.preventDefault();
  };

  // why: chỉ cuộn khi tab đang mở đổi (hoặc `force` khi vùng cuộn đổi bề rộng) — người dùng tự cuộn thanh để xem tab
  // khác thì không bị kéo về.
  #revealActive = (tabs: SdTabRouterTab[], force = false): void => {
    const active = tabs.find(tab => tab.isActive);
    if (!active || (!force && active.key === this.#activeKey)) return;
    this.#activeKey = active.key;
    this.#reveal(this.scroller().nativeElement.querySelector<HTMLElement>('sd-tab-router-item.sd-tab-router-item--active'));
  };

  /** Cuộn thanh để `item` hiện trọn, ngoài vùng lớp mờ. */
  #reveal = (item: HTMLElement | null): void => {
    const scroller = this.scroller().nativeElement;
    if (!item || scroller.scrollWidth - scroller.clientWidth <= 1) return;
    const left = item.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
    const right = left + item.offsetWidth;
    if (left - FADE_WIDTH < scroller.scrollLeft) {
      scroller.scrollLeft = Math.max(0, left - FADE_WIDTH);
    } else if (right + FADE_WIDTH > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollLeft = right + FADE_WIDTH - scroller.clientWidth;
    }
    this.#measure();
  };
}
