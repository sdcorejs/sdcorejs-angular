const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'heic', 'heif'];
export const IsImage = (extension: string | undefined | null) => {
  if (!extension) {
    return false;
  }
  return IMAGE_EXTENSIONS.includes(extension?.toLowerCase());
};

export interface PreviewFile {
  idOrKey?: string | number;
  file?: File | null;
  src?: string | null;
  previewSrc: string | ArrayBuffer | null;
  isPreviewImage: boolean; // Chỉ preview nếu là ảnh, ngoại trừ định dạng ảnh TIFF (fileType: TIFF hoặc mimeType: image/tiff) do thẻ img không hỗ trợ
  fileName?: string | null;
  fileSize?: number | null;
  extension?: string | null;
  isImgError?: boolean;
}
