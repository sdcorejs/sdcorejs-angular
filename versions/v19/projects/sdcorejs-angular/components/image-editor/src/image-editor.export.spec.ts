import { SdImageEditorOrientationOp } from './image-editor.geometry';
import type { SdImageEditorEdits, SdImageEditorFormat } from './image-editor.model';
import {
  sdImageEditorColorToHex,
  sdImageEditorEncodableFormats,
  sdImageEditorEncode,
  sdImageEditorExport,
  sdImageEditorFileName,
  sdImageEditorFormatBytes,
  sdImageEditorHasTransparency,
  sdImageEditorRender,
} from './image-editor.export';
import {
  BLACK,
  BLUE,
  Corners,
  GREEN,
  RED,
  TRANSPARENT,
  UPRIGHT,
  WHITE,
  YELLOW,
  bytes,
  canvas,
  corners,
  decode,
  fill,
  near,
  pixel,
  quadrants,
  sameCorners,
} from './image-editor.fixtures.spec';
import { SdImageEditorFailure, sdImageEditorSniffFormat } from './image-editor.source';
import {
  SdImageEditorOutputRules,
  sdImageEditorInitialEdits,
  sdImageEditorOperate,
  sdImageEditorOutputSize,
  sdImageEditorSetCrop,
} from './image-editor.state';

const RULES: SdImageEditorOutputRules = { allowUpscale: false, maxPixels: 16_777_216, maxSide: 16_384 };

function source(element: HTMLCanvasElement) {
  return { image: element, width: element.width, height: element.height };
}

async function exportEdits(
  element: HTMLCanvasElement,
  edits: SdImageEditorEdits,
  format: SdImageEditorFormat = 'image/png',
  options: { quality?: number; background?: string } = {}
) {
  const output = sdImageEditorOutputSize(edits, RULES);
  const encoded = await sdImageEditorExport(document, {
    source: source(element),
    edits,
    output,
    format,
    quality: options.quality ?? 0.92,
    background: options.background ?? 'white',
  });
  return { encoded, decoded: await decode(encoded.blob) };
}

function operate(element: HTMLCanvasElement, ...ops: SdImageEditorOrientationOp[]): SdImageEditorEdits {
  const size = { width: element.width, height: element.height };
  return ops.reduce((edits, op) => sdImageEditorOperate(edits, op, size, RULES), sdImageEditorInitialEdits(size, null));
}

async function failureOf(promise: Promise<unknown>): Promise<SdImageEditorFailure> {
  try {
    await promise;
  } catch (error) {
    return error as SdImageEditorFailure;
  }
  throw new Error('expected a failure');
}

describe('image-editor export', () => {
  const fixture = () => quadrants(40, 20);

  it('exports the untouched image pixel for pixel', async () => {
    const element = fixture();
    const { encoded, decoded } = await exportEdits(element, operate(element));
    expect(encoded.format).toBe('image/png');
    expect([decoded.width, decoded.height]).toEqual([40, 20]);
    expect(sameCorners(corners(decoded), UPRIGHT, 0)).toBeTrue();
    // Exact edges: the quadrant boundary stays at x = 20.
    expect(pixel(decoded, 19, 0)).toEqual(RED);
    expect(pixel(decoded, 20, 0)).toEqual(GREEN);
  });

  describe('orientation', () => {
    const cases: { ops: SdImageEditorOrientationOp[]; size: [number, number]; expected: Corners }[] = [
      { ops: ['rotate-cw'], size: [20, 40], expected: { tl: BLUE, tr: RED, bl: YELLOW, br: GREEN } },
      { ops: ['rotate-ccw'], size: [20, 40], expected: { tl: GREEN, tr: YELLOW, bl: RED, br: BLUE } },
      { ops: ['flip-horizontal'], size: [40, 20], expected: { tl: GREEN, tr: RED, bl: YELLOW, br: BLUE } },
      { ops: ['flip-vertical'], size: [40, 20], expected: { tl: BLUE, tr: YELLOW, bl: RED, br: GREEN } },
      { ops: ['rotate-cw', 'rotate-cw'], size: [40, 20], expected: { tl: YELLOW, tr: BLUE, bl: GREEN, br: RED } },
      // Same two operations, other order → different image.
      { ops: ['rotate-cw', 'flip-horizontal'], size: [20, 40], expected: { tl: RED, tr: BLUE, bl: GREEN, br: YELLOW } },
      { ops: ['flip-horizontal', 'rotate-cw'], size: [20, 40], expected: { tl: YELLOW, tr: GREEN, bl: BLUE, br: RED } },
    ];

    for (const { ops, size, expected } of cases) {
      it(`matches what the preview shows after ${ops.join(' → ')}`, async () => {
        const element = fixture();
        const { decoded } = await exportEdits(element, operate(element, ...ops));
        expect([decoded.width, decoded.height]).toEqual(size);
        expect(sameCorners(corners(decoded), expected, 0)).toBeTrue();
      });
    }
  });

  it('crops in oriented coordinates after a rotation', async () => {
    // Rotated clockwise the image is 20 × 40: blue on the top-left quarter. Crop that quarter only.
    const element = fixture();
    const size = { width: 40, height: 20 };
    const rotated = operate(element, 'rotate-cw');
    const edits = sdImageEditorSetCrop(rotated, { x: 0, y: 0, width: 10, height: 20 }, size, RULES);
    const { decoded } = await exportEdits(element, edits);
    expect([decoded.width, decoded.height]).toEqual([10, 20]);
    expect(sameCorners(corners(decoded), { tl: BLUE, tr: BLUE, bl: BLUE, br: BLUE }, 0)).toBeTrue();
  });

  it('crops an exact pixel window', async () => {
    // A 1 px black marker at (13, 7) on white must end at (3, 2) of a crop starting at (10, 5).
    const element = canvas(40, 20, ctx => {
      fill(ctx, WHITE, 0, 0, 40, 20);
      fill(ctx, BLACK, 13, 7, 1, 1);
    });
    const size = { width: 40, height: 20 };
    const edits = sdImageEditorSetCrop(sdImageEditorInitialEdits(size, null), { x: 10, y: 5, width: 8, height: 6 }, size, RULES);
    const { decoded } = await exportEdits(element, edits);
    expect([decoded.width, decoded.height]).toEqual([8, 6]);
    expect(pixel(decoded, 3, 2)).toEqual(BLACK);
    expect(pixel(decoded, 2, 2)).toEqual(WHITE);
    expect(pixel(decoded, 4, 2)).toEqual(WHITE);
  });

  it('resizes to the requested output size', async () => {
    const element = quadrants(400, 200);
    const size = { width: 400, height: 200 };
    const edits = { ...sdImageEditorInitialEdits(size, null), resize: { width: 100, height: 50 } };
    const { decoded } = await exportEdits(element, edits);
    expect([decoded.width, decoded.height]).toEqual([100, 50]);
    expect(sameCorners(corners(decoded), UPRIGHT, 2)).toBeTrue();
  });

  describe('formats and alpha', () => {
    const transparent = () => canvas(20, 10, ctx => fill(ctx, RED, 10, 0, 10, 10));

    it('keeps transparency in PNG', async () => {
      const element = transparent();
      const { encoded, decoded } = await exportEdits(element, operate(element), 'image/png');
      expect(sdImageEditorSniffFormat(await bytes(encoded.blob))).toBe('image/png');
      expect(pixel(decoded, 2, 5)).toEqual(TRANSPARENT);
      expect(pixel(decoded, 15, 5)).toEqual(RED);
    });

    it('keeps transparency in WebP when the browser encodes WebP', async () => {
      const formats = await sdImageEditorEncodableFormats(document);
      if (!formats.has('image/webp')) {
        pending('This browser cannot encode WebP.');
        return;
      }
      const element = transparent();
      const { encoded, decoded } = await exportEdits(element, operate(element), 'image/webp', { quality: 1 });
      expect(encoded.blob.type).toBe('image/webp');
      expect(pixel(decoded, 2, 5)[3]).toBeLessThan(10);
      expect(near(pixel(decoded, 15, 5), RED, 12)).toBeTrue();
    });

    it('paints the background colour under transparent pixels for JPEG', async () => {
      const element = transparent();
      const { encoded, decoded } = await exportEdits(element, operate(element), 'image/jpeg', { quality: 1, background: 'rgb(0, 0, 255)' });
      expect(encoded.blob.type).toBe('image/jpeg');
      expect(sdImageEditorSniffFormat(await bytes(encoded.blob))).toBe('image/jpeg');
      expect(near(pixel(decoded, 2, 5), BLUE, 12)).toBeTrue();
      expect(near(pixel(decoded, 15, 5), RED, 12)).toBeTrue();
    });

    it('uses white for JPEG by default', async () => {
      const element = transparent();
      const { decoded } = await exportEdits(element, operate(element), 'image/jpeg', { quality: 1 });
      expect(near(pixel(decoded, 2, 5), WHITE, 6)).toBeTrue();
    });

    it('produces smaller files at lower JPEG quality', async () => {
      const element = canvas(200, 200, ctx => {
        for (let i = 0; i < 200; i += 4) fill(ctx, [i, 255 - i, (i * 7) % 255, 255], i, 0, 4, 200);
      });
      const high = await exportEdits(element, operate(element), 'image/jpeg', { quality: 0.95 });
      const low = await exportEdits(element, operate(element), 'image/jpeg', { quality: 0.3 });
      expect(low.encoded.blob.size).toBeLessThan(high.encoded.blob.size);
    });

    it('reports the formats this browser really encodes', async () => {
      const formats = await sdImageEditorEncodableFormats(document);
      expect(formats.has('image/png')).toBeTrue();
      expect(formats.has('image/jpeg')).toBeTrue();
      expect(await sdImageEditorEncodableFormats(document)).toBe(formats);
    });
  });

  describe('failures', () => {
    it('refuses to relabel a fallback format', async () => {
      // A browser that cannot encode WebP silently returns PNG bytes; the editor must not call that WebP.
      const element = fixture();
      const native = HTMLCanvasElement.prototype.toBlob;
      spyOn(HTMLCanvasElement.prototype, 'toBlob').and.callFake(function (this: HTMLCanvasElement, callback: BlobCallback) {
        native.call(this, callback, 'image/png');
      });
      const failure = await failureOf(sdImageEditorEncode(element, 'image/webp', 0.9));
      expect(failure).toBeInstanceOf(SdImageEditorFailure);
      expect(failure.code).toBe('format-unsupported');
      expect(failure.detail).toBe('image/png');
    });

    it('reports a null blob as encode-failed', async () => {
      spyOn(HTMLCanvasElement.prototype, 'toBlob').and.callFake((callback: BlobCallback) => callback(null));
      expect((await failureOf(sdImageEditorEncode(fixture(), 'image/png', 1))).code).toBe('encode-failed');
    });

    it('reports a canvas the browser could not allocate as render-failed', () => {
      const element = fixture();
      spyOn(HTMLCanvasElement.prototype, 'getContext').and.returnValue(null);
      expect(() =>
        sdImageEditorRender(document, {
          source: source(element),
          edits: operate(element),
          output: { width: 40, height: 20 },
          format: 'image/png',
          quality: 1,
          background: 'white',
        })
      ).toThrowMatching(error => error instanceof SdImageEditorFailure && error.code === 'render-failed');
    });

    it('releases the output canvas even when encoding fails', async () => {
      const element = quadrants(40, 20);
      const created: HTMLCanvasElement[] = [];
      const createElement = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake(((tag: string) => {
        const element = createElement(tag);
        if (tag === 'canvas') created.push(element as HTMLCanvasElement);
        return element;
      }) as typeof document.createElement);
      spyOn(HTMLCanvasElement.prototype, 'toBlob').and.callFake((callback: BlobCallback) => callback(null));
      await failureOf(exportEdits(element, operate(element)));
      expect(created.length).toBe(1);
      expect([created[0].width, created[0].height]).toEqual([0, 0]);
    });
  });

  describe('helpers', () => {
    it('names the file after the real format', () => {
      expect(sdImageEditorFileName('holiday.HEIC', 'image/jpeg')).toBe('holiday.jpg');
      expect(sdImageEditorFileName('scan.final.png', 'image/webp')).toBe('scan.final.webp');
      expect(sdImageEditorFileName('report.v1', 'image/png')).toBe('report.v1.png');
      expect(sdImageEditorFileName('  ', 'image/png')).toBe('image.png');
      expect(sdImageEditorFileName(undefined, 'image/jpeg')).toBe('image.jpg');
    });

    it('formats byte sizes', () => {
      expect(sdImageEditorFormatBytes(830, 'en-US')).toBe('830 B');
      expect(sdImageEditorFormatBytes(250 * 1024, 'en-US')).toBe('250 KB');
      expect(sdImageEditorFormatBytes(1.25 * 1024 * 1024, 'en-US')).toBe('1.3 MB');
      expect(sdImageEditorFormatBytes(1.25 * 1024 * 1024, 'vi-VN')).toBe('1,3 MB');
    });

    it('detects real transparency, not just an alpha channel', () => {
      expect(sdImageEditorHasTransparency(quadrants(8, 8))).toBeFalse();
      expect(sdImageEditorHasTransparency(canvas(8, 8, ctx => fill(ctx, RED, 0, 0, 4, 8)))).toBeTrue();
    });

    it('normalises CSS colours for the colour input', () => {
      expect(sdImageEditorColorToHex(document, 'white')).toBe('#ffffff');
      expect(sdImageEditorColorToHex(document, 'rgb(0, 128, 255)')).toBe('#0080ff');
      expect(sdImageEditorColorToHex(document, 'not a colour')).toBeNull();
      expect(sdImageEditorColorToHex(document, 'rgba(0, 0, 0, 0.5)')).toBeNull();
    });
  });
});
