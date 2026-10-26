import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton, SdButtonItem, SdButtonItemDivider } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-grouped-example',
  standalone: true,
  imports: [SdButton, SdButtonItem, SdButtonItemDivider],
  templateUrl: './button-grouped.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonGroupedExampleComponent {
  readonly workflowActions = [
    { title: 'Gửi duyệt', icon: 'send', color: 'primary' },
    { title: 'Duyệt', icon: 'check_circle', color: 'success' },
    { title: 'Từ chối', icon: 'cancel', color: 'error' },
    { title: 'Tạm dừng', icon: 'pause_circle', color: 'warning' },
  ] as const;
  readonly dataActions = [
    { title: 'Xuất dữ liệu', icon: 'download', color: 'info' },
    { title: 'In', icon: 'print', color: 'secondary' },
  ] as const;
  readonly message = signal('');

  run(title: string): void {
    this.message.set(`Đã thực hiện tác vụ mẫu: ${title}.`);
  }
}
