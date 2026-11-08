import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdCard, type SdCardContent } from '@sdcorejs/angular/components/card';

@Component({
  selector: 'app-card-score-metric-example',
  standalone: true,
  imports: [SdCard],
  templateUrl: './card-score-metric.example.html',
  styleUrl: './card-score-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardScoreMetricExampleComponent {
  readonly metric: SdCardContent = {
    layout: 'stat',
    data: { label: 'Giá trị đơn hàng', value: 567_000_000, format: 'compact', context: '24 đơn hàng · Toàn bộ dữ liệu mẫu' },
  };
}
