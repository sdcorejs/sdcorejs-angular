import { FileLoader } from 'ckeditor5';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdEditorImageUploadValidation } from '../../../models';
import { validateAndGetFile } from './validate.utils';

function imageFile(bytes: number[], size = bytes.length): File {
  const content = new Uint8Array(Math.max(size, bytes.length));
  content.set(bytes);
  return new File([content], 'upload.bin');
}

function loaderFor(file: File | null): FileLoader {
  return { file: Promise.resolve(file) } as FileLoader;
}

describe('editor image upload validation', () => {
  let dimensions = { width: 640, height: 480 };

  beforeEach(() => {
    dimensions = { width: 640, height: 480 };
    spyOn(URL, 'createObjectURL').and.callFake(() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}"></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    });
    spyOn(URL, 'revokeObjectURL');
  });

  it('returns the file when validation is absent', async () => {
    const file = imageFile([0xff, 0xd8, 0xff]);

    await expectAsync(validateAndGetFile(loaderFor(file))).toBeResolvedTo(file);
  });

  it('throws when the loader has no file', async () => {
    await expectAsync(validateAndGetFile(loaderFor(null))).toBeRejectedWithError('No file found');
  });

  it('accepts detected JPG, PNG, WebP, GIF, AVIF, and HEIC signatures', async () => {
    const cases: [number[], string][] = [
      [[0xff, 0xd8, 0xff], 'jpeg'],
      [[0x89, 0x50, 0x4e, 0x47], '.png'],
      [[0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57], 'webp'],
      [[0x47, 0x49, 0x46, 0x38], 'gif'],
      [[0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], 'avif'],
      [[0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], 'heic'],
    ];

    for (const [signature, allowedFormat] of cases) {
      const file = imageFile(signature);
      await expectAsync(validateAndGetFile(loaderFor(file), { allowedFormats: [allowedFormat] })).toBeResolvedTo(file);
    }
  });

  it('rejects unknown formats and reports normalized allowed formats', async () => {
    const warnings: string[] = [];
    const i18n = {
      t: (key: string, params: Record<string, unknown>) => `${key}:${params['format']}:${params['allowed']}`,
    } as I18nService;

    await expectAsync(
      validateAndGetFile(loaderFor(imageFile([1, 2, 3])), { allowedFormats: ['.PNG', 'jpeg'] }, message => warnings.push(message), i18n)
    ).toBeRejectedWithError('Image validation failed');
    expect(warnings).toEqual(['core.component.editor.image.invalid-format::png, jpg']);
  });

  it('rejects files above the configured size', async () => {
    const warnings: string[] = [];
    const i18n = { t: (key: string) => key } as I18nService;
    const file = imageFile([0xff, 0xd8, 0xff], 2 * 1024 * 1024);

    await expectAsync(validateAndGetFile(loaderFor(file), { maxSizeMB: 1 }, message => warnings.push(message), i18n)).toBeRejectedWithError(
      'Image validation failed'
    );
    expect(warnings).toEqual(['core.component.editor.image.size-exceeded']);
  });

  it('enforces each image dimension boundary', async () => {
    const cases: [Partial<SdEditorImageUploadValidation>, { width: number; height: number }, string][] = [
      [{ minWidth: 641 }, { width: 640, height: 480 }, 'core.component.editor.image.min-width'],
      [{ minHeight: 481 }, { width: 640, height: 480 }, 'core.component.editor.image.min-height'],
      [{ maxWidth: 639 }, { width: 640, height: 480 }, 'core.component.editor.image.max-width'],
      [{ maxHeight: 479 }, { width: 640, height: 480 }, 'core.component.editor.image.max-height'],
    ];
    const i18n = { t: (key: string) => key } as I18nService;

    for (const [validation, currentDimensions, warningKey] of cases) {
      dimensions = currentDimensions;
      const warnings: string[] = [];
      await expectAsync(
        validateAndGetFile(loaderFor(imageFile([0xff, 0xd8, 0xff])), validation, message => warnings.push(message), i18n)
      ).toBeRejectedWithError('Image validation failed');
      expect(warnings).toEqual([warningKey]);
    }
  });

  it('returns an empty warning when no translator is supplied', async () => {
    const warnings: string[] = [];

    await expectAsync(
      validateAndGetFile(loaderFor(imageFile([1, 2, 3])), { allowedFormats: ['png'] }, message => warnings.push(message))
    ).toBeRejectedWithError('Image validation failed');
    expect(warnings).toEqual(['']);
  });
});
