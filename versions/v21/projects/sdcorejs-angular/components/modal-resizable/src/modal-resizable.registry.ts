import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Sổ đăng ký các panel `<sd-modal-resizable>` đang sống.
 *
 * why: mỗi panel được portal ra thẳng `document.body` nên việc xếp chỗ (width/right) là bài toán
 * chung của cả stack. Trước đây `#arrangePanels` quét `document.querySelectorAll('.modal-resizable')`
 * — query đó bắt MỌI phần tử mang class này trong tài liệu, kể cả markup của component khác hoặc
 * của app dùng trùng tên class, rồi ghi đè inline style lên chúng. Registry giới hạn phạm vi ghi
 * đúng vào các instance do library tạo ra và còn sống.
 */
@Injectable({ providedIn: 'root' })
export class SdModalResizableRegistry {
  // why: dùng token DOCUMENT thay vì global `document`, đồng bộ với `preview-image` — service
  // `providedIn:'root'` có thể được khởi tạo trong quá trình render phía server.
  readonly #document = inject(DOCUMENT);

  // Set giữ nguyên thứ tự đăng ký → thứ tự xếp chỗ ổn định, khớp thứ tự panel được mở.
  readonly #ids = new Set<string>();

  register(id: string): void {
    this.#ids.add(id);
  }

  unregister(id: string): void {
    this.#ids.delete(id);
  }

  /**
   * Phần tử panel của các instance đã đăng ký và đang có mặt trong DOM.
   * Instance đã destroy hoặc chưa attach portal sẽ bị bỏ qua.
   */
  panels(): HTMLElement[] {
    const elements: HTMLElement[] = [];
    for (const id of this.#ids) {
      const element = this.#document.getElementById(id);
      if (element) elements.push(element);
    }
    return elements;
  }
}
