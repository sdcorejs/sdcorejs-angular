import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { PagingReq, PagingRes } from '@sdcorejs/utils/models';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export const APPROVAL_STATUS_OPTIONS = [
  { id: 'pending', name: 'Chờ duyệt', color: 'warning' },
  { id: 'approved', name: 'Đã duyệt', color: 'success' },
  { id: 'rejected', name: 'Bị từ chối', color: 'error' },
] satisfies { id: ApprovalStatus; name: string; color: SdBadgeData['color'] }[];

/** Đề nghị thanh toán chờ người duyệt xử lý. */
export interface ApprovalDto {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly requester: string;
  readonly department: string;
  /** Số tiền đề nghị (₫). */
  readonly amount: number;
  readonly submittedAt: string;
  readonly status: ApprovalStatus;
  readonly reason: string | null;
  readonly note: string | null;
}

export type ApprovalListReq = PagingReq<ApprovalDto>;
export type ApprovalListRes = PagingRes<ApprovalDto>;

export interface ApprovalDecisionReq {
  readonly id: string;
  readonly reason?: string;
}

export function approvalStatusBadge(status: ApprovalStatus): SdBadgeData {
  const option = APPROVAL_STATUS_OPTIONS.find(item => item.id === status);
  return { type: 'round', title: option?.name ?? status, color: option?.color };
}
