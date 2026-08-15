import { DOCUMENT } from '@angular/common';
import { ApplicationRef, ComponentRef, createComponent, DestroyRef, EnvironmentInjector, inject, Injectable, signal } from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';

import { I18nService } from '@sdcorejs/angular/i18n';

import { ToastContainerComponent } from './components/toast-container.component';
import { NotifyOption, ToastData, ToastType } from './notify.model';

@Injectable({
  providedIn: 'root',
})
export class SdNotifyService {
  readonly toasts = signal<ToastData[]>([]);

  // Constants
  readonly #DEBOUNCE_TIME = 500;
  readonly #DEFAULT_SUCCESS_DURATION = 3000;
  readonly #DEFAULT_BUFFERED_DURATION = 5000;
  readonly #MAX_TOASTS = 5;

  // State
  #buffer: Record<string, string[]> = {};
  #timers: Record<string, ReturnType<typeof setTimeout> | null> = {};
  #containerRef?: ComponentRef<ToastContainerComponent>;
  #containerElement?: HTMLElement;
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #i18n = inject(I18nService);
  /** Đặt trong `#teardown()` — mọi API public trở thành no-op sau khi injector bị destroy. */
  #destroyed = false;

  constructor() {
    this.#initContainer();
    // why: providedIn:'root' KHÔNG có nghĩa là sống mãi — root injector vẫn bị destroy
    // (TestBed reset, mỗi request khi SSR, micro-frontend unmount). Không có hook teardown thì
    // ComponentRef + node <body> ở lại vĩnh viễn và timer debounce đang chờ sẽ flush vào signal
    // của service đã chết → toast ma + leak view/DOM tích luỹ theo từng lần bootstrap.
    this.#destroyRef.onDestroy(() => this.#teardown());
  }

  #initContainer() {
    const componentRef = createComponent(ToastContainerComponent, {
      environmentInjector: this.injector,
    });
    componentRef.instance.toasts = this.toasts;
    this.appRef.attachView(componentRef.hostView);
    const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    this.document.body.appendChild(domElem);
    this.#containerRef = componentRef;
    this.#containerElement = domElem;
  }

  #teardown() {
    // why: cờ này chặn MỌI lời gọi sau teardown. Chỉ dọn timer đang chờ là chưa đủ: một
    // `error()`/`warning()` gọi sau khi injector đã destroy vẫn chạy `#addToBuffer` và hẹn một
    // timer 500ms MỚI mà không còn ai clear — nó flush vào signal của service đã chết.
    this.#destroyed = true;
    // why: dọn timer TRƯỚC khi huỷ view — flush chạy sau khi container đã destroy sẽ
    // update signal mà không còn ai render, thuần tuý là công vô ích trên state đã chết.
    this.#clearAllTimers();
    this.#buffer = {};

    const componentRef = this.#containerRef;
    const containerElement = this.#containerElement;
    this.#containerRef = undefined;
    this.#containerElement = undefined;

    // why: hook destroy của service chạy SAU ApplicationRef.destroy() khi root injector bị tháo
    // (hook đăng ký theo thứ tự khởi tạo, mà appRef luôn có trước). Lúc đó view đã bị huỷ và
    // detachView chỉ log NG0406 — nên chỉ detach khi appRef còn sống.
    if (componentRef && !this.appRef.destroyed && !componentRef.hostView.destroyed) {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    }
    // why: createComponent() tạo host node rời rồi ta tự appendChild, nên destroy() không
    // bảo đảm gỡ node khỏi <body> — gỡ tay để không để lại rác DOM. remove() an toàn khi
    // node đã bị tách.
    containerElement?.remove();
  }

  // Public API
  success(message: string, option?: NotifyOption) {
    this.#addImmediate('success', message, option);
  }

  info(message: string, option?: NotifyOption) {
    this.#addImmediate('info', message, option);
  }

  warning(message: string | string[], option?: NotifyOption) {
    this.#addToBuffer('warning', message, option);
  }

  error(message: string | string[], option?: NotifyOption) {
    this.#addToBuffer('error', message, option);
  }

  remove(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clearAll() {
    this.toasts.set([]);
    this.#clearAllTimers();
  }

  clearByType(type: ToastType) {
    this.toasts.update(current => current.filter(t => t.type !== type));
  }

  // Private helpers
  #addImmediate(type: ToastType, message: string, option?: NotifyOption) {
    if (this.#destroyed) return;
    const newToast: ToastData = {
      id: Utilities.generateUuid(),
      type,
      message,
      title: option?.title,
      duration: option?.duration ?? this.#DEFAULT_SUCCESS_DURATION,
      actionLabel: option?.actionLabel,
      onAction: option?.onAction,
      html: option?.html,
    };

    this.toasts.update(current => {
      const updated = [newToast, ...current];
      return updated.slice(0, this.#MAX_TOASTS);
    });
  }

  #addToBuffer(type: ToastType, message: string | string[], option?: NotifyOption) {
    if (this.#destroyed) return;
    if (!this.#buffer[type]) {
      this.#buffer[type] = [];
    }

    const msgs = Array.isArray(message) ? message : [message];
    this.#buffer[type].push(...msgs);

    // Clear existing timer and set new one
    if (this.#timers[type]) {
      clearTimeout(this.#timers[type]!);
    }

    this.#timers[type] = setTimeout(() => {
      this.#flushBuffer(type, option);
    }, this.#DEBOUNCE_TIME);
  }

  #flushBuffer(type: ToastType, option?: NotifyOption) {
    const messages = [...new Set(this.#buffer[type])];

    // Cleanup
    this.#buffer[type] = [];
    this.#timers[type] = null;

    if (messages.length === 0) return;

    const title = option?.title ?? this.#i18n.t(`core.notify.type.${type}`);
    const finalTitle = messages.length > 1 ? `${title} (${messages.length})` : title;

    const newToast: ToastData = {
      id: Utilities.generateUuid(),
      type,
      message: messages.length === 1 ? messages[0] : messages,
      title: finalTitle,
      duration: option?.duration ?? this.#DEFAULT_BUFFERED_DURATION,
      actionLabel: option?.actionLabel,
      onAction: option?.onAction,
      html: option?.html,
    };

    this.toasts.update(current => {
      const updated = [newToast, ...current];
      return updated.slice(0, this.#MAX_TOASTS);
    });
  }

  #clearAllTimers() {
    Object.values(this.#timers).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    this.#timers = {};
  }
}
