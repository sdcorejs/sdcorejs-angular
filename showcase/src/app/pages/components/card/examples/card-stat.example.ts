import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdCard, SdCardGroup, type SdCardContent } from '@sdcorejs/angular/components/card';

type OrderFilter = 'pending' | 'shipping' | 'done';

@Component({
  selector: 'app-card-stat-example',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  templateUrl: './card-stat.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardStatExampleComponent {
  readonly filter = signal<OrderFilter | OrderFilter[] | null>('shipping');
  readonly cards: readonly { readonly key: OrderFilter; readonly content: SdCardContent }[] = [
    {
      key: 'pending',
      content: { layout: 'stat', data: { label: 'Chờ xác nhận', value: 18, delta: { value: 6, positive: 'down' }, icon: 'schedule' } },
    },
    { key: 'shipping', content: { layout: 'stat', data: { label: 'Đang giao', value: 9, context: 'Đang lọc' } } },
    {
      key: 'done',
      content: { layout: 'stat', data: { label: 'Tỉ lệ hoàn tất', value: 0.874, format: 'percent', delta: { value: 0.021 } } },
    },
  ];
  readonly revenue: SdCardContent = {
    layout: 'stat',
    data: { label: 'Doanh thu', value: 1_820_000_000, format: 'compact', context: 'Không đổi so với tháng trước', delta: { value: 0 } },
  };
}
