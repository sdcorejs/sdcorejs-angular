import type { SdFileExplorerConfig, SdFileExplorerItem, SdFileExplorerOption, SdFileExplorerState } from './file-explorer.model';

/** Resolves original callbacks without wrappers; canonical groups win as a whole. */
export function sdFileExplorerNormalizeConfig<T>(config: SdFileExplorerConfig<T>) {
  const capabilities = config.capabilities;
  const legacy = config as SdFileExplorerOption<T>;
  return {
    ...config,
    list: config.dataSource ? config.dataSource.onList : legacy.list,
    search: config.dataSource ? config.dataSource.onSearch : legacy.search,
    share: capabilities?.share ? capabilities.share.onShare : legacy.share,
    download: capabilities?.download ? capabilities.download.onDownload : legacy.download,
    preview: capabilities?.preview ? capabilities.preview.onPreview : legacy.preview,
    upload: capabilities?.upload ? capabilities.upload.onUpload : legacy.upload,
    createFolder: capabilities?.createFolder ? capabilities.createFolder.onCreateFolder : legacy.createFolder,
    shareable: capabilities?.share?.shareable,
    downloadable: capabilities?.download?.downloadable,
    previewable: capabilities?.preview?.previewable,
    uploadable: capabilities?.upload?.uploadable,
    creatable: capabilities?.createFolder?.creatable,
  };
}

/** Eligibility defaults true for a supported callback and is checked again at dispatch. */
export function sdFileExplorerEligible<T>(state: SdFileExplorerState<T> | undefined, context: T): boolean {
  return typeof state === 'function' ? !!state(context) : state !== false;
}

export type SdFileExplorerNormalizedConfig<T = unknown> = ReturnType<typeof sdFileExplorerNormalizeConfig<T>>;
export type SdFileExplorerItemEligibility<T = unknown> = SdFileExplorerState<SdFileExplorerItem<T>>;
