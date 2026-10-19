/**
 * Browser effects used by `SdLayoutContextService`. The default implementation wraps the document window;
 * provide `SD_LAYOUT_CONTEXT_RUNTIME` with a fake in specs and demos so nothing reloads for real.
 */
export interface SdLayoutContextRuntime {
  /** Reloads the page. */
  reload(): void;
  /** Subscribes to cross-tab localStorage changes (window 'storage' events); returns an unsubscribe function. */
  onStorage(listener: () => void): () => void;
  /** Per-tab reconcile marker; `undefined` when session storage is unavailable. */
  readMarker(): string | null | undefined;
  /** Writes the marker (`null` clears it); returns false when it could not be persisted. */
  writeMarker(value: string | null): boolean;
}

/** Session storage key of the per-tab reconcile marker (id of the last context reconcile reload target). */
export const SD_LAYOUT_CONTEXT_MARKER_KEY = 'sd.layout.context.reconcile-marker';
