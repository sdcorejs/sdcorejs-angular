import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';

@Component({
  selector: 'app-notify-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: `
    <demo-page title="Notify" description="SdNotifyService – toast container được mount một lần ở &lt;body&gt;. Thông báo success/info hiển thị ngay, warning/error gom nhóm 500ms (debounce) để tránh spam.">
      <demo-section heading="4 loại toast cơ bản (type)" note="success / info / warning / error với thông điệp ngắn.">
        <button mat-flat-button color="primary" (click)="onInfo()">info</button>
        <button mat-flat-button style="background:#2e7d32;color:#fff" (click)="onSuccess()">success</button>
        <button mat-flat-button style="background:#ed6c02;color:#fff" (click)="onWarning()">warning</button>
        <button mat-flat-button color="warn" (click)="onError()">error</button>
      </demo-section>

      <demo-section heading="thời lượng tùy chỉnh" note="duration tính bằng ms. Mặc định 3000ms cho success/info, 5000ms cho warning/error.">
        <button mat-stroked-button (click)="onShort()">Toast 1.5 giây</button>
        <button mat-stroked-button (click)="onLong()">Toast 8 giây</button>
      </demo-section>

      <demo-section heading="toast có nút hành động" note="actionLabel + onAction để gắn nút bấm vào toast.">
        <button mat-stroked-button color="primary" (click)="onAction()">Toast có nút "Hoàn tác"</button>
      </demo-section>

      <demo-section heading="dọn dẹp" note="clearAll() xóa toàn bộ; clearByType('error') xóa theo loại.">
        <button mat-stroked-button (click)="onSpam()">Tạo 3 toast cùng lúc</button>
        <button mat-stroked-button color="warn" (click)="onClear()">Xóa tất cả</button>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotifyDemoComponent {
  readonly #notify = inject(SdNotifyService);

  onInfo() { this.#notify.info('Đã tải dữ liệu xong.'); }
  onSuccess() { this.#notify.success('Lưu bản ghi thành công.'); }
  onWarning() { this.#notify.warning('Dung lượng tệp gần đạt giới hạn.'); }
  onError() { this.#notify.error('Không thể kết nối tới máy chủ.'); }

  onShort() { this.#notify.info('Toast biến mất sau 1.5 giây.', { duration: 1500 }); }
  onLong() { this.#notify.success('Toast ở lại 8 giây.', { duration: 8000 }); }

  onAction() {
    this.#notify.success('Đã xóa 1 bản ghi.', {
      actionLabel: 'Hoàn tác',
      onAction: () => this.#notify.info('Đã khôi phục bản ghi.'),
    });
  }

  onSpam() {
    this.#notify.info('Thông báo 1');
    this.#notify.success('Thông báo 2');
    this.#notify.warning('Thông báo 3');
  }

  onClear() { this.#notify.clearAll(); }
}
