/** Dữ liệu của ví dụ nhúng trên trang Page List (128 đơn, PRNG Park–Miller seed 20261024, giống seed của /pattern/order). */

export type OrderStatus = 'pending' | 'shipping' | 'done' | 'cancelled';

export interface Order {
  readonly id: number;
  readonly code: string;
  readonly customer: string;
  readonly channel: string;
  readonly createdAt: Date;
  readonly total: number;
  readonly status: OrderStatus;
  readonly warehouse: string;
  readonly payment: string;
}

export const ORDER_STATUSES: readonly { readonly value: OrderStatus; readonly display: string; readonly color: 'warning' | 'info' | 'success' | 'secondary' }[] = [
  { value: 'pending', display: 'Chờ xác nhận', color: 'warning' },
  { value: 'shipping', display: 'Đang giao', color: 'info' },
  { value: 'done', display: 'Hoàn tất', color: 'success' },
  { value: 'cancelled', display: 'Đã huỷ', color: 'secondary' },
];

export const CHANNELS = ['Online', 'Cửa hàng', 'Đại lý'] as const;
export const WAREHOUSES = ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] as const;
export const PAYMENTS = ['Tiền mặt', 'Chuyển khoản', 'COD'] as const;
const CUSTOMERS = [
  'Nguyễn An',
  'Trần Bình',
  'Lê Chi',
  'Phạm Dũng',
  'Hoàng Giang',
  'Vũ Hà',
  'Đặng Khoa',
  'Bùi Lan',
  'Đỗ Minh',
  'Hồ Ngọc',
  'Ngô Phúc',
  'Dương Quân',
  'Lý Sơn',
  'Mai Thảo',
  'Trịnh Uyên',
  'Phan Vy',
];

/** 128 đơn, PRNG Park–Miller seed 20261024: dữ liệu giống nhau mỗi lần để e2e ổn định. */
export const ORDERS: readonly Order[] = (() => {
  let seed = 20261024;
  const random = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
  const start = new Date(2026, 9, 24, 8, 0);
  return Array.from({ length: 128 }, (_, index) => {
    const roll = random();
    const status: OrderStatus =
      index < 3 ? (['pending', 'shipping', 'done'] as const)[index] : roll < 0.1 ? 'pending' : roll < 0.36 ? 'shipping' : roll < 0.94 ? 'done' : 'cancelled';
    const createdAt = new Date(start);
    createdAt.setDate(start.getDate() - Math.floor(index / 4));
    createdAt.setHours(8 + (index % 4) * 2);
    return {
      id: 2400 - index,
      code: `ĐH-${2400 - index}`,
      customer: pick(CUSTOMERS),
      channel: pick(CHANNELS),
      createdAt,
      total: Math.round((150_000 + random() * 14_850_000) / 1000) * 1000,
      status,
      warehouse: pick(WAREHOUSES),
      payment: pick(PAYMENTS),
    };
  });
})();
