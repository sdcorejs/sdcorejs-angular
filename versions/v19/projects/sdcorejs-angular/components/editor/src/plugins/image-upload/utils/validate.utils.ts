import { I18nService } from '@sdcorejs/angular/i18n';
import { SdEditorImageUploadValidation } from '../../../models';

/** Structural local contract; no dependency on an editor vendor's file loader. */
export interface SdEditorFileLoader {
  file: Promise<File | null> | File | null;
}

const detectFormatFromBytes = async (file: File): Promise<string> => {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return 'png';
  if (String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'webp';
  if (['GIF87a', 'GIF89a'].includes(String.fromCharCode(...b.slice(0, 6)))) return 'gif';
  if (String.fromCharCode(...b.slice(4, 8)) === 'ftyp') {
    const brand = String.fromCharCode(...b.slice(8, 12));
    if (['avif', 'avis'].includes(brand)) return 'avif';
    if (['heic', 'heix', 'hevc', 'hevx'].includes(brand)) return 'heic';
  }
  return '';
};

const loadDimensions = (file: File, signal?: AbortSignal): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Image validation cancelled'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    const finish = (dimensions?: { width: number; height: number }) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      img.onload = img.onerror = null;
      img.src = '';
      URL.revokeObjectURL(url);
      if (dimensions) resolve(dimensions);
      else reject(new Error('Image validation cancelled'));
    };
    const abort = () => finish();
    const timer = setTimeout(() => finish({ width: 0, height: 0 }), 15000);
    signal?.addEventListener('abort', abort, { once: true });
    img.onload = () => finish({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => finish({ width: 0, height: 0 });
    img.src = url;
  });

export const validateAndGetFile = async (
  loader: SdEditorFileLoader,
  validation: SdEditorImageUploadValidation = {},
  onWarning?: (message: string) => void,
  i18n?: I18nService,
  signal?: AbortSignal
): Promise<File> => {
  const file = await loader.file;
  if (!file) throw new Error('No file found');
  const warn = (key: string, params: Record<string, unknown>) => onWarning?.(i18n?.t(key, params as any) ?? '');
  const format = await detectFormatFromBytes(file);
  const allowed = validation.allowedFormats?.map(value => {
    const normalized = value.replace(/^\./, '').toLowerCase();
    return normalized === 'jpeg' ? 'jpg' : normalized;
  });
  if (!format || (allowed && !allowed.includes(format))) {
    warn('core.component.editor.image.invalid-format', { format, allowed: allowed?.join(', ') ?? 'jpg, png, webp, gif, avif, heic' });
    throw new Error('Image validation failed');
  }
  const sizeMB = file.size / (1024 * 1024);
  if (validation.maxSizeMB !== undefined && sizeMB > validation.maxSizeMB) {
    warn('core.component.editor.image.size-exceeded', { sizeMB: sizeMB.toFixed(2), maxSizeMB: validation.maxSizeMB });
    throw new Error('Image validation failed');
  }
  const { width, height } = await loadDimensions(file, signal);
  if (!width || !height) {
    warn('core.component.editor.image.invalid-format', { format, allowed: allowed?.join(', ') ?? format });
    throw new Error('Image validation failed');
  }
  const checks: [number | undefined, number, boolean, string, string][] = [
    [validation.minWidth, width, true, 'min-width', 'min'],
    [validation.minHeight, height, true, 'min-height', 'min'],
    [validation.maxWidth, width, false, 'max-width', 'max'],
    [validation.maxHeight, height, false, 'max-height', 'max'],
  ];
  for (const [limit, actual, minimum, key, param] of checks) {
    if (limit !== undefined && (minimum ? actual < limit : actual > limit)) {
      warn(`core.component.editor.image.${key}`, { width, height, [param]: limit });
      throw new Error('Image validation failed');
    }
  }
  return file;
};
