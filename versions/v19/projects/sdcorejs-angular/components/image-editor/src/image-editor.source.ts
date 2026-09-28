import { sdImageEditorExifOrientation, sdImageEditorOrientationMatrix, sdImageEditorOrientedSize } from './image-editor.geometry';
import type { SdImageEditorErrorCode, SdImageEditorFormat, SdImageEditorSize } from './image-editor.model';

// Reads what the source is from its first bytes, before anything is decoded, then decodes it once.
// Browser APIs are only touched inside the functions, never at import time (SSR-safe).

/** How many leading bytes are read to find the format, the size, the alpha flag and the EXIF orientation. */
export const SD_IMAGE_EDITOR_HEADER_BYTES = 256 * 1024;

/** Format recognised from magic bytes. Only the first three can be edited. */
export type SdImageEditorSniffedFormat =
  | SdImageEditorFormat
  | 'image/gif'
  | 'image/bmp'
  | 'image/tiff'
  | 'image/avif'
  | 'image/heic'
  | 'image/svg+xml'
  | 'image/x-icon';

/** What the header says about an image. Dimensions are the stored ones, before EXIF orientation. */
export interface SdImageEditorHeader {
  readonly format: SdImageEditorSniffedFormat | null;
  readonly width?: number;
  readonly height?: number;
  readonly hasAlpha: boolean;
  readonly animated: boolean;
  /** EXIF orientation 1–8 (JPEG only); 1 when absent or invalid. */
  readonly orientation: number;
}

/** Error raised by the loading and export pipeline; turned into `SdImageEditorError` by the component. */
export class SdImageEditorFailure extends Error {
  constructor(
    readonly code: SdImageEditorErrorCode,
    readonly detail?: unknown
  ) {
    super(code);
    this.name = 'SdImageEditorFailure';
  }
}

export const SD_IMAGE_EDITOR_EDITABLE_FORMATS: readonly SdImageEditorFormat[] = ['image/jpeg', 'image/png', 'image/webp'];

export function sdImageEditorIsEditableFormat(format: string | null | undefined): format is SdImageEditorFormat {
  return !!format && (SD_IMAGE_EDITOR_EDITABLE_FORMATS as readonly string[]).includes(format);
}

/** Format from magic bytes only — the declared `Blob.type` is never trusted. */
export function sdImageEditorSniffFormat(bytes: Uint8Array): SdImageEditorSniffedFormat | null {
  const at = (offset: number, ...values: number[]) => values.every((value, i) => bytes[offset + i] === value);
  const text = (offset: number, value: string) => at(offset, ...Array.from(value, char => char.charCodeAt(0)));
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  if (text(0, 'RIFF') && text(8, 'WEBP')) return 'image/webp';
  if (text(0, 'GIF87a') || text(0, 'GIF89a')) return 'image/gif';
  if (text(0, 'BM')) return 'image/bmp';
  if (at(0, 0x49, 0x49, 0x2a, 0x00) || at(0, 0x4d, 0x4d, 0x00, 0x2a)) return 'image/tiff';
  if (at(0, 0x00, 0x00, 0x01, 0x00)) return 'image/x-icon';
  if (text(4, 'ftyp')) {
    const brand = String.fromCharCode(...bytes.subarray(8, 12));
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return 'image/heic';
  }
  const head = new TextDecoder().decode(bytes.subarray(0, 512)).trimStart().toLowerCase();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'image/svg+xml';
  return null;
}

/** Parses the header of a JPEG, PNG or WebP. Other formats only report `format`. */
export function sdImageEditorReadHeader(bytes: Uint8Array): SdImageEditorHeader {
  const format = sdImageEditorSniffFormat(bytes);
  const base: SdImageEditorHeader = { format, hasAlpha: false, animated: false, orientation: 1 };
  try {
    if (format === 'image/jpeg') return { ...base, ...readJpeg(bytes) };
    if (format === 'image/png') return { ...base, ...readPng(bytes) };
    if (format === 'image/webp') return { ...base, ...readWebp(bytes) };
  } catch {
    // why: header hỏng không được làm sập luồng — để bước decode của trình duyệt quyết định và báo decode-failed.
  }
  return base;
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function readJpeg(bytes: Uint8Array): Partial<SdImageEditorHeader> {
  const data = view(bytes);
  const result: { width?: number; height?: number; orientation: number } = { orientation: 1 };
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xff) {
      offset++;
      continue;
    }
    // Standalone markers carry no length.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) break;
    const length = data.getUint16(offset + 2);
    if (length < 2) break;
    const start = offset + 4;
    if (marker === 0xe1 && start + 6 <= bytes.length && isExif(bytes, start)) {
      result.orientation = readExifOrientation(bytes, start + 6, Math.min(bytes.length, offset + 2 + length));
    }
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof && start + 5 <= bytes.length) {
      result.height = data.getUint16(start + 1);
      result.width = data.getUint16(start + 3);
      break;
    }
    offset += 2 + length;
  }
  return result;
}

function isExif(bytes: Uint8Array, start: number): boolean {
  return (
    bytes[start] === 0x45 && bytes[start + 1] === 0x78 && bytes[start + 2] === 0x69 && bytes[start + 3] === 0x66 && bytes[start + 4] === 0
  );
}

function readExifOrientation(bytes: Uint8Array, tiff: number, end: number): number {
  const data = view(bytes);
  if (tiff + 8 > end) return 1;
  const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
  const big = bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d;
  if (!little && !big) return 1;
  const u16 = (at: number) => data.getUint16(at, little);
  const u32 = (at: number) => data.getUint32(at, little);
  if (u16(tiff + 2) !== 42) return 1;
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > end) return 1;
  const count = u16(ifd);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > end) break;
    if (u16(entry) === 0x0112) {
      const value = u16(entry + 8);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}

function readPng(bytes: Uint8Array): Partial<SdImageEditorHeader> {
  const data = view(bytes);
  if (bytes.length < 33) return {};
  const width = data.getUint32(16);
  const height = data.getUint32(20);
  const colorType = bytes[25];
  let hasAlpha = colorType === 4 || colorType === 6;
  let animated = false;
  let offset = 8;
  // acTL (APNG) and tRNS must appear before the first IDAT chunk.
  while (offset + 8 <= bytes.length) {
    const length = data.getUint32(offset);
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    if (type === 'IDAT' || type === 'IEND') break;
    if (type === 'acTL') animated = true;
    if (type === 'tRNS') hasAlpha = true;
    offset += 12 + length;
  }
  return { width, height, hasAlpha, animated };
}

function readWebp(bytes: Uint8Array): Partial<SdImageEditorHeader> {
  const data = view(bytes);
  const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (chunk === 'VP8X' && bytes.length >= 30) {
    const flags = bytes[20];
    const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
    const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
    return { width, height, hasAlpha: (flags & 0x10) !== 0, animated: (flags & 0x02) !== 0 };
  }
  if (chunk === 'VP8 ' && bytes.length >= 30) {
    return { width: data.getUint16(26, true) & 0x3fff, height: data.getUint16(28, true) & 0x3fff, hasAlpha: false, animated: false };
  }
  if (chunk === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
    const b1 = bytes[21];
    const b2 = bytes[22];
    const b3 = bytes[23];
    const b4 = bytes[24];
    const width = 1 + (b1 | ((b2 & 0x3f) << 8));
    const height = 1 + ((b2 >> 6) | (b3 << 2) | ((b4 & 0x0f) << 10));
    return { width, height, hasAlpha: ((b4 >> 4) & 1) === 1, animated: false };
  }
  return {};
}

/** Checks done before decoding. Throws `SdImageEditorFailure`. */
export interface SdImageEditorSourceLimits {
  readonly maxSourceSize: number;
  readonly maxSourcePixels: number;
}

export async function sdImageEditorInspect(blob: Blob, limits: SdImageEditorSourceLimits): Promise<SdImageEditorHeader> {
  if (blob.size > limits.maxSourceSize) throw new SdImageEditorFailure('source-too-large', blob.size);
  if (blob.size === 0) throw new SdImageEditorFailure('decode-failed');
  const bytes = new Uint8Array(await blob.slice(0, SD_IMAGE_EDITOR_HEADER_BYTES).arrayBuffer());
  const header = sdImageEditorReadHeader(bytes);
  if (!sdImageEditorIsEditableFormat(header.format)) throw new SdImageEditorFailure('unsupported-format', header.format ?? blob.type);
  if (header.animated) throw new SdImageEditorFailure('animated', header.format);
  if (header.width && header.height && header.width * header.height > limits.maxSourcePixels) {
    throw new SdImageEditorFailure('source-too-many-pixels', { width: header.width, height: header.height });
  }
  return header;
}

/**
 * Inspects then decodes `blob`. The pixel limit is checked on the header before decoding and again on the decoded
 * size, for JPEGs whose frame header lies beyond the bytes read.
 */
export async function sdImageEditorLoad(
  blob: Blob,
  limits: SdImageEditorSourceLimits,
  doc: Document
): Promise<{ header: SdImageEditorHeader; decoded: SdImageEditorDecoded }> {
  const header = await sdImageEditorInspect(blob, limits);
  const decoded = await sdImageEditorDecode(blob, header, doc);
  if (decoded.width * decoded.height > limits.maxSourcePixels) {
    decoded.release();
    throw new SdImageEditorFailure('source-too-many-pixels', { width: decoded.width, height: decoded.height });
  }
  return { header, decoded };
}

/** Decoded source. Call `release()` when done; it frees the bitmap and any object URL created for it. */
export interface SdImageEditorDecoded {
  readonly image: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  release(): void;
}

/**
 * Decodes once, letting the browser apply the EXIF orientation (`imageOrientation: 'from-image'`, the default of
 * every current engine). The pixels are never rotated again by the editor, so no double rotation can happen.
 *
 * Only if the decoded size shows that a swapping orientation (5–8) was ignored, the orientation is applied here,
 * exactly once.
 */
export async function sdImageEditorDecode(blob: Blob, header: SdImageEditorHeader, doc: Document): Promise<SdImageEditorDecoded> {
  const win = doc.defaultView;
  let decoded: SdImageEditorDecoded;
  try {
    decoded = win && typeof win.createImageBitmap === 'function' ? await decodeBitmap(win, blob) : await decodeElement(doc, blob);
  } catch (error) {
    if (error instanceof SdImageEditorFailure) throw error;
    throw new SdImageEditorFailure('decode-failed', error);
  }
  if (!decoded.width || !decoded.height) {
    decoded.release();
    throw new SdImageEditorFailure('decode-failed');
  }
  const swaps = header.orientation >= 5 && header.orientation <= 8;
  const ignored = swaps && header.width !== header.height && decoded.width === header.width && decoded.height === header.height;
  if (!ignored) return decoded;
  try {
    return orient(doc, decoded, header.orientation);
  } finally {
    decoded.release();
  }
}

async function decodeBitmap(win: Window & typeof globalThis, blob: Blob): Promise<SdImageEditorDecoded> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await win.createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch (error) {
    // why: engine cũ chỉ biết 'none' | 'flipY' → option lạ ném TypeError ngay khi gọi. Thử lại với mặc định của engine.
    if (!(error instanceof TypeError)) throw error;
    bitmap = await win.createImageBitmap(blob);
  }
  return { image: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
}

async function decodeElement(doc: Document, blob: Blob): Promise<SdImageEditorDecoded> {
  const urlApi = doc.defaultView?.URL;
  if (!urlApi?.createObjectURL) throw new SdImageEditorFailure('decode-failed');
  const url = urlApi.createObjectURL(blob);
  const img = doc.createElement('img');
  try {
    img.src = url;
    await img.decode();
  } catch (error) {
    urlApi.revokeObjectURL(url);
    throw error;
  }
  // why: giữ object URL tới khi release — trình duyệt có thể bỏ bản decode và đọc lại URL khi drawImage.
  return { image: img, width: img.naturalWidth, height: img.naturalHeight, release: () => urlApi.revokeObjectURL(url) };
}

function orient(doc: Document, decoded: SdImageEditorDecoded, exif: number): SdImageEditorDecoded {
  const orientation = sdImageEditorExifOrientation(exif);
  const source: SdImageEditorSize = { width: decoded.width, height: decoded.height };
  const size = sdImageEditorOrientedSize(source, orientation.rotate);
  const canvas = doc.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new SdImageEditorFailure('render-failed');
  ctx.setTransform(...sdImageEditorOrientationMatrix(source, orientation));
  ctx.drawImage(decoded.image, 0, 0, source.width, source.height);
  return { image: canvas, width: size.width, height: size.height, release: () => sdImageEditorReleaseCanvas(canvas) };
}

/** Shrinks a canvas to 0 × 0 so its backing store is freed now (Safari keeps it until GC otherwise). */
export function sdImageEditorReleaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}
