import { DestroyRef, Directive, ElementRef, NgZone, OnInit, Renderer2, effect, inject, untracked } from '@angular/core';
import { SdScrollPointerService } from './sd-scroll-pointer.service';

type SdScrollOverflow = 'hidden' | 'auto';

@Directive({
  selector: '[sdScroll]',
  standalone: true,
})
export class SdScrollDirective implements OnInit {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  readonly #zone = inject(NgZone);
  readonly #pointer = inject(SdScrollPointerService);
  #touch = false;
  #overflowX: SdScrollOverflow | null = null;
  #mouseListeners: (() => void)[] = [];
  #scrollTopTimer: ReturnType<typeof setTimeout> | null = null;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    // why: theo dõi chế độ cảm ứng/chuột qua signal của service dùng chung; effect tự huỷ cùng directive.
    effect(() => {
      const touch = this.#pointer.touch();
      untracked(() => this.#applyMode(touch));
    });
    inject(DestroyRef).onDestroy(() => {
      this.#detachMouse();
      this.#clearScrollTop();
    });
  }

  /** Chế độ chuột: hiện thanh cuộn ngang khi con trỏ vào host (gọi từ `mouseenter`). Không làm gì trên thiết bị cảm ứng. */
  onMouseOver() {
    if (!this.#touch) {
      this.#setOverflowX('auto');
    }
  }

  /** Chế độ chuột: ẩn thanh cuộn ngang khi con trỏ rời host (gọi từ `mouseleave`). Không làm gì trên thiết bị cảm ứng. */
  onMouseOut() {
    if (!this.#touch) {
      this.#setOverflowX('hidden');
    }
  }

  ngOnInit(): void {
    this.renderer.setStyle(this.elementRef.nativeElement, '-webkit-transform', 'translate3d(0, 0, 0)');
    this.renderer.setStyle(this.elementRef.nativeElement, 'overflow-y', 'auto');
    // why: đặt overflow-x ngay lần render đầu, không chờ effect, để lần vuốt đầu trên màn hình cảm ứng đã cuộn được.
    this.#applyMode(this.#pointer.touch());
  }

  scrollTop = () => {
    this.#clearScrollTop();
    this.#scrollTopTimer = setTimeout(() => {
      this.#scrollTopTimer = null;
      if (this.elementRef?.nativeElement) {
        this.elementRef.nativeElement.scrollTop = 0;
      }
    }, 1);
  };

  #applyMode(touch: boolean) {
    this.#touch = touch;
    if (touch) {
      // why: trình duyệt chọn phần tử cuộn ngay khi cử chỉ chạm bắt đầu, nên overflow-x phải là auto từ trước.
      this.#detachMouse();
      this.#setOverflowX('auto');
      return;
    }
    this.#setOverflowX('hidden');
    this.#attachMouse();
  }

  #attachMouse() {
    if (this.#mouseListeners.length > 0) {
      return;
    }
    const host = this.elementRef.nativeElement;
    // why: mouseenter/mouseleave không lan lên từ từng ô con như mouseover/mouseout, và gắn ngoài NgZone nên rê chuột
    // qua bảng không kích hoạt change detection của cả ứng dụng; handler chỉ ghi style.
    this.#zone.runOutsideAngular(() => {
      this.#mouseListeners = [
        this.renderer.listen(host, 'mouseenter', () => this.onMouseOver()),
        this.renderer.listen(host, 'mouseleave', () => this.onMouseOut()),
      ];
    });
  }

  #detachMouse() {
    this.#mouseListeners.forEach(unlisten => unlisten());
    this.#mouseListeners = [];
  }

  #setOverflowX(value: SdScrollOverflow) {
    if (this.#overflowX === value) {
      return;
    }
    this.#overflowX = value;
    this.renderer.setStyle(this.elementRef.nativeElement, 'overflow-x', value);
  }

  #clearScrollTop() {
    if (this.#scrollTopTimer !== null) {
      clearTimeout(this.#scrollTopTimer);
      this.#scrollTopTimer = null;
    }
  }
}
