import type { SdPageListDetail } from '@sdcorejs/angular/modules/layout';

/** Route sống của trang Page List, mount bởi `app.routes.ts`; e2e/page-list.e2e.ts đo tiêu chí E1 trên route này. */
export const PAGE_LIST_DEMO_BASE = '/demo/page-list';

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

/**
 * Cấu hình của màn mẫu, đọc từ query `?cfg=<json>`; khoá không có dùng giá trị mặc định (doc 08 của handoff).
 * Chỉ e2e và trang Examples đổi cấu hình; code feature thật không có phần này.
 */
export interface PageListDemoConfig {
  readonly tabs: boolean;
  readonly score: boolean;
  readonly quickSearch: boolean;
  readonly warehouse: boolean;
  readonly inlineFilter: boolean | 'auto';
  readonly externalFilter: boolean;
  readonly externalFilterCollapsed: boolean;
  readonly selector: boolean;
  readonly footerButtons: boolean;
  readonly records: 0 | 3 | 20 | 128;
  readonly pageSize: 10 | 20 | 50;
  readonly state: 'normal' | 'loading' | 'error';
  readonly autoCompact: boolean;
  readonly detail: SdPageListDetail;
}

export const PAGE_LIST_DEMO_DEFAULTS: PageListDemoConfig = {
  tabs: false,
  score: false,
  quickSearch: true,
  warehouse: true,
  inlineFilter: true,
  externalFilter: false,
  externalFilterCollapsed: false,
  selector: false,
  footerButtons: true,
  records: 128,
  pageSize: 20,
  state: 'normal',
  autoCompact: true,
  detail: 'drawer',
};

export function readPageListDemoConfig(raw: string | null): PageListDemoConfig {
  if (!raw) return PAGE_LIST_DEMO_DEFAULTS;
  try {
    return { ...PAGE_LIST_DEMO_DEFAULTS, ...(JSON.parse(raw) as Partial<PageListDemoConfig>) };
  } catch {
    return PAGE_LIST_DEMO_DEFAULTS;
  }
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
