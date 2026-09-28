import { sdImageEditorExportMatrix } from './image-editor.geometry';
import type { SdImageEditorEdits, SdImageEditorFormat, SdImageEditorSize } from './image-editor.model';
import {
  SD_IMAGE_EDITOR_EDITABLE_FORMATS,
  SdImageEditorDecoded,
  SdImageEditorFailure,
  sdImageEditorReleaseCanvas,
  sdImageEditorSniffFormat,
} from './image-editor.source';

// Export pipeline: one canvas at the requested output size, drawn from the full-resolution source with the same
// matrix maths as the preview, then encoded once. The preview canvas is never read back.

export interface SdImageEditorRenderRequest {
  readonly source: Pick<SdImageEditorDecoded, 'image' | 'width' | 'height'>;
  readonly edits: SdImageEditorEdits;
  readonly output: SdImageEditorSize;
  readonly format: SdImageEditorFormat;
  /** 0–1, used for JPEG and WebP only. */
  readonly quality: number;
  /** CSS colour under the image for JPEG. */
  readonly background: string;
}

export interface SdImageEditorEncoded {
  readonly blob: Blob;
  /** Format read back from the encoded bytes. */
  readonly format: SdImageEditorFormat;
}

/** Draws the edited image at the output size. The caller owns the canvas and must release it. */
export function sdImageEditorRender(doc: Document, request: SdImageEditorRenderRequest): HTMLCanvasElement {
  const { source, edits, output, format } = request;
  const canvas = doc.createElement('canvas');
  canvas.width = output.width;
  canvas.height = output.height;
  // why: trình duyệt trả canvas 0×0 hoặc context null khi vượt giới hạn bộ nhớ thiết bị (iOS ~16.7 MP) thay vì ném lỗi.
  const ctx = canvas.width === output.width && canvas.height === output.height ? canvas.getContext('2d') : null;
  if (!ctx) {
    sdImageEditorReleaseCanvas(canvas);
    throw new SdImageEditorFailure('render-failed', output);
  }
  if (format === 'image/jpeg') {
    // JPEG has no alpha: composite over white first so a translucent background colour stays predictable.
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, output.width, output.height);
    ctx.fillStyle = request.background || 'white';
    ctx.fillRect(0, 0, output.width, output.height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.setTransform(...sdImageEditorExportMatrix({ width: source.width, height: source.height }, edits, edits.crop, output));
  ctx.drawImage(source.image, 0, 0, source.width, source.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}

/**
 * Encodes the canvas and verifies the result: a `null` blob is `encode-failed`, and bytes that are not the
 * requested format (a browser silently falling back to PNG) are `format-unsupported` — never relabelled.
 */
export async function sdImageEditorEncode(
  canvas: HTMLCanvasElement,
  format: SdImageEditorFormat,
  quality: number
): Promise<SdImageEditorEncoded> {
  const lossy = format !== 'image/png';
  let blob: Blob | null;
  try {
    blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, format, lossy ? sdImageEditorClampQuality(quality) : undefined)
    );
  } catch (error) {
    throw new SdImageEditorFailure('encode-failed', error);
  }
  if (!blob || blob.size === 0) throw new SdImageEditorFailure('encode-failed');
  const actual = sdImageEditorSniffFormat(new Uint8Array(await blob.slice(0, 32).arrayBuffer()));
  if (actual !== format) throw new SdImageEditorFailure('format-unsupported', actual ?? blob.type);
  // why: một số engine để trống `type` hoặc ghi khác chuẩn — gắn lại đúng MIME đã đọc từ byte thật.
  return { blob: blob.type === format ? blob : blob.slice(0, blob.size, format), format };
}

/** Renders then encodes, always releasing the output canvas. */
export async function sdImageEditorExport(doc: Document, request: SdImageEditorRenderRequest): Promise<SdImageEditorEncoded> {
  const canvas = sdImageEditorRender(doc, request);
  try {
    return await sdImageEditorEncode(canvas, request.format, request.quality);
  } finally {
    sdImageEditorReleaseCanvas(canvas);
  }
}

export function sdImageEditorClampQuality(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0.92;
  return Math.min(1, Math.max(0.01, value));
}

const supportCache = new WeakMap<Document, Promise<ReadonlySet<SdImageEditorFormat>>>();

/**
 * Output formats this browser really encodes, probed once per document with a 1 × 1 canvas. Safari, for example,
 * returns PNG bytes when asked for WebP; such a format is reported as unsupported instead of being faked.
 */
export function sdImageEditorEncodableFormats(doc: Document): Promise<ReadonlySet<SdImageEditorFormat>> {
  let cached = supportCache.get(doc);
  if (!cached) {
    cached = probeFormats(doc);
    supportCache.set(doc, cached);
  }
  return cached;
}

async function probeFormats(doc: Document): Promise<ReadonlySet<SdImageEditorFormat>> {
  const supported = new Set<SdImageEditorFormat>();
  const canvas = doc.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  if (!canvas.getContext('2d') || typeof canvas.toBlob !== 'function') return supported;
  try {
    for (const format of SD_IMAGE_EDITOR_EDITABLE_FORMATS) {
      try {
        await sdImageEditorEncode(canvas, format, 0.9);
        supported.add(format);
      } catch {
        // not encodable here
      }
    }
  } finally {
    sdImageEditorReleaseCanvas(canvas);
  }
  return supported;
}

/**
 * Draws a downscaled copy of the source (at most `maxPixels`) into `canvas` for the on-screen preview. Returns the
 * preview size. Interaction runs on this copy; the export always reads the full source.
 */
export function sdImageEditorDrawPreview(
  canvas: HTMLCanvasElement,
  source: Pick<SdImageEditorDecoded, 'image' | 'width' | 'height'>,
  maxPixels: number
): SdImageEditorSize {
  const scale = Math.min(1, Math.sqrt(maxPixels / (source.width * source.height)));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new SdImageEditorFailure('render-failed', { width, height });
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source.image, 0, 0, width, height);
  return { width, height };
}

/**
 * `true` when the canvas holds at least one pixel that is not fully opaque. Used once per load on the preview copy,
 * only when the header declares an alpha channel — encoders often write RGBA even for opaque images.
 */
export function sdImageEditorHasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.width || !canvas.height) return false;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

const EXTENSIONS: Record<SdImageEditorFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const IMAGE_EXTENSION = /\.(?:jpe?g|jfif|png|apng|webp|gif|bmp|heic|heif|avif|tiff?|svg)$/i;

export function sdImageEditorExtension(format: SdImageEditorFormat): string {
  return EXTENSIONS[format];
}

/** `base` without its image extension, plus the extension of `format`. */
export function sdImageEditorFileName(base: string | undefined, format: SdImageEditorFormat): string {
  const stem = (base ?? '').trim().replace(IMAGE_EXTENSION, '').trim() || 'image';
  return `${stem}.${EXTENSIONS[format]}`;
}

/** `1.2 MB`, `245 KB`, `830 B` in the given locale. */
export function sdImageEditorFormatBytes(bytes: number, locale: string): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  let text: string;
  try {
    text = new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  } catch {
    text = value.toFixed(digits);
  }
  return `${text} ${units[unit]}`;
}

/**
 * Normalises a CSS colour to `#rrggbb` for `<input type="color">`, using the canvas colour parser. Returns `null`
 * for an invalid colour.
 */
export function sdImageEditorColorToHex(doc: Document, color: string): string | null {
  const ctx = doc.createElement('canvas').getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = 'black';
  ctx.fillStyle = color;
  const first = String(ctx.fillStyle);
  ctx.fillStyle = 'white';
  ctx.fillStyle = color;
  // why: màu không hợp lệ bị bỏ qua nên fillStyle giữ giá trị trước — hai lần gán khác nhau cho ra hai kết quả khác nhau.
  if (String(ctx.fillStyle) !== first) return null;
  return /^#[0-9a-f]{6}$/i.test(first) ? first.toLowerCase() : null;
}
