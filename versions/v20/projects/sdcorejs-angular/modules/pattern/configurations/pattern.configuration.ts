import { InjectionToken } from '@angular/core';

/** What the host configures when it mounts the pattern routes with `provideSdPatterns()`. */
export interface SdPatternConfiguration {
  /**
   * Answer `apiBaseUrl` requests from the built-in mock API (seeded data, latency, simulated errors).
   * `false`: the feature services call a real API at `apiBaseUrl`. Default `true`.
   */
  readonly mockApi?: boolean;
  /** Base URL of the pattern API, root-relative or absolute HTTP(S), no query or hash. Default `'/pattern-api'`. */
  readonly apiBaseUrl?: string;
  /** Latency of every mock response in milliseconds; the toolbar can change it. Default `400`. */
  readonly latencyMs?: number;
  /** Where the mock API keeps created, updated and deleted records. Default `'session'` (sessionStorage). */
  readonly storage?: 'session' | 'none';
  /**
   * Host URL to open when a role has no permission for a pattern route (Core `onForbiden`).
   * Unset: the navigation is only blocked. Errors while loading a record (404, timeout) reach the host's
   * navigation error handler instead, like any other route.
   */
  readonly forbiddenUrl?: string;
}

/** Resolved values; internal to the module, the host uses `provideSdPatterns()`. */
export interface SdPatternResolvedConfiguration {
  readonly mockApi: boolean;
  readonly apiBaseUrl: string;
  readonly latencyMs: number;
  readonly storage: 'session' | 'none';
  readonly forbiddenUrl: string | null;
}

export const SD_PATTERN_CONFIGURATION = new InjectionToken<SdPatternResolvedConfiguration>('SD_PATTERN_CONFIGURATION');
