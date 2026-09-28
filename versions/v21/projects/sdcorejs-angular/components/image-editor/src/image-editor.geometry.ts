import type { SdImageEditorOrientation, SdImageEditorRect, SdImageEditorRotation, SdImageEditorSize } from './image-editor.model';

// Pure 2D maths shared by the preview and the export. Nothing here touches the DOM, so the exact same
// matrices drive the on-screen canvas (as a CSS `matrix()`) and the export canvas (`setTransform`).

/**
 * 2D affine matrix in canvas / CSS order: `x' = a·x + c·y + e`, `y' = b·x + d·y + f`.
 * Same argument order as `CanvasRenderingContext2D.setTransform(a, b, c, d, e, f)` and CSS `matrix(a, b, c, d, e, f)`.
 */
export type SdImageEditorMatrix = readonly [a: number, b: number, c: number, d: number, e: number, f: number];

/** Edit applied from the toolbar, expressed in what the user sees on screen. */
export type SdImageEditorOrientationOp = 'rotate-cw' | 'rotate-ccw' | 'flip-horizontal' | 'flip-vertical';

/** Crop handle being dragged: an edge (`n`, `e`, `s`, `w`) or a corner. */
export type SdImageEditorCropHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export const SD_IMAGE_EDITOR_IDENTITY: SdImageEditorMatrix = [1, 0, 0, 1, 0, 0];

/** `m · n`: the returned matrix applies `n` first, then `m`. */
export function sdImageEditorMultiply(m: SdImageEditorMatrix, n: SdImageEditorMatrix): SdImageEditorMatrix {
  const [a, b, c, d, e, f] = m;
  const [a2, b2, c2, d2, e2, f2] = n;
  return [a * a2 + c * b2, b * a2 + d * b2, a * c2 + c * d2, b * c2 + d * d2, a * e2 + c * f2 + e, b * e2 + d * f2 + f];
}

/** Product of the matrices, applied right to left (the last one first). */
export function sdImageEditorCompose(...matrices: readonly SdImageEditorMatrix[]): SdImageEditorMatrix {
  return matrices.reduce((acc, m) => sdImageEditorMultiply(acc, m), SD_IMAGE_EDITOR_IDENTITY);
}

export function sdImageEditorInvert(m: SdImageEditorMatrix): SdImageEditorMatrix {
  const [a, b, c, d, e, f] = m;
  const det = a * d - b * c;
  if (!det) throw new Error('sd-image-editor: matrix is not invertible');
  const ia = d / det;
  const ib = -b / det;
  const ic = -c / det;
  const id = a / det;
  return [ia, ib, ic, id, -(ia * e + ic * f), -(ib * e + id * f)];
}

export function sdImageEditorApply(m: SdImageEditorMatrix, x: number, y: number): { x: number; y: number } {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}

export function sdImageEditorTranslate(x: number, y: number): SdImageEditorMatrix {
  return [1, 0, 0, 1, x, y];
}

export function sdImageEditorScale(x: number, y = x): SdImageEditorMatrix {
  return [x, 0, 0, y, 0, 0];
}

/** Size of the image once rotated: a quarter turn swaps width and height. */
export function sdImageEditorOrientedSize(size: SdImageEditorSize, rotate: SdImageEditorRotation): SdImageEditorSize {
  return rotate === 90 || rotate === 270 ? { width: size.height, height: size.width } : { width: size.width, height: size.height };
}

/**
 * Maps a pixel of the decoded source (width × height, EXIF orientation already applied by the browser) to the
 * oriented image the user edits: mirror horizontally first when `flip`, then rotate clockwise by `rotate`.
 * The result always lies inside `[0, orientedWidth] × [0, orientedHeight]`.
 */
export function sdImageEditorOrientationMatrix(size: SdImageEditorSize, orientation: SdImageEditorOrientation): SdImageEditorMatrix {
  const { width: w, height: h } = size;
  const mirror: SdImageEditorMatrix = orientation.flip ? [-1, 0, 0, 1, w, 0] : SD_IMAGE_EDITOR_IDENTITY;
  return sdImageEditorMultiply(sdImageEditorRotationMatrix(size, orientation.rotate), mirror);
}

/** Clockwise rotation of a `size` box around its origin, translated back so the result starts at (0, 0). */
export function sdImageEditorRotationMatrix(size: SdImageEditorSize, rotate: SdImageEditorRotation): SdImageEditorMatrix {
  const { width: w, height: h } = size;
  switch (rotate) {
    case 90:
      return [0, 1, -1, 0, h, 0];
    case 180:
      return [-1, 0, 0, -1, w, h];
    case 270:
      return [0, -1, 1, 0, 0, w];
    default:
      return SD_IMAGE_EDITOR_IDENTITY;
  }
}

/**
 * Matrix of a toolbar operation applied to the image as currently shown (`orientedSize`). Used to carry the crop
 * rectangle along so it keeps framing the same content after a rotation or a flip.
 */
export function sdImageEditorOperationMatrix(op: SdImageEditorOrientationOp, orientedSize: SdImageEditorSize): SdImageEditorMatrix {
  const { width: w, height: h } = orientedSize;
  switch (op) {
    case 'rotate-cw':
      return [0, 1, -1, 0, h, 0];
    case 'rotate-ccw':
      return [0, -1, 1, 0, 0, w];
    case 'flip-horizontal':
      return [-1, 0, 0, 1, w, 0];
    default:
      return [1, 0, 0, -1, 0, h];
  }
}

/**
 * Composes a screen-space operation into the canonical `{ flip, rotate }` pair.
 *
 * With `F` = horizontal mirror and `R(r)` = clockwise rotation, the state stands for `R(r)·F^flip`. Mirroring
 * the displayed image gives `F·R(r) = R(−r)·F`, and a vertical mirror is `R(180)·F`, hence the formulas below.
 */
export function sdImageEditorApplyOperation(
  orientation: SdImageEditorOrientation,
  op: SdImageEditorOrientationOp
): SdImageEditorOrientation {
  const r = orientation.rotate;
  switch (op) {
    case 'rotate-cw':
      return { flip: orientation.flip, rotate: normalizeRotation(r + 90) };
    case 'rotate-ccw':
      return { flip: orientation.flip, rotate: normalizeRotation(r + 270) };
    case 'flip-horizontal':
      return { flip: !orientation.flip, rotate: normalizeRotation(360 - r) };
    default:
      return { flip: !orientation.flip, rotate: normalizeRotation(540 - r) };
  }
}

export function normalizeRotation(value: number): SdImageEditorRotation {
  const r = (((Math.round(value / 90) * 90) % 360) + 360) % 360;
  return r as SdImageEditorRotation;
}

/**
 * EXIF orientation (1–8) as the `{ flip, rotate }` pair that displays the stored pixels upright. Only used when
 * the browser did not apply the orientation itself while decoding.
 */
export function sdImageEditorExifOrientation(value: number): SdImageEditorOrientation {
  switch (value) {
    case 2:
      return { flip: true, rotate: 0 };
    case 3:
      return { flip: false, rotate: 180 };
    case 4:
      return { flip: true, rotate: 180 };
    case 5:
      return { flip: true, rotate: 270 };
    case 6:
      return { flip: false, rotate: 90 };
    case 7:
      return { flip: true, rotate: 90 };
    case 8:
      return { flip: false, rotate: 270 };
    default:
      return { flip: false, rotate: 0 };
  }
}

/** Bounding box of `rect` mapped through `m`, rounded to whole pixels. Exact for quarter turns and mirrors. */
export function sdImageEditorTransformRect(rect: SdImageEditorRect, m: SdImageEditorMatrix): SdImageEditorRect {
  const p1 = sdImageEditorApply(m, rect.x, rect.y);
  const p2 = sdImageEditorApply(m, rect.x + rect.width, rect.y + rect.height);
  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  return {
    x: roundPixel(x),
    y: roundPixel(y),
    width: roundPixel(Math.max(p1.x, p2.x) - x),
    height: roundPixel(Math.max(p1.y, p2.y) - y),
  };
}

/**
 * Transform used by the export: source pixels → output canvas.
 *
 * `Scale(output / crop) · Translate(−crop) · Orientation`. Reads only the source, never a preview.
 */
export function sdImageEditorExportMatrix(
  sourceSize: SdImageEditorSize,
  orientation: SdImageEditorOrientation,
  crop: SdImageEditorRect,
  output: SdImageEditorSize
): SdImageEditorMatrix {
  return sdImageEditorCompose(
    sdImageEditorScale(output.width / crop.width, output.height / crop.height),
    sdImageEditorTranslate(-crop.x, -crop.y),
    sdImageEditorOrientationMatrix(sourceSize, orientation)
  );
}

// ---- Viewport ----

/** Zoom and pan of the preview. View-only: never part of the edits or the export. */
export interface SdImageEditorView {
  /** Zoom relative to "fit": `1` shows the whole oriented image inside the stage. */
  readonly zoom: number;
  /** Offset of the image centre from the stage centre, in CSS pixels. */
  readonly panX: number;
  readonly panY: number;
}

export const SD_IMAGE_EDITOR_FIT_VIEW: SdImageEditorView = { zoom: 1, panX: 0, panY: 0 };

/** Scale and top-left position of the oriented image inside the stage. */
export interface SdImageEditorViewport {
  /** CSS pixels per image pixel. */
  readonly scale: number;
  readonly originX: number;
  readonly originY: number;
}

/** Scale at which the oriented image fits the stage minus `padding` on every side. */
export function sdImageEditorFitScale(stage: SdImageEditorSize, image: SdImageEditorSize, padding: number): number {
  const width = Math.max(1, stage.width - padding * 2);
  const height = Math.max(1, stage.height - padding * 2);
  if (image.width <= 0 || image.height <= 0) return 1;
  return Math.min(width / image.width, height / image.height);
}

export function sdImageEditorViewport(
  stage: SdImageEditorSize,
  image: SdImageEditorSize,
  view: SdImageEditorView,
  padding: number
): SdImageEditorViewport {
  const scale = sdImageEditorFitScale(stage, image, padding) * view.zoom;
  return {
    scale,
    originX: stage.width / 2 + view.panX - (image.width * scale) / 2,
    originY: stage.height / 2 + view.panY - (image.height * scale) / 2,
  };
}

/** Oriented image pixels → stage CSS pixels. */
export function sdImageEditorViewMatrix(viewport: SdImageEditorViewport): SdImageEditorMatrix {
  return [viewport.scale, 0, 0, viewport.scale, viewport.originX, viewport.originY];
}

export function sdImageEditorImageToStage(viewport: SdImageEditorViewport, rect: SdImageEditorRect): SdImageEditorRect {
  return {
    x: viewport.originX + rect.x * viewport.scale,
    y: viewport.originY + rect.y * viewport.scale,
    width: rect.width * viewport.scale,
    height: rect.height * viewport.scale,
  };
}

export function sdImageEditorStageToImage(viewport: SdImageEditorViewport, x: number, y: number): { x: number; y: number } {
  return { x: (x - viewport.originX) / viewport.scale, y: (y - viewport.originY) / viewport.scale };
}

/**
 * Keeps at least `margin` CSS pixels of the image inside the stage so the user cannot pan it out of reach.
 */
export function sdImageEditorClampPan(
  stage: SdImageEditorSize,
  image: SdImageEditorSize,
  view: SdImageEditorView,
  padding: number,
  margin: number
): SdImageEditorView {
  const scale = sdImageEditorFitScale(stage, image, padding) * view.zoom;
  const limitX = Math.max(0, (image.width * scale + stage.width) / 2 - margin);
  const limitY = Math.max(0, (image.height * scale + stage.height) / 2 - margin);
  return { zoom: view.zoom, panX: clamp(view.panX, -limitX, limitX), panY: clamp(view.panY, -limitY, limitY) };
}

/**
 * Zooms by `factor` keeping the image point under (`anchorX`, `anchorY`) — stage CSS pixels — still under it.
 */
export function sdImageEditorZoomAt(
  stage: SdImageEditorSize,
  image: SdImageEditorSize,
  view: SdImageEditorView,
  padding: number,
  zoom: number,
  anchorX: number,
  anchorY: number
): SdImageEditorView {
  const before = sdImageEditorViewport(stage, image, view, padding);
  const point = sdImageEditorStageToImage(before, anchorX, anchorY);
  const scale = sdImageEditorFitScale(stage, image, padding) * zoom;
  // Solve origin so that `origin + point · scale = anchor`, then convert the origin back to a pan.
  const originX = anchorX - point.x * scale;
  const originY = anchorY - point.y * scale;
  return {
    zoom,
    panX: originX + (image.width * scale) / 2 - stage.width / 2,
    panY: originY + (image.height * scale) / 2 - stage.height / 2,
  };
}

// ---- Crop rectangle ----

/** Whole-pixel rectangle inside `bounds`, at least 1 × 1. */
export function sdImageEditorClampRect(rect: SdImageEditorRect, bounds: SdImageEditorSize): SdImageEditorRect {
  const width = clamp(Math.round(rect.width), 1, Math.max(1, bounds.width));
  const height = clamp(Math.round(rect.height), 1, Math.max(1, bounds.height));
  return {
    x: clamp(Math.round(rect.x), 0, Math.max(0, bounds.width - width)),
    y: clamp(Math.round(rect.y), 0, Math.max(0, bounds.height - height)),
    width,
    height,
  };
}

/** Moves the rectangle by (`dx`, `dy`) without resizing it, stopping at the image edges. */
export function sdImageEditorMoveRect(rect: SdImageEditorRect, dx: number, dy: number, bounds: SdImageEditorSize): SdImageEditorRect {
  return sdImageEditorClampRect({ ...rect, x: rect.x + dx, y: rect.y + dy }, bounds);
}

/** Largest whole-pixel size with `ratio` (width / height) inside `maxWidth × maxHeight`. */
export function sdImageEditorFitRatio(maxWidth: number, maxHeight: number, ratio: number): SdImageEditorSize {
  let width = Math.min(maxWidth, maxHeight * ratio);
  let height = width / ratio;
  width = Math.max(1, Math.round(width));
  height = Math.max(1, Math.round(height));
  if (height > maxHeight) height = Math.max(1, Math.floor(maxHeight));
  if (width > maxWidth) width = Math.max(1, Math.floor(maxWidth));
  return { width, height };
}

/** Largest rectangle with `ratio` inside `bounds`, centred. `null` ratio returns the whole image. */
export function sdImageEditorInitialCrop(bounds: SdImageEditorSize, ratio: number | null): SdImageEditorRect {
  if (!ratio) return { x: 0, y: 0, width: bounds.width, height: bounds.height };
  const size = sdImageEditorFitRatio(bounds.width, bounds.height, ratio);
  return {
    x: Math.round((bounds.width - size.width) / 2),
    y: Math.round((bounds.height - size.height) / 2),
    ...size,
  };
}

/**
 * Re-shapes `rect` to `ratio`, keeping its centre and roughly its area, then fits it inside `bounds`.
 * Used when the user picks another ratio and when a quarter turn breaks a fixed ratio.
 */
export function sdImageEditorReshape(rect: SdImageEditorRect, ratio: number, bounds: SdImageEditorSize): SdImageEditorRect {
  const area = Math.max(1, rect.width * rect.height);
  let width = Math.sqrt(area * ratio);
  let height = width / ratio;
  if (width > bounds.width) {
    width = bounds.width;
    height = width / ratio;
  }
  if (height > bounds.height) {
    height = bounds.height;
    width = height * ratio;
  }
  const size = sdImageEditorFitRatio(Math.min(bounds.width, Math.round(width)), Math.min(bounds.height, Math.round(height)), ratio);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  return sdImageEditorClampRect({ x: cx - size.width / 2, y: cy - size.height / 2, ...size }, bounds);
}

/**
 * Resizes `start` by dragging `handle` by (`dx`, `dy`) image pixels. The opposite edge or corner stays fixed; with
 * a `ratio` the free dimension follows and edge handles grow symmetrically around the centre of the other axis.
 * The result never leaves `bounds` and never gets smaller than `minSize` on either side.
 */
export function sdImageEditorResizeRect(
  start: SdImageEditorRect,
  handle: SdImageEditorCropHandle,
  dx: number,
  dy: number,
  bounds: SdImageEditorSize,
  ratio: number | null,
  minSize: number
): SdImageEditorRect {
  const min = Math.max(1, Math.min(minSize, bounds.width, bounds.height));
  const hasW = handle.includes('w');
  const hasE = handle.includes('e');
  const hasN = handle.includes('n');
  const hasS = handle.includes('s');
  const left = start.x;
  const top = start.y;
  const right = start.x + start.width;
  const bottom = start.y + start.height;

  if (!ratio) {
    const x1 = hasW ? clamp(left + dx, 0, right - min) : left;
    const x2 = hasE ? clamp(right + dx, left + min, bounds.width) : right;
    const y1 = hasN ? clamp(top + dy, 0, bottom - min) : top;
    const y2 = hasS ? clamp(bottom + dy, top + min, bounds.height) : bottom;
    return sdImageEditorClampRect({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 }, bounds);
  }

  const minWidth = Math.max(min, min * ratio);
  const horizontal = hasE || hasW;
  const vertical = hasN || hasS;
  let width: number;
  let maxWidth: number;
  if (horizontal && vertical) {
    // Corner: follow the axis the pointer moved most along, relative to the ratio.
    const byWidth = start.width + (hasE ? dx : -dx);
    const byHeight = (start.height + (hasS ? dy : -dy)) * ratio;
    width = Math.abs(byWidth - start.width) >= Math.abs(byHeight - start.width) ? byWidth : byHeight;
    const roomX = hasE ? bounds.width - left : right;
    const roomY = hasS ? bounds.height - top : bottom;
    maxWidth = Math.min(roomX, roomY * ratio);
  } else if (horizontal) {
    width = start.width + (hasE ? dx : -dx);
    const cy = top + start.height / 2;
    const roomX = hasE ? bounds.width - left : right;
    maxWidth = Math.min(roomX, 2 * Math.min(cy, bounds.height - cy) * ratio);
  } else {
    width = (start.height + (hasS ? dy : -dy)) * ratio;
    const cx = left + start.width / 2;
    const roomY = hasS ? bounds.height - top : bottom;
    maxWidth = Math.min(roomY * ratio, 2 * Math.min(cx, bounds.width - cx));
  }
  width = maxWidth < minWidth ? maxWidth : clamp(width, minWidth, maxWidth);
  const height = width / ratio;

  let x: number;
  let y: number;
  if (horizontal) x = hasE ? left : right - width;
  else x = left + start.width / 2 - width / 2;
  if (vertical) y = hasS ? top : bottom - height;
  else y = top + start.height / 2 - height / 2;
  return sdImageEditorClampRect({ x, y, width, height }, bounds);
}

export function sdImageEditorSameRect(a: SdImageEditorRect, b: SdImageEditorRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundPixel(value: number): number {
  // why: `Math.round(-0)` là -0; so sánh bằng `===` vẫn đúng nhưng JSON/snapshot in ra "-0" gây nhiễu test.
  return Math.round(value) || 0;
}
