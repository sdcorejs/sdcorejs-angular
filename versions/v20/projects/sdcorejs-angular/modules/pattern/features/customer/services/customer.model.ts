import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { PagingReq, PagingRes } from '@sdcorejs/utils/models';
import type { OrderStatus } from '../../order/services/order.model';

export type CustomerType = 'individual' | 'business';
export type CustomerTier = 'standard' | 'vip';
export type CustomerStatus = 'active' | 'inactive';

export const CUSTOMER_TYPE_OPTIONS = [
  { id: 'individual', name: 'Cá nhân' },
  { id: 'business', name: 'Doanh nghiệp' },
] satisfies { id: CustomerType; name: string }[];

export const CUSTOMER_STATUS_OPTIONS = [
  { id: 'active', name: 'Đang hoạt động', color: 'success' },
  { id: 'inactive', name: 'Ngừng hoạt động', color: 'secondary' },
] satisfies { id: CustomerStatus; name: string; color: SdBadgeData['color'] }[];

/** Nhóm khách của score card; `null` là tất cả. */
export type CustomerSegment = 'individual' | 'business' | 'vip';

export interface CustomerDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: CustomerType;
  readonly tier: CustomerTier;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly taxCode: string | null;
  readonly status: CustomerStatus;
  /** Công nợ hiện tại (₫). */
  readonly debt: number;
  readonly createdAt: string;
  readonly note: string | null;
}

export type CustomerListReq = PagingReq<CustomerDto>;
export type CustomerListRes = PagingRes<CustomerDto>;

/** Số khách theo nhóm, cùng bộ lọc với danh sách (trừ nhóm đang chọn). */
export type CustomerCounts = Record<'all' | CustomerSegment, number>;

export interface CustomerSaveReq {
  readonly name: string;
  readonly type: CustomerType;
  readonly tier: CustomerTier;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly taxCode: string | null;
  readonly status: CustomerStatus;
  readonly note: string | null;
}

/** Dòng của tab Đơn hàng trong hồ sơ 360°. */
export interface CustomerOrderDto {
  readonly id: string;
  readonly code: string;
  readonly createdAt: string;
  readonly total: number;
  readonly status: OrderStatus;
}

/** Dòng của tab Công nợ. */
export interface CustomerDebtDto {
  readonly id: string;
  readonly orderId: string;
  readonly orderCode: string;
  readonly dueDate: string;
  readonly amount: number;
  readonly status: 'OVERDUE' | 'CURRENT';
  readonly overdueDays: number;
}

/** Dòng của tab Tài liệu. */
export interface CustomerDocumentDto {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly uploadedAt: string;
  /** PDF rendition for the embedded viewer, including documents originally uploaded in Office formats. */
  readonly previewUrl: string;
}

export interface CustomerActivityDto {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly date: string;
}

export interface CustomerSummaryDto {
  readonly debtTotal: number;
  readonly overdueTotal: number;
  readonly overdueCount: number;
  readonly revenue12m: number;
  readonly orderCount: number;
  readonly documentCount: number;
  readonly lastOrder: { readonly id: string; readonly code: string; readonly date: string; readonly status: OrderStatus } | null;
  readonly owner: { readonly name: string; readonly team: string };
}

export function customerStatusBadge(status: CustomerStatus): SdBadgeData {
  const option = CUSTOMER_STATUS_OPTIONS.find(item => item.id === status);
  return { type: 'round', title: option?.name ?? status, color: option?.color };
}

export function customerTypeName(type: CustomerType): string {
  return CUSTOMER_TYPE_OPTIONS.find(item => item.id === type)?.name ?? type;
}
