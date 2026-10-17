import type { SdTimeZone } from '@sdcorejs/angular/configurations';
import { DateUtilities } from '@sdcorejs/utils/fns';

/**
 * ISdCoreConfiguration.timeZone of the Showcase, read from `?timeZone=` once before bootstrap
 * (SdDateTimeService reads the root configuration once, so it cannot change after start).
 *
 * - no parameter, empty or `local` → `'local'`;
 * - a valid IANA id (`Asia/Ho_Chi_Minh`, `UTC`) → that id;
 * - anything else (`+07:00`, unknown id) → `'local'` and a warning, so a bad link never breaks the docs.
 */
export function showcaseTimeZone(search: string, warn: (message: string) => void = message => console.warn(message)): SdTimeZone {
  const value = new URLSearchParams(search).get('timeZone')?.trim();
  if (!value || value === 'local') return 'local';
  if (DateUtilities.isValidTimeZone(value)) return value;
  warn(`[showcase] Ignoring ?timeZone="${value}": use an IANA time zone id such as Asia/Ho_Chi_Minh, or local.`);
  return 'local';
}
