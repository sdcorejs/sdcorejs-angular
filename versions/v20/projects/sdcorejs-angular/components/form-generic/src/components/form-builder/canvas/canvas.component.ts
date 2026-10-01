import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  NgZone,
  output,
  viewChild,
} from '@angular/core';
import { SdButton, SdButtonItem, SdButtonItemDivider } from '@sdcorejs/angular/components/button';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { sdSpanSource } from '../../../layout/form-generic-layout';
import type { SdFormGenericGroup } from '../../../models/form-generic-schema.model';
import { BuilderItem, canDuplicate, ContainerId, isGroup, isUnknown } from '../state/builder-document';
import { BuilderDragService } from '../state/builder-drag';
import { CanvasGeometry, GeoContainer, GeoRow, GRID_COLUMNS, itemSpan, layoutOf } from '../state/builder-layout';
import { itemIcon, itemTypeLabelKey } from '../state/builder-palette';
import { FormBuilderStore } from '../state/builder-store';
import { DropIndicatorComponent, DropStatusComponent } from './drop-feedback.component';
import { FieldPreviewComponent } from './field-preview.component';

/** Độ rộng tối thiểu khi kéo resize (inspector vẫn cho chọn 1–12). */
const MIN_RESIZE_SPAN = 2;

/**
 * Canvas thiết kế: hàng (cùng thuật toán với renderer), group sửa trực tiếp, chọn/kéo/resize.
 * Mọi thay đổi schema đi qua `FormBuilderStore`; trong lúc kéo/resize chỉ đổi state tạm.
 */
@Component({
  selector: 'fb-canvas',
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    SdIcon,
    SdButton,
    SdButtonItem,
    SdButtonItemDivider,
    SdTranslatePipe,
    FieldPreviewComponent,
    DropIndicatorComponent,
    DropStatusComponent,
  ],
})
export class CanvasComponent {
  readonly store = inject(FormBuilderStore);
  readonly #drag = inject(BuilderDragService);
  readonly #zone = inject(NgZone);
  readonly #document = inject(DOCUMENT);
  readonly #injector = inject(Injector);

  /** Người dùng muốn thêm thành phần (bấm vùng "thêm" cuối canvas) — shell đưa focus sang palette. */
  readonly requestAdd = output<void>();
  /** Người dùng yêu cầu xoá (shell hỏi xác nhận khi có phụ thuộc). */
  readonly requestRemove = output<string>();

  readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  readonly page = viewChild.required<ElementRef<HTMLElement>>('page');

  readonly GRID_COLUMNS = GRID_COLUMNS;
  readonly itemIcon = itemIcon;
  readonly itemTypeLabelKey = itemTypeLabelKey;
  readonly isGroup = isGroup;
  readonly isUnknown = isUnknown;
  readonly canDuplicate = canDuplicate;

  /**
   * Đang kéo? — boolean chỉ đổi lúc bắt đầu/kết thúc kéo.
   * why: canvas KHÔNG đọc `store.drag()` trực tiếp trong template (intent đổi liên tục khi kéo và
   * sẽ refresh cả canvas); phản hồi theo intent nằm ở `fb-drop-indicator` / `fb-drop-status`.
   */
  readonly isDragging = computed(() => !!this.store.drag());
  /** id phần tử đang được kéo (mờ đi tại chỗ cũ). Chỉ đổi lúc bắt đầu/kết thúc kéo. */
  readonly movingId = computed(() => {
    const subject = this.store.drag()?.subject;
    return subject?.kind === 'move' ? subject.id : null;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const unregister = this.#drag.registerTarget({ scroller: this.scroller().nativeElement, measure: () => this.measure() });
      const observer = new ResizeObserver(() => this.#drag.remeasure());
      observer.observe(this.page().nativeElement);
      destroyRef.onDestroy(() => {
        unregister();
        observer.disconnect();
      });
    });
  }

  // ── Hiển thị ────────────────────────────────────────────────────────────────

  spanOf = (item: BuilderItem): number => itemSpan(item, this.store.layoutMode(), this.store.resize());

  widthOf = (item: BuilderItem): string => `${(this.spanOf(item) / GRID_COLUMNS) * 100}%`;

  isSelected = (item: BuilderItem): boolean => this.store.selectedId() === item.id;

  isHidden = (item: BuilderItem): boolean => !!(item as { hidden?: boolean }).hidden;

  /** Phần tử tự mở hàng mới (`layout.newRow`). */
  hasNewRow = (item: BuilderItem): boolean => !!layoutOf(item)?.newRow;

  /**
   * Nhãn span của field đang chọn ở mức đang xem: `6/12`, kèm "Theo Desktop" (tablet) hoặc "Mặc định"
   * (mobile) khi mức đó chưa tự khai báo span.
   */
  spanLabel = (item: BuilderItem): string => {
    const mode = this.store.layoutMode();
    const text = `${this.spanOf(item)}/${GRID_COLUMNS}`;
    if (mode === 'desktop' || sdSpanSource(layoutOf(item), mode) === 'own') return text;
    const inherited = mode === 'tablet' ? 'core.component.form-builder.span.follow-desktop' : 'core.component.form-builder.span.default';
    return `${text} · ${this.store.t(inherited)}`;
  };

  labelOf = (item: BuilderItem): string => this.store.labelOf(item);

  /** Tên truy cập của nút chọn field: nhãn, loại, trạng thái. */
  ariaLabelOf = (item: BuilderItem): string => {
    const parts = [this.labelOf(item), this.store.t(itemTypeLabelKey(item))];
    const required = (item as { validation?: { required?: boolean } }).validation?.required;
    if (required) parts.push(this.store.t('core.component.form-builder.required'));
    if (this.isHidden(item)) parts.push(this.store.t('core.component.form-builder.hidden'));
    return parts.join(', ');
  };

  groupRows = (group: SdFormGenericGroup) => this.store.groupRows().get(group.id) ?? [];

  groupCount = (group: SdFormGenericGroup): number => (group.elements ?? []).length;

  isCollapsed = (group: SdFormGenericGroup): boolean => this.store.collapsed().has(group.id);

  canMoveUp = (item: BuilderItem): boolean => (this.store.index().get(item.id)?.index ?? 0) > 0;

  canMoveDown = (item: BuilderItem): boolean => {
    const location = this.store.index().get(item.id);
    return !!location && location.index < this.store.childrenOf(location.parentId).length - 1;
  };

  parentOf = (item: BuilderItem): ContainerId => this.store.index().get(item.id)?.parentId ?? null;

  /** Group khác (đích cho "Chuyển vào nhóm"). */
  otherGroups = (item: BuilderItem): SdFormGenericGroup[] => {
    if (isGroup(item)) return [];
    const parentId = this.parentOf(item);
    return this.store.groups().filter(group => group.id !== parentId);
  };

  resizeBadge = (item: BuilderItem): string | null => {
    const resize = this.store.resize();
    return resize?.id === item.id ? `${resize.span}/${GRID_COLUMNS}` : null;
  };

  // ── Chọn & bàn phím ─────────────────────────────────────────────────────────

  select(item: BuilderItem, event?: Event): void {
    event?.stopPropagation();
    this.store.select(item.id);
  }

  onBackgroundClick(event: MouseEvent): void {
    // Chỉ click vào NỀN canvas (không phải field) mới bỏ chọn.
    if (event.target === this.scroller().nativeElement || event.target === this.page().nativeElement) this.store.select(null);
  }

  onCardKeydown(event: KeyboardEvent, item: BuilderItem): void {
    if (event.target !== event.currentTarget) return;
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.store.select(item.id);
      return;
    }
    if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault();
      this.requestRemove.emit(item.id);
      return;
    }
    if (event.altKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
      event.preventDefault();
      this.store.moveBy(item.id, key === 'ArrowUp' ? -1 : 1);
      this.#refocus(item.id);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'd') {
      event.preventDefault();
      if (!canDuplicate(item)) return;
      const copy = this.store.duplicate(item.id);
      if (copy) this.#refocus(copy);
      return;
    }
    if (key === 'Escape' && this.store.selectedId()) {
      event.preventDefault();
      event.stopPropagation();
      this.store.select(null);
    }
  }

  // ── Kéo-thả ─────────────────────────────────────────────────────────────────

  /** Kéo từ thân card (chuột/bút). Trên cảm ứng chỉ tay nắm mới kéo — để vuốt vẫn cuộn được canvas. */
  onCardPointerDown(event: PointerEvent, item: BuilderItem): void {
    if (event.pointerType === 'touch') return;
    this.#armMove(event, item);
  }

  onGripPointerDown(event: PointerEvent, item: BuilderItem): void {
    event.stopPropagation();
    this.#armMove(event, item);
  }

  #armMove(event: PointerEvent, item: BuilderItem): void {
    if (this.store.mode() !== 'design') return;
    this.#drag.arm(event, {
      subject: () => ({ kind: 'move', id: item.id }),
      label: this.labelOf(item),
      icon: itemIcon(item),
      isGroup: isGroup(item),
      span: itemSpan(item, this.store.layoutMode()),
    });
  }

  // ── Resize (snap theo lưới 12 cột, commit một lần khi thả) ─────────────────

  onResizePointerDown(event: PointerEvent, item: BuilderItem, cell: HTMLElement): void {
    if (event.button !== 0 || isGroup(item) || isUnknown(item)) return;
    event.preventDefault();
    event.stopPropagation();
    const row = cell.parentElement;
    if (!row) return;
    const mode = this.store.layoutMode();
    const startSpan = itemSpan(item, mode);
    const columnWidth = row.clientWidth / GRID_COLUMNS;
    const left = cell.getBoundingClientRect().left;
    const pointerId = event.pointerId;
    const keyTarget: Window | Document = this.#document.defaultView ?? this.#document;
    this.store.select(item.id);
    this.store.resize.set({ id: item.id, span: startSpan, mode });
    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      const span = Math.min(GRID_COLUMNS, Math.max(MIN_RESIZE_SPAN, Math.round((moveEvent.clientX - left) / columnWidth)));
      if (this.store.resize()?.span !== span) this.#zone.run(() => this.store.resize.set({ id: item.id, span, mode }));
    };
    const finish = (commit: boolean) => {
      this.#document.removeEventListener('pointermove', move, true);
      this.#document.removeEventListener('pointerup', up, true);
      this.#document.removeEventListener('pointercancel', cancel, true);
      keyTarget.removeEventListener('keydown', escape as EventListener, true);
      this.#zone.run(() => {
        const current = this.store.resize();
        this.store.resize.set(null);
        if (commit && current && current.span !== startSpan) this.store.setSpan(item.id, current.span, mode);
      });
    };
    const up = (upEvent: PointerEvent) => upEvent.pointerId === pointerId && finish(true);
    const cancel = (cancelEvent: PointerEvent) => cancelEvent.pointerId === pointerId && finish(false);
    const escape = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== 'Escape') return;
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      finish(false);
    };
    this.#zone.runOutsideAngular(() => {
      this.#document.addEventListener('pointermove', move, true);
      this.#document.addEventListener('pointerup', up, true);
      this.#document.addEventListener('pointercancel', cancel, true);
      // Escape nghe ở window — xem ghi chú ở BuilderDragService (#keyTarget).
      keyTarget.addEventListener('keydown', escape as EventListener, true);
    });
  }

  // ── Menu thao tác ───────────────────────────────────────────────────────────

  duplicate(item: BuilderItem): void {
    this.store.duplicate(item.id);
  }

  remove(item: BuilderItem): void {
    this.requestRemove.emit(item.id);
  }

  moveBy(item: BuilderItem, delta: -1 | 1): void {
    this.store.moveBy(item.id, delta);
  }

  moveTo(item: BuilderItem, parentId: ContainerId): void {
    this.store.moveTo(item.id, parentId);
  }

  toggleNewRow(item: BuilderItem): void {
    this.store.setNewRow(item.id, !this.hasNewRow(item));
  }

  toggleCollapsed(group: SdFormGenericGroup, event: Event): void {
    event.stopPropagation();
    this.store.toggleCollapsed(group.id);
  }

  /**
   * Cuộn tới phần tử (khi chọn từ tab Cấu trúc hoặc vừa thêm).
   * why: sau lần render KẾ TIẾP — phần tử vừa thêm/nhân bản chưa có trong DOM khi lệnh vừa commit, còn
   * microtask/setTimeout(0) chạy trước change detection (nhất là khi app bật eventCoalescing).
   */
  scrollToItem(id: string, focus = false): void {
    afterNextRender(
      () => {
        const element = this.page().nativeElement.querySelector<HTMLElement>(`[data-fb-item="${CSS.escape(id)}"]`);
        if (!element) return;
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        if (focus) element.querySelector<HTMLElement>('[data-fb-card]')?.focus({ preventScroll: true });
      },
      { injector: this.#injector }
    );
  }

  #refocus(id: string): void {
    this.scrollToItem(id, true);
  }

  /**
   * Focus thẻ của phần tử sau lần render kế tiếp; không có (hoặc `null`) thì focus vùng canvas.
   * Shell gọi khi xử lý `store.focusRequest` (sau xoá / tách nhóm).
   */
  focusItem(id: string | null): void {
    afterNextRender(
      () => {
        const selector = id ? `[data-fb-item="${CSS.escape(id)}"] [data-fb-card]` : null;
        const card = selector ? this.page().nativeElement.querySelector<HTMLElement>(selector) : null;
        if (card) card.focus();
        else this.scroller().nativeElement.focus({ preventScroll: true });
      },
      { injector: this.#injector }
    );
  }

  // ── Hình học ────────────────────────────────────────────────────────────────

  /** Đo hàng/phần tử theo toạ độ nội dung của vùng cuộn (dùng cho hit-test và indicator). */
  measure(): CanvasGeometry {
    const scroller = this.scroller().nativeElement;
    const origin = scroller.getBoundingClientRect();
    const offsetX = scroller.scrollLeft - origin.left;
    const offsetY = scroller.scrollTop - origin.top;
    const rect = (element: Element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left + offsetX, right: box.right + offsetX, top: box.top + offsetY, bottom: box.bottom + offsetY };
    };
    const rowsIn = (container: Element): GeoRow[] =>
      Array.from(container.querySelectorAll(':scope > [data-fb-row]')).map(row => ({
        key: row.getAttribute('data-fb-row') ?? '',
        ...rect(row),
        items: Array.from(row.querySelectorAll(':scope > [data-fb-item]')).map(item => ({
          id: item.getAttribute('data-fb-item') ?? '',
          ...rect(item),
        })),
      }));
    const page = this.page().nativeElement;
    const rootRows = page.querySelector('[data-fb-container="root"]');
    const root: GeoContainer = { parentId: null, ...rect(page), rows: rootRows ? rowsIn(rootRows) : [] };
    const groups: GeoContainer[] = Array.from(page.querySelectorAll('[data-fb-group-body]')).map(body => {
      const container = body.querySelector('[data-fb-container]');
      return { parentId: body.getAttribute('data-fb-group-body'), ...rect(body), rows: container ? rowsIn(container) : [] };
    });
    return { root, groups };
  }
}
