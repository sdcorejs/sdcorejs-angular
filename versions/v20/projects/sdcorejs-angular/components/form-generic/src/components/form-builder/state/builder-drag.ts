import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable, NgZone, signal } from '@angular/core';
import { CanvasGeometry, DragSubject, hitTest, itemSpan, planDrop } from './builder-layout';
import { BuilderDragState, FormBuilderStore } from './builder-store';

/** Canvas đăng ký với dịch vụ kéo-thả để được đo hình học và cuộn tự động. */
export interface CanvasDropTarget {
  /** Phần tử cuộn của canvas. */
  readonly scroller: HTMLElement;
  /** Đo hàng/phần tử/group theo toạ độ NỘI DUNG của `scroller`. */
  measure(): CanvasGeometry;
}

export interface DragStartRequest {
  /** Tạo subject lúc kéo THỰC SỰ bắt đầu (palette tạo phần tử mới với id/key mới). */
  readonly subject: () => DragSubject;
  readonly label: string;
  readonly icon: string;
  readonly isGroup: boolean;
  /** Số cột phần tử sẽ chiếm (dùng khi xét "cùng hàng"). */
  readonly span: number;
}

interface DragSession {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  lastX: number;
  lastY: number;
  started: boolean;
  readonly request: DragStartRequest;
  subject?: DragSubject;
  ghost?: HTMLElement;
  frame?: number;
  lastKey?: string;
  onScroll?: () => void;
}

/** Khoảng di chuyển (px) trước khi một pointerdown thành thao tác kéo — dưới ngưỡng là click. */
export const DRAG_THRESHOLD = 5;
/** Vùng sát mép trên/dưới canvas kích hoạt cuộn tự động. */
const AUTOSCROLL_EDGE = 56;
const AUTOSCROLL_MAX_STEP = 18;

/**
 * Điều khiển kéo-thả của MỘT builder, dựng trên Pointer Events (chuột, bút, cảm ứng).
 *
 * why: CDK DragDrop mô hình hoá "sắp xếp một danh sách" — không biểu diễn được ý định 2D của canvas
 * (hàng mới / cùng hàng / vào group) mà không chắp vá nhiều target cạnh tranh. Ở đây: gesture +
 * ghost + cuộn tự động nằm trong dịch vụ; ý định do hàm thuần `hitTest` + `planDrop` quyết định,
 * dùng CHUNG cho indicator và commit. Schema chỉ đổi MỘT lần lúc thả; Escape/thả ra ngoài = không đổi.
 */
@Injectable()
export class BuilderDragService {
  readonly #store = inject(FormBuilderStore);
  readonly #zone = inject(NgZone);
  readonly #document = inject(DOCUMENT);
  #target?: CanvasDropTarget;
  #session: DragSession | null = null;

  /** Hình học đo lúc bắt đầu kéo (và đo lại khi canvas đổi kích thước) — canvas vẽ indicator theo nó. */
  readonly geometry = signal<CanvasGeometry | null>(null);
  /**
   * Vị trí cuộn của canvas trong lúc kéo. Lớp phản hồi (indicator) nằm NGOÀI vùng cuộn nên đổi toạ độ
   * nội dung sang toạ độ khung nhìn bằng offset này.
   */
  readonly scroll = signal<{ readonly top: number; readonly left: number }>({ top: 0, left: 0 });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#end(false));
  }

  get active(): boolean {
    return !!this.#session?.started;
  }

  registerTarget(target: CanvasDropTarget): () => void {
    this.#target = target;
    return () => {
      if (this.#target === target) this.#target = undefined;
    };
  }

  /** Đo lại hình học (canvas gọi khi kích thước nội dung đổi trong lúc kéo). */
  remeasure(): void {
    if (!this.#session?.started || !this.#target) return;
    this.geometry.set(this.#target.measure());
    this.#evaluate();
  }

  /**
   * Ghi nhận pointerdown. Kéo chỉ bắt đầu khi con trỏ đi quá `DRAG_THRESHOLD` — dưới ngưỡng thì
   * `click` bình thường vẫn chạy (thêm field / chọn field).
   */
  arm(event: PointerEvent, request: DragStartRequest): void {
    if (event.button !== 0 || this.#session) return;
    if (this.#store.mode() !== 'design') return;
    this.#session = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      started: false,
      request,
    };
    this.#zone.runOutsideAngular(() => {
      this.#document.addEventListener('pointermove', this.#onMove, true);
      this.#document.addEventListener('pointerup', this.#onUp, true);
      this.#document.addEventListener('pointercancel', this.#onCancel, true);
      // why: Escape nghe ở `window` (capture), KHÔNG ở `document`. zone.js gộp mọi listener cùng
      // (target, event, capture) vào MỘT listener native với options của lần đăng ký đầu, và CDK
      // InputModalityDetector đăng ký `keydown` capture trên document với `passive: true` — ở đó
      // `preventDefault()` bị trình duyệt bỏ qua (kèm lỗi console).
      this.#keyTarget().addEventListener('keydown', this.#onKeydown as EventListener, true);
    });
  }

  #keyTarget(): Window | Document {
    return this.#document.defaultView ?? this.#document;
  }

  /** Huỷ thao tác kéo hiện tại — schema không đổi. */
  cancel(): void {
    this.#end(false);
  }

  #onMove = (event: PointerEvent): void => {
    const session = this.#session;
    if (!session || event.pointerId !== session.pointerId) return;
    session.lastX = event.clientX;
    session.lastY = event.clientY;
    if (!session.started) {
      if (Math.hypot(event.clientX - session.startX, event.clientY - session.startY) < DRAG_THRESHOLD) return;
      this.#start(session);
    }
    event.preventDefault();
    this.#moveGhost(session);
    this.#evaluate();
  };

  #onUp = (event: PointerEvent): void => {
    const session = this.#session;
    if (!session || event.pointerId !== session.pointerId) return;
    session.lastX = event.clientX;
    session.lastY = event.clientY;
    if (session.started) {
      this.#evaluate();
      this.#suppressNextClick();
    }
    this.#end(session.started);
  };

  #onCancel = (event: PointerEvent): void => {
    if (this.#session && event.pointerId === this.#session.pointerId) this.#end(false);
  };

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.#session?.started) return;
    event.preventDefault();
    event.stopPropagation();
    this.#swallowClickAfterRelease();
    this.#end(false);
  };

  /**
   * Huỷ bằng Escape khi nút chuột còn giữ: lần nhả sau đó vẫn sinh `click` trên phần tử bên dưới
   * (vd chính mục palette → thêm field dù đã huỷ). Nuốt click đi kèm lần `pointerup` kế tiếp.
   */
  #swallowClickAfterRelease(): void {
    const options = { capture: true } as const;
    const onUp = () => {
      this.#document.removeEventListener('pointerdown', onDown, options);
      this.#suppressNextClick();
    };
    // Nút đã được nhả ở nơi không phát pointerup (ngoài cửa sổ…) → lần nhấn mới không bị nuốt nhầm.
    const onDown = () => this.#document.removeEventListener('pointerup', onUp, options);
    this.#document.addEventListener('pointerup', onUp, { ...options, once: true });
    this.#document.addEventListener('pointerdown', onDown, { ...options, once: true });
  }

  #start(session: DragSession): void {
    session.started = true;
    session.subject = session.request.subject();
    if (this.#target) this.geometry.set(this.#target.measure());
    session.ghost = this.#createGhost(session.request);
    const scroller = this.#target?.scroller;
    if (scroller) {
      session.onScroll = () => this.#syncScroll();
      scroller.addEventListener('scroll', session.onScroll, { passive: true });
    }
    this.#zone.run(() => {
      this.scroll.set({ top: scroller?.scrollTop ?? 0, left: scroller?.scrollLeft ?? 0 });
      const state: BuilderDragState = { subject: session.subject!, label: session.request.label, icon: session.request.icon, intent: null };
      this.#store.drag.set(state);
    });
    const loop = () => {
      if (this.#session !== session) return;
      this.#autoscroll(session);
      session.frame = requestAnimationFrame(loop);
    };
    session.frame = requestAnimationFrame(loop);
  }

  #evaluate(): void {
    const session = this.#session;
    const target = this.#target;
    const geometry = this.geometry();
    if (!session?.started || !session.subject) return;
    let intent: BuilderDragState['intent'] = null;
    let hint: BuilderDragState['hint'];
    if (target && geometry) {
      const rect = target.scroller.getBoundingClientRect();
      const x = session.lastX - rect.left + target.scroller.scrollLeft;
      const y = session.lastY - rect.top + target.scroller.scrollTop;
      const insideCanvas =
        session.lastX >= rect.left && session.lastX <= rect.right && session.lastY >= rect.top && session.lastY <= rect.bottom;
      const store = this.#store;
      const mode = store.layoutMode();
      const moving = session.subject.kind === 'move' ? store.index().get(session.subject.id)?.item : undefined;
      const span = moving ? itemSpan(moving, mode) : session.request.span;
      const hit = insideCanvas
        ? hitTest(
            geometry,
            parentId => store.rowsOf(parentId),
            x,
            y,
            {
              id: session.subject.kind === 'move' ? session.subject.id : undefined,
              isGroup: session.request.isGroup,
              span,
              adaptive: session.subject.kind === 'new' && !session.request.isGroup,
            },
            mode
          )
        : { intent: null };
      hint = hit.hint ?? (insideCanvas ? undefined : 'outside');
      if (hit.intent) {
        const plan = planDrop(store.doc(), hit.intent, session.subject, mode);
        if (plan.ok) intent = hit.intent;
        else if (plan.reason === 'row-full' || plan.reason === 'nested-group') hint = plan.reason;
      }
    }
    const key = JSON.stringify([intent, hint]);
    if (key === session.lastKey) return;
    session.lastKey = key;
    this.#zone.run(() => this.#store.drag.update(state => (state ? { ...state, intent, hint } : state)));
  }

  #autoscroll(session: DragSession): void {
    const scroller = this.#target?.scroller;
    if (!scroller || !session.started) return;
    const rect = scroller.getBoundingClientRect();
    if (session.lastX < rect.left - AUTOSCROLL_EDGE || session.lastX > rect.right + AUTOSCROLL_EDGE) return;
    let step = 0;
    if (session.lastY < rect.top + AUTOSCROLL_EDGE)
      step = -Math.ceil(((rect.top + AUTOSCROLL_EDGE - session.lastY) / AUTOSCROLL_EDGE) * AUTOSCROLL_MAX_STEP);
    else if (session.lastY > rect.bottom - AUTOSCROLL_EDGE)
      step = Math.ceil(((session.lastY - (rect.bottom - AUTOSCROLL_EDGE)) / AUTOSCROLL_EDGE) * AUTOSCROLL_MAX_STEP);
    if (!step) return;
    const before = scroller.scrollTop;
    scroller.scrollTop = before + Math.max(-AUTOSCROLL_MAX_STEP, Math.min(AUTOSCROLL_MAX_STEP, step));
    if (scroller.scrollTop !== before) this.#evaluate();
  }

  #syncScroll(): void {
    const scroller = this.#target?.scroller;
    if (!scroller) return;
    const current = this.scroll();
    if (current.top === scroller.scrollTop && current.left === scroller.scrollLeft) return;
    this.#zone.run(() => this.scroll.set({ top: scroller.scrollTop, left: scroller.scrollLeft }));
  }

  #end(commit: boolean): void {
    const session = this.#session;
    if (!session) return;
    this.#session = null;
    if (session.onScroll) this.#target?.scroller.removeEventListener('scroll', session.onScroll);
    this.#document.removeEventListener('pointermove', this.#onMove, true);
    this.#document.removeEventListener('pointerup', this.#onUp, true);
    this.#document.removeEventListener('pointercancel', this.#onCancel, true);
    this.#keyTarget().removeEventListener('keydown', this.#onKeydown as EventListener, true);
    if (session.frame !== undefined) cancelAnimationFrame(session.frame);
    session.ghost?.remove();
    if (!session.started) return;
    this.#zone.run(() => {
      const state = this.#store.drag();
      if (commit && state?.intent && session.subject) this.#store.drop(state.intent, session.subject, session.request.label);
      this.#store.drag.set(null);
      this.geometry.set(null);
    });
  }

  /** Trình duyệt phát `click` sau pointerup trên cùng phần tử — sau khi kéo thì click đó phải bị nuốt. */
  #suppressNextClick(): void {
    const swallow = (event: Event) => {
      event.stopPropagation();
      event.preventDefault();
    };
    this.#document.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => this.#document.removeEventListener('click', swallow, { capture: true }), 0);
  }

  #createGhost(request: DragStartRequest): HTMLElement {
    const ghost = this.#document.createElement('div');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.className = 'sd-form-builder-ghost';
    // why: ghost gắn vào <body> (thoát mọi containing block transform của host) nên không nhận style
    // encapsulated của component — style inline, màu qua token (fallback đúng giá trị 2.15).
    Object.assign(ghost.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      zIndex: '10000',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      maxWidth: '280px',
      padding: '8px 12px',
      borderRadius: 'var(--sd-radius-8, 8px)',
      border: '1px solid var(--sd-primary)',
      background: 'var(--sd-surface, #ffffff)',
      color: 'var(--sd-text)',
      boxShadow: 'var(--sd-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.12))',
      font: '500 13px/18px Roboto, system-ui, sans-serif',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      opacity: '0.96',
      // why: lớp composite riêng — ghost di chuyển mỗi pointermove mà không vẽ lại trang bên dưới.
      willChange: 'transform',
    } satisfies Partial<CSSStyleDeclaration>);
    const icon = this.#document.createElement('span');
    icon.className = 'material-icons-outlined';
    icon.textContent = request.icon;
    Object.assign(icon.style, { fontFamily: "'Material Icons Outlined'", fontSize: '18px', color: 'var(--sd-primary)' });
    const label = this.#document.createElement('span');
    label.textContent = request.label;
    ghost.append(icon, label);
    this.#document.body.appendChild(ghost);
    return ghost;
  }

  #moveGhost(session: DragSession): void {
    if (session.ghost) session.ghost.style.transform = `translate(${session.lastX + 14}px, ${session.lastY + 14}px)`;
  }
}
