import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

interface Order {
  id: number;
  code: string;
  customer: string;
  phone: string;
  email: string;
  createdAt: string;
  status: string;
  channel: string;
  payment: string;
  staff: string;
  warehouse: string;
  weight: number;
  total: number;
  note: string;
  updatedAt: string;
}

const CUSTOMERS = ['Đỗ Thu Hà', 'Nguyễn Văn Minh', 'Trần Thị Lan', 'Vũ Đức Long', 'Lê Minh Châu', 'Phạm Quốc Huy'];
const STATUSES = ['Chờ xác nhận', 'Đang giao', 'Hoàn tất'];
const CHANNELS = ['Website', 'Shopee', 'Cửa hàng'];
const PAYMENTS = ['Đã thanh toán', 'Chưa thanh toán', 'Hoàn tiền'];
const STAFF = ['Hoàng Anh Tuấn', 'Bùi Thị Mai Phương', 'Ngô Đức Thịnh'];
const WAREHOUSES = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'];

const day = (offset: number): string => {
  const date = new Date(2026, 9, 1 + offset);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

const ORDERS: Order[] = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  code: `DH-${24300 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  phone: `09${String(10000000 + index * 7919).slice(0, 8)}`,
  email: `kh${index + 1}@example.com`,
  createdAt: day(index % 28),
  status: STATUSES[index % STATUSES.length],
  channel: CHANNELS[index % CHANNELS.length],
  payment: PAYMENTS[index % PAYMENTS.length],
  staff: STAFF[index % STAFF.length],
  warehouse: WAREHOUSES[index % WAREHOUSES.length],
  weight: (index % 9) + 1,
  total: (index + 3) * 650_000,
  note: index % 4 === 0 ? 'Giao gấp trong ngày, gọi trước cho khách khi tới nơi' : '',
  updatedAt: `${day((index % 28) + 1)} 09:30:00`,
}));

@Component({
  selector: 'app-table-settings-example',
  standalone: true,
  imports: [SdTable],
  templateUrl: './table-settings.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSettingsExampleComponent {
  // why: `key` lưu thiết lập vào localStorage — tải lại trang vẫn giữ thứ tự, độ rộng, cột ẩn.
  readonly option: SdTableOption<Order> = {
    type: 'local',
    key: 'showcase-table-settings',
    items: () => ORDERS,
    paginate: { pageSize: 5, pages: [5, 10, 24] },
    config: { visible: true, resizable: true },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '120px', fixed: true },
      { field: 'customer', title: 'Khách hàng', type: 'string', width: '200px', minWidth: '160px', maxWidth: '320px' },
      { field: 'phone', title: 'Điện thoại', type: 'string', width: '130px' },
      { field: 'email', title: 'Email', type: 'string', width: '200px', invisible: true },
      { field: 'createdAt', title: 'Ngày tạo', type: 'date', width: '120px' },
      { field: 'status', title: 'Trạng thái', type: 'string', width: '140px' },
      { field: 'channel', title: 'Kênh bán', type: 'string' },
      { field: 'payment', title: 'Thanh toán', type: 'string', width: '140px' },
      { field: 'staff', title: 'Nhân viên phụ trách', type: 'string', width: '180px', cell: { truncate: { enable: true } } },
      { field: 'warehouse', title: 'Kho xuất', type: 'string', width: '120px' },
      { field: 'weight', title: 'Cân nặng (kg)', type: 'number', align: 'right', width: '120px' },
      { field: 'total', title: 'Tổng tiền', type: 'number', align: 'right', width: '140px' },
      { field: 'note', title: 'Ghi chú', type: 'string', width: '20%', cell: { truncate: { enable: true } } },
      { field: 'updatedAt', title: 'Cập nhật', type: 'datetime', width: '160px' },
    ],
  };
}
