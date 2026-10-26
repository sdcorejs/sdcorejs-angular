import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';

@Component({
  selector: 'app-button-crud-example',
  standalone: true,
  imports: [RouterLink, SdButton],
  templateUrl: './button-crud.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonCrudExampleComponent {
  readonly #confirm = inject(SdConfirmService);
  readonly saving = signal(false);
  readonly deleted = signal(false);
  readonly message = signal('');

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    this.saving.set(false);
    this.message.set('Đã lưu thay đổi.');
  }

  async remove(): Promise<void> {
    try {
      await this.#confirm.confirm('Khách hàng KH-0001 sẽ bị xoá khỏi danh sách mẫu này.', {
        title: 'Xoá khách hàng KH-0001?',
        yesTitle: 'Xoá',
        noTitle: 'Giữ lại',
        yesButtonColor: 'error',
      });
      this.deleted.set(true);
      this.message.set('Đã xoá khách hàng KH-0001 trong dữ liệu mẫu.');
    } catch {
      this.message.set('Đã giữ lại bản ghi.');
    }
  }
}
