import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { PagingReq, PagingRes } from '@sdcorejs/utils/models';

export type ProductStatus = 'active' | 'inactive';

export const PRODUCT_STATUS_OPTIONS = [
  { id: 'active', name: 'Đang hoạt động', color: 'success' },
  { id: 'inactive', name: 'Ngừng hoạt động', color: 'secondary' },
] satisfies { id: ProductStatus; name: string; color: SdBadgeData['color'] }[];

export interface ProductDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: ProductStatus;
  /** Đơn vị tính. */
  readonly unit: string;
  /** Giá bán (₫). */
  readonly price: number;
}

/** PagingReq dùng pageNumber bắt đầu từ 0. */
export type ProductListReq = PagingReq<ProductDto>;
export type ProductListRes = PagingRes<ProductDto>;

export interface ProductSaveReq {
  readonly code: string;
  readonly name: string;
  readonly status: ProductStatus;
  readonly unit: string;
  readonly price: number;
}

/** Badge trạng thái cạnh title của chi tiết. */
export function productStatusBadge(status: ProductStatus): SdBadgeData {
  const option = PRODUCT_STATUS_OPTIONS.find(item => item.id === status);
  return { type: 'round', title: option?.name ?? status, color: option?.color };
}
