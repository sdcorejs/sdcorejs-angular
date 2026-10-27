import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';

@Component({
  selector: 'app-card-score-metric-example',
  standalone: true,
  imports: [SdSection],
  templateUrl: './card-score-metric.example.html',
  styleUrl: './card-score-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardScoreMetricExampleComponent {
  readonly metric = { label: 'Giá trị đơn hàng', value: '567 triệu ₫', hint: '24 đơn hàng · Toàn bộ dữ liệu mẫu' };
}
