import { CommonModule } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { ToastData } from '../notify.model';
import { SdToastComponent } from './toast/toast.component';

@Component({
  selector: 'sd-toast-container',
  standalone: true,
  imports: [CommonModule, SdToastComponent],
  template: `
    <div class="toast-container">
      <sd-toast *ngFor="let toast of toasts()" [data]="toast"> </sd-toast>
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
export class SdToastContainerComponent {
  // 1. Khai báo biến để nhận Signal từ Service
  // Khởi tạo mặc định là mảng rỗng để không bị lỗi null
  toasts: WritableSignal<ToastData[]> = signal([]);

  // 2. XÓA constructor inject SdNotifyService
  constructor() {}
}
