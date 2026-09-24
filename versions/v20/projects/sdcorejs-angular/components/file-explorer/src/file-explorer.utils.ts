import {
  SD_FILE_EXPLORER_ICON_EXTENSIONS,
  SD_FILE_EXPLORER_ICON_MIME,
  SD_FILE_EXPLORER_ICON_SVGS,
  type SdFileExplorerIconName,
} from './file-explorer-icons.generated';
import type { SdFileExplorerItem } from './file-explorer.model';

/** Family of an item: picks the type label and the preview renderer. The glyph comes from `sdFileExplorerIconName`. */
export type SdFileExplorerFileType =
  | 'folder'
  | 'image'
  | 'pdf'
  | 'spreadsheet'
  | 'document'
  | 'presentation'
  | 'video'
  | 'audio'
  | 'archive'
  | 'text'
  | 'other';

/** Renderer used by the detail drawer. */
export type SdFileExplorerPreviewKind = 'image' | 'pdf' | 'none';

const EXTENSIONS: Readonly<Record<Exclude<SdFileExplorerFileType, 'folder' | 'other'>, readonly string[]>> = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico', 'heic'],
  pdf: ['pdf'],
  spreadsheet: ['xls', 'xlsx', 'xlsm', 'csv', 'ods', 'numbers'],
  document: ['doc', 'docx', 'odt', 'rtf', 'pages'],
  presentation: ['ppt', 'pptx', 'odp', 'key'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2'],
  text: ['txt', 'md', 'json', 'xml', 'log', 'yml', 'yaml', 'html', 'css', 'js', 'ts'],
};

const LOCALES: Readonly<Record<string, string>> = { vi: 'vi-VN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN' };

/** Maps a Core UI language code to the locale used by `Intl` formatters. */
export function sdFileExplorerLocale(language: string): string {
  return LOCALES[language] ?? 'vi-VN';
}

/** Lower-cased extension of a file name, without the dot; empty when there is none. */
export function sdFileExplorerExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : '';
}

/** Resolves the visual family of an item from its MIME type, falling back to the extension of its name. */
export function sdFileExplorerFileType(item: Pick<SdFileExplorerItem, 'kind' | 'name' | 'mimeType'>): SdFileExplorerFileType {
  if (item.kind === 'folder') return 'folder';
  const mime = (item.mimeType ?? '').toLowerCase();
  if (mime) {
    if (mime.startsWith('image/')) return 'image';
    if (mime === 'application/pdf') return 'pdf';
    if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') return 'spreadsheet';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
    if (mime.includes('wordprocessing') || mime.includes('msword') || mime.includes('opendocument.text') || mime === 'application/rtf') {
      return 'document';
    }
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (/(zip|rar|7z|tar|gzip|compressed)/.test(mime)) return 'archive';
    if (mime.startsWith('text/') || mime.endsWith('json') || mime.endsWith('xml')) return 'text';
  }
  const ext = sdFileExplorerExtension(item.name);
  for (const [type, extensions] of Object.entries(EXTENSIONS)) {
    if (extensions.includes(ext)) return type as SdFileExplorerFileType;
  }
  return 'other';
}

function lookup(map: Readonly<Record<string, SdFileExplorerIconName>>, key: string): SdFileExplorerIconName | undefined {
  // why: tra bằng hasOwnProperty — tên như "x.constructor" không được trả về hàm của Object.prototype.
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}

/**
 * Built-in icon for an item. Folders use `folder-open` / `folder-closed`. Files resolve the longest known
 * extension first (`report.tar.gz`, `types.d.ts`), then dot-files (`.env`), then the MIME type (exact match,
 * then family such as `image/`), and finally `file-generic`.
 */
export function sdFileExplorerIconName(
  item: Pick<SdFileExplorerItem, 'kind' | 'name' | 'mimeType'>,
  options: { open?: boolean } = {}
): SdFileExplorerIconName {
  if (item.kind === 'folder') return options.open ? 'folder-open' : 'folder-closed';
  const basename = (item.name.split(/[\\/]/).pop() ?? '').toLowerCase();
  const suffixes = basename.split('.').slice(1);
  for (let i = 0; i < suffixes.length; i++) {
    const icon = lookup(SD_FILE_EXPLORER_ICON_EXTENSIONS, suffixes.slice(i).join('.'));
    if (icon) return icon;
  }
  const dotfile = basename.startsWith('.') ? lookup(SD_FILE_EXPLORER_ICON_EXTENSIONS, basename.slice(1)) : undefined;
  if (dotfile) return dotfile;
  if (basename.startsWith('.env.')) return 'file-code';
  const mime = (item.mimeType ?? '').toLowerCase().split(';', 1)[0].trim();
  const exact = mime ? lookup(SD_FILE_EXPLORER_ICON_MIME, mime) : undefined;
  if (exact) return exact;
  const family = Object.keys(SD_FILE_EXPLORER_ICON_MIME).find(prefix => prefix.endsWith('/') && mime.startsWith(prefix));
  return (family && SD_FILE_EXPLORER_ICON_MIME[family]) || 'file-generic';
}

const ICON_URLS = new Map<SdFileExplorerIconName, string>();

/** `data:` URL of a built-in icon, encoded once and cached (the SVGs keep their own colours, so `<img>` is enough). */
export function sdFileExplorerIconUrl(name: SdFileExplorerIconName): string {
  let url = ICON_URLS.get(name);
  if (!url) {
    const svg = SD_FILE_EXPLORER_ICON_SVGS[name] ?? SD_FILE_EXPLORER_ICON_SVGS['file-generic'];
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    ICON_URLS.set(name, url);
  }
  return url;
}

/** Preview renderer for a file type. */
export function sdFileExplorerPreviewKind(type: SdFileExplorerFileType): SdFileExplorerPreviewKind {
  if (type === 'image') return 'image';
  if (type === 'pdf') return 'pdf';
  return 'none';
}

/**
 * Human-readable size: `846 KB`, `2,4 MB` (vi) / `2.4 MB` (en).
 * One decimal below 10 units, none above — the precision users expect from file managers.
 */
export function sdFileExplorerFormatSize(bytes: number | null | undefined, locale: string): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = value < 10 ? 1 : 0;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)} ${units[unit]}`;
}

/** Parses `SdFileExplorerItem.modifiedAt`; `null` when missing or invalid. */
export function sdFileExplorerParseDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Compact modification date: "today" / "yesterday" labels, day + month within the current year,
 * full date otherwise. Order of day and month follows the locale.
 */
export function sdFileExplorerFormatDate(
  value: Date | string | number | null | undefined,
  now: Date,
  locale: string,
  labels: { today: string; yesterday: string }
): string {
  const date = sdFileExplorerParseDate(value);
  if (!date) return '';
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  // why: so sánh theo mốc 0h local (không trừ 86 400 000 ms) để ngày chuyển giờ DST vẫn đúng "hôm qua".
  if (day === startOfToday) return labels.today;
  if (day === new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()) return labels.yesterday;
  const options: Intl.DateTimeFormatOptions =
    date.getFullYear() === now.getFullYear() ? { day: '2-digit', month: '2-digit' } : { day: '2-digit', month: '2-digit', year: 'numeric' };
  // why: lấy THỨ TỰ ngày/tháng theo locale nhưng luôn nối bằng "/" — Chrome format vi-VN ngày+tháng thành "21-09".
  return new Intl.DateTimeFormat(locale, options)
    .formatToParts(date)
    .filter(part => part.type === 'day' || part.type === 'month' || part.type === 'year')
    .map(part => part.value)
    .join('/');
}

/** Full date and time, used as tooltip and in the preview metadata. */
export function sdFileExplorerFormatDateTime(value: Date | string | number | null | undefined, locale: string): string {
  const date = sdFileExplorerParseDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Lower-cases and strips Vietnamese accents so "tai lieu" matches "Tài liệu". */
export function sdFileExplorerNormalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0111\u0110]/g, match => (match === '\u0110' ? 'D' : 'd'))
    .toLowerCase()
    .trim();
}

/** Readable reason from whatever a callback threw. */
export function sdFileExplorerErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return '';
}

/** `true` for errors produced by an aborted `AbortSignal`. */
export function sdFileExplorerIsAbort(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'name' in error && error.name === 'AbortError';
}

/**
 * Folders first, then files. Within each group the order returned by the callback is kept, so the
 * consumer (or its API) decides how items are sorted.
 */
export function sdFileExplorerFoldersFirst(items: readonly SdFileExplorerItem[]): SdFileExplorerItem[] {
  return [...items.filter(item => item.kind === 'folder'), ...items.filter(item => item.kind !== 'folder')];
}

/** Element-safe id fragment for `autoId` / DOM ids. */
export function sdFileExplorerSafeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}
