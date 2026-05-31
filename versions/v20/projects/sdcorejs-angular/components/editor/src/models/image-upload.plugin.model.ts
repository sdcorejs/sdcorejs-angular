import { SdEditorUploadFileDetail } from '../configurations';

export interface SdEditorImageUploadValidation {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxSizeMB?: number;
  allowedFormats?: string[];
}

export interface SdEditorImageConfig {
  /**
   * Chế độ tải lên hình ảnh.
   * 'immediate': Upload ngay khi chọn ảnh.
   * 'deferred': Lưu tạm ảnh blob, khi submit thì viewChild component sd-editor rồi gọi upload() để tự động map lại src lấy từ uploadFn,
   * @default 'deferred'
   */
  uploadMode?: 'deferred' | 'immediate';

  /**
   * Hàm xử lý tải lên file
   * Nếu thuộc tính này được khai báo, tính năng tải lên hình ảnh trong editor sẽ tự động được kích hoạt.
   * @param files Danh sách các tệp (File) cần tải lên.
   * @returns Promise chứa mảng thông tin chi tiết của các tệp sau khi tải lên thành công.
   */
  uploadFn?: (files: File[]) => Promise<SdEditorUploadFileDetail[]>;

  /**
   * Validation hình ảnh trước khi tiến hành tải lên.
   */
  validation?: SdEditorImageUploadValidation;

  /**
   * Số lượng luồng tải lên (API calls) tối đa được thực thi đồng thời.
   * Ví dụ: Nếu có 10 API cần tải lên, hệ thống sẽ đưa vào hàng đợi và xử lý song song dựa trên giới hạn này để tránh nghẽn mạng và rateLimit phía BE.
   * @default 2
   */
  maxConcurrentUploads?: number;

  /**
   * Số lượng file được gom nhóm (batch) trong mỗi lần gọi hàm `uploadFn`.
   * Nếu Backend hỗ trợ multi-file, có thể thiết lập số này lớn hơn để gửi nhiều file trong cùng một payload.
   * Ví dụ: Nếu chọn 10 file và `batchSize = 5`, hệ thống sẽ chỉ gọi 2 API, mỗi lần gửi 5 file.
   * * @default 2
   */
  batchSize?: number;

  /**
   * Số lượng hình ảnh tối đa người dùng được phép chọn trong một lần thao tác.
   */
  maxImagesPerSelection?: number;

  /**
   * Kích hoạt chế độ tải chậm (lazy load) cho hình ảnh để tối ưu hóa hiệu suất
   * @default true
   */
  lazyLoad?: boolean;
}
