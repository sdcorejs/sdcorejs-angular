import { AfterViewInit, Component, ContentChildren, ElementRef, Input, QueryList, Renderer2, ViewChild } from '@angular/core';
import { SdAnchorVerticalListV2 } from '../anchor-vertical-v2/anchor-vertical-list-v2.component';
import { SdAnchorItemV2 } from '../anchor-item-v2/anchor-item-v2.component';
import { auditTime, debounceTime, filter, fromEvent, map, Subscription, take } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sd-anchor-v2',
  templateUrl: './anchor-v2.component.html',
  styleUrls: ['./anchor-v2.component.scss'],
  imports: [CommonModule, SdAnchorVerticalListV2],
  standalone: true,
})
export class SdAnchorV2 implements AfterViewInit {
  constructor(private renderer: Renderer2) {}
  @ViewChild('wrapper', { static: false }) wrapper!: ElementRef;
  @ViewChild('anchorContent', { static: false }) anchorContent!: ElementRef;

  @ContentChildren(SdAnchorItemV2) sections!: QueryList<SdAnchorItemV2>; // Danh sách sd-anchor-v2 được khai báo

  @Input() type: 'vertical' | 'horizontal' = 'vertical';
  @Input() sidebarWidth: string = '200px'; // Độ rộng của danh sách tiêu đề

  ellipsis = false; // Có thu gọn tiêu đề bằng dấu 3 chấm?
  @Input('ellipsis') set _ellipsis(value: '' | boolean | undefined | null) {
    this.ellipsis = value === '' || !!value;
  }

  isOverscroll = false; // Có cho phép scroll vượt qua sd-anchor và scroll tiếp đến phần tử bên ngoài?
  @Input('isOverscroll') set _isOverscroll(value: '' | boolean | undefined | null) {
    this.isOverscroll = value === '' || !!value;
  }

  isHiddenAnchorList = false; // Có ẩn danh sách tiêu đề section hay không?
  @Input('isHiddenAnchorList') set _isHiddenAnchorList(value: '' | boolean | undefined | null) {
    this.isHiddenAnchorList = value === '' || !!value;
  }

  // RxJS
  // Note : Scroll bằng con lăn chuột hay scroll bằng click thì tại 1 thời điểm chỉ được lắng nghe 1 Rxjs
  #scrollSubscription = new Subscription(); // Scroll bằng con lăn chuột
  #clickScrollSubscription = new Subscription(); // Scroll bằng click
  // End

  // Variables Private
  #delay: number = 100;
  #currentScrollTop: number = 0;
  #timeoutId: ReturnType<typeof setTimeout> | null = null;
  // End

  // Variables Public
  activeSectionId: string = '';
  // End

  ngAfterViewInit(): void {
    if (!this.isHiddenAnchorList) {
      this.activeSectionId = this.sections?.first?.id ?? ''; // Active section đầu tiên
      this.#registerScrollSubscription(); // Đăng ký Rxjs Scroll bằng con lăn chuột
      this.#setWidthAnchorContent()
    }
  }

  #registerScrollSubscription = (): void => {
    this.#disposeResources(); // Giải phóng tất cả subscription và timer cũ
    const wrapperEl = this.wrapper.nativeElement;
    const scroll$ = fromEvent<UIEvent>(wrapperEl, 'scroll').pipe(debounceTime(this.#delay));
    this.#scrollSubscription = scroll$.subscribe((event: UIEvent) => {
      const elementTarget = event.target as HTMLElement;
      this.#currentScrollTop = this.#updateCurrentScroll(elementTarget); // Ví trí scroll hiện tại
      for (const section of this.sections) {
        // Vùng section chiếm diện tích
        const rect = section?.elementRef?.nativeElement;
        const rectTop = rect.offsetTop;
        const rectBottom = rectTop + rect.offsetHeight;
        // End
        if (this.#currentScrollTop >= rectTop && this.#currentScrollTop < rectBottom) {
          this.activeSectionId = section?.id;
          break;
        }
      }
    });
  };

  scrollSectionByClick(idSectionTarget: string): void {
    // Khi scrollByClick sẽ có 2 case xảy ra:
    // Case 1 : Được scroll (ElementTarget không nằm trong vùng viewport và được scroll đến vị trí)
    // Case 2 : Không được scroll (ElementTarget đã được scroll trước đó hoặc đã nằm trong vùng viewport luôn)

    this.activeSectionId = idSectionTarget;
    const targetSection = this.sections.find(s => s?.id === this.activeSectionId)?.elementRef;
    if (!targetSection) {
      return;
    }

    this.#disposeResources(); // Giải phóng tất cả subscription và timer cũ
    const wrapperEl = this.wrapper.nativeElement;
    const targetElement = targetSection.nativeElement;
    const prevScrollTop = this.#currentScrollTop; // Lưu lại ví trí trước khi scroll bởi event click

    // Case 1: Nếu được Scroll check điều kiện để đăng ký lại Rxjs Scroll bằng con lăn chuột
    const clickScrollEnd$ = fromEvent<UIEvent>(wrapperEl, 'scroll');
    this.#clickScrollSubscription = clickScrollEnd$
      .pipe(
        auditTime(this.#delay),
        map((event: UIEvent) => {
          const elementTarget = event.target as HTMLElement;
          this.#currentScrollTop = this.#updateCurrentScroll(elementTarget); // Cập nhật vị trí sau mỗi lần #delay
          const wrapperTop = wrapperEl.getBoundingClientRect().top;
          const targetRect = targetElement.getBoundingClientRect();
          const targetTop = targetRect.top;
          const isVisible = targetRect.top >= 0 && targetRect.bottom <= window.innerHeight; // Nằm trong viewPort
          return Math.abs(targetTop - wrapperTop) < 1 || isVisible; // Đã được scroll tới hoặc element đã nằm trong vùng viewPort
        }),
        filter(Boolean),
        debounceTime(this.#delay + 100),
        take(1)
      )
      .subscribe(() => {
        this.#registerScrollSubscription(); // Đã xác nhận scroll xong thì mới đăng ký lại Rxjs Scroll bằng con lăn chuột
      });
    // // End

    // Case 2: Nếu không được scroll thì sau (#delay + 100) đăng ký lại Rxjs Scroll bằng con lăn chuột
    this.#timeoutId = setTimeout(() => {
      if (prevScrollTop === this.#currentScrollTop) {
        this.#registerScrollSubscription();
      }
    }, this.#delay + 100);

    wrapperEl.scrollTo({ top: targetElement.offsetTop, behavior: 'smooth' }); // Action scroll
    // End
  }

  #updateCurrentScroll(elementTarget: HTMLElement): number {
    const style = getComputedStyle(elementTarget);
    const paddingTop = parseFloat(style.paddingTop);
    const borderTop = parseFloat(style.borderTopWidth);
    return elementTarget.scrollTop + paddingTop + borderTop; // Vị trí scroll thực tế nếu có padding, border
  }

  // Giải phóng tất cả subscription và timer đang hoạt động
  #disposeResources = (): void => {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
    }
    this.#scrollSubscription?.unsubscribe();
    this.#clickScrollSubscription?.unsubscribe();
  };

  // Thiết lập chiều rộng nội dung phụ thuộc vào chiều rộng danh sách tiêu đề section
  #setWidthAnchorContent = (): void => {
    const gap = '16px'; // Khoảng cách giữa nội dung và danh sách tiêu đề section
    this.renderer.setStyle(this.anchorContent.nativeElement, 'width', `calc(100% - ${this.sidebarWidth} - ${gap})`);
  };

  ngOnDestroy(): void {
    this.#disposeResources();
  }
}
