import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

type OrderStatus = 'pending' | 'done';

interface Order {
  id: number;
  code: string;
  name: string;
  status: OrderStatus;
}

const CUSTOMERS = ['An Phát', 'Minh Long', 'Bình Minh', 'Đại Việt', 'Hải Nam', 'Phú Gia'];

@Component({
  selector: 'app-tab-counts-example',
  standalone: true,
  imports: [SdButton, SdTab, SdTabGroup, SdTable],
  templateUrl: './tab-counts.example.html',
  styleUrl: './tab-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabCountsExampleComponent {
  readonly orders = signal<Order[]>(
    Array.from({ length: 12 }, (_, index) => ({
      id: 2400 - index,
      code: `ĐH-${2400 - index}`,
      name: CUSTOMERS[index % CUSTOMERS.length],
      status: index % 3 === 0 ? 'done' : 'pending',
    }))
  );
  readonly selectedIndex = signal(0);
  // Each badge is the real size of its group, recomputed from the data.
  readonly tabs = computed(() => {
    const orders = this.orders();
    return [
      { label: 'Tất cả', icon: 'list_alt', rows: orders },
      { label: 'Chờ xử lý', icon: 'schedule', rows: orders.filter(order => order.status === 'pending') },
      { label: 'Hoàn tất', icon: 'check_circle', rows: orders.filter(order => order.status === 'done') },
    ].map(tab => ({ ...tab, option: this.tableOption(tab.rows) }));
  });

  complete(): void {
    const first = this.orders().find(order => order.status === 'pending');
    if (first) this.orders.update(orders => orders.map(order => (order.id === first.id ? { ...order, status: 'done' } : order)));
  }

  private tableOption(rows: Order[]): SdTableOption<Order> {
    return {
      type: 'local',
      items: () => rows,
      rowKey: 'id',
      paginate: { pageSize: 5, pages: [5, 10] },
      filter: { hideInlineFilter: true },
      columns: [
        { field: 'code', title: 'Mã đơn', type: 'string', width: '120px' },
        { field: 'name', title: 'Khách hàng', type: 'string', width: '200px' },
        {
          field: 'status',
          title: 'Trạng thái',
          type: 'string',
          width: '150px',
          useBadge: value => (value === 'done' ? { title: 'Hoàn tất', color: 'success' } : { title: 'Chờ xử lý', color: 'warning' }),
        },
      ],
    };
  }
}
