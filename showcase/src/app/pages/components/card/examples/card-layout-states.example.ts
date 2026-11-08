import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdCard, SdCardGroup, type SdCardContent } from '@sdcorejs/angular/components/card';

@Component({
  selector: 'app-card-layout-states-example',
  standalone: true,
  imports: [SdButton, SdCard, SdCardGroup],
  templateUrl: './card-layout-states.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardLayoutStatesExampleComponent {
  readonly loading = signal(true);
  readonly failed = signal(true);
  readonly retries = signal(0);
  readonly selected = signal<string | string[] | null>('selected');
  readonly kind = signal<string | string[] | null>(null);
  readonly pending: SdCardContent = { layout: 'stat', data: { label: 'Chờ xác nhận', value: null, context: '12 đơn quá 24 giờ' } };
  readonly customer: SdCardContent = {
    layout: 'entity',
    data: { title: 'Công ty TNHH Minh Phát', subtitle: 'KH0012', avatar: { text: 'Minh Phát' } },
  };
  readonly business: SdCardContent = { layout: 'option', data: { icon: 'business', title: 'Doanh nghiệp', description: 'Cần mã số thuế' } };
  readonly shipping: SdCardContent = { layout: 'stat', data: { label: 'Đang giao', value: 9, context: 'Đang lọc' } };

  retry(): void {
    this.retries.update(count => count + 1);
    this.failed.set(false);
  }
}
