export type AutoidE2eTarget = 'playwright' | 'robot';

export interface AutoidRobotExportContext {
  requirement?: string;
  testCases?: string;
  testData?: string;
  precondition?: string;
  component?: string;
  storyLinkages?: string;
  qcNotes?: string;
}

export interface AutoidExportMeta {
  /** `location.pathname + location.search`, kept for back-compat with MD exports. */
  pageUrl: string;
  pageTitle: string;
  timestamp: string;
  /** Full `location.href`. */
  url: string;
  /** `location.pathname` only. */
  pathname: string;
  /** Raw `location.search` (incl. leading `?`), or `''`. */
  search: string;
  /** Parsed query string as key/value map (last value wins on repeats). */
  queryParams: Record<string, string>;
  /**
   * Angular route path params (`:id`, etc.) merged across the activated-route tree.
   * Only present when an Angular `Router` is available at scan time; omitted otherwise.
   */
  params?: Record<string, string>;
}

/** JSON export envelope: page meta + the scanned elements. */
export interface AutoidExportJson {
  meta: AutoidExportMeta;
  elements: import('./autoid-element.model').AutoidElement[];
}
