import {
  SdImageEditorOrientationOp,
  sdImageEditorApplyOperation,
  sdImageEditorClampRect,
  sdImageEditorInitialCrop,
  sdImageEditorOperationMatrix,
  sdImageEditorOrientedSize,
  sdImageEditorReshape,
  sdImageEditorSameRect,
  sdImageEditorTransformRect,
} from './image-editor.geometry';
import type { SdImageEditorEdits, SdImageEditorRect, SdImageEditorSize } from './image-editor.model';

// Pure edit reducers and the undo history. Each reducer returns a new `SdImageEditorEdits`; nothing is mutated,
// so a history entry is a few numbers instead of a canvas snapshot.
//
// The crop defines the shape of the result and the output size only its scale: a typed width or height always keeps
// the crop ratio, so the image is never stretched. `aspectRatio` ("keep ratio") locks the shape of the crop.

/** Output rules resolved from `option.output` and `option.limits`. */
export interface SdImageEditorOutputRules {
  readonly targetWidth?: number;
  readonly targetHeight?: number;
  readonly allowUpscale: boolean;
  readonly maxPixels: number;
  readonly maxSide: number;
}

/** Output size and whether the limits reduced it. */
export interface SdImageEditorOutputSize extends SdImageEditorSize {
  readonly limited: boolean;
}

export function sdImageEditorInitialEdits(source: SdImageEditorSize, aspectRatio: number | null): SdImageEditorEdits {
  return { flip: false, rotate: 0, crop: sdImageEditorInitialCrop(source, aspectRatio), aspectRatio, resize: null };
}

/** Oriented image size for these edits. */
export function sdImageEditorBounds(edits: SdImageEditorEdits, source: SdImageEditorSize): SdImageEditorSize {
  return sdImageEditorOrientedSize(source, edits.rotate);
}

/**
 * Applies a rotate/flip button. The crop follows the content; a quarter turn with a fixed ratio re-shapes the
 * crop to that ratio around the same centre, and swaps a typed output size.
 */
export function sdImageEditorOperate(
  edits: SdImageEditorEdits,
  op: SdImageEditorOrientationOp,
  source: SdImageEditorSize,
  rules: SdImageEditorOutputRules
): SdImageEditorEdits {
  const before = sdImageEditorBounds(edits, source);
  const orientation = sdImageEditorApplyOperation(edits, op);
  const after = sdImageEditorOrientedSize(source, orientation.rotate);
  const quarter = op === 'rotate-cw' || op === 'rotate-ccw';
  let crop = sdImageEditorClampRect(sdImageEditorTransformRect(edits.crop, sdImageEditorOperationMatrix(op, before)), after);
  if (quarter && edits.aspectRatio) crop = sdImageEditorReshape(crop, edits.aspectRatio, after);
  let resize = edits.resize;
  if (quarter && resize) resize = { width: resize.height, height: resize.width };
  return { ...edits, ...orientation, crop, resize: sdImageEditorFitResize(resize, edits.crop, crop, rules) };
}

/** Replaces the crop (drag, keyboard or typed values). The rectangle is clamped inside the image. */
export function sdImageEditorSetCrop(
  edits: SdImageEditorEdits,
  crop: SdImageEditorRect,
  source: SdImageEditorSize,
  rules: SdImageEditorOutputRules
): SdImageEditorEdits {
  const next = sdImageEditorClampRect(crop, sdImageEditorBounds(edits, source));
  if (sdImageEditorSameRect(next, edits.crop)) return edits;
  return { ...edits, crop: next, resize: sdImageEditorFitResize(edits.resize, edits.crop, next, rules) };
}

/** Selects a crop ratio. The crop keeps its centre and area; `null` keeps the current crop and frees it. */
export function sdImageEditorSetAspectRatio(
  edits: SdImageEditorEdits,
  ratio: number | null,
  source: SdImageEditorSize,
  rules: SdImageEditorOutputRules
): SdImageEditorEdits {
  const value = ratio && Number.isFinite(ratio) && ratio > 0 ? ratio : null;
  if (value === edits.aspectRatio) return edits;
  if (!value) return { ...edits, aspectRatio: null };
  const crop = sdImageEditorReshape(edits.crop, value, sdImageEditorBounds(edits, source));
  return { ...edits, aspectRatio: value, crop, resize: sdImageEditorFitResize(edits.resize, edits.crop, crop, rules) };
}

/**
 * "Keep ratio" on or off without moving the crop: on locks the current crop shape (`width / height`), off frees it.
 */
export function sdImageEditorKeepRatio(edits: SdImageEditorEdits, keep: boolean): SdImageEditorEdits {
  if (keep === (edits.aspectRatio !== null)) return edits;
  return { ...edits, aspectRatio: keep ? edits.crop.width / edits.crop.height : null };
}

/**
 * Sets the output width (`null` follows the crop again). The height always follows the crop ratio, and the size is
 * clamped to the rules. To start from a height, convert it with `height × crop ratio` first.
 */
export function sdImageEditorSetResize(
  edits: SdImageEditorEdits,
  size: SdImageEditorSize | null,
  rules: SdImageEditorOutputRules
): SdImageEditorEdits {
  const resize = size ? sdImageEditorClampResize(size, edits.crop, rules).size : null;
  if (resize === edits.resize || (resize && edits.resize && sameSize(resize, edits.resize))) return edits;
  return { ...edits, resize };
}

/**
 * Output size: the typed size when there is one, otherwise the crop scaled into the default box, never above the
 * crop unless upscaling is allowed, and always inside the output limits.
 */
export function sdImageEditorOutputSize(edits: SdImageEditorEdits, rules: SdImageEditorOutputRules): SdImageEditorOutputSize {
  if (edits.resize) return { ...edits.resize, limited: false };
  const { width: cw, height: ch } = edits.crop;
  let scale = 1;
  const boxScale = Math.min(rules.targetWidth ? rules.targetWidth / cw : Infinity, rules.targetHeight ? rules.targetHeight / ch : Infinity);
  if (Number.isFinite(boxScale)) scale = rules.allowUpscale ? boxScale : Math.min(1, boxScale);
  const limitScale = sdImageEditorLimitScale(cw * scale, ch * scale, rules);
  const limited = limitScale < 1;
  scale *= limitScale;
  return { ...roundSize(cw * scale, ch * scale, rules), limited };
}

/**
 * Clamps a typed size: the height is derived from the width and the crop ratio, never above the crop unless
 * upscaling is allowed, and always inside the output limits.
 */
export function sdImageEditorClampResize(
  size: SdImageEditorSize,
  crop: SdImageEditorRect,
  rules: SdImageEditorOutputRules
): { size: SdImageEditorSize; limited: boolean } {
  const ratio = crop.width / crop.height;
  let width = positive(size.width) ?? crop.width;
  let height = width / ratio;
  let limited = false;
  if (!rules.allowUpscale && width > crop.width) {
    width = crop.width;
    height = crop.height;
    limited = true;
  }
  const limitScale = sdImageEditorLimitScale(width, height, rules);
  if (limitScale < 1) {
    width *= limitScale;
    height *= limitScale;
    limited = true;
  }
  return { size: roundSize(width, height, rules), limited };
}

/** Largest scale (≤ 1) that keeps `width × height` inside the output limits. */
export function sdImageEditorLimitScale(width: number, height: number, rules: SdImageEditorOutputRules): number {
  let scale = 1;
  const side = Math.max(width, height);
  if (side > rules.maxSide) scale = Math.min(scale, rules.maxSide / side);
  const pixels = width * height;
  if (pixels > rules.maxPixels) scale = Math.min(scale, Math.sqrt(rules.maxPixels / pixels));
  return scale;
}

/** Keeps a typed size meaningful after the crop changed. */
function sdImageEditorFitResize(
  resize: SdImageEditorSize | null,
  previousCrop: SdImageEditorRect,
  crop: SdImageEditorRect,
  rules: SdImageEditorOutputRules
): SdImageEditorSize | null {
  if (!resize) return null;
  if (sdImageEditorSameRect(previousCrop, crop)) return resize;
  return sdImageEditorClampResize(resize, crop, rules).size;
}

function roundSize(width: number, height: number, rules: SdImageEditorOutputRules): SdImageEditorSize {
  // why: làm tròn có thể đẩy vượt giới hạn 1px (ví dụ 4096.5 → 4097) — co lại bằng floor khi đó.
  let w = Math.max(1, Math.round(width));
  let h = Math.max(1, Math.round(height));
  if (w * h > rules.maxPixels || Math.max(w, h) > rules.maxSide) {
    w = Math.max(1, Math.floor(width));
    h = Math.max(1, Math.floor(height));
  }
  return { width: w, height: h };
}

function positive(value: number): number | null {
  return Number.isFinite(value) && value >= 1 ? value : null;
}

function sameSize(a: SdImageEditorSize, b: SdImageEditorSize): boolean {
  return a.width === b.width && a.height === b.height;
}

export function sdImageEditorSameEdits(a: SdImageEditorEdits, b: SdImageEditorEdits): boolean {
  return (
    a.flip === b.flip &&
    a.rotate === b.rotate &&
    a.aspectRatio === b.aspectRatio &&
    sdImageEditorSameRect(a.crop, b.crop) &&
    (a.resize === b.resize || (!!a.resize && !!b.resize && sameSize(a.resize, b.resize)))
  );
}

/** Ratio that exactly fits the given size — used to format ratio chips. */
export function sdImageEditorRatioLabel(ratio: number): string {
  const common: readonly [number, number][] = [
    [1, 1],
    [4, 3],
    [3, 4],
    [16, 9],
    [9, 16],
    [3, 2],
    [2, 3],
    [5, 4],
    [4, 5],
    [21, 9],
  ];
  const match = common.find(([w, h]) => Math.abs(w / h - ratio) < 1e-6);
  if (match) return `${match[0]}:${match[1]}`;
  return `${Number(ratio.toFixed(2))}:1`;
}

// ---- Undo / redo ----

/** Bounded undo history. `present` is what the editor shows once no drag is in progress. */
export interface SdImageEditorHistory<T> {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
}

export function sdImageEditorHistoryStart<T>(present: T): SdImageEditorHistory<T> {
  return { past: [], present, future: [] };
}

/** Records `next` as a new step. A value equal to `present` records nothing; the redo branch is dropped. */
export function sdImageEditorHistoryCommit<T>(
  history: SdImageEditorHistory<T>,
  next: T,
  limit: number,
  same: (a: T, b: T) => boolean
): SdImageEditorHistory<T> {
  if (same(history.present, next)) return history;
  const keep = Math.max(1, Math.floor(limit));
  const past = [...history.past, history.present];
  return { past: past.length > keep ? past.slice(past.length - keep) : past, present: next, future: [] };
}

export function sdImageEditorHistoryUndo<T>(history: SdImageEditorHistory<T>): SdImageEditorHistory<T> {
  if (!history.past.length) return history;
  const present = history.past[history.past.length - 1];
  return { past: history.past.slice(0, -1), present, future: [history.present, ...history.future] };
}

export function sdImageEditorHistoryRedo<T>(history: SdImageEditorHistory<T>): SdImageEditorHistory<T> {
  if (!history.future.length) return history;
  const [present, ...future] = history.future;
  return { past: [...history.past, history.present], present, future };
}
