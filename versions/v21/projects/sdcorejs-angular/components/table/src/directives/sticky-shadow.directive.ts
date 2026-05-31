// sticky-shadow.directive.ts
import { afterNextRender, Directive, DestroyRef, ElementRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * Directive thêm hiệu ứng đổ bóng (elevation-2) vào cột sticky cuối cùng bên trái
 * và cột sticky đầu tiên bên phải, tạo ngăn cách trực quan với phần được scroll.
 *
 * Chỉ dùng nội bộ trong sd-table, không chìa ra ngoài.
 *
 * Gắn vào scroll container của table:
 * @example
 * <div class="c-table" stickyShadow>...</div>
 */
@Directive({
  selector: '[stickyShadow]',
  standalone: true,
})
export class StickyShadowDirective {
  readonly #el = inject(ElementRef<HTMLElement>);
  readonly #destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const container = this.#el.nativeElement;

      // Dùng MutationObserver để detect khi CDK render rows mới vào table
      // (data load async, phân trang, ...) — lúc này td mới có đủ sticky classes
      const mutationObserver = new MutationObserver(() => {
        this.#updateShadow(container);
      });

      mutationObserver.observe(container, {
        childList: true, // Theo dõi thêm/bớt các node con
        subtree: true, // Bao gồm tất cả các cấp con cháu
      });

      // Cập nhật shadow mỗi khi user scroll ngang
      fromEvent(container, 'scroll')
        .pipe(debounceTime(10), takeUntilDestroyed(this.#destroyRef))
        .subscribe(() => this.#updateShadow(container));

      // Disconnect MutationObserver khi directive bị destroy
      this.#destroyRef.onDestroy(() => mutationObserver.disconnect());
    });
  }

  /**
   * Toggle class shadow lên tất cả th và td của một cột.
   * Dùng cdk-column-{field} để xác định cột vì Angular CDK
   * add class này đồng nhất lên cả th lẫn td.
   */
  #setShadow(container: HTMLElement, colClass: string, shadowClass: string, add: boolean) {
    container.querySelectorAll<HTMLElement>(`th.${colClass}, td.${colClass}`).forEach(el => {
      el.classList.toggle(shadowClass, add);
      // Cần position relative để ::after absolute hoạt động
      if (add) {
        el.style.position = 'sticky'; // Các cell sticky đã có sẵn, chỉ đảm bảo
        el.style.overflow = 'visible';
      }
    });
  }

  /**
   * Tính toán và cập nhật shadow dựa trên vị trí scroll hiện tại.
   *
   * Angular Material đánh dấu sticky left bằng class `mat-mdc-table-sticky-border-elem-left`
   * và sticky right bằng `mat-mdc-table-sticky-border-elem-right` — dùng các class này
   * để detect thay vì getComputedStyle vì reliable hơn.
   *
   * Chỉ apply shadow cho:
   * - Cột cuối cùng trong nhóm sticky-left (sát phần scroll)
   * - Cột đầu tiên trong nhóm sticky-right (sát phần scroll)
   */
  #updateShadow(container: HTMLElement) {
    const scrollLeft = container.scrollLeft;
    const scrollRight = container.scrollWidth - container.clientWidth - scrollLeft;

    // Query trên header row đầu tiên để xác định các cột sticky
    // td sẽ được xử lý thông qua #setShadow theo cdk-column class
    const headerRow = container.querySelector<HTMLElement>('tr.c-first-header');
    if (!headerRow) return;

    const allStickyLeft = Array.from(headerRow.querySelectorAll<HTMLElement>('th.mat-mdc-table-sticky-border-elem-left'));
    const allStickyRight = Array.from(headerRow.querySelectorAll<HTMLElement>('th.mat-mdc-table-sticky-border-elem-right'));

    // Reset shadow toàn bộ các cột sticky trước khi tính lại
    allStickyLeft.forEach(th => {
      const colClass = [...th.classList].find(c => c.startsWith('cdk-column-'));
      if (colClass) this.#setShadow(container, colClass, 'sticky-shadow-right', false);
    });
    allStickyRight.forEach(th => {
      const colClass = [...th.classList].find(c => c.startsWith('cdk-column-'));
      if (colClass) this.#setShadow(container, colClass, 'sticky-shadow-left', false);
    });

    // Chỉ cột cuối cùng sticky-left có shadow khi đang scroll sang phải
    const lastStickyLeft = allStickyLeft.at(-1);
    if (lastStickyLeft && scrollLeft > 0) {
      const colClass = [...lastStickyLeft.classList].find(c => c.startsWith('cdk-column-'));
      if (colClass) this.#setShadow(container, colClass, 'sticky-shadow-right', true);
    }

    // Chỉ cột đầu tiên sticky-right có shadow khi chưa scroll hết sang phải
    const firstStickyRight = allStickyRight.at(0);
    if (firstStickyRight && scrollRight > 0) {
      const colClass = [...firstStickyRight.classList].find(c => c.startsWith('cdk-column-'));
      if (colClass) this.#setShadow(container, colClass, 'sticky-shadow-left', true);
    }
  }
}
