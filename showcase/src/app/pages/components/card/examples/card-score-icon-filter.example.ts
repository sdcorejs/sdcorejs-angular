import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdCard, SdCardGroup } from '@sdcorejs/angular/components/card';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

type OrderStatus = 'pending' | 'active' | 'done';

interface Order {
  id: number;
  code: string;
  name: string;
  status: OrderStatus;
}

const STATUS = {
  pending: { label: 'Chờ xử lý', icon: 'schedule', color: 'warning' },
  active: { label: 'Đang xử lý', icon: 'sync', color: 'info' },
  done: { label: 'Hoàn tất', icon: 'check_circle', color: 'success' },
} as const;
const CUSTOMERS = ['An Phát', 'Minh Long', 'Bình Minh', 'Đại Việt', 'Hải Nam', 'Phú Gia', 'Thiên An', 'Trường Sơn'];

const ORDERS: Order[] = Array.from({ length: 24 }, (_, index) => ({
  id: 2400 - index,
  code: `ĐH-${2400 - index}`,
  name: CUSTOMERS[index % CUSTOMERS.length],
  status: (['pending', 'active', 'done'] as const)[index % 3],
}));

@Component({
  selector: 'app-card-score-icon-filter-example',
  standalone: true,
  imports: [SdBadge, SdCard, SdCardGroup, SdIcon],
  templateUrl: './card-score-icon-filter.example.html',
  styleUrl: './card-score-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardScoreIconFilterExampleComponent {
  readonly status = STATUS;
  readonly total = ORDERS.length;
  // Counts always describe the whole dataset; the selection only filters the list below.
  readonly cards = [
    { id: '', label: 'Tất cả đơn hàng', value: ORDERS.length, icon: 'receipt_long', color: 'primary' },
    ...(Object.keys(STATUS) as OrderStatus[]).map(id => ({
      id,
      label: STATUS[id].label,
      value: ORDERS.filter(order => order.status === id).length,
      icon: STATUS[id].icon,
      color: STATUS[id].color,
    })),
  ];
  readonly selected = signal<string | null>('');
  readonly filtered = computed(() => ORDERS.filter(order => !this.selected() || order.status === this.selected()));

  /** Clicking the selected card clears the group; fall back to "Tất cả" so one card stays selected. */
  onSelect(value: string | string[] | null): void {
    if (value === null) this.selected.set('');
  }
}
