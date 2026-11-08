import { InjectionToken } from '@angular/core';

/** App-wide defaults for `sd-card` layouts. */
export interface SdCardConfiguration {
  /**
   * Word form of `format: 'compact'` numbers. Defaults to `'long'` for Vietnamese ("86,4 triệu") and `'short'`
   * for other locales ("86.4M").
   */
  compactDisplay?: 'short' | 'long';
}

export const SD_CARD_CONFIGURATION = new InjectionToken<SdCardConfiguration>('sd-card.configuration');
