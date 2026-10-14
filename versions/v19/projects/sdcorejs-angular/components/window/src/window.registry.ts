import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Sổ đăng ký các panel `<sd-window>` đang sống.
 *
 * why: mỗi panel được portal ra thẳng `document.body` nên việc xếp chỗ (width/right) là bài toán
 * chung của cả stack. Trước đây `#arrangePanels` quét `document.querySelectorAll('.modal-resizable')`
 * — query đó bắt MỌI phần tử mang class này trong tài liệu, kể cả markup của component khác hoặc
 * của app dùng trùng tên class, rồi ghi đè inline style lên chúng. Registry giới hạn phạm vi ghi
 * đúng vào các instance do library tạo ra và còn sống.
 */
@Injectable({ providedIn: 'root' })
export class SdWindowRegistry {
  // why: dùng token DOCUMENT thay vì global `document`, đồng bộ với `preview-image` — service
  // `providedIn:'root'` có thể được khởi tạo trong quá trình render phía server.
  readonly #document = inject(DOCUMENT);

  // Set giữ nguyên thứ tự đăng ký → thứ tự xếp chỗ ổn định, khớp thứ tự panel được mở.
  readonly #ids = new Set<string>();
  #activeId?: string;

  register(id: string): void {
    this.#ids.add(id);
  }

  unregister(id: string): void {
    this.#ids.delete(id);
    if (this.#activeId === id) this.#activeId = undefined;
    this.arrange();
  }

  activate(id: string): void {
    if (!this.#ids.has(id)) return;
    this.#activeId = id;
    this.arrange();
  }

  /** Bound every window to the viewport; overflow stacks overlap and focus raises the chosen window. */
  arrange(): void {
    const layoutWidth = this.#document.documentElement.clientWidth;
    const windowWidth = this.#document.defaultView?.innerWidth ?? layoutWidth;
    const viewport = layoutWidth > 0 ? Math.min(layoutWidth, windowWidth) : windowWidth;
    const gutter = Math.min(8, viewport / 2);
    const available = Math.max(0, viewport - gutter * 2);
    const rtl = this.#document.documentElement.dir === 'rtl' || this.#document.body.dir === 'rtl';
    let offset = gutter;
    for (const panel of this.panels()) {
      if (panel.classList.contains('c-closed')) continue;
      const fullscreen = panel.classList.contains('c-fullscreen') && !panel.classList.contains('c-minium');
      const requested = panel.classList.contains('c-minium') ? 300 : Number.parseFloat(panel.dataset['width'] || '');
      if (!fullscreen && (!Number.isFinite(requested) || requested <= 0)) continue;
      const width = fullscreen ? available : Math.min(requested, available);
      const inset = fullscreen ? gutter : Math.min(offset, Math.max(gutter, viewport - width - gutter));
      panel.style.width = fullscreen ? 'calc(100% - 16px)' : `${width}px`;
      panel.style.setProperty(rtl ? 'left' : 'right', `${inset}px`);
      panel.style.removeProperty(rtl ? 'right' : 'left');
      panel.style.zIndex =
        panel.id === this.#activeId || (!this.#activeId && fullscreen) ? 'var(--sd-z-drawer, 999)' : 'var(--sd-z-backdrop, 998)';
      if (!fullscreen) offset += width + 8;
    }
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
