import {
  RED,
  UPRIGHT,
  animatedPng,
  animatedWebpHeader,
  bytes,
  canvas,
  gifBlob,
  near,
  quadrantBlob,
  quadrants,
  sameCorners,
  toBlob,
  transparentBlob,
  truncatedPng,
  withExifOrientation,
} from './image-editor.fixtures.spec';
import {
  SdImageEditorFailure,
  sdImageEditorDecode,
  sdImageEditorInspect,
  sdImageEditorLoad,
  sdImageEditorReadHeader,
  sdImageEditorSniffFormat,
} from './image-editor.source';

const LIMITS = { maxSourceSize: 10 * 1024 * 1024, maxSourcePixels: 10_000_000 };

async function failureOf(promise: Promise<unknown>): Promise<SdImageEditorFailure> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(SdImageEditorFailure);
    return error as SdImageEditorFailure;
  }
  throw new Error('expected a failure');
}

function readPixels(image: CanvasImageSource, width: number, height: number) {
  const element = canvas(width, height, ctx => ctx.drawImage(image, 0, 0));
  const data = (element.getContext('2d') as CanvasRenderingContext2D).getImageData(0, 0, width, height);
  const at = (x: number, y: number) => {
    const i = (Math.floor(y) * width + Math.floor(x)) * 4;
    return [data.data[i], data.data[i + 1], data.data[i + 2], data.data[i + 3]] as const;
  };
  return {
    tl: at(width * 0.25, height * 0.25),
    tr: at(width * 0.75, height * 0.25),
    bl: at(width * 0.25, height * 0.75),
    br: at(width * 0.75, height * 0.75),
  };
}

describe('image-editor source', () => {
  describe('format sniffing', () => {
    it('recognises formats from the bytes, not the declared type', async () => {
      const png = await quadrantBlob(8, 8, 'image/png');
      const jpeg = await quadrantBlob(8, 8, 'image/jpeg');
      const webp = await quadrantBlob(8, 8, 'image/webp');
      expect(sdImageEditorSniffFormat(await bytes(png))).toBe('image/png');
      expect(sdImageEditorSniffFormat(await bytes(jpeg))).toBe('image/jpeg');
      expect(sdImageEditorSniffFormat(await bytes(webp))).toBe('image/webp');
      expect(sdImageEditorSniffFormat(await bytes(gifBlob()))).toBe('image/gif');
      const heic = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0, 0, 0, 0]);
      expect(sdImageEditorSniffFormat(heic)).toBe('image/heic');
      const avif = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]);
      expect(sdImageEditorSniffFormat(avif)).toBe('image/avif');
      expect(sdImageEditorSniffFormat(new TextEncoder().encode('  <svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe('image/svg+xml');
      expect(sdImageEditorSniffFormat(new TextEncoder().encode('hello'))).toBeNull();
    });

    it('reads the size and alpha from PNG, JPEG and WebP headers', async () => {
      const png = sdImageEditorReadHeader(await bytes(await quadrantBlob(40, 20, 'image/png'), 4096));
      expect(png).toEqual(jasmine.objectContaining({ format: 'image/png', width: 40, height: 20, animated: false }));
      const jpeg = sdImageEditorReadHeader(await bytes(await quadrantBlob(40, 20, 'image/jpeg'), 4096));
      expect(jpeg).toEqual(jasmine.objectContaining({ format: 'image/jpeg', width: 40, height: 20, hasAlpha: false, orientation: 1 }));
      const webp = sdImageEditorReadHeader(await bytes(await quadrantBlob(40, 20, 'image/webp'), 4096));
      expect(webp).toEqual(jasmine.objectContaining({ format: 'image/webp', width: 40, height: 20, animated: false }));
      const alpha = sdImageEditorReadHeader(await bytes(await transparentBlob(20, 10, 'image/png'), 4096));
      expect(alpha.hasAlpha).toBeTrue();
    });

    it('detects animated PNG and WebP', async () => {
      expect(sdImageEditorReadHeader(await bytes(await animatedPng(), 4096)).animated).toBeTrue();
      const webp = sdImageEditorReadHeader(await bytes(animatedWebpHeader(), 64));
      expect(webp).toEqual(jasmine.objectContaining({ format: 'image/webp', width: 100, height: 50, animated: true, hasAlpha: true }));
    });

    it('reads the EXIF orientation in both byte orders', async () => {
      const jpeg = await quadrantBlob(40, 20, 'image/jpeg');
      expect(sdImageEditorReadHeader(await bytes(await withExifOrientation(jpeg, 6), 4096)).orientation).toBe(6);
      expect(sdImageEditorReadHeader(await bytes(await withExifOrientation(jpeg, 3, true), 4096)).orientation).toBe(3);
      expect(sdImageEditorReadHeader(await bytes(await withExifOrientation(jpeg, 42), 4096)).orientation).toBe(1);
    });

    it('does not throw on garbage after a valid signature', () => {
      const broken = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff, 0x45, 0x78]);
      expect(() => sdImageEditorReadHeader(broken)).not.toThrow();
      expect(sdImageEditorReadHeader(broken).format).toBe('image/jpeg');
    });
  });

  describe('inspection before decoding', () => {
    it('rejects unsupported and animated formats with a clear code', async () => {
      expect((await failureOf(sdImageEditorInspect(gifBlob(), LIMITS))).code).toBe('unsupported-format');
      expect((await failureOf(sdImageEditorInspect(new Blob(['not an image'], { type: 'image/png' }), LIMITS))).code).toBe(
        'unsupported-format'
      );
      expect((await failureOf(sdImageEditorInspect(await animatedPng(), LIMITS))).code).toBe('animated');
      expect((await failureOf(sdImageEditorInspect(animatedWebpHeader(), LIMITS))).code).toBe('animated');
    });

    it('checks the byte and pixel limits before any decoding', async () => {
      const decode = spyOn(window, 'createImageBitmap').and.callThrough();
      const blob = await quadrantBlob(40, 20);
      expect((await failureOf(sdImageEditorLoad(blob, { maxSourceSize: 10, maxSourcePixels: 1e9 }, document))).code).toBe(
        'source-too-large'
      );
      const pixels = await failureOf(sdImageEditorLoad(blob, { maxSourceSize: 1e9, maxSourcePixels: 799 }, document));
      expect(pixels.code).toBe('source-too-many-pixels');
      expect(pixels.detail).toEqual({ width: 40, height: 20 });
      expect(decode).not.toHaveBeenCalled();
    });

    it('treats an empty blob as undecodable', async () => {
      expect((await failureOf(sdImageEditorInspect(new Blob([]), LIMITS))).code).toBe('decode-failed');
    });
  });

  describe('decoding', () => {
    it('decodes a PNG at full size without altering the pixels', async () => {
      const { decoded, header } = await sdImageEditorLoad(await quadrantBlob(40, 20), LIMITS, document);
      try {
        expect(header.format).toBe('image/png');
        expect([decoded.width, decoded.height]).toEqual([40, 20]);
        expect(sameCorners(readPixels(decoded.image, 40, 20), UPRIGHT)).toBeTrue();
      } finally {
        decoded.release();
      }
    });

    it('applies the EXIF orientation exactly once (no double rotation)', async () => {
      // Stored 40 × 20, orientation 6 = rotate 90° clockwise → displayed 20 × 40 with blue (stored bottom-left) at the top-left.
      const blob = await withExifOrientation(await quadrantBlob(40, 20, 'image/jpeg'), 6);
      const { decoded, header } = await sdImageEditorLoad(blob, LIMITS, document);
      try {
        expect(header.orientation).toBe(6);
        expect([decoded.width, decoded.height]).toEqual([20, 40]);
        const c = readPixels(decoded.image, 20, 40);
        expect(sameCorners(c, { tl: UPRIGHT.bl, tr: UPRIGHT.tl, bl: UPRIGHT.br, br: UPRIGHT.tr }, 40)).toBeTrue();
      } finally {
        decoded.release();
      }
    });

    it('applies a swapping orientation itself when the decoder ignored it', async () => {
      const blob = await quadrantBlob(40, 20, 'image/png');
      // Pretend the header carried orientation 6 while the (PNG) decoder returned the stored pixels.
      const decoded = await sdImageEditorDecode(
        blob,
        { format: 'image/png', width: 40, height: 20, hasAlpha: false, animated: false, orientation: 6 },
        document
      );
      try {
        expect([decoded.width, decoded.height]).toEqual([20, 40]);
        const c = readPixels(decoded.image, 20, 40);
        expect(sameCorners(c, { tl: UPRIGHT.bl, tr: UPRIGHT.tl, bl: UPRIGHT.br, br: UPRIGHT.tr })).toBeTrue();
      } finally {
        decoded.release();
      }
    });

    it('reports a truncated file as decode-failed', async () => {
      expect((await failureOf(sdImageEditorLoad(await truncatedPng(), LIMITS, document))).code).toBe('decode-failed');
    });

    it('releases the bitmap it created', async () => {
      const close = spyOn(ImageBitmap.prototype, 'close').and.callThrough();
      const { decoded } = await sdImageEditorLoad(await quadrantBlob(8, 8), LIMITS, document);
      decoded.release();
      expect(close).toHaveBeenCalledTimes(1);
    });

    it('never mutates or revokes the source blob', async () => {
      const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
      const source = await toBlob(quadrants(40, 20));
      const before = new Uint8Array(await source.arrayBuffer());
      const { decoded } = await sdImageEditorLoad(source, LIMITS, document);
      decoded.release();
      const after = new Uint8Array(await source.arrayBuffer());
      expect(after).toEqual(before);
      expect(revoke).not.toHaveBeenCalled();
      expect(near(readPixels(await createImageBitmap(source), 40, 20).tl, RED)).toBeTrue();
    });
  });
});
