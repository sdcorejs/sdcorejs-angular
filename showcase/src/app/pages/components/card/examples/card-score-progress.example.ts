import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';

interface Progress {
  id: string;
  label: string;
  done: number;
  total: number;
  unit: string;
}

@Component({
  selector: 'app-card-score-progress-example',
  standalone: true,
  imports: [SdSection],
  templateUrl: './card-score-progress.example.html',
  styleUrl: './card-score-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardScoreProgressExampleComponent {
  readonly items: Progress[] = [
    { id: 'requests', label: 'Tiến độ hoàn tất', done: 31, total: 50, unit: 'yêu cầu' },
    { id: 'returns', label: 'Đổi trả đã xử lý', done: 0, total: 0, unit: 'yêu cầu' },
  ];

  /** A zero total shows 0% instead of dividing by zero. */
  percent(item: Progress): number {
    return item.total ? Math.round((item.done / item.total) * 100) : 0;
  }
}
