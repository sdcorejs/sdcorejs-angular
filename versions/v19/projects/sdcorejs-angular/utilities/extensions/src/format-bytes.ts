/**
 * Human-readable file size in base 1024: `846 KB`, `2,4 MB` (vi) / `2.4 MB` (en).
 * One fraction digit below 10 units, none above — the precision users expect from file managers.
 * Empty string for a missing, negative or non-finite value.
 *
 * @internal Shared by `sd-file-explorer` and `sd-card`; not a public API.
 */
export function ɵsdFormatBytes(bytes: number | null | undefined, locale: string): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = value < 10 ? 1 : 0;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)} ${units[unit]}`;
}
