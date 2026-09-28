// Shared fixtures for the image-editor specs. Images are drawn with a real canvas and encoded by the browser, so
// the specs exercise real decoding and encoding — nothing about the canvas is mocked here.

export type Rgba = readonly [number, number, number, number];

export const RED: Rgba = [255, 0, 0, 255];
export const GREEN: Rgba = [0, 255, 0, 255];
export const BLUE: Rgba = [0, 0, 255, 255];
export const YELLOW: Rgba = [255, 255, 0, 255];
export const BLACK: Rgba = [0, 0, 0, 255];
export const WHITE: Rgba = [255, 255, 255, 255];
export const TRANSPARENT: Rgba = [0, 0, 0, 0];

/** Corner colours of the quadrant fixture, as they appear on screen. */
export interface Corners {
  readonly tl: Rgba;
  readonly tr: Rgba;
  readonly bl: Rgba;
  readonly br: Rgba;
}

/** Quadrant fixture: red top-left, green top-right, blue bottom-left, yellow bottom-right. */
export const UPRIGHT: Corners = { tl: RED, tr: GREEN, bl: BLUE, br: YELLOW };

export function canvas(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  const ctx = element.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  draw(ctx);
  return element;
}

export function fill(ctx: CanvasRenderingContext2D, color: Rgba, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
  ctx.fillRect(x, y, w, h);
}

/** Four solid quadrants. Width and height should be even. */
export function quadrants(width: number, height: number, corners: Corners = UPRIGHT): HTMLCanvasElement {
  const hw = width / 2;
  const hh = height / 2;
  return canvas(width, height, ctx => {
    fill(ctx, corners.tl, 0, 0, hw, hh);
    fill(ctx, corners.tr, hw, 0, hw, hh);
    fill(ctx, corners.bl, 0, hh, hw, hh);
    fill(ctx, corners.br, hw, hh, hw, hh);
  });
}

export function toBlob(element: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    element.toBlob(blob => (blob ? resolve(blob) : reject(new Error(`toBlob(${type}) returned null`))), type, quality)
  );
}

export async function quadrantBlob(width = 40, height = 20, type = 'image/png'): Promise<Blob> {
  return toBlob(quadrants(width, height), type, 1);
}

/** Left half fully transparent, right half opaque red. */
export async function transparentBlob(width = 20, height = 10, type = 'image/png'): Promise<Blob> {
  return toBlob(
    canvas(width, height, ctx => fill(ctx, RED, width / 2, 0, width / 2, height)),
    type
  );
}

export interface Decoded {
  readonly width: number;
  readonly height: number;
  readonly data: ImageData;
}

/** Decodes a blob with the browser and reads its pixels. */
export async function decode(blob: Blob): Promise<Decoded> {
  const bitmap = await createImageBitmap(blob);
  try {
    const element = canvas(bitmap.width, bitmap.height, ctx => ctx.drawImage(bitmap, 0, 0));
    const ctx = element.getContext('2d') as CanvasRenderingContext2D;
    return { width: bitmap.width, height: bitmap.height, data: ctx.getImageData(0, 0, bitmap.width, bitmap.height) };
  } finally {
    bitmap.close();
  }
}

export function pixel(decoded: Decoded, x: number, y: number): Rgba {
  const i = (Math.floor(y) * decoded.width + Math.floor(x)) * 4;
  const d = decoded.data.data;
  return [d[i], d[i + 1], d[i + 2], d[i + 3]];
}

export function near(actual: Rgba, expected: Rgba, tolerance = 2): boolean {
  return actual.every((value, i) => Math.abs(value - expected[i]) <= tolerance);
}

/** Colours sampled 25 % inside each corner — far enough from the quadrant edges to survive smoothing and JPEG. */
export function corners(decoded: Decoded): Corners {
  const x1 = decoded.width * 0.25;
  const x2 = decoded.width * 0.75;
  const y1 = decoded.height * 0.25;
  const y2 = decoded.height * 0.75;
  return { tl: pixel(decoded, x1, y1), tr: pixel(decoded, x2, y1), bl: pixel(decoded, x1, y2), br: pixel(decoded, x2, y2) };
}

export function sameCorners(actual: Corners, expected: Corners, tolerance = 2): boolean {
  return (
    near(actual.tl, expected.tl, tolerance) &&
    near(actual.tr, expected.tr, tolerance) &&
    near(actual.bl, expected.bl, tolerance) &&
    near(actual.br, expected.br, tolerance)
  );
}

export async function bytes(blob: Blob, length = 64): Promise<Uint8Array> {
  return new Uint8Array(await blob.slice(0, length).arrayBuffer());
}

/**
 * Inserts an APP1/EXIF segment carrying `orientation` right after the JPEG SOI marker, like a phone camera does.
 * The pixels stay as stored; a viewer must apply the orientation.
 */
export async function withExifOrientation(jpeg: Blob, orientation: number, littleEndian = false): Promise<Blob> {
  const source = new Uint8Array(await jpeg.arrayBuffer());
  const tiff = new Uint8Array(26);
  const view = new DataView(tiff.buffer);
  tiff.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 42, littleEndian);
  view.setUint32(4, 8, littleEndian); // IFD0 right after the header
  view.setUint16(8, 1, littleEndian); // one entry
  view.setUint16(10, 0x0112, littleEndian); // Orientation
  view.setUint16(12, 3, littleEndian); // SHORT
  view.setUint32(14, 1, littleEndian); // count
  view.setUint16(18, orientation, littleEndian);
  view.setUint32(22, 0, littleEndian); // no next IFD
  const payload = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]);
  const length = payload.length + 2;
  const segment = new Uint8Array([0xff, 0xe1, length >> 8, length & 0xff, ...payload]);
  const out = new Uint8Array(source.length + segment.length);
  out.set(source.subarray(0, 2), 0);
  out.set(segment, 2);
  out.set(source.subarray(2), 2 + segment.length);
  return new Blob([out], { type: 'image/jpeg' });
}

/** A PNG with an `acTL` chunk (APNG) inserted after IHDR. The CRC is not checked by the header reader. */
export async function animatedPng(): Promise<Blob> {
  const png = new Uint8Array(await (await quadrantBlob(8, 8)).arrayBuffer());
  const ihdrEnd = 8 + 8 + 13 + 4;
  const actl = new Uint8Array([0, 0, 0, 8, 0x61, 0x63, 0x54, 0x4c, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0]);
  const out = new Uint8Array(png.length + actl.length);
  out.set(png.subarray(0, ihdrEnd), 0);
  out.set(actl, ihdrEnd);
  out.set(png.subarray(ihdrEnd), ihdrEnd + actl.length);
  return new Blob([out], { type: 'image/png' });
}

/** RIFF/WEBP header with a VP8X chunk flagging animation (enough for the header reader). */
export function animatedWebpHeader(): Blob {
  const bytes = new Uint8Array(40);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  bytes.set([32, 0, 0, 0], 4);
  bytes.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  bytes.set([0x56, 0x50, 0x38, 0x58], 12); // VP8X
  bytes.set([10, 0, 0, 0], 16);
  bytes[20] = 0x02 | 0x10; // animation + alpha
  bytes.set([99, 0, 0], 24); // width - 1
  bytes.set([49, 0, 0], 27); // height - 1
  return new Blob([bytes], { type: 'image/webp' });
}

export function gifBlob(): Blob {
  // 1×1 transparent GIF89a.
  const bytes = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), char => char.charCodeAt(0));
  return new Blob([bytes], { type: 'image/gif' });
}

/** Bytes that start like a PNG but stop inside the IHDR chunk. */
export async function truncatedPng(): Promise<Blob> {
  const png = new Uint8Array(await (await quadrantBlob(8, 8)).arrayBuffer());
  return new Blob([png.subarray(0, 40)], { type: 'image/png' });
}

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Polls `check` until it returns true or `timeout` ms elapse. */
export async function until(check: () => boolean, timeout = 4000, label = 'condition'): Promise<void> {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeout) throw new Error(`Timed out waiting for ${label}`);
    await wait(10);
  }
}
