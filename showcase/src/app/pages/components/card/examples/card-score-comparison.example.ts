import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';

interface Comparison {
  id: string;
  label: string;
  current: number;
  previous: number;
  previousLabel: string;
  unit: string;
  /** Whether an increase is good news for this metric; never assume it. */
  higherIsBetter: boolean;
}

@Component({
  selector: 'app-card-score-comparison-example',
  standalone: true,
  imports: [SdSection],
  templateUrl: './card-score-comparison.example.html',
  styleUrl: './card-score-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardScoreComparisonExampleComponent {
  readonly items: Comparison[] = [
    { id: 'orders', label: 'Đơn hàng tháng 9', current: 120, previous: 100, previousLabel: 'Tháng 8', unit: 'đơn', higherIsBetter: true },
    {
      id: 'returns',
      label: 'Đơn đổi trả tháng 9',
      current: 18,
      previous: 12,
      previousLabel: 'Tháng 8',
      unit: 'đơn',
      higherIsBetter: false,
    },
  ];

  delta(item: Comparison): string {
    const percent = item.previous ? Math.round(((item.current - item.previous) / item.previous) * 100) : 0;
    return `${percent > 0 ? '+' : ''}${percent}%`;
  }

  deltaColor(item: Comparison): string {
    if (item.current === item.previous) return 'text-secondary';
    const increased = item.current > item.previous;
    return increased === item.higherIsBetter ? 'text-success' : 'text-error';
  }
}
