// Helper dùng chung cho ô tải lên và popup preview (đợt 3 · 4a, design handoff `upload-file.md` mục H1). Nội bộ, không
// export ra entry point công khai.

/**
 * Đuôi file có icon SVG trong `src/assets/file-types/`. `file-type-icon.component.scss` khai cùng danh sách và sinh một
 * class cho mỗi đuôi (thiếu file SVG thì build lỗi); spec `file-type-icon.component.spec.ts` kiểm mỗi đuôi có ảnh nền.
 */
export const SD_FILE_TYPE_ICONS = [
  '3ds', 'ai', 'asp', 'avi', 'bin', 'com', 'css', 'csv', 'dbf', 'dll', 'doc', 'docx', 'dwg', 'eml', 'eps', 'exe', 'file',
  'fla', 'gif', 'html', 'ico', 'ini', 'iso', 'jar', 'jpg', 'js', 'mkv', 'mov', 'mp3', 'mp4', 'nfo', 'obj', 'otf', 'pdf',
  'pkg', 'png', 'ppt', 'pptx', 'psd', 'rtf', 'svg', 'tiff', 'ttf', 'txt', 'vcf', 'wav', 'wmv', 'xls', 'xlsx', 'xml', 'zip',
] as const; // prettier-ignore

export type SdFileTypeIcon = (typeof SD_FILE_TYPE_ICONS)[number];

const ICONS = new Set<string>(SD_FILE_TYPE_ICONS);

/** Đuôi viết khác của cùng một loại có icon. */
const ALIASES: Record<string, SdFileTypeIcon> = {
  jpeg: 'jpg',
  jpe: 'jpg',
  tif: 'tiff',
  htm: 'html',
  mpeg: 'mp4',
  m4v: 'mp4',
  qt: 'mov',
};

/** Đuôi (chữ thường, không dấu chấm) của tên file hoặc URL; bỏ query và fragment. `undefined` khi không có. */
export const sdFileExtension = (nameOrUrl: string | null | undefined): string | undefined => {
  if (!nameOrUrl) return undefined;
  const path = nameOrUrl.split(/[?#]/)[0];
  const base = path.substring(path.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot > 0 && dot < base.length - 1 ? base.substring(dot + 1).toLowerCase() : undefined;
};

/** Icon SVG cho một đuôi file; đuôi không có icon thì `file`. */
export const sdFileTypeIcon = (extension: string | null | undefined): SdFileTypeIcon => {
  const ext = extension?.replace(/^\./, '').toLowerCase();
  if (!ext) return 'file';
  if (ICONS.has(ext)) return ext as SdFileTypeIcon;
  return ALIASES[ext] ?? 'file';
};

/** Nhóm màu của đuôi file trong filmstrip của popup: PDF đỏ, Word xanh dương, Excel xanh lá, còn lại màu chữ phụ. */
export type SdFileTypeGroup = 'pdf' | 'word' | 'excel' | 'image' | 'archive' | 'slides' | 'video' | 'audio' | 'other';

const GROUPS: Record<string, SdFileTypeGroup> = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  rtf: 'word',
  odt: 'word',
  txt: 'word',
  xls: 'excel',
  xlsx: 'excel',
  csv: 'excel',
  ods: 'excel',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  heic: 'image',
  heif: 'image',
  tif: 'image',
  tiff: 'image',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  gz: 'archive',
  tar: 'archive',
  ppt: 'slides',
  pptx: 'slides',
  odp: 'slides',
  mp4: 'video',
  mov: 'video',
  avi: 'video',
  mkv: 'video',
  wmv: 'video',
  webm: 'video',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  m4a: 'audio',
};

export const sdFileTypeGroup = (extension: string | null | undefined): SdFileTypeGroup =>
  GROUPS[extension?.replace(/^\./, '').toLowerCase() ?? ''] ?? 'other';

/**
 * Icon Material một màu cho đuôi file, dùng trên nền tối của popup (icon SVG có nền trắng, không tô được màu của
 * viewer).
 */
export const sdFileTypeSymbol = (extension: string | null | undefined): string =>
  ({
    pdf: 'picture_as_pdf',
    word: 'description',
    excel: 'table_chart',
    image: 'image',
    archive: 'folder_zip',
    slides: 'slideshow',
    video: 'movie',
    audio: 'audio_file',
    other: 'draft',
  })[sdFileTypeGroup(extension)];

const MB = 1024 * 1024;

/**
 * Dung lượng theo locale: dưới 1 MB là `{n} KB` (số nguyên làm tròn lên, tối thiểu 1 KB), từ 1 MB là `{n} MB` với một
 * chữ số thập phân (vi: `2,4 MB`). `bytes` không phải số dương thì chuỗi rỗng.
 */
export const sdFormatFileSize = (bytes: number | null | undefined, locale?: string): string => {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < MB) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.max(1, Math.ceil(bytes / 1024)))} KB`;
  }
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / MB)} MB`;
};

/** Dòng phụ của một file: `{EXT} · {dung lượng}`; thiếu phần nào thì bỏ phần đó. */
export const sdFileMeta = (extension: string | null | undefined, bytes: number | null | undefined, locale?: string): string =>
  [extension?.replace(/^\./, '').toUpperCase(), sdFormatFileSize(bytes, locale)].filter(Boolean).join(' · ');
