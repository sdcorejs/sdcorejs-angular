import {
  SdImageEditorOrientationOp,
  sdImageEditorInvert,
  sdImageEditorOrientationMatrix,
  sdImageEditorTransformRect,
} from './image-editor.geometry';
import type { SdImageEditorEdits } from './image-editor.model';
import {
  SdImageEditorOutputRules,
  sdImageEditorClampResize,
  sdImageEditorHistoryCommit,
  sdImageEditorHistoryRedo,
  sdImageEditorHistoryStart,
  sdImageEditorHistoryUndo,
  sdImageEditorInitialEdits,
  sdImageEditorKeepRatio,
  sdImageEditorOperate,
  sdImageEditorOutputSize,
  sdImageEditorRatioLabel,
  sdImageEditorSameEdits,
  sdImageEditorSetAspectRatio,
  sdImageEditorSetCrop,
  sdImageEditorSetResize,
} from './image-editor.state';

const SOURCE = { width: 400, height: 200 };
const RULES: SdImageEditorOutputRules = { allowUpscale: false, maxPixels: 16_777_216, maxSide: 16_384 };

function run(edits: SdImageEditorEdits, ...ops: SdImageEditorOrientationOp[]): SdImageEditorEdits {
  return ops.reduce((acc, op) => sdImageEditorOperate(acc, op, SOURCE, RULES), edits);
}

/** Region of the source (unrotated pixels) that the crop selects. */
function sourceRegion(edits: SdImageEditorEdits) {
  return sdImageEditorTransformRect(edits.crop, sdImageEditorInvert(sdImageEditorOrientationMatrix(SOURCE, edits)));
}

describe('image-editor state', () => {
  describe('orientation edits', () => {
    const start = sdImageEditorSetCrop(sdImageEditorInitialEdits(SOURCE, null), { x: 20, y: 10, width: 100, height: 50 }, SOURCE, RULES);

    it('keeps the same source content selected after any sequence of rotations and flips', () => {
      const sequences: SdImageEditorOrientationOp[][] = [
        ['rotate-cw'],
        ['rotate-ccw', 'rotate-ccw'],
        ['flip-horizontal', 'rotate-cw'],
        ['rotate-cw', 'flip-horizontal'],
        ['flip-vertical', 'rotate-ccw', 'flip-horizontal'],
        ['rotate-cw', 'rotate-cw', 'rotate-cw', 'flip-vertical'],
      ];
      for (const ops of sequences) {
        const edits = run(start, ...ops);
        expect(sourceRegion(edits)).withContext(ops.join(' → ')).toEqual(sourceRegion(start));
      }
    });

    it('lands on different orientations for the same operations in another order', () => {
      const a = run(start, 'rotate-cw', 'flip-horizontal');
      const b = run(start, 'flip-horizontal', 'rotate-cw');
      expect({ flip: a.flip, rotate: a.rotate }).not.toEqual({ flip: b.flip, rotate: b.rotate });
      expect(a.crop).not.toEqual(b.crop);
    });

    it('returns to the start after a full turn or a double flip', () => {
      expect(sdImageEditorSameEdits(run(start, 'rotate-cw', 'rotate-cw', 'rotate-cw', 'rotate-cw'), start)).toBeTrue();
      expect(sdImageEditorSameEdits(run(start, 'flip-vertical', 'flip-vertical'), start)).toBeTrue();
      expect(sdImageEditorSameEdits(run(start, 'rotate-cw', 'rotate-ccw'), start)).toBeTrue();
    });

    it('re-shapes a fixed-ratio crop after a quarter turn and swaps a typed size', () => {
      let edits = sdImageEditorInitialEdits(SOURCE, 16 / 9);
      edits = sdImageEditorSetResize(edits, { width: 320, height: 180 }, RULES);
      const turned = run(edits, 'rotate-cw');
      expect(turned.rotate).toBe(90);
      expect(turned.crop.width / turned.crop.height).toBeCloseTo(16 / 9, 1);
      expect(turned.crop.width).toBeLessThanOrEqual(200);
      expect(turned.crop.height).toBeLessThanOrEqual(400);
      // The typed 320 × 180 became 180 × 320, then followed the crop ratio from its width.
      expect(turned.resize?.width).toBe(180);
      expect(turned.resize?.height).toBeCloseTo(180 / (turned.crop.width / turned.crop.height), -1);
    });

    it('keeps the crop ratio through flips', () => {
      const edits = sdImageEditorInitialEdits(SOURCE, 1);
      const flipped = run(edits, 'flip-horizontal', 'flip-vertical');
      expect(flipped.crop.width).toBe(flipped.crop.height);
    });
  });

  describe('crop and ratio', () => {
    it('clamps a typed crop inside the image', () => {
      const edits = sdImageEditorSetCrop(sdImageEditorInitialEdits(SOURCE, null), { x: 390, y: -4, width: 50, height: 500 }, SOURCE, RULES);
      expect(edits.crop).toEqual({ x: 350, y: 0, width: 50, height: 200 });
    });

    it('returns the same object when nothing changes', () => {
      const edits = sdImageEditorInitialEdits(SOURCE, null);
      expect(sdImageEditorSetCrop(edits, edits.crop, SOURCE, RULES)).toBe(edits);
      expect(sdImageEditorSetAspectRatio(edits, null, SOURCE, RULES)).toBe(edits);
    });

    it('re-shapes the crop when a ratio is picked and frees it with null', () => {
      const edits = sdImageEditorInitialEdits(SOURCE, null);
      const square = sdImageEditorSetAspectRatio(edits, 1, SOURCE, RULES);
      expect(square.aspectRatio).toBe(1);
      expect(square.crop.width).toBe(square.crop.height);
      const free = sdImageEditorSetAspectRatio(square, null, SOURCE, RULES);
      expect(free.aspectRatio).toBeNull();
      expect(free.crop).toEqual(square.crop);
      expect(sdImageEditorSetAspectRatio(edits, Number.NaN, SOURCE, RULES).aspectRatio).toBeNull();
    });
  });

  describe('output size', () => {
    it('follows the crop by default', () => {
      const edits = sdImageEditorInitialEdits(SOURCE, null);
      expect(sdImageEditorOutputSize(edits, RULES)).toEqual({ width: 400, height: 200, limited: false });
    });

    it('scales the crop into the default box without upscaling', () => {
      const edits = sdImageEditorInitialEdits(SOURCE, null);
      expect(sdImageEditorOutputSize(edits, { ...RULES, targetWidth: 100 })).toEqual({ width: 100, height: 50, limited: false });
      expect(sdImageEditorOutputSize(edits, { ...RULES, targetWidth: 1000 })).toEqual({ width: 400, height: 200, limited: false });
      expect(sdImageEditorOutputSize(edits, { ...RULES, targetWidth: 1000, allowUpscale: true })).toEqual({
        width: 1000,
        height: 500,
        limited: false,
      });
      expect(sdImageEditorOutputSize(edits, { ...RULES, targetWidth: 300, targetHeight: 50 })).toEqual({
        width: 100,
        height: 50,
        limited: false,
      });
    });

    it('reports when the limits reduced the automatic size', () => {
      const edits = sdImageEditorInitialEdits(SOURCE, null);
      const size = sdImageEditorOutputSize(edits, { ...RULES, maxPixels: 20_000 });
      expect(size.limited).toBeTrue();
      expect(size.width * size.height).toBeLessThanOrEqual(20_000);
      expect(size.width / size.height).toBeCloseTo(2, 1);
      expect(sdImageEditorOutputSize(edits, { ...RULES, maxSide: 100 })).toEqual({ width: 100, height: 50, limited: true });
    });

    it('clamps a typed size: the height follows the crop ratio, no upscaling', () => {
      const crop = { x: 0, y: 0, width: 400, height: 200 };
      expect(sdImageEditorClampResize({ width: 800, height: 999 }, crop, RULES)).toEqual({
        size: { width: 400, height: 200 },
        limited: true,
      });
      // The typed height is ignored: the image is never stretched.
      expect(sdImageEditorClampResize({ width: 100, height: 999 }, crop, RULES)).toEqual({
        size: { width: 100, height: 50 },
        limited: false,
      });
      expect(sdImageEditorClampResize({ width: 800, height: 400 }, crop, { ...RULES, allowUpscale: true })).toEqual({
        size: { width: 800, height: 400 },
        limited: false,
      });
      expect(sdImageEditorClampResize({ width: 800, height: 400 }, crop, { ...RULES, allowUpscale: true, maxSide: 600 })).toEqual({
        size: { width: 600, height: 300 },
        limited: true,
      });
    });

    it('turns "keep ratio" on and off without moving the crop', () => {
      const edits = sdImageEditorSetCrop(sdImageEditorInitialEdits(SOURCE, null), { x: 10, y: 20, width: 150, height: 100 }, SOURCE, RULES);
      const locked = sdImageEditorKeepRatio(edits, true);
      expect(locked.aspectRatio).toBeCloseTo(1.5, 9);
      expect(locked.crop).toEqual(edits.crop);
      expect(sdImageEditorKeepRatio(locked, true)).toBe(locked);
      const free = sdImageEditorKeepRatio(locked, false);
      expect(free.aspectRatio).toBeNull();
      expect(free.crop).toEqual(edits.crop);
    });

    it('keeps a typed size in step with the crop', () => {
      let edits = sdImageEditorSetResize(sdImageEditorInitialEdits(SOURCE, null), { width: 200, height: 100 }, RULES);
      edits = sdImageEditorSetCrop(edits, { x: 0, y: 0, width: 100, height: 100 }, SOURCE, RULES);
      // Width 200 is now wider than the crop: clamped to 100, height follows the new 1:1 ratio.
      expect(edits.resize).toEqual({ width: 100, height: 100 });
      expect(sdImageEditorSetResize(edits, null, RULES).resize).toBeNull();
    });
  });

  describe('history', () => {
    const same = (a: number, b: number) => a === b;

    it('commits, undoes and redoes; a new commit drops the redo branch', () => {
      let h = sdImageEditorHistoryStart(0);
      h = sdImageEditorHistoryCommit(h, 1, 10, same);
      h = sdImageEditorHistoryCommit(h, 2, 10, same);
      expect(h.present).toBe(2);
      h = sdImageEditorHistoryUndo(h);
      h = sdImageEditorHistoryUndo(h);
      expect(h.present).toBe(0);
      expect(h.future).toEqual([1, 2]);
      h = sdImageEditorHistoryRedo(h);
      expect(h.present).toBe(1);
      h = sdImageEditorHistoryCommit(h, 5, 10, same);
      expect(h.future).toEqual([]);
      expect(h.past).toEqual([0, 1]);
    });

    it('ignores a commit equal to the present and no-op undo/redo at the ends', () => {
      const h = sdImageEditorHistoryStart(3);
      expect(sdImageEditorHistoryCommit(h, 3, 10, same)).toBe(h);
      expect(sdImageEditorHistoryUndo(h)).toBe(h);
      expect(sdImageEditorHistoryRedo(h)).toBe(h);
    });

    it('keeps at most `limit` undo steps', () => {
      let h = sdImageEditorHistoryStart(0);
      for (let i = 1; i <= 20; i++) h = sdImageEditorHistoryCommit(h, i, 5, same);
      expect(h.past).toEqual([15, 16, 17, 18, 19]);
    });

    it('stores small plain objects, not image data', () => {
      let h = sdImageEditorHistoryStart(sdImageEditorInitialEdits(SOURCE, null));
      h = sdImageEditorHistoryCommit(h, run(h.present, 'rotate-cw'), 50, sdImageEditorSameEdits);
      expect(JSON.stringify(h).length).toBeLessThan(1000);
    });
  });

  it('labels common ratios', () => {
    expect(sdImageEditorRatioLabel(1)).toBe('1:1');
    expect(sdImageEditorRatioLabel(16 / 9)).toBe('16:9');
    expect(sdImageEditorRatioLabel(3 / 4)).toBe('3:4');
    expect(sdImageEditorRatioLabel(1.85)).toBe('1.85:1');
  });
});
