import { InjectionToken } from '@angular/core';

/**
 * Contract cấu hình cho cơ chế upload file của sd-angular.
 *
 * Cách dùng phổ biến:
 * - Portal có thể provide cấu hình mặc định ở tầng global.
 * - Mỗi module có thể provide thêm cấu hình riêng (thường với `multi: true`).
 * - Khi có nhiều cấu hình cùng lúc, dùng `key` để chọn đúng provider.
 *
 * Luồng xử lý:
 * 1) `upload`: upload file mới, trả về danh sách id/key.
 * 2) `details`: lấy metadata để render danh sách file từ id/key.
 * 3) `download` (optional): tải file theo id/key.
 */

export interface ISdUploadFileConfiguration<TArgs = unknown> {
  /**
   * Định danh cấu hình upload.
   * Bắt buộc khi app có nhiều provider upload để tránh mapping nhầm.
   */
  key?: string;

  /** Upload file và trả về danh sách id/key dùng cho lưu trữ. */
  upload: SdUploadFileFuncUpload<TArgs>;

  /** Nhận danh sách id/key và trả về dữ liệu hiển thị file trong UI. */
  details: SdUploadFileFuncDetails<TArgs>;

  /** Tùy chọn: tải file về theo id/key. */
  download?: SdUploadFileFuncDownload<TArgs>;
}

/**
 * Token DI cho upload configuration.
 * Khuyến nghị provide dạng `multi: true` để hỗ trợ nhiều nguồn upload trong cùng app/module.
 */
export const SD_UPLOAD_FILE_CONFIGURATION = new InjectionToken<ISdUploadFileConfiguration>('sd.upload-file.configuration');

/** Hàm upload file và trả về danh sách id/key tương ứng. */
export type SdUploadFileFuncUpload<TArgs> = (files: File[], args?: TArgs) => Promise<string[]>;

/** Hàm lấy thông tin file phục vụ hiển thị từ danh sách id/key. */
export type SdUploadFileFuncDetails<TArgs> = (idOrKey: (string | number)[], args?: TArgs) => Promise<SdUploadFileDetail[]>;

/** Hàm tải file theo id/key. */
export type SdUploadFileFuncDownload<TArgs> = (idOrKey: string | number, args?: TArgs) => Promise<void>;

export interface SdUploadFileDetail {
  /** Định danh file được backend trả về sau upload. */
  idOrKey: string;

  /** URL truy cập file (CDN hoặc direct URL). */
  cdn: string;

  /** Tên hiển thị file. */
  name?: string;

  /** Đuôi file: png, jpg, pdf... */
  extension?: string;

  /** Dung lượng file tính theo MB (nếu backend có trả về). */
  size?: number;
}
