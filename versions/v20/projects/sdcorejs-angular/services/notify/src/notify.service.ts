import { DOCUMENT } from '@angular/common';
import { ApplicationRef, createComponent, EnvironmentInjector, inject, Injectable, signal } from '@angular/core';
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
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  readonly #i18n = inject(I18nService);

  constructor() {
    this.#initContainer();
  }

  #initContainer() {
    const componentRef = createComponent(ToastContainerComponent, {
      environmentInjector: this.injector,
    });
    componentRef.instance.toasts = this.toasts;
    this.appRef.attachView(componentRef.hostView);
    const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    this.document.body.appendChild(domElem);
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
