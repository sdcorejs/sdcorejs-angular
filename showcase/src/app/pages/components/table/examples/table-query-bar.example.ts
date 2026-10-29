import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableOption, SdTableQuickSearchRightDefDirective } from '@sdcorejs/angular/components/table';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { FilterUtilities } from '@sdcorejs/utils/fns';
import { PagingReq } from '@sdcorejs/utils/models';

interface Order {
  id: number;
  code: string;
  customer: string;
  phone: string;
  email: string;
  warehouseId: string;
  priority: string;
  status: string;
  channel: number;
  note: string;
  total: number;
  weight: number;
  payment: string;
  createdAt: string;
  deliveredOn: string;
  updatedAt: string;
}

const WAREHOUSES = [
  { id: 'hn', name: 'Hà Nội' },
  { id: 'hcm', name: 'Hồ Chí Minh' },
  { id: 'dn', name: 'Đà Nẵng' },
];
const PRIORITIES = [
  { id: 'high', name: 'Cao' },
  { id: 'normal', name: 'Thường' },
];
const STATUSES = [
  { id: 'new', name: 'Chờ xác nhận' },
  { id: 'shipping', name: 'Đang giao' },
  { id: 'done', name: 'Hoàn tất' },
];
const CHANNELS = [
  { id: 1, name: 'Website' },
  { id: 2, name: 'Shopee' },
  { id: 3, name: 'Cửa hàng' },
];
const PAYMENTS = [
  { id: 'paid', name: 'Đã thanh toán' },
  { id: 'unpaid', name: 'Chưa thanh toán' },
  { id: 'refund', name: 'Hoàn tiền' },
];
const CUSTOMERS = ['Đỗ Thu Hà', 'Nguyễn Văn Minh', 'Trần Thị Lan', 'Vũ Đức Long', 'Lê Minh Châu', 'Phạm Quốc Huy'];

const day = (offset: number): string => {
  const date = new Date(2026, 9, 1 + offset);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

const ORDERS: Order[] = Array.from({ length: 36 }, (_, index) => ({
  id: index + 1,
  code: `DH-${24300 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  phone: `09${String(10000000 + index * 7919).slice(0, 8)}`,
  email: `kh${index + 1}@example.com`,
  warehouseId: WAREHOUSES[index % WAREHOUSES.length].id,
  priority: PRIORITIES[index % 2].id,
  status: STATUSES[index % STATUSES.length].id,
  channel: CHANNELS[index % CHANNELS.length].id,
  note: index % 4 === 0 ? 'Giao gấp' : '',
  total: (index + 3) * 650_000,
  weight: (index % 9) + 1,
  payment: PAYMENTS[index % PAYMENTS.length].id,
  createdAt: day(index % 28),
  deliveredOn: day((index % 28) + 2),
  updatedAt: `${day((index % 28) + 1)} 09:30:00`,
}));

@Component({
  selector: 'app-table-query-bar-example',
  standalone: true,
  imports: [JsonPipe, SdButton, SdCheckbox, SdTable, SdTableQuickSearchRightDefDirective],
  templateUrl: './table-query-bar.example.html',
  styleUrl: './table-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableQueryBarExampleComponent {
  readonly mode = signal<'default' | 'query-bar'>('query-bar');
  readonly manualFilter = signal(false);
  /** Last `pagingReq` sent by the table — the same edit must give the same payload in both modes. */
  readonly pagingReq = signal<PagingReq | undefined>(undefined);

  // why: option mới mỗi lần đổi mode → bảng dựng lại; cùng `filter.key` + `cacheable` nên giá trị đã lọc được giữ.
  readonly option = computed<SdTableOption<Order>>(() => ({
    type: 'server',
    rowKey: 'id',
    items: async (_filterReq, pagingReq) => {
      this.pagingReq.set(pagingReq);
      await new Promise(resolve => setTimeout(resolve, 600));
      // Demo backend: applies pagingReq.filters as a real API would, then pages.
      const rows = ORDERS.filter(row => FilterUtilities.match(pagingReq.filters ?? [], row));
      const { pageNumber = 0, pageSize = 8 } = pagingReq;
      return { items: rows.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize), total: rows.length };
    },
    paginate: { pageSize: 8, pages: [8, 16, 36] },
    sort: { enable: true },
    filter: {
      mode: this.mode(),
      manualFilter: this.manualFilter(),
      key: 'showcase-table-query-bar',
      cacheable: true,
      quickSearch: {
        containFields: ['code', 'customer'],
        placeholder: 'Mã đơn, khách hàng…',
        filters: [
          {
            field: 'warehouseId',
            title: 'Kho xuất',
            type: 'values',
            required: true,
            default: 'hn',
            option: { items: WAREHOUSES, valueField: 'id', displayField: 'name' },
          },
          {
            field: 'priority',
            title: 'Ưu tiên',
            type: 'values',
            option: { items: PRIORITIES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
          },
        ],
      },
      externalFilters: [
        {
          field: 'status',
          title: 'Trạng thái',
          type: 'values',
          defaultShowing: true,
          option: { items: STATUSES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
        },
        { field: 'createdAt', title: 'Ngày tạo', type: 'daterange', defaultShowing: true, default: { from: day(0), to: day(30) } },
        {
          field: 'channel',
          title: 'Kênh bán',
          type: 'lazy-values',
          option: {
            valueField: 'id',
            displayField: 'name',
            items: async ({ type, searchText, value }) =>
              type === 'VALUE'
                ? CHANNELS.filter(item => ([] as unknown[]).concat(value).includes(item.id))
                : CHANNELS.filter(item => item.name.toLowerCase().includes((searchText ?? '').toLowerCase())),
          },
        },
        { field: 'note', title: 'Ghi chú', type: 'string' },
      ],
    },
    columns: [
      {
        field: 'code',
        title: 'Mã đơn',
        type: 'string',
        width: '130px',
        sortable: true,
        filter: { operator: { enable: true, list: ['CONTAIN', 'EQUAL', 'START_WITH'] } },
      },
      { field: 'customer', title: 'Khách hàng', type: 'string', width: '170px' },
      { field: 'createdAt', title: 'Ngày tạo', type: 'date', width: '120px' },
      {
        field: 'total',
        title: 'Tổng tiền',
        type: 'number',
        align: 'right',
        width: '140px',
        filter: { operator: { enable: true, list: ['EQUAL', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL'] } },
      },
      { field: 'payment', title: 'Thanh toán', type: 'values', width: '150px', option: { items: PAYMENTS, valueField: 'id', displayField: 'name' } },
      // why: header nhóm chỉ chứa cột không lọc — SdConvertToPagingReq chỉ đọc cột cấp đầu, nên filter của cột con không
      // được gửi đi ở cả hai mode.
      {
        field: 'contact',
        title: 'Liên hệ',
        type: 'children',
        children: [
          { field: 'phone', title: 'Điện thoại', type: 'string', width: '130px', filter: { disabled: true } },
          { field: 'email', title: 'Email', type: 'string', width: '190px', filter: { disabled: true } },
        ],
      },
      { field: 'weight', title: 'Cân nặng (kg)', type: 'number', align: 'right', width: '130px', filter: { type: 'split-number' } },
      { field: 'deliveredOn', title: 'Ngày giao', type: 'date', width: '120px', filter: { type: 'date' } },
      { field: 'updatedAt', title: 'Cập nhật', type: 'datetime', width: '160px' },
    ],
  }));
}
