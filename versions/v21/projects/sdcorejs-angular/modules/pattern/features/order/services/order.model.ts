import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { PagingReq, PagingRes } from '@sdcorejs/utils/models';

export type OrderStatus = 'pending' | 'shipping' | 'done' | 'cancelled';
export type OrderApproval = 'draft' | 'submitted' | 'approved' | 'rejected';

export const ORDER_STATUS_OPTIONS = [
  { id: 'pending', name: 'Chờ xác nhận', color: 'warning' },
  { id: 'shipping', name: 'Đang giao', color: 'info' },
  { id: 'done', name: 'Hoàn tất', color: 'success' },
  { id: 'cancelled', name: 'Đã huỷ', color: 'secondary' },
] satisfies { id: OrderStatus; name: string; color: SdBadgeData['color'] }[];

export const ORDER_APPROVAL_OPTIONS = [
  { id: 'draft', name: 'Nháp', color: 'secondary' },
  { id: 'submitted', name: 'Chờ duyệt', color: 'warning' },
  { id: 'approved', name: 'Đã duyệt', color: 'success' },
  { id: 'rejected', name: 'Bị từ chối', color: 'error' },
] satisfies { id: OrderApproval; name: string; color: SdBadgeData['color'] }[];

export const ORDER_CHANNELS = ['Online', 'Cửa hàng', 'Đại lý'] as const;
export const ORDER_WAREHOUSES = ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] as const;
export const ORDER_PAYMENTS = ['Tiền mặt', 'Chuyển khoản', 'COD'] as const;

export interface OrderLineDto {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface OrderApprovalStepDto {
  readonly action: 'submit' | 'approve' | 'reject';
  readonly by: string;
  readonly at: string;
  readonly reason?: string;
}

export interface OrderDto {
  readonly id: string;
  readonly code: string;
  readonly customerId: string;
  /** Tên khách lúc lập đơn: chứng từ giữ snapshot, không đổi theo danh mục khách hàng. */
  readonly customer: string;
  readonly channel: string;
  readonly warehouse: string;
  readonly payment: string;
  readonly createdAt: string;
  readonly deliveredAt: string | null;
  /** Tổng tiền (₫). */
  readonly total: number;
  readonly status: OrderStatus;
  readonly approval: OrderApproval;
  readonly approvalHistory: readonly OrderApprovalStepDto[];
  readonly lines: readonly OrderLineDto[];
  readonly creator: string;
  readonly source: string;
  readonly tracking: string | null;
  readonly note: string | null;
  readonly cancelReason: string | null;
}

export type OrderListReq = PagingReq<OrderDto>;
export type OrderListRes = PagingRes<OrderDto>;

/** Số đơn theo trạng thái và doanh thu hoàn tất, cùng bộ lọc với danh sách (trừ trạng thái đang chọn). */
export type OrderCounts = Record<'all' | OrderStatus | 'revenue', number>;

export interface OrderSaveReq {
  readonly customerId: string;
  readonly channel: string;
  readonly warehouse: string;
  readonly payment: string;
  readonly note: string | null;
  readonly lines: readonly OrderLineDto[];
}

/** Tác vụ đổi trạng thái của đơn; `cancel` và `reject` bắt buộc lý do. */
export type OrderAction = 'confirm' | 'cancel' | 'submit' | 'approve' | 'reject';

export interface OrderActionReq {
  readonly id: string;
  readonly reason?: string;
}

/** Kết quả từng đơn của một tác vụ hàng loạt: API trả đủ thành công lẫn thất bại. */
export interface OrderBulkItemRes {
  readonly id: string;
  readonly ok: boolean;
  readonly message?: string;
}

export interface OrderBulkRes {
  readonly results: readonly OrderBulkItemRes[];
}

export function orderStatusBadge(status: OrderStatus): SdBadgeData {
  const option = ORDER_STATUS_OPTIONS.find(item => item.id === status);
  return { type: 'round', title: option?.name ?? status, color: option?.color };
}

export function orderApprovalBadge(approval: OrderApproval): SdBadgeData {
  const option = ORDER_APPROVAL_OPTIONS.find(item => item.id === approval);
  return { type: 'tag', title: option?.name ?? approval, color: option?.color };
}

/** Đơn còn sửa được: chờ xác nhận, chưa gửi duyệt hoặc đã bị từ chối. */
export function canUpdateOrder(order: OrderDto): boolean {
  return order.status === 'pending' && (order.approval === 'draft' || order.approval === 'rejected');
}
