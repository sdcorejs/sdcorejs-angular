import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'app-card-score-icon-inline-example',
  standalone: true,
  imports: [SdSection, SdIcon],
  templateUrl: './card-score-icon-inline.example.html',
  styleUrl: './card-score-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardScoreIconInlineExampleComponent {
  readonly metrics = [
    { id: 'orders', label: 'Tổng đơn hàng', value: '24', hint: 'Toàn bộ dữ liệu mẫu', icon: 'receipt_long', color: 'info' },
    { id: 'customers', label: 'Khách hàng', value: '8', hint: 'Khách hàng có đơn hàng', icon: 'groups', color: 'success' },
    { id: 'amount', label: 'Giá trị đơn hàng', value: '567 triệu ₫', hint: 'Toàn bộ dữ liệu mẫu', icon: 'payments', color: 'warning' },
  ];
}
