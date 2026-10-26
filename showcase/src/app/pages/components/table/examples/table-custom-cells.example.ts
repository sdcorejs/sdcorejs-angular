import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SdTable, SdTableCellDefDirective, SdTableOption, SdTableTitleDefDirective } from '@sdcorejs/angular/components/table';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';

interface Order {
  id: number;
  code: string;
  name: string;
  region: string;
  owner: string;
  amount: number;
}

const CUSTOMERS = ['An Phát', 'Minh Long', 'Bình Minh', 'Đại Việt', 'Hải Nam', 'Phú Gia', 'Thiên An', 'Trường Sơn'];
const REGIONS = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];
const OWNERS = ['Lan', 'Minh', 'Hà', 'Nam'];

const ORDERS: Order[] = Array.from({ length: 12 }, (_, index) => ({
  id: 2400 - index,
  code: `ĐH-${2400 - index}`,
  name: CUSTOMERS[index % CUSTOMERS.length],
  region: REGIONS[Math.floor(index / 3) % REGIONS.length],
  owner: OWNERS[index % OWNERS.length],
  amount: (index + 2) * 1_750_000,
}));

@Component({
  selector: 'app-table-custom-cells-example',
  standalone: true,
  imports: [RouterLink, SdTable, SdTableCellDefDirective, SdTableTitleDefDirective, SdFormatNumberPipe],
  templateUrl: './table-custom-cells.example.html',
  styleUrl: './table-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCustomCellsExampleComponent {
  readonly option: SdTableOption<Order> = {
    type: 'local',
    items: () => ORDERS,
    rowKey: 'id',
    sort: { enable: true },
    paginate: { pageSize: 6, pages: [6, 12] },
    filter: { hideInlineFilter: true },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '120px', sortable: true },
      { field: 'name', title: 'Khách hàng', type: 'string', width: '220px', sortable: true },
      { field: 'amount', title: 'Giá trị đơn hàng', type: 'number', align: 'right', width: '180px', sortable: true },
    ],
  };
}
