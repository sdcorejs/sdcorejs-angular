export type SdAutoidExportFormat = 'csv' | 'json' | 'md-pom' | 'md-table';

export interface SdAutoidExportMeta {
  /** `location.pathname + location.search` — kept for back-compat with MD exports. */
  pageUrl: string;
  pageTitle: string;
  timestamp: string;
  /** Full `location.href`. */
  url: string;
  /** `location.pathname` only. */
  pathname: string;
  /** Raw `location.search` (incl. leading `?`), or `''`. */
  search: string;
  /** Parsed query string → key/value map (last value wins on repeats). */
  queryParams: Record<string, string>;
  /**
   * Angular route path params (`:id`, …) merged across the activated-route tree.
   * Only present when an Angular `Router` is available at scan time; omitted otherwise.
   */
  params?: Record<string, string>;
}

/** JSON export envelope: page meta + the scanned elements. */
export interface SdAutoidExportJson {
  meta: SdAutoidExportMeta;
  elements: import('./autoid-element.model').SdAutoidElement[];
}
