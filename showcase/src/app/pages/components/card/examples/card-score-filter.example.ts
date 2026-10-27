import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdCard, SdCardGroup } from '@sdcorejs/angular/components/card';
import { SdInput } from '@sdcorejs/angular/forms/input';

type OrderStatus = 'pending' | 'active' | 'done';

interface Order {
  id: number;
  code: string;
  name: string;
  status: OrderStatus;
}

const STATUS = {
  pending: { label: 'Chờ xử lý', color: 'warning' },
  active: { label: 'Đang xử lý', color: 'info' },
  done: { label: 'Hoàn tất', color: 'success' },
} as const;
const CUSTOMERS = ['An Phát', 'Minh Long', 'Bình Minh', 'Đại Việt', 'Hải Nam', 'Phú Gia', 'Thiên An', 'Trường Sơn'];

const ORDERS: Order[] = Array.from({ length: 24 }, (_, index) => ({
  id: 2400 - index,
  code: `ĐH-${2400 - index}`,
  name: CUSTOMERS[index % CUSTOMERS.length],
  status: (['pending', 'active', 'done'] as const)[index % 3],
}));

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();

@Component({
  selector: 'app-card-score-filter-example',
  standalone: true,
  imports: [SdBadge, SdCard, SdCardGroup, SdInput],
  templateUrl: './card-score-filter.example.html',
  styleUrl: './card-score-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardScoreFilterExampleComponent {
  readonly status = STATUS;
  readonly total = ORDERS.length;
  // Counts cover the whole dataset and do not change with the search or the selected card.
  readonly cards = [
    { id: '', label: 'Tất cả', value: ORDERS.length },
    ...(Object.keys(STATUS) as OrderStatus[]).map(id => ({
      id,
      label: STATUS[id].label,
      value: ORDERS.filter(order => order.status === id).length,
    })),
  ];
  readonly selected = signal<string | null>('');
  readonly search = signal('');
  // The list is the intersection of the selected card and the search.
  readonly filtered = computed(() => {
    const term = normalize(this.search() ?? '');
    return ORDERS.filter(
      order => (!this.selected() || order.status === this.selected()) && normalize(`${order.code} ${order.name}`).includes(term)
    );
  });

  onSelect(value: string | string[] | null): void {
    if (value === null) this.selected.set('');
  }
}
