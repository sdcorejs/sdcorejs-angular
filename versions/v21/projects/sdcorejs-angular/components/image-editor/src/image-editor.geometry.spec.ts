import {
  SD_IMAGE_EDITOR_FIT_VIEW,
  SdImageEditorMatrix,
  SdImageEditorOrientationOp,
  sdImageEditorApply,
  sdImageEditorApplyOperation,
  sdImageEditorClampPan,
  sdImageEditorClampRect,
  sdImageEditorCompose,
  sdImageEditorExifOrientation,
  sdImageEditorExportMatrix,
  sdImageEditorFitRatio,
  sdImageEditorImageToStage,
  sdImageEditorInitialCrop,
  sdImageEditorInvert,
  sdImageEditorMoveRect,
  sdImageEditorOperationMatrix,
  sdImageEditorOrientationMatrix,
  sdImageEditorOrientedSize,
  sdImageEditorReshape,
  sdImageEditorResizeRect,
  sdImageEditorStageToImage,
  sdImageEditorTransformRect,
  sdImageEditorViewMatrix,
  sdImageEditorViewport,
  sdImageEditorZoomAt,
} from './image-editor.geometry';
import type { SdImageEditorOrientation, SdImageEditorRect, SdImageEditorRotation } from './image-editor.model';

const SOURCE = { width: 40, height: 20 };
const ALL_ORIENTATIONS: SdImageEditorOrientation[] = ([0, 90, 180, 270] as SdImageEditorRotation[]).flatMap(rotate => [
  { flip: false, rotate },
  { flip: true, rotate },
]);
const OPS: SdImageEditorOrientationOp[] = ['rotate-cw', 'rotate-ccw', 'flip-horizontal', 'flip-vertical'];

function expectMatrix(actual: SdImageEditorMatrix, expected: SdImageEditorMatrix): void {
  actual.forEach((value, i) => expect(value).withContext(`m[${i}]`).toBeCloseTo(expected[i], 9));
}

/** Where the four source corners land. */
function corners(m: SdImageEditorMatrix, size = SOURCE) {
  const p = (x: number, y: number) => {
    const r = sdImageEditorApply(m, x, y);
    return [Math.round(r.x), Math.round(r.y)];
  };
  return { tl: p(0, 0), tr: p(size.width, 0), bl: p(0, size.height), br: p(size.width, size.height) };
}

describe('image-editor geometry', () => {
  describe('orientation matrix', () => {
    it('maps the source box onto the oriented box for every orientation', () => {
      for (const orientation of ALL_ORIENTATIONS) {
        const size = sdImageEditorOrientedSize(SOURCE, orientation.rotate);
        const c = corners(sdImageEditorOrientationMatrix(SOURCE, orientation));
        const xs = [c.tl[0], c.tr[0], c.bl[0], c.br[0]];
        const ys = [c.tl[1], c.tr[1], c.bl[1], c.br[1]];
        expect(Math.min(...xs))
          .withContext(JSON.stringify(orientation))
          .toBe(0);
        expect(Math.min(...ys)).toBe(0);
        expect(Math.max(...xs)).toBe(size.width);
        expect(Math.max(...ys)).toBe(size.height);
      }
    });

    it('rotates clockwise: the source top-left corner goes to the top-right', () => {
      const c = corners(sdImageEditorOrientationMatrix(SOURCE, { flip: false, rotate: 90 }));
      expect(c.tl).toEqual([20, 0]);
      expect(c.bl).toEqual([0, 0]);
      expect(c.br).toEqual([0, 40]);
    });

    it('mirrors before rotating', () => {
      // Mirror then rotate 90° clockwise = transpose flipped: source top-left ends at the bottom-right.
      const c = corners(sdImageEditorOrientationMatrix(SOURCE, { flip: true, rotate: 90 }));
      expect(c.tl).toEqual([20, 40]);
      expect(c.tr).toEqual([20, 0]);
    });

    it('swaps width and height on quarter turns only', () => {
      expect(sdImageEditorOrientedSize(SOURCE, 90)).toEqual({ width: 20, height: 40 });
      expect(sdImageEditorOrientedSize(SOURCE, 270)).toEqual({ width: 20, height: 40 });
      expect(sdImageEditorOrientedSize(SOURCE, 180)).toEqual({ width: 40, height: 20 });
    });
  });

  describe('screen operations', () => {
    it('compose into the canonical { flip, rotate } pair for every orientation and operation', () => {
      // The operation matrix applied after the current orientation must equal the matrix of the new pair.
      for (const orientation of ALL_ORIENTATIONS) {
        for (const op of OPS) {
          const before = sdImageEditorOrientationMatrix(SOURCE, orientation);
          const opMatrix = sdImageEditorOperationMatrix(op, sdImageEditorOrientedSize(SOURCE, orientation.rotate));
          const next = sdImageEditorApplyOperation(orientation, op);
          expectMatrix(sdImageEditorCompose(opMatrix, before), sdImageEditorOrientationMatrix(SOURCE, next));
        }
      }
    });

    it('undoes itself: two flips or a turn and its inverse restore the orientation', () => {
      for (const orientation of ALL_ORIENTATIONS) {
        const apply = (...ops: SdImageEditorOrientationOp[]) => ops.reduce(sdImageEditorApplyOperation, orientation);
        expect(apply('flip-horizontal', 'flip-horizontal')).toEqual(orientation);
        expect(apply('flip-vertical', 'flip-vertical')).toEqual(orientation);
        expect(apply('rotate-cw', 'rotate-ccw')).toEqual(orientation);
        expect(apply('rotate-cw', 'rotate-cw', 'rotate-cw', 'rotate-cw')).toEqual(orientation);
      }
    });

    it('depends on order: rotate then flip is not flip then rotate', () => {
      const start: SdImageEditorOrientation = { flip: false, rotate: 0 };
      const a = sdImageEditorApplyOperation(sdImageEditorApplyOperation(start, 'rotate-cw'), 'flip-horizontal');
      const b = sdImageEditorApplyOperation(sdImageEditorApplyOperation(start, 'flip-horizontal'), 'rotate-cw');
      expect(a).toEqual({ flip: true, rotate: 270 });
      expect(b).toEqual({ flip: true, rotate: 90 });
    });

    it('stores a vertical flip as a mirror plus a half turn', () => {
      expect(sdImageEditorApplyOperation({ flip: false, rotate: 0 }, 'flip-vertical')).toEqual({ flip: true, rotate: 180 });
    });
  });

  describe('EXIF orientation', () => {
    it('maps the eight EXIF values to the transform that shows the image upright', () => {
      // Expected position of the stored top-left pixel once displayed, per the EXIF specification.
      const stored = { width: 40, height: 20 };
      const expectations: Record<number, [number, number]> = {
        1: [0, 0],
        2: [40, 0],
        3: [40, 20],
        4: [0, 20],
        5: [0, 0],
        6: [20, 0],
        7: [20, 40],
        8: [0, 40],
      };
      for (const [value, expected] of Object.entries(expectations)) {
        const m = sdImageEditorOrientationMatrix(stored, sdImageEditorExifOrientation(Number(value)));
        const p = sdImageEditorApply(m, 0, 0);
        expect([Math.round(p.x), Math.round(p.y)])
          .withContext(`EXIF ${value}`)
          .toEqual(expected);
      }
      expect(sdImageEditorExifOrientation(0)).toEqual({ flip: false, rotate: 0 });
      expect(sdImageEditorExifOrientation(9)).toEqual({ flip: false, rotate: 0 });
    });
  });

  describe('rectangles', () => {
    it('carries the crop with the content through every operation', () => {
      // The source region selected by the crop must not change when the image is rotated or flipped.
      const crop: SdImageEditorRect = { x: 3, y: 2, width: 10, height: 6 };
      for (const orientation of ALL_ORIENTATIONS) {
        const m = sdImageEditorOrientationMatrix(SOURCE, orientation);
        const cropInOriented = sdImageEditorTransformRect(crop, m);
        const regionBefore = sdImageEditorTransformRect(cropInOriented, sdImageEditorInvert(m));
        for (const op of OPS) {
          const opMatrix = sdImageEditorOperationMatrix(op, sdImageEditorOrientedSize(SOURCE, orientation.rotate));
          const next = sdImageEditorApplyOperation(orientation, op);
          const moved = sdImageEditorTransformRect(cropInOriented, opMatrix);
          const regionAfter = sdImageEditorTransformRect(moved, sdImageEditorInvert(sdImageEditorOrientationMatrix(SOURCE, next)));
          expect(regionAfter)
            .withContext(`${JSON.stringify(orientation)} ${op}`)
            .toEqual(regionBefore);
        }
        expect(regionBefore).toEqual(crop);
      }
    });

    it('clamps inside the bounds with whole pixels', () => {
      const bounds = { width: 100, height: 50 };
      expect(sdImageEditorClampRect({ x: -5.4, y: 45, width: 20.6, height: 10 }, bounds)).toEqual({ x: 0, y: 40, width: 21, height: 10 });
      expect(sdImageEditorClampRect({ x: 0, y: 0, width: 500, height: 0 }, bounds)).toEqual({ x: 0, y: 0, width: 100, height: 1 });
    });

    it('moves without resizing and stops at the edges', () => {
      const bounds = { width: 100, height: 50 };
      const rect = { x: 10, y: 10, width: 30, height: 20 };
      expect(sdImageEditorMoveRect(rect, 5, -3, bounds)).toEqual({ x: 15, y: 7, width: 30, height: 20 });
      expect(sdImageEditorMoveRect(rect, 500, 500, bounds)).toEqual({ x: 70, y: 30, width: 30, height: 20 });
      expect(sdImageEditorMoveRect(rect, -500, -500, bounds)).toEqual({ x: 0, y: 0, width: 30, height: 20 });
    });

    it('builds the largest centred crop for a ratio', () => {
      expect(sdImageEditorInitialCrop({ width: 400, height: 300 }, null)).toEqual({ x: 0, y: 0, width: 400, height: 300 });
      expect(sdImageEditorInitialCrop({ width: 400, height: 300 }, 1)).toEqual({ x: 50, y: 0, width: 300, height: 300 });
      expect(sdImageEditorInitialCrop({ width: 400, height: 300 }, 16 / 9)).toEqual({ x: 0, y: 38, width: 400, height: 225 });
      expect(sdImageEditorFitRatio(10, 10, 3)).toEqual({ width: 10, height: 3 });
    });

    it('reshapes to a ratio around the same centre, inside the image', () => {
      const bounds = { width: 400, height: 300 };
      const square = sdImageEditorReshape({ x: 100, y: 100, width: 160, height: 90 }, 1, bounds);
      expect(square.width).toBe(square.height);
      expect(square.x + square.width / 2).toBeCloseTo(180, 0);
      expect(square.y + square.height / 2).toBeCloseTo(145, 0);
      const wide = sdImageEditorReshape({ x: 0, y: 0, width: 300, height: 300 }, 16 / 9, bounds);
      expect(wide.width).toBeLessThanOrEqual(400);
      expect(wide.height).toBeLessThanOrEqual(300);
      expect(wide.width / wide.height).toBeCloseTo(16 / 9, 1);
    });

    describe('resize by handle', () => {
      const bounds = { width: 200, height: 100 };
      const start: SdImageEditorRect = { x: 50, y: 20, width: 80, height: 40 };

      it('moves only the dragged edge in a free crop', () => {
        expect(sdImageEditorResizeRect(start, 'e', 10, 99, bounds, null, 1)).toEqual({ x: 50, y: 20, width: 90, height: 40 });
        expect(sdImageEditorResizeRect(start, 'nw', -10, -5, bounds, null, 1)).toEqual({ x: 40, y: 15, width: 90, height: 45 });
      });

      it('never crosses the opposite edge nor leaves the image', () => {
        expect(sdImageEditorResizeRect(start, 'w', 500, 0, bounds, null, 4)).toEqual({ x: 126, y: 20, width: 4, height: 40 });
        expect(sdImageEditorResizeRect(start, 'se', 1000, 1000, bounds, null, 1)).toEqual({ x: 50, y: 20, width: 150, height: 80 });
      });

      it('keeps the ratio and the opposite corner with a fixed ratio', () => {
        const r = sdImageEditorResizeRect(start, 'se', 20, 0, bounds, 2, 1);
        expect(r).toEqual({ x: 50, y: 20, width: 100, height: 50 });
        const clamped = sdImageEditorResizeRect(start, 'se', 1000, 1000, bounds, 2, 1);
        expect(clamped.x).toBe(50);
        expect(clamped.y).toBe(20);
        expect(clamped.width / clamped.height).toBeCloseTo(2, 5);
        expect(clamped.y + clamped.height).toBeLessThanOrEqual(100);
        expect(clamped.x + clamped.width).toBeLessThanOrEqual(200);
      });

      it('grows an edge symmetrically around the other axis with a fixed ratio', () => {
        const r = sdImageEditorResizeRect(start, 'e', 20, 0, bounds, 2, 1);
        expect(r.width).toBe(100);
        expect(r.height).toBe(50);
        expect(r.y + r.height / 2).toBeCloseTo(40, 0);
      });
    });
  });

  describe('viewport', () => {
    const stage = { width: 800, height: 600 };
    const image = { width: 4000, height: 2000 };

    it('fits the oriented image and round-trips stage ↔ image coordinates', () => {
      const viewport = sdImageEditorViewport(stage, image, SD_IMAGE_EDITOR_FIT_VIEW, 0);
      expect(viewport.scale).toBeCloseTo(0.2, 9);
      const box = sdImageEditorImageToStage(viewport, { x: 0, y: 0, ...image });
      expect(box).toEqual({ x: 0, y: 100, width: 800, height: 400 });
      const back = sdImageEditorStageToImage(viewport, 400, 300);
      expect(back.x).toBeCloseTo(2000, 6);
      expect(back.y).toBeCloseTo(1000, 6);
      const m = sdImageEditorViewMatrix(viewport);
      const p = sdImageEditorApply(m, 1000, 500);
      expect(p).toEqual({ x: 200, y: 200 });
    });

    it('zooms around the anchor: the pixel under the pointer stays put', () => {
      const view = sdImageEditorZoomAt(stage, image, SD_IMAGE_EDITOR_FIT_VIEW, 24, 3, 123, 456);
      const before = sdImageEditorStageToImage(sdImageEditorViewport(stage, image, SD_IMAGE_EDITOR_FIT_VIEW, 24), 123, 456);
      const after = sdImageEditorStageToImage(sdImageEditorViewport(stage, image, view, 24), 123, 456);
      expect(after.x).toBeCloseTo(before.x, 6);
      expect(after.y).toBeCloseTo(before.y, 6);
      expect(view.zoom).toBe(3);
    });

    it('keeps part of the image reachable when panning', () => {
      const view = sdImageEditorClampPan(stage, image, { zoom: 1, panX: 99999, panY: -99999 }, 0, 48);
      const viewport = sdImageEditorViewport(stage, image, view, 0);
      expect(viewport.originX).toBeLessThanOrEqual(stage.width - 48 + 1e-6);
      expect(viewport.originY + image.height * viewport.scale).toBeGreaterThanOrEqual(48 - 1e-6);
    });
  });

  describe('export matrix', () => {
    it('maps the crop corners to the output corners, whatever the orientation', () => {
      for (const orientation of ALL_ORIENTATIONS) {
        const bounds = sdImageEditorOrientedSize(SOURCE, orientation.rotate);
        const crop = { x: 2, y: 4, width: bounds.width - 6, height: bounds.height - 8 };
        const output = { width: 300, height: 120 };
        const m = sdImageEditorExportMatrix(SOURCE, orientation, crop, output);
        const toOriented = sdImageEditorOrientationMatrix(SOURCE, orientation);
        const source = sdImageEditorApply(sdImageEditorInvert(toOriented), crop.x, crop.y);
        const origin = sdImageEditorApply(m, source.x, source.y);
        expect(origin.x).toBeCloseTo(0, 9);
        expect(origin.y).toBeCloseTo(0, 9);
        const far = sdImageEditorApply(sdImageEditorInvert(toOriented), crop.x + crop.width, crop.y + crop.height);
        const end = sdImageEditorApply(m, far.x, far.y);
        expect(end.x).toBeCloseTo(output.width, 9);
        expect(end.y).toBeCloseTo(output.height, 9);
      }
    });

    it('does not depend on the viewport', () => {
      // Zoom/pan only change the preview matrix; the export matrix has no view input at all.
      const orientation: SdImageEditorOrientation = { flip: true, rotate: 90 };
      const crop = { x: 1, y: 2, width: 10, height: 20 };
      const a = sdImageEditorExportMatrix(SOURCE, orientation, crop, { width: 10, height: 20 });
      sdImageEditorZoomAt({ width: 500, height: 500 }, { width: 20, height: 40 }, SD_IMAGE_EDITOR_FIT_VIEW, 0, 4, 10, 10);
      const b = sdImageEditorExportMatrix(SOURCE, orientation, crop, { width: 10, height: 20 });
      expect(b).toEqual(a);
    });
  });
});
