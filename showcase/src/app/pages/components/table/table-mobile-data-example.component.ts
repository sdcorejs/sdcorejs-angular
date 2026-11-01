import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdTable, SdTableMobileCardData, SdTableOption } from '@sdcorejs/angular/components/table';

interface Order {
  code: string;
  customer: string;
  channel: string;
  status: string;
  warehouse: string;
  total: number;
  createdAt: string;
  createdBy: string;
  items: number;
  discount: number;
  paidAt: string;
  region: string;
  phone: string;
  locked: boolean;
}

const STATUSES = [
  { id: 'new', name: 'Mới', color: 'info' },
  { id: 'confirmed', name: 'Đã xác nhận', color: 'primary' },
  { id: 'picking', name: 'Đang lấy hàng', color: 'warning' },
  { id: 'packed', name: 'Đã đóng gói', color: 'warning' },
  { id: 'shipping', name: 'Đang giao', color: 'primary' },
  { id: 'delivered', name: 'Đã giao', color: 'success' },
  { id: 'returned', name: 'Hoàn trả', color: 'error' },
  { id: 'cancelled', name: 'Đã huỷ', color: 'error' },
  { id: 'on-hold', name: 'Tạm giữ', color: 'secondary' },
  { id: 'refunded', name: 'Đã hoàn tiền', color: 'secondary' },
] as const;
const WAREHOUSES = [
  { id: 'HN', name: 'Hà Nội' },
  { id: 'HCM', name: 'Hồ Chí Minh' },
  { id: 'DN', name: 'Đà Nẵng' },
];
const CHANNELS = [
  { id: 'online', name: 'Online' },
  { id: 'store', name: 'Cửa hàng' },
  { id: 'partner', name: 'Đối tác' },
];
const CUSTOMERS = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Thu Dung', 'Võ Minh Em'];
const STAFF = ['Lan', 'Minh', 'Hà', 'Tuấn'];

const ORDERS: Order[] = Array.from({ length: 24 }, (_, index) => ({
  code: `DH-${String(1001 + index)}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  channel: CHANNELS[index % CHANNELS.length].id,
  status: STATUSES[index % STATUSES.length].id,
  warehouse: WAREHOUSES[index % WAREHOUSES.length].id,
  total: 350000 + ((index * 137000) % 4200000),
  createdAt: `2026/10/${String(1 + (index % 28)).padStart(2, '0')}`,
  createdBy: STAFF[index % STAFF.length],
  items: 1 + (index % 7),
  discount: (index % 4) * 5,
  paidAt: `2026/10/${String(2 + (index % 27)).padStart(2, '0')}`,
  region: index % 2 ? 'Miền Nam' : 'Miền Bắc',
  phone: `09${String(10000000 + index * 7919).slice(0, 8)}`,
  locked: index % 9 === 4,
}));

/** Card of an order on phones: built from row values, no template. */
const orderCard = (row: Order): SdTableMobileCardData<Order> => ({
  title: 'code',
  subtitle: 'customer',
  badge: row.locked ? { title: 'Đã khóa', color: 'error' } : 'status',
  highlight: 'total',
  fields: ['createdAt', 'warehouse', 'createdBy', 'items', 'discount', 'paidAt'],
});

@Component({
  selector: 'app-table-mobile-data-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdTable],
  templateUrl: './table-mobile-data-example.component.html',
})
export class TableMobileDataDemoComponent {
  readonly log = signal('');
  readonly option: SdTableOption<Order> = {
    type: 'local',
    rowKey: 'code',
    items: () => ORDERS,
    paginate: { pageSize: 10 },
    reload: { visible: true },
    export: { type: 'default', visible: 'ALL' },
    config: { visible: true },
    sort: { enable: true },
    mobile: { rowLabel: row => row.code, template: { data: orderCard } },
    selector: {
      visible: true,
      disabled: row => !!row?.locked,
      actions: [{ title: 'Duyệt', icon: 'check', click: (rows = []) => this.log.set(`Duyệt ${rows.length} đơn`) }],
    },
    command: {
      commands: [
        { title: 'Xem', icon: 'visibility', click: row => this.log.set(`Xem ${row.code}`) },
        { title: 'Sửa', icon: 'edit', click: row => this.log.set(`Sửa ${row.code}`) },
      ],
    },
    filter: {
      externalFilters: [
        { field: 'customer', type: 'string', title: 'Khách hàng' },
        {
          field: 'channel',
          type: 'values',
          title: 'Kênh bán',
          option: { items: CHANNELS, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
        },
      ],
    },
    columns: [
      { field: 'code', type: 'string', title: 'Mã đơn', sortable: true, filter: { operator: { enable: true, list: ['CONTAIN', 'EQUAL'] } } },
      { field: 'customer', type: 'string', title: 'Khách hàng', sortable: true, filter: { disabled: true } },
      {
        field: 'status',
        type: 'values',
        title: 'Trạng thái',
        sortable: true,
        option: { items: [...STATUSES], valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
        useBadge: value => {
          const status = STATUSES.find(entry => entry.id === value);
          return { title: status?.name ?? value, color: status?.color ?? 'secondary', type: 'round' };
        },
      },
      {
        field: 'warehouse',
        type: 'values',
        title: 'Kho',
        sortable: true,
        option: { items: WAREHOUSES, valueField: 'id', displayField: 'name' },
      },
      { field: 'total', type: 'number', title: 'Tổng tiền', sortable: true, filter: { type: 'split-number' } },
      { field: 'createdAt', type: 'date', title: 'Ngày tạo', sortable: true },
      { field: 'createdBy', type: 'string', title: 'Người tạo', sortable: true, filter: { disabled: true } },
      { field: 'items', type: 'number', title: 'Số sản phẩm', sortable: true, filter: { disabled: true } },
      { field: 'discount', type: 'number', title: 'Giảm giá (%)', sortable: true, filter: { disabled: true } },
      { field: 'paidAt', type: 'date', title: 'Ngày thanh toán', sortable: true, filter: { disabled: true } },
      { field: 'region', type: 'string', title: 'Vùng', sortable: true, filter: { disabled: true } },
      { field: 'phone', type: 'string', title: 'Điện thoại', sortable: true, filter: { disabled: true }, invisible: true },
    ],
  };
}
