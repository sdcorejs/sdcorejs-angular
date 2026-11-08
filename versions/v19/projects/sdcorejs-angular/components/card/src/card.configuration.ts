import { InjectionToken, type Signal } from '@angular/core';

/** App-wide defaults for `sd-card` layouts. */
export interface SdCardConfiguration {
  /**
   * Word form of `format: 'compact'` numbers. Defaults to `'long'` for Vietnamese ("86,4 triệu") and `'short'`
   * for other locales ("86.4M").
   */
  compactDisplay?: 'short' | 'long';
}

export const SD_CARD_CONFIGURATION = new InjectionToken<SdCardConfiguration>('sd-card.configuration');

/**
 * Layout context a surrounding page frame (for example `sd-page-list`) offers the cards inside it.
 *
 * why: the token lives in the card entry so the card does not depend back on `modules/layout`.
 */
export interface SdCardLayout {
  /** Cards without an explicit `size` render `sm` while this is true. */
  readonly compact: Signal<boolean>;
}

export const SD_CARD_LAYOUT = new InjectionToken<SdCardLayout>('SD_CARD_LAYOUT');
