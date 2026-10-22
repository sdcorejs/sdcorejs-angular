import { A11yModule } from '@angular/cdk/a11y';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
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

  readonly tabs = input<SdTabRouterTab[]>([]);
  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  readonly listButton = viewChild<ElementRef<HTMLButtonElement>>('listButton');

  /** Tổng `min-width` của các tab vượt bề rộng thanh: thanh cuộn ngang và có nút danh sách tab. */
  readonly overflowing = signal(false);
  /** Còn tab khuất ở cạnh đầu / cạnh cuối: hiện lớp mờ ở cạnh đó. */
  readonly fadeStart = signal(false);
  readonly fadeEnd = signal(false);
  readonly listOpen = signal(false);

  // why: menu treo dưới cả khối nút (cao bằng thanh 40px) cách 4px, mép phải thẳng mép phải nút (khối có đệm phải 6px).
  readonly listPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetX: -6, offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetX: -6, offsetY: -4 },
  ];

  #activeKey?: string;

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

    // Danh sách tab đổi: đo lại sau khi DOM đã có tab mới, rồi cuộn tới tab đang mở nếu nó vừa đổi.
    effect(() => {
      const tabs = this.tabs();
      untracked(() =>
        afterNextRender(
          () => {
            this.#measure();
            this.#revealActive(tabs);
          },
          { injector: this.#injector }
        )
      );
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
    moveItemInArray(this.tabs(), event.previousIndex, event.currentIndex);
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
    const scroller = this.scroller().nativeElement;
    const item = scroller.querySelector<HTMLElement>('sd-tab-router-item.sd-tab-router-item--active');
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
