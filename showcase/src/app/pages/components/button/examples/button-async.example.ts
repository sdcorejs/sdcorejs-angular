import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInput } from '@sdcorejs/angular/forms/input';

@Component({
  selector: 'app-button-async-example',
  standalone: true,
  imports: [SdButton, SdInput],
  templateUrl: './button-async.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonAsyncExampleComponent {
  readonly name = signal('Công ty An Phát');
  readonly saving = signal(false);
  readonly failed = signal(false);
  readonly message = signal('');
  readonly title = computed(() => (this.saving() ? 'Đang lưu…' : this.failed() ? 'Thử lại' : 'Lưu'));
  #attempt = 0;

  async save(): Promise<void> {
    // Disabled while pending, so a second click cannot send the request twice.
    if (this.saving()) return;
    this.saving.set(true);
    this.message.set('');
    await new Promise(resolve => setTimeout(resolve, 500));
    this.saving.set(false);
    // The first attempt fails on purpose; the input keeps its value for the retry.
    this.failed.set(++this.#attempt === 1);
    this.message.set(this.failed() ? 'Không thể lưu. Dữ liệu được giữ nguyên; vui lòng thử lại.' : 'Đã lưu thay đổi.');
  }
}
