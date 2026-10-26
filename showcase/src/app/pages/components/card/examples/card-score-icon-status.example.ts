import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'app-card-score-icon-status-example',
  standalone: true,
  imports: [SdSection, SdIcon],
  templateUrl: './card-score-icon-status.example.html',
  styleUrl: './card-score-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardScoreIconStatusExampleComponent {
  // The label names the state; icon and colour only support it.
  readonly statuses = [
    { id: 'pending', label: 'Chờ xử lý', value: 8, hint: 'Chưa có người nhận', icon: 'schedule', color: 'warning' },
    { id: 'active', label: 'Đang xử lý', value: 8, hint: 'Đang được thực hiện', icon: 'sync', color: 'info' },
    { id: 'done', label: 'Hoàn tất', value: 8, hint: 'Đã giao cho khách hàng', icon: 'check_circle', color: 'success' },
  ];
}
