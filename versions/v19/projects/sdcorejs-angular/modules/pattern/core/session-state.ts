/** Reads a JSON value the pattern shell kept in sessionStorage; any failure (no storage, bad JSON) gives `fallback`. */
export function readSessionValue<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.sessionStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Writes a JSON value to sessionStorage; `undefined` removes it. Storage errors (private mode, quota) are ignored. */
export function writeSessionValue(key: string, value: unknown): void {
  try {
    if (value === undefined) globalThis.sessionStorage?.removeItem(key);
    else globalThis.sessionStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // why: the shell state is a convenience; the pattern screens work the same without it.
  }
}
