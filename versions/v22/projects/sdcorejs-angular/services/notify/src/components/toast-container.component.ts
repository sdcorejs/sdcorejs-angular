import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, OnDestroy, signal, WritableSignal } from '@angular/core';
import { ToastData } from '../notify.model';
import { ToastComponent } from './toast/toast.component';

/** Độ trễ giữa lúc xoá và lúc ghi lại một region, để screen reader nhận ra nội dung thay đổi. */
const ANNOUNCE_DELAY_MS = 100;

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'toast-container',
  standalone: true,
  imports: [ToastComponent],
  template: `
    <div class="toast-container">
      @for (toast of toasts(); track toast.id) {
        <toast [data]="toast"> </toast>
      }
    </div>
    <!-- why: a live region must be in the DOM BEFORE its content changes for screen readers to announce
         it reliably; a new toast that carries aria-live itself is often skipped. Both regions live as long
         as the container (D-027). -->
    <div class="toast-live-region" role="status" aria-live="polite" aria-atomic="true" data-autoid="services-notify-live-polite">
      {{ politeMessage() }}
    </div>
    <div class="toast-live-region" role="alert" aria-live="assertive" aria-atomic="true" data-autoid="services-notify-live-assertive">
      {{ assertiveMessage() }}
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: var(--sd-z-overlay, 9999);
        display: flex;
        flex-direction: column;
        pointer-events: none; /* Cho phép click xuyên qua vùng trống */
      }
      /* why: the old "sd-toast" selector matched nothing (the element is <toast>). */
      toast {
        pointer-events: auto; /* Bật lại click cho toast */
      }
      .toast-live-region {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ],
})
export class ToastContainerComponent implements OnDestroy {
  toasts: WritableSignal<ToastData[]> = signal([]);
  readonly politeMessage = signal('');
  readonly assertiveMessage = signal('');
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();

  /**
   * Đọc `text` qua region tương ứng. Region được xoá trước rồi mới ghi lại sau một nhịp ngắn, để hai
   * thông báo giống hệt nhau liên tiếp vẫn được đọc.
   */
  announce(politeness: 'polite' | 'assertive', text: string): void {
    const region = politeness === 'assertive' ? this.assertiveMessage : this.politeMessage;
    region.set('');
    const timer = setTimeout(() => {
      this.#timers.delete(timer);
      region.set(text);
    }, ANNOUNCE_DELAY_MS);
    this.#timers.add(timer);
  }

  ngOnDestroy(): void {
    this.#timers.forEach(timer => clearTimeout(timer));
    this.#timers.clear();
  }
}
