import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';

@Component({
  selector: 'app-button-danger-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-danger.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDangerExampleComponent {
  readonly #confirm = inject(SdConfirmService);
  readonly deleted = signal(false);
  readonly message = signal('');

  async remove(): Promise<void> {
    // Name the record and the consequence; the way out is "Giữ lại", not a generic "Huỷ".
    try {
      await this.#confirm.confirm('Đơn hàng DH-1024 của An Phát sẽ bị xoá khỏi danh sách mẫu này.', {
        title: 'Xoá đơn hàng DH-1024?',
        yesTitle: 'Xoá',
        noTitle: 'Giữ lại',
        yesButtonColor: 'error',
      });
      this.deleted.set(true);
      this.message.set('Đã xoá đơn hàng DH-1024 trong dữ liệu mẫu.');
    } catch {
      this.message.set('Đã giữ lại bản ghi.');
    }
  }

  restore(): void {
    this.deleted.set(false);
    this.message.set('');
  }
}
