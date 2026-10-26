import type { SdBadgeData } from '@sdcorejs/angular/components/badge';

export type CategoryStatus = 'active' | 'inactive';

export const CATEGORY_STATUS_OPTIONS = [
  { id: 'active', name: 'Đang dùng', color: 'success' },
  { id: 'inactive', name: 'Ngừng dùng', color: 'secondary' },
] satisfies { id: CategoryStatus; name: string; color: SdBadgeData['color'] }[];

/** Danh mục có tối đa 3 cấp. */
export const CATEGORY_MAX_LEVEL = 3;

export interface CategoryDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly status: CategoryStatus;
}

/** Một nút của cây danh mục cho bảng cây. */
export interface CategoryNodeDto extends CategoryDto {
  /** 1 là cấp gốc. */
  readonly level: number;
  readonly productCount: number;
  readonly children: readonly CategoryNodeDto[];
}

export interface CategorySaveReq {
  readonly code: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly status: CategoryStatus;
}

export function categoryStatusBadge(status: CategoryStatus): SdBadgeData {
  const option = CATEGORY_STATUS_OPTIONS.find(item => item.id === status);
  return { type: 'round', title: option?.name ?? status, color: option?.color };
}
