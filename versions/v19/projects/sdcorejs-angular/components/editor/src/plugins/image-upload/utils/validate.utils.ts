import { FileLoader } from 'ckeditor5';
import { SdEditorImageUploadValidation } from '../../../models';

// Dựa vào file để detect định dạng thay vì chỉ check tên
// Tránh user gửi file không đúng, ví dụ file docx nhưng đổi tên thành ảnh docx.jpg
const detectFormatFromBytes = async (file: File): Promise<string> => {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const b = new Uint8Array(buffer);

  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57) return 'webp';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'gif';
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand === 'avif') return 'avif';
    if (brand.startsWith('hei')) return 'heic';
  }
  return '';
};

const getImageInfo = async (file: File): Promise<{ width: number; height: number; sizeMB: number; format: string }> => {
  const sizeMB = file.size / (1024 * 1024);
  const loadDimensions = new Promise<{ width: number; height: number }>(resolve => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
  const [format, { width, height }] = await Promise.all([detectFormatFromBytes(file), loadDimensions]);
  return { width, height, sizeMB, format };
};

const validateImageFile = async (
  file: File,
  validation: SdEditorImageUploadValidation,
  onWarning?: (message: string) => void
): Promise<boolean> => {
  const { width, height, sizeMB, format } = await getImageInfo(file);

  if (validation.allowedFormats !== undefined) {
    const normalizedFormats = validation.allowedFormats.map((f: string) => {
      const fmt = f.replace(/^\./, '').toLowerCase();
      return fmt === 'jpeg' ? 'jpg' : fmt;
    });
    if (!normalizedFormats.includes(format)) {
      onWarning?.(`Định dạng file ".${format}" không được phép. Các định dạng hợp lệ: ${normalizedFormats.join(', ')}`);
      return false;
    }
  }
  if (validation.maxSizeMB !== undefined && sizeMB > validation.maxSizeMB) {
    onWarning?.(`Dung lượng file ${sizeMB.toFixed(2)}MB vượt quá giới hạn ${validation.maxSizeMB}MB`);
    return false;
  }
  if (validation.minWidth !== undefined && width < validation.minWidth) {
    onWarning?.(`Chiều rộng ảnh ${width}px nhỏ hơn giới hạn tối thiểu ${validation.minWidth}px`);
    return false;
  }
  if (validation.minHeight !== undefined && height < validation.minHeight) {
    onWarning?.(`Chiều cao ảnh ${height}px nhỏ hơn giới hạn tối thiểu ${validation.minHeight}px`);
    return false;
  }
  if (validation.maxWidth !== undefined && width > validation.maxWidth) {
    onWarning?.(`Chiều rộng ảnh ${width}px vượt quá giới hạn ${validation.maxWidth}px`);
    return false;
  }
  if (validation.maxHeight !== undefined && height > validation.maxHeight) {
    onWarning?.(`Chiều cao ảnh ${height}px vượt quá giới hạn ${validation.maxHeight}px`);
    return false;
  }
  return true;
};

export const validateAndGetFile = async (
  loader: FileLoader,
  validation?: SdEditorImageUploadValidation,
  onWarning?: (message: string) => void
): Promise<File> => {
  const file = (await loader.file) as File | null;
  if (!file) {
    throw new Error('No file found');
  }
  if (validation) {
    const valid = await validateImageFile(file, validation, onWarning);
    if (!valid) {
      throw new Error('Image validation failed');
    }
  }
  return file;
};
