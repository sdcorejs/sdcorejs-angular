import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';

type OrderStatus = 'pending' | 'active' | 'done';

interface Order {
  id: number;
  code: string;
  name: string;
  region: string;
  status: OrderStatus;
  amount: number;
}

const STATUSES = [
  { id: 'pending', name: 'Chờ xử lý' },
  { id: 'active', name: 'Đang xử lý' },
  { id: 'done', name: 'Hoàn tất' },
];
const CUSTOMERS = ['An Phát', 'Minh Long', 'Bình Minh', 'Đại Việt', 'Hải Nam', 'Phú Gia', 'Thiên An', 'Trường Sơn'];
const REGIONS = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];

const ORDERS: Order[] = Array.from({ length: 24 }, (_, index) => ({
  id: 2400 - index,
  code: `ĐH-${2400 - index}`,
  name: CUSTOMERS[index % CUSTOMERS.length],
  region: REGIONS[Math.floor(index / 3) % REGIONS.length],
  status: (['pending', 'active', 'done'] as const)[index % 3],
  amount: (index + 2) * 1_750_000,
}));

@Component({
  selector: 'app-table-standard-example',
  standalone: true,
  imports: [RouterLink, SdTable, SdTableCellDefDirective],
  templateUrl: './table-standard.example.html',
  styleUrl: './table-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableStandardExampleComponent {
  readonly option: SdTableOption<Order> = {
    type: 'local',
    items: () => ORDERS,
    rowKey: 'id',
    sort: { enable: true },
    paginate: { pageSize: 6, pages: [6, 12, 24] },
    filter: { hideInlineFilter: true },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '120px', sortable: true },
      { field: 'name', title: 'Khách hàng', type: 'string', width: '180px', sortable: true },
      { field: 'region', title: 'Khu vực', type: 'string', width: '120px' },
      {
        field: 'status',
        title: 'Trạng thái',
        type: 'values',
        width: '150px',
        option: { items: STATUSES, valueField: 'id', displayField: 'name' },
        useBadge: (_value, row) => ({
          title: STATUSES.find(status => status.id === row.status)?.name ?? row.status,
          color: row.status === 'pending' ? 'warning' : row.status === 'done' ? 'success' : 'info',
        }),
      },
      { field: 'amount', title: 'Giá trị (VND)', type: 'number', align: 'right', width: '150px', sortable: true },
    ],
  };
}
