import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Khoá scroll của `document.body` theo kiểu đếm tham chiếu (ref-count).
 *
 * why: mỗi drawer tự lưu/khôi phục `document.body.style.overflow` là KHÔNG stack-safe. Với hai
 * drawer chồng nhau: drawer ngoài lưu `''` rồi set `'hidden'`; drawer trong lưu `'hidden'` (giá trị
 * do drawer ngoài vừa ghi) rồi cũng set `'hidden'`. Đóng drawer ngoài trước → khôi phục `''` →
 * trang scroll lại được dù drawer trong vẫn mở; đóng drawer trong sau → khôi phục `'hidden'` →
 * trang KHOÁ SCROLL VĨNH VIỄN dù không còn drawer nào. Ref-count chỉ ghi DOM ở lần khoá đầu và
 * lần nhả cuối, nên thứ tự đóng không còn ảnh hưởng.
 */
interface SdBodyScrollLockState {
  count: number;
  previousOverflow: string | null;
  /** `padding-right` inline trước khi khoá; `null` khi lần khoá hiện tại không bù padding. */
  previousPaddingRight: string | null;
}

/**
 * why: state nằm ở MODULE, khoá theo `Document`, KHÔNG nằm trong instance service.
 * `providedIn: 'root'` cho một instance mỗi *ứng dụng Angular*, không phải mỗi *document*. Hai app
 * bootstrap độc lập trên cùng một trang (micro-frontend, widget nhúng) sẽ có hai bộ đếm riêng, mỗi
 * bên chụp lại `overflow` mà bên kia vừa ghi — tái lập đúng bug khoá-scroll-vĩnh-viễn mà service
 * này sinh ra để sửa, chỉ dịch lên một tầng. Khoá theo `Document` thì mọi instance trong cùng
 * document dùng chung một bộ đếm, bất kể injector nào tạo ra chúng.
 */
const scrollLockStates = new WeakMap<Document, SdBodyScrollLockState>();

const stateFor = (doc: Document): SdBodyScrollLockState => {
  let state = scrollLockStates.get(doc);
  if (!state) {
    state = { count: 0, previousOverflow: null, previousPaddingRight: null };
    scrollLockStates.set(doc, state);
  }
  return state;
};

@Injectable({ providedIn: 'root' })
export class SdBodyScrollLockService {
  readonly #document = inject(DOCUMENT);

  /** Số lượng khoá đang giữ trên document này — phục vụ chẩn đoán/test. */
  get count(): number {
    return stateFor(this.#document).count;
  }

  lock(): void {
    const state = stateFor(this.#document);
    const body = this.#document.body;
    if (!body) return;
    if (state.count === 0) {
      state.previousOverflow = body.style.overflow;
      // why: đo TRƯỚC khi ẩn overflow — sau đó scrollbar đã biến mất và độ rộng đo được luôn là 0.
      const scrollbarWidth = this.#scrollbarWidth();
      body.style.overflow = 'hidden';
      // why: ẩn scrollbar làm vùng nội dung rộng thêm đúng bằng độ rộng của nó, khiến cả trang giật sang
      // phải khi drawer mở/đóng. Bù lại bằng `padding-right`; overlay scrollbar (rộng 0) thì bỏ qua.
      if (scrollbarWidth > 0) {
        state.previousPaddingRight = body.style.paddingRight;
        body.style.paddingRight = `${this.#computedPaddingRight(body) + scrollbarWidth}px`;
      }
    }
    state.count++;
  }

  release(): void {
    const state = stateFor(this.#document);
    // Nhả nhiều hơn khoá (double close, destroy sau close) không được đẩy count xuống âm,
    // nếu không lần khoá kế tiếp sẽ không ghi DOM.
    if (state.count === 0) return;
    state.count--;
    if (state.count > 0) return;
    const body = this.#document.body;
    if (body) {
      body.style.overflow = state.previousOverflow ?? '';
      if (state.previousPaddingRight !== null) body.style.paddingRight = state.previousPaddingRight;
    }
    state.previousOverflow = null;
    state.previousPaddingRight = null;
  }

  /** Độ rộng scrollbar dọc của viewport; 0 khi không đo được (SSR) hoặc dùng overlay scrollbar. */
  #scrollbarWidth(): number {
    const view = this.#document.defaultView;
    const root = this.#document.documentElement;
    if (!view || !root) return 0;
    return Math.max(0, view.innerWidth - root.clientWidth);
  }

  #computedPaddingRight(body: HTMLElement): number {
    const value = this.#document.defaultView?.getComputedStyle(body).paddingRight;
    return value ? parseFloat(value) || 0 : 0;
  }
}
