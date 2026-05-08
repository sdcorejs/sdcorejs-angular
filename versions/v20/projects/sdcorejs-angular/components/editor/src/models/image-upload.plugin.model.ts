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
  /** 'immediate': upload ngay khi chọn ảnh.
   ** 'deferred': lưu tạm, upload thì viewChild component rồi gọi upload() */
  uploadMode?: 'immediate' | 'deferred';
  uploadFn?: (files: File[]) => Promise<SdEditorUploadFileDetail[]>;
  validation?: SdEditorImageUploadValidation;
  maxConcurrentUploads?: number;
  batchSize?: number;
  maxImagesPerSelection?: number;
  lazyLoad?: boolean;
}
