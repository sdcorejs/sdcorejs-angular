import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

interface Invoice {
  id: number;
  code: string;
  customer: string;
  status: string;
  total: number;
}

const CUSTOMERS = ['Công ty An Phát', 'Minh Long Foods', 'Hải Đăng Logistics', 'Thiên Phúc', 'Sao Mai Retail'];
const STATUSES = ['Nháp', 'Đã gửi', 'Đã thanh toán', 'Quá hạn'];

const INVOICES: Invoice[] = Array.from({ length: 36 }, (_, index) => ({
  id: index + 1,
  code: `HD-${2026_0100 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  status: STATUSES[index % STATUSES.length],
  total: (index + 4) * 1_250_000,
}));

@Component({
  selector: 'app-table-sync-query-params-example',
  standalone: true,
  imports: [SdTable],
  templateUrl: './table-sync-query-params.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSyncQueryParamsExampleComponent {
  // why: `syncQueryParams` + `autoId` ghi filter/sort/trang lên `?table-invoices=…`; copy link mở lại đúng bảng này.
  readonly option: SdTableOption<Invoice> = {
    type: 'local',
    items: () => INVOICES,
    columns: [
      { field: 'code', title: 'Số hóa đơn', type: 'string', sortable: true, filter: {} },
      { field: 'customer', title: 'Khách hàng', type: 'string', sortable: true, filter: {} },
      { field: 'status', title: 'Trạng thái', type: 'string', filter: {} },
      { field: 'total', title: 'Tổng tiền', type: 'number', sortable: true, filter: {} },
    ],
    filter: { quickSearch: { containFields: ['code', 'customer'], placeholder: 'Tìm số hóa đơn, khách hàng' } },
    sort: { enable: true },
    paginate: { pageSize: 5, pages: [5, 10, 20] },
  };
}
