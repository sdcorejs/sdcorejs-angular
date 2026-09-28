/**
 * Clockwise rotation in degrees, always a quarter turn.
 */
export type SdImageEditorRotation = 0 | 90 | 180 | 270;

/** Width and height in whole pixels. */
export interface SdImageEditorSize {
  readonly width: number;
  readonly height: number;
}

/**
 * Rectangle in whole pixels of the **oriented** image — the image as shown in the editor, after the EXIF
 * orientation, the flip and the rotation. `x`/`y` is the top-left corner; the origin is the top-left of the image.
 */
export interface SdImageEditorRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Orientation applied to the decoded source, in this order: mirror left ↔ right when `flip` is `true`, then rotate
 * clockwise by `rotate` degrees.
 *
 * Every combination of the toolbar's rotate and flip buttons reduces to this pair. For example "flip vertically"
 * on an unrotated image is stored as `{ flip: true, rotate: 180 }`.
 */
export interface SdImageEditorOrientation {
  readonly flip: boolean;
  readonly rotate: SdImageEditorRotation;
}

/**
 * Complete description of the edits, relative to the decoded source. Plain data: it is what undo/redo stores and
 * what `SdImageEditorResult.edits` returns, so a server can replay the same transform on the original file.
 *
 * Replay order: decode with the EXIF orientation applied → `flip` → `rotate` → `crop` → scale to `resize`
 * (or to the crop size when `resize` is `null`).
 *
 * @example
 * ```ts
 * const edits: SdImageEditorEdits = {
 *   flip: false,
 *   rotate: 90,
 *   crop: { x: 120, y: 0, width: 1080, height: 1080 },
 *   aspectRatio: 1,
 *   resize: { width: 512, height: 512 },
 * };
 * ```
 */
export interface SdImageEditorEdits extends SdImageEditorOrientation {
  /** Crop area in pixels of the oriented image. Always inside the image and at least 1 × 1. */
  readonly crop: SdImageEditorRect;
  /** Width / height ratio the crop is constrained to, or `null` for a free crop. */
  readonly aspectRatio: number | null;
  /** Output size chosen by the user, or `null` to follow the crop (see `SdImageEditorOutputOption.width`). */
  readonly resize: SdImageEditorSize | null;
}

/** Output formats the editor can encode, when the browser supports them. */
export type SdImageEditorFormat = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * One entry of the crop ratio picker.
 *
 * @example
 * ```ts
 * const square: SdImageEditorAspectRatio = { label: '1:1', value: 1 };
 * const free: SdImageEditorAspectRatio = { label: 'Free', value: null };
 * ```
 */
export interface SdImageEditorAspectRatio {
  /** Text of the chip. When omitted, `null` shows the translated "Free" and a number shows the ratio. */
  readonly label?: string;
  /** Width / height ratio (`16 / 9`), or `null` for a free crop. */
  readonly value: number | null;
}

/**
 * Output settings. The user can change format, quality, background and size in the panel; these values are the
 * starting point.
 *
 * @example
 * ```ts
 * const output: SdImageEditorOutputOption = {
 *   format: 'image/webp',
 *   quality: 0.85,
 *   width: 1600, // scale the crop down to at most 1600 px wide
 *   fileName: 'banner',
 * };
 * ```
 */
export interface SdImageEditorOutputOption {
  /**
   * Initial output format. Defaults to the source format; when the browser cannot encode it, PNG for images with
   * transparency and JPEG otherwise — the panel shows the format that will be produced.
   */
  format?: SdImageEditorFormat;
  /**
   * Formats offered in the panel, in this order. Defaults to JPEG, PNG and WebP. Formats the browser cannot
   * encode stay visible but disabled. Pass a single format to hide the picker.
   */
  formats?: readonly SdImageEditorFormat[];
  /** Initial JPEG/WebP quality between `0` and `1`. Ignored for PNG, which is lossless. @defaultValue `0.92` */
  quality?: number;
  /**
   * CSS colour painted under the image when encoding JPEG, which has no transparency. PNG and WebP keep the alpha
   * channel. @defaultValue `'white'`
   */
  background?: string;
  /**
   * Default output box: while the user has not typed a size, the crop is scaled down to fit inside `width` ×
   * `height` (either may be omitted), keeping its ratio. The user can still type another size.
   */
  width?: number;
  height?: number;
  /** Allow an output larger than the crop. Off by default so the editor never upscales by accident. */
  allowUpscale?: boolean;
  /**
   * File name without extension. The extension always follows the encoded format (`.jpg`, `.png`, `.webp`).
   * Defaults to the source `File` name, or `image`.
   */
  fileName?: string;
  /**
   * `'file'` returns a `File`, `'blob'` a plain `Blob`. `'auto'` (default) returns a `File` when the source is a
   * `File`.
   */
  resultType?: 'auto' | 'blob' | 'file';
}

/**
 * Hard limits, checked before any full-resolution canvas is created.
 *
 * Source limits reject the image with an error. Output limits cap the size the user can pick; when the automatic
 * size had to be reduced, the panel says so and `SdImageEditorResult.sizeLimited` is `true`.
 */
export interface SdImageEditorLimits {
  /** Largest accepted source, in bytes. @defaultValue `41_943_040` (40 MiB) */
  maxSourceSize?: number;
  /** Largest accepted source, in pixels (width × height). @defaultValue `40_000_000` */
  maxSourcePixels?: number;
  /** Largest output, in pixels. The default matches the canvas limit of iOS Safari. @defaultValue `16_777_216` */
  maxOutputPixels?: number;
  /** Longest output side, in pixels. @defaultValue `16_384` */
  maxOutputSide?: number;
}

/**
 * Configuration of `<sd-image-editor>`. Every field is optional.
 *
 * @example
 * ```ts
 * readonly avatarOption: SdImageEditorOption = {
 *   aspectRatio: 1,
 *   lockAspectRatio: true,
 *   output: { format: 'image/jpeg', width: 512, height: 512, fileName: 'avatar' },
 *   limits: { maxSourceSize: 10 * 1024 * 1024 },
 * };
 * ```
 */
export interface SdImageEditorOption {
  /** Ratio chips shown above the crop fields. Defaults to Free, 1:1, 4:3, 16:9 and 3:4. */
  aspectRatios?: readonly SdImageEditorAspectRatio[];
  /** Ratio selected when an image loads. `null` (default) starts with a free crop of the whole image. */
  aspectRatio?: number | null;
  /** Keep `aspectRatio` for the whole session and hide the ratio chips — for avatars, thumbnails, banners. */
  lockAspectRatio?: boolean;
  /** Output format, quality, size and file name. */
  output?: SdImageEditorOutputOption;
  /** Source and output limits. */
  limits?: SdImageEditorLimits;
  /** Number of undo steps kept. @defaultValue `50` */
  historyLimit?: number;
  /** E2E scope. Produces `data-autoid="components-image-editor-{autoId}"` and derived child ids. */
  autoId?: string;
}

/**
 * Resolved by `SdImageEditor.getResult()`: the encoded image and what produced it.
 *
 * The editor never uploads, downloads or overwrites anything: send `blob` to your API yourself.
 *
 * @example
 * ```ts
 * async save(): Promise<void> {
 *   const result = await this.editor().getResult();
 *   const form = new FormData();
 *   form.append('file', result.blob, result.fileName);
 *   await firstValueFrom(this.http.post('/api/avatar', form));
 * }
 * ```
 */
export interface SdImageEditorResult {
  /** Encoded image. The same object as `file` when a `File` is returned. */
  readonly blob: Blob;
  /** `File` named `fileName`, or `null` when `resultType` resolved to a plain `Blob`. */
  readonly file: File | null;
  /** File name with the extension of the real encoded format. */
  readonly fileName: string;
  /** MIME type read back from the encoded bytes — never just the requested one. */
  readonly mimeType: SdImageEditorFormat;
  readonly width: number;
  readonly height: number;
  /** Encoded size in bytes. */
  readonly size: number;
  /** Quality used for JPEG/WebP; `null` for PNG. */
  readonly quality: number | null;
  /** Edits that produced the image, relative to the decoded source. */
  readonly edits: SdImageEditorEdits;
  /** `true` when the automatic output size was reduced to respect `limits`. */
  readonly sizeLimited: boolean;
}

/**
 * Reason of a failure: carried by `(failed)` for the source, and by the rejection of `getResult()` for the export.
 *
 * - `unsupported-format`: the bytes are not JPEG, PNG or WebP (for example GIF, HEIC, AVIF, SVG), whatever the
 *   declared MIME type.
 * - `animated`: an animated PNG or WebP. Only still images are supported; the editor never drops frames silently.
 * - `source-too-large`: the source is bigger than `limits.maxSourceSize`.
 * - `source-too-many-pixels`: width × height is above `limits.maxSourcePixels`.
 * - `decode-failed`: the browser could not decode the image (corrupt or truncated file).
 * - `format-unsupported`: the browser cannot encode the chosen output format.
 * - `render-failed`: the browser could not allocate the output canvas (too large for this device).
 * - `encode-failed`: the browser returned no data while encoding.
 * - `not-ready`: `getResult()` was called without a loaded image, or the image was replaced while encoding.
 */
export type SdImageEditorErrorCode =
  | 'not-ready'
  | 'unsupported-format'
  | 'animated'
  | 'source-too-large'
  | 'source-too-many-pixels'
  | 'decode-failed'
  | 'format-unsupported'
  | 'render-failed'
  | 'encode-failed';

/**
 * Error emitted by `(failed)` (source) or rejected by `getResult()` (export), and shown in the editor.
 *
 * @example
 * ```ts
 * onFailed(error: SdImageEditorError): void {
 *   if (error.code === 'source-too-large') this.notify.warning(error.message);
 * }
 * ```
 */
export interface SdImageEditorError {
  readonly code: SdImageEditorErrorCode;
  /** `'load'` while reading the source, `'export'` while encoding the result. */
  readonly stage: 'load' | 'export';
  /** Translated, user-facing message. */
  readonly message: string;
  /** Underlying error or detected MIME type, for logging. */
  readonly cause?: unknown;
}

/**
 * Lifecycle of the editor.
 *
 * - `empty`: no source.
 * - `loading`: the source is being checked and decoded.
 * - `ready`: the image can be edited.
 * - `exporting`: `getResult()` is encoding the result; the controls are disabled.
 * - `error`: the source could not be loaded. Export errors keep the editor `ready`.
 */
export type SdImageEditorStatus = 'empty' | 'loading' | 'ready' | 'exporting' | 'error';

/** Facts about the loaded source, exposed through `SdImageEditor.sourceInfo`. */
export interface SdImageEditorSourceInfo {
  /** Format detected from the bytes. */
  readonly mimeType: SdImageEditorFormat;
  /** Decoded size, EXIF orientation applied. */
  readonly width: number;
  readonly height: number;
  /** Source size in bytes. */
  readonly size: number;
  /**
   * The image has transparent pixels: the header declares an alpha channel and the decoded pixels confirm it
   * (checked once on the preview copy). Always `false` for JPEG.
   */
  readonly hasAlpha: boolean;
  /** EXIF orientation found in a JPEG (1 when absent). The browser applies it while decoding. */
  readonly exifOrientation: number;
}
