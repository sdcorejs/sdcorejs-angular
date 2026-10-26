import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

interface Order {
  id: number;
  code: string;
  name: string;
  amount: number;
}

interface Customer {
  id: number;
  code: string;
  name: string;
  region: string;
}

const CUSTOMERS = ['An Phát', 'Minh Long', 'Bình Minh', 'Đại Việt', 'Hải Nam', 'Phú Gia', 'Thiên An', 'Trường Sơn'];
const REGIONS = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];

@Component({
  selector: 'app-tab-table-example',
  standalone: true,
  imports: [SdTab, SdTabGroup, SdTable],
  templateUrl: './tab-table.example.html',
  styleUrl: './tab-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabTableExampleComponent {
  // Quick search and paging come from the Core table option; the tab only hosts the table.
  readonly ordersOption: SdTableOption<Order> = {
    type: 'local',
    items: () =>
      Array.from({ length: 24 }, (_, index) => ({
        id: 2400 - index,
        code: `ĐH-${2400 - index}`,
        name: CUSTOMERS[index % CUSTOMERS.length],
        amount: (index + 2) * 1_750_000,
      })),
    rowKey: 'id',
    paginate: { pageSize: 6, pages: [6, 12, 24] },
    filter: { hideInlineFilter: true, quickSearch: { containFields: ['code', 'name'], placeholder: 'Tìm mã đơn hoặc khách hàng' } },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '120px' },
      { field: 'name', title: 'Khách hàng', type: 'string', width: '200px' },
      { field: 'amount', title: 'Giá trị (VND)', type: 'number', align: 'right', width: '160px' },
    ],
  };
  readonly customersOption: SdTableOption<Customer> = {
    type: 'local',
    items: () =>
      CUSTOMERS.map((name, index) => ({
        id: index + 1,
        code: `KH-${String(index + 1).padStart(4, '0')}`,
        name: `Công ty ${name}`,
        region: REGIONS[index % REGIONS.length],
      })),
    rowKey: 'id',
    paginate: { pageSize: 6, pages: [6, 12] },
    filter: { hideInlineFilter: true, quickSearch: { containFields: ['code', 'name'], placeholder: 'Tìm mã hoặc tên khách hàng' } },
    columns: [
      { field: 'code', title: 'Mã KH', type: 'string', width: '120px' },
      { field: 'name', title: 'Khách hàng', type: 'string', width: '220px' },
      { field: 'region', title: 'Khu vực', type: 'string', width: '140px' },
    ],
  };
}
