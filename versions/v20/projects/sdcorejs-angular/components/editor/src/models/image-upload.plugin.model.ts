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
  // 'immediate': Upload ngay khi chọn ảnh.
  // 'deferred': Lưu tạm ảnh blob, khi submit thì viewChild component sd-editor rồi gọi upload() để tự động map lại src lấy từ uploadFn,
  uploadMode?: 'deferred' | 'immediate'; // Mặc định là 'deferred'
  uploadFn?: (files: File[]) => Promise<SdEditorUploadFileDetail[]>;
  validation?: SdEditorImageUploadValidation;
  maxConcurrentUploads?: number;
  batchSize?: number;
  maxImagesPerSelection?: number;
  lazyLoad?: boolean;
}
