import { InjectionToken } from '@angular/core';
import { ThemePalette } from '@angular/material/core';

export interface SdDatetimeDefaultOptions {
  /** Whether to show the seconds spinner column in the time picker. */
  showSeconds?: boolean;
  /** Minute spinner step (e.g. 5 → 0, 5, 10, ...). */
  stepMinute?: number;
  /** Touch-friendly modal mode instead of inline overlay. */
  touchUi?: boolean;
  /** Material theme palette for the picker UI. */
  color?: ThemePalette;
}

export const SD_DATETIME_DEFAULT_OPTIONS =
  new InjectionToken<SdDatetimeDefaultOptions>('sd-datetime-default-options');
