import { InjectionToken, type Signal } from '@angular/core';

/**
 * Bố cục mà một khung trang (ví dụ `sd-page-list`) yêu cầu ở `sd-table` bên trong nó.
 *
 * why: token nằm ở entry của table để table không phụ thuộc ngược vào `modules/layout`.
 */
export interface SdTableLayout {
  /**
   * Phần tử phải lấp phần chiều cao còn lại: chính host của bảng, hoặc một wrapper chứa bảng. Bảng nằm trong
   * phần tử này chuyển sang chế độ fill; các bảng khác giữ nguyên.
   */
  readonly fillTarget: Signal<Element | null>;
  /** Trạng thái thu gọn ban đầu của external filter ở bảng fill khi `filter.externalFilterCollapsed` không đặt. */
  readonly externalFilterCollapsed: Signal<boolean>;
}

export const SD_TABLE_LAYOUT = new InjectionToken<SdTableLayout>('SD_TABLE_LAYOUT');
