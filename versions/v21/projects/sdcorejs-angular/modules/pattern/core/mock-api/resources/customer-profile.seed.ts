import type { CustomerActivityDto, CustomerDocumentDto, CustomerOrderDto } from '../../../features/customer/services/customer.model';
import { COMPANY_NAMES } from './names';

/** Snapshot date shared by the sample ledger and its "overdue by N days" labels. */
export const PROFILE_AS_OF = '2026-11-24';
export const PROFILE_CUSTOMER_ID = '12';
export const PROFILE_CUSTOMER = {
  id: PROFILE_CUSTOMER_ID,
  code: 'KH0012',
  name: COMPANY_NAMES[0],
  type: 'business',
  tier: 'vip',
  status: 'active',
  debt: 128_400_000,
  taxCode: '0312 456 789',
  phone: '028 3822 1190',
  email: 'ketoan@minhphat.example',
  address: '12 Lê Lợi, Q.1, TP.HCM',
  createdAt: '2021-03-12T03:00:00.000Z',
  note: 'Giao giờ hành chính, gọi trước 30 phút.',
} as const;

const onDate = (date: string) => date + 'T03:00:00.000Z';
const order = (id: number, date: string, total: number, status: CustomerOrderDto['status'] = 'done'): CustomerOrderDto => ({
  id: String(id),
  code: 'DH' + id,
  createdAt: onDate(date),
  total,
  status,
});

/** These are actual rows of the 128-order seed so every profile and invoice link opens the same order. */
function profileOrders(): Map<string, CustomerOrderDto> {
  const rows = [
    order(2408, '2026-11-02', 3_120_000, 'shipping'),
    order(2391, '2026-10-28', 1_240_000),
    order(2377, '2026-10-21', 5_600_000),
    order(2360, '2026-10-14', 890_000, 'cancelled'),
    order(2342, '2026-10-06', 2_380_000),
    order(2318, '2026-09-30', 32_200_000),
    order(2301, '2026-09-15', 52_000_000),
  ];
  // The remaining 41 completed orders bring the rolling year's sales to 1.82 billion VND.
  for (let id = 2274; id <= 2315; id++) {
    if (id === 2301) continue;
    const date = new Date(Date.UTC(2026, 7, 31 - (id - 2274) * 4));
    rows.push(order(id, date.toISOString().slice(0, 10), id === 2315 ? 46_580_000 : 42_000_000));
  }
  return new Map(rows.map(row => [row.id, row]));
}

export const PROFILE_ORDERS = profileOrders();

export const PROFILE_INVOICES = [
  { orderId: '2301', dueDate: '2026-10-15', amount: 52_000_000 },
  { orderId: '2318', dueDate: '2026-10-30', amount: 32_200_000 },
  { orderId: '2408', dueDate: '2026-12-02', amount: 44_200_000 },
];

export const PROFILE_DOCUMENTS = [
  { name: 'Hợp đồng nguyên tắc 2026.pdf', size: Math.round(1.2 * 1024 * 1024), uploadedAt: '2026-10-27' },
  { name: 'Bảng giá đại lý Q4.xlsx', size: 84 * 1024, uploadedAt: '2026-10-20' },
  { name: 'Giấy phép kinh doanh.pdf', size: 640 * 1024, uploadedAt: '2026-10-06' },
  { name: 'Biên bản đối chiếu 09-2026.docx', size: 52 * 1024, uploadedAt: '2026-09-30' },
] satisfies Pick<CustomerDocumentDto, 'name' | 'size' | 'uploadedAt'>[];

export const PROFILE_ACTIVITY: CustomerActivityDto[] = [
  ['Trần Thu Hà tạo đơn DH2408', 'Đơn hàng', '2026-11-02'],
  ['Hệ thống nhắc nợ DH2301', 'Công nợ', '2026-10-30'],
  ['Lê Minh cập nhật hạng VIP', 'Thông tin', '2026-10-24'],
  ['Trần Thu Hà tải lên Bảng giá Q4', 'Tài liệu', '2026-10-20'],
  ['Đơn DH2360 đã huỷ', 'Đơn hàng', '2026-10-14'],
  ['Hoàn tất đơn DH2342', 'Đơn hàng', '2026-10-06'],
  ['Đối chiếu công nợ tháng 9', 'Công nợ', '2026-09-30'],
  ['Ghi nhận đơn DH2301', 'Đơn hàng', '2026-09-15'],
  ['Cập nhật điều kiện giao hàng', 'Thông tin', '2026-08-28'],
  ['Trần Thu Hà tiếp nhận hồ sơ', 'Thông tin', '2026-07-15'],
  ['Tiếp nhận hợp đồng nguyên tắc', 'Tài liệu', '2026-03-12'],
  ['Tạo hồ sơ khách hàng', 'Thông tin', '2021-03-12'],
].map(([title, category, date], i) => ({ id: 'seed-' + i, title, category, date: onDate(date) }));
