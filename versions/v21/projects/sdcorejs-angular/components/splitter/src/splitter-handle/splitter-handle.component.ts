import { booleanAttribute, Component, DestroyRef, ElementRef, HostListener, inject, input, numberAttribute, output } from '@angular/core';
import { SplitterOrientation } from '../splitter.models';

@Component({
  selector: 'sd-splitter-handle',
  standalone: true,
  templateUrl: './splitter-handle.component.html',
  styleUrl: './splitter-handle.component.scss',
  host: {
    class: 'sd-splitter__handle',
    '[class.sd-splitter__handle--horizontal]': 'orientation() === "horizontal"',
    '[class.sd-splitter__handle--vertical]': 'orientation() === "vertical"',
    '[class.sd-splitter__handle--disabled]': 'disabled()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.role]': '"separator"',
    '[attr.aria-orientation]': 'orientation() === "horizontal" ? "vertical" : "horizontal"',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-valuemin]': 'ariaValueMin() ?? null',
    '[attr.aria-valuemax]': 'ariaValueMax() ?? null',
    '[attr.aria-valuenow]': 'ariaValueNow() ?? null',
  },
})
export class SdSplitterHandleComponent {
  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  constructor() {
    // why: destroy giữa lúc drag (splitter re-sync handle, panel bị @if gỡ…) thì pointerup
    // KHÔNG bao giờ tới → frame đang chờ vẫn chạy và emit dragMove từ component đã tháo.
    // Huỷ frame ở cả destroy chứ không chỉ ở pointerup.
    this.#destroyRef.onDestroy(() => this.#cancelPendingFrame());
  }

  orientation = input<SplitterOrientation>('horizontal');
  disabled = input(false, { transform: booleanAttribute });
  keyboardStep = input<number, unknown>(10, { transform: numberAttribute });
  ariaValueMin = input<number | undefined>(undefined);
  ariaValueMax = input<number | undefined>(undefined);
  ariaValueNow = input<number | undefined>(undefined);

  readonly dragStart = output<void>();
  readonly dragMove = output<number>();
  readonly dragEnd = output<void>();
  readonly toggleRequest = output<void>();

  #pointerId: number | null = null;
  #startCoord = 0;
  #rafPending: number | null = null;
  #pendingDelta = 0;

  @HostListener('dblclick')
  onDblClick(): void {
    if (this.disabled()) return;
    this.toggleRequest.emit();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent): void {
    if (this.disabled()) return;
    const isH = this.orientation() === 'horizontal';
    const step = this.keyboardStep();
    let delta: number | null = null;
    switch (ev.key) {
      case 'ArrowRight':
        if (isH) delta = step;
        break;
      case 'ArrowLeft':
        if (isH) delta = -step;
        break;
      case 'ArrowDown':
        if (!isH) delta = step;
        break;
      case 'ArrowUp':
        if (!isH) delta = -step;
        break;
      case 'Enter':
      case ' ':
        ev.preventDefault();
        this.toggleRequest.emit();
        return;
    }
    if (delta == null) return;
    ev.preventDefault();
    // Keyboard step là 1 lần commit (không live drag) — emit start+move+end liền
    this.dragStart.emit();
    this.dragMove.emit(delta);
    this.dragEnd.emit();
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(ev: PointerEvent): void {
    if (this.disabled()) return;
    // Chỉ xử lý nút trái chuột cho pointerType=mouse; touch/pen không có button constraint
    if (ev.button !== 0 && ev.pointerType === 'mouse') return;
    this.#pointerId = ev.pointerId;
    this.#startCoord = this.orientation() === 'horizontal' ? ev.clientX : ev.clientY;
    this.elementRef.nativeElement.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    this.dragStart.emit();
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(ev: PointerEvent): void {
    // Bỏ qua nếu chưa bắt đầu drag hoặc sai pointer
    if (this.#pointerId == null || ev.pointerId !== this.#pointerId) return;
    const coord = this.orientation() === 'horizontal' ? ev.clientX : ev.clientY;
    this.#pendingDelta = coord - this.#startCoord;
    // Batch qua rAF để tránh trigger Angular CD quá 60fps
    if (this.#rafPending != null) return;
    this.#rafPending = requestAnimationFrame(() => {
      this.#rafPending = null;
      this.dragMove.emit(this.#pendingDelta);
    });
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  onPointerUp(ev: PointerEvent): void {
    if (this.#pointerId == null || ev.pointerId !== this.#pointerId) return;
    this.elementRef.nativeElement.releasePointerCapture(ev.pointerId);
    this.#pointerId = null;
    // Hủy rAF đang chờ để tránh emit dragMove sau khi drag kết thúc
    this.#cancelPendingFrame();
    this.dragEnd.emit();
  }

  #cancelPendingFrame(): void {
    if (this.#rafPending == null) return;
    cancelAnimationFrame(this.#rafPending);
    this.#rafPending = null;
  }
}
