import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdCard, type SdCardContent } from '@sdcorejs/angular/components/card';

@Component({
  selector: 'app-card-behavior-example',
  standalone: true,
  imports: [SdCard],
  templateUrl: './card-behavior.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBehaviorExampleComponent {
  readonly revenue: SdCardContent = {
    layout: 'stat',
    data: { label: 'Doanh thu', value: 86_400_000, format: 'compact', context: '31 đơn hoàn tất' },
  };
  readonly pending: SdCardContent = {
    layout: 'stat',
    data: { label: 'Chờ xác nhận', value: 18, delta: { value: 6, positive: 'down' }, context: '12 đơn quá 24 giờ', contextColor: 'warning' },
  };
  readonly shipping: SdCardContent = { layout: 'stat', data: { label: 'Đang giao', value: 9, context: 'Bấm để lọc' } };
  readonly lastEvent = signal('Chưa có interaction');
}
