/**
 * Source descriptor accepted by SdPreviewPdf's `source` signal input.
 *
 * Mirrors the input shapes that `pdfjsLib.getDocument()` understands while
 * adding consumer-friendly variants (raw `File`/`Blob`). The component handles
 * the bridging internally — caller never touches pdfjs types.
 */
export type PdfSource =
  | string                                                                  // CDN/HTTP URL
  | File
  | Blob
  | ArrayBuffer
  | Uint8Array
  | { url: string; httpHeaders?: Record<string, string>; withCredentials?: boolean }
  | { data: ArrayBuffer | Uint8Array };

/**
 * Zoom expressed either as a raw scale number (1 = 100%) OR a symbolic mode
 * that auto-fits the stage. The auto modes recompute on container resize +
 * page change.
 */
export type PdfZoomMode = number | 'page-fit' | 'page-width' | 'page-actual';

/**
 * Which tab the sidebar shows. `'none'` collapses the sidebar entirely.
 * NOTE: outline + search tabs are deferred — selecting them shows a placeholder.
 */
export type PdfSidebarMode = 'thumbnails' | 'outline' | 'search' | 'none';

/**
 * Page layout mode. `'continuous'` is deferred — the input is kept on the
 * public API so consumer code compiles, but the component falls back to
 * single-page behavior with a warning.
 */
export type PdfScrollMode = 'page' | 'continuous';

/**
 * Document-level metadata extracted from `pdfDoc.getMetadata()`.
 */
export interface PdfMeta {
  title?: string;
  author?: string;
  subject?: string;
  numPages: number;
}

/** Visual state of the stage. */
export type PdfStage = 'empty' | 'loading' | 'ready' | 'error';

/** Classifier for `loadError` output — drives which Artboard H copy renders. */
export type PdfErrorReason = 'invalid' | 'password' | 'network' | 'unknown';

/** Fired once after `getDocument()` resolves successfully. */
export interface PdfLoadEvent {
  totalPages: number;
  meta: PdfMeta;
}

/** Fired whenever a load attempt rejects. */
export interface PdfErrorEvent {
  reason: PdfErrorReason;
  message?: string;
}

/**
 * One hit returned by `SdPreviewPdf.search()`. `before` / `term` / `after`
 * are sliced from the original page text so the result list can render a
 * snippet with the matched substring wrapped in `<mark>` while preserving the
 * surrounding context (~30 chars each side).
 *
 * `textItemIndices` is reserved for the in-page highlight pass — it carries
 * the indices of the pdfjs text items the match spans across so the renderer
 * can wrap the right spans without re-running the search per page.
 */
export interface PdfSearchResult {
  page: number;
  before: string;
  term: string;
  after: string;
  textItemIndices?: number[];
}

// Re-exported so consumers can import the theme type from either preview
// module without reaching across symbols. Single source of truth lives in
// preview-image.types.
export type { PreviewTheme } from '../preview-image/preview-image.types';

/**
 * Lightweight projection of the internal search state for the
 * `searchChange` output + the result-list rendering. `activeIndex` is `-1`
 * when no result is currently focused (e.g. immediately after a `clearSearch`).
 */
export interface PdfSearchState {
  term: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  results: PdfSearchResult[];
  activeIndex: number;
}
