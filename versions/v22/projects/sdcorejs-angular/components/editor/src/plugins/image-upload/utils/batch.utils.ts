import { ClassicEditor } from 'ckeditor5';
import { SdEditorOption } from '../../../models';
import { SdEditorUploadFileDetail, SdEditorUploadFileFuncUpload } from '../../../configurations';

export const getBatchConfig = (option: SdEditorOption): { batchSize: number; maxConcurrent: number } => {
  const imageConfig = option?.imageConfig;
  return {
    batchSize: Math.max(1, imageConfig?.batchSize ?? 2),
    maxConcurrent: Math.max(1, imageConfig?.maxConcurrentUploads ?? 2),
  };
};

export const getActiveBlobUrls = (editor: ClassicEditor): Set<string> => {
  const urls = new Set<string>();
  const root = editor.model.document.getRoot();
  if (!root) return urls;
  for (const item of editor.model.createRangeIn(root).getItems()) {
    if (item.is('element', 'imageBlock') || item.is('element', 'imageInline')) {
      const src = item.getAttribute('src') as string;
      if (src?.startsWith('blob:')) urls.add(src);
    }
  }
  return urls;
};

export const filterActivePendingFiles = (pendingFiles: Map<string, File>, activeBlobUrls: Set<string>): [string, File][] => {
  const toUpload: [string, File][] = [];
  for (const [blobUrl, file] of pendingFiles) {
    if (activeBlobUrls.has(blobUrl)) {
      toUpload.push([blobUrl, file]);
    } else {
      URL.revokeObjectURL(blobUrl);
      pendingFiles.delete(blobUrl);
    }
  }
  return toUpload;
};

export const runBatchUploads = async (
  toUpload: [string, File][],
  uploadFn: SdEditorUploadFileFuncUpload,
  batchSize: number,
  maxConcurrent: number
): Promise<{ replacements: Map<string, SdEditorUploadFileDetail>; failedBatches: [string, File][][] }> => {
  const batches: [string, File][][] = [];
  for (let i = 0; i < toUpload.length; i += batchSize) {
    batches.push(toUpload.slice(i, i + batchSize));
  }

  const replacements = new Map<string, SdEditorUploadFileDetail>();
  const failedBatches: [string, File][][] = [];

  let head = 0;
  const runWorker = async () => {
    while (head < batches.length) {
      const batch = batches[head++];
      try {
        const details = await uploadFn(batch.map(([, file]) => file));
        if (details.length !== batch.length) {
          throw new Error(`API returned ${details.length} results for ${batch.length} files`);
        }
        batch.forEach(([blobUrl], idx) => {
          replacements.set(blobUrl, details[idx]);
          URL.revokeObjectURL(blobUrl);
        });
      } catch {
        failedBatches.push(batch);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(maxConcurrent, batches.length) }, runWorker));

  return { replacements, failedBatches };
};

export const applyReplacementsToEditor = (editor: ClassicEditor, replacements: Map<string, SdEditorUploadFileDetail>): void => {
  if (replacements.size === 0) return;

  editor.model.change(writer => {
    const root = editor.model.document.getRoot()!;
    for (const item of editor.model.createRangeIn(root).getItems()) {
      if (!item.is('element', 'imageBlock') && !item.is('element', 'imageInline')) continue;
      const detail = replacements.get(item.getAttribute('src') as string);
      if (detail) writer.setAttribute('src', detail.cdn, item);
    }
  });
};
