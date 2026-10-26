import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-tab-form-example',
  standalone: true,
  imports: [SdButton, SdSection, SdTab, SdTabGroup, SdInput],
  templateUrl: './tab-form.example.html',
  styleUrl: './tab-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabFormExampleComponent {
  readonly #notify = inject(SdNotifyService);
  // The values live here, not in the tab body, so switching tabs keeps them.
  readonly name = signal('Công ty An Phát');
  readonly email = signal('contact@anphat.example');
  readonly selectedIndex = signal(0);
  readonly saving = signal(false);

  async save(): Promise<void> {
    if (this.saving()) return;
    const nameMissing = !this.name()?.trim();
    if (nameMissing || !EMAIL.test(this.email() ?? '')) {
      // Open the group that holds the first invalid field.
      this.selectedIndex.set(nameMissing ? 0 : 1);
      this.#notify.warning('Nhập tên khách hàng và email hợp lệ.');
      return;
    }
    this.saving.set(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    this.saving.set(false);
    this.#notify.success('Đã lưu thông tin khách hàng.');
  }
}
