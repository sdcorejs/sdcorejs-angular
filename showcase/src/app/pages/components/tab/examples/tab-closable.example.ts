import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTab, SdTabGroup, type SdTabBeforeClose } from '@sdcorejs/angular/components/tab';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';

const SAVED_NAMES: Record<string, string> = {
  'CUS-001': 'Công ty An Phát',
  'CUS-002': 'Công ty Minh Long',
  'CUS-003': 'Công ty Bình Minh',
};
const CODES = Object.keys(SAVED_NAMES);

@Component({
  selector: 'app-tab-closable-example',
  standalone: true,
  imports: [SdButton, SdSection, SdTab, SdTabGroup, SdInput],
  templateUrl: './tab-closable.example.html',
  styleUrl: './tab-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabClosableExampleComponent {
  readonly #confirm = inject(SdConfirmService);
  readonly records = signal(CODES);
  readonly drafts: Record<string, string> = { ...SAVED_NAMES };
  /** One guard per record: an unchanged record closes at once, an edited one asks first. */
  readonly beforeClose: Record<string, SdTabBeforeClose> = Object.fromEntries(CODES.map(code => [code, () => this.confirmClose(code)]));

  close(code: string): void {
    this.drafts[code] = SAVED_NAMES[code];
    this.records.update(records => records.filter(record => record !== code));
  }

  reopen(): void {
    this.records.set(CODES);
  }

  private async confirmClose(code: string): Promise<boolean> {
    if (this.drafts[code] === SAVED_NAMES[code]) return true;
    try {
      await this.#confirm.confirm('Tên khách hàng vừa nhập chưa được lưu và sẽ bị mất.', {
        title: `Đóng hồ sơ ${code}?`,
        yesTitle: 'Bỏ thay đổi',
        noTitle: 'Tiếp tục chỉnh sửa',
      });
      return true;
    } catch {
      return false;
    }
  }
}
