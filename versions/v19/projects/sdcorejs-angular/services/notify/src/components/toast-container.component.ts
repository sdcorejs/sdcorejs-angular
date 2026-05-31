import { Component, signal, WritableSignal } from '@angular/core';
import { ToastData } from '../notify.model';
import { ToastComponent } from './toast/toast.component';

@Component({
  selector: 'toast-container',
  standalone: true,
  imports: [ToastComponent],
  template: `
    <div class="toast-container">
      @for (toast of toasts(); track toast.id) {
        <toast [data]="toast"> </toast>
      }
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        pointer-events: none; /* Cho phép click xuyên qua vùng trống */
      }
      sd-toast {
        pointer-events: auto; /* Bật lại click cho toast */
      }
    `,
  ],
})
export class ToastContainerComponent {
  toasts: WritableSignal<ToastData[]> = signal([]);
}
