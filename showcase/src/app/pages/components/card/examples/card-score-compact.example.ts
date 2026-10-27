import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';

@Component({
  selector: 'app-card-score-compact-example',
  standalone: true,
  imports: [SdSection],
  templateUrl: './card-score-compact.example.html',
  styleUrl: './card-score-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardScoreCompactExampleComponent {
  readonly statuses = [
    { id: 'pending', label: 'Chờ xử lý', value: 8, hint: 'Toàn bộ dữ liệu mẫu' },
    { id: 'active', label: 'Đang xử lý', value: 8, hint: 'Toàn bộ dữ liệu mẫu' },
    { id: 'done', label: 'Hoàn tất', value: 8, hint: 'Toàn bộ dữ liệu mẫu' },
  ];
}
