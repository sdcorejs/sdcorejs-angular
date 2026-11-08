import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { Color as SdColor } from '@sdcorejs/utils/models';

/**
 * How a card reacts to the user.
 * - `static`: read-only surface; no role, no focus, native clicks pass through untouched.
 * - `link`: the whole card is one `<a>` (router `link` or external `href`).
 * - `select`: toggles selection (standalone) or drives the nearest `sd-card-group` model.
 */
export type SdCardBehavior = 'static' | 'link' | 'select';

/** Card density. `sm` is a single compact row; layouts without an `sm` variant always render `md`. */
export type SdCardSize = 'md' | 'sm';

/** Built-in content layout chosen by `layout`; without `content` the card projects `ng-content`. */
export type SdCardContent =
  | { layout: 'stat'; data: SdCardStatData }
  | { layout: 'option'; data: SdCardOptionData }
  | { layout: 'entity'; data: SdCardEntityData }
  | { layout: 'file'; data: SdCardFileData }
  | { layout: 'shortcut'; data: SdCardShortcutData };

/** Metric tile: label, formatted value, optional delta chip and context line. */
export interface SdCardStatData {
  label: string;
  value: number | string | null;
  /** Defaults to `'number'`. `'text'` renders the string as is. */
  format?: 'number' | 'compact' | 'percent' | 'text';
  /** Fraction digits for `'number'`; defaults to 0. */
  precision?: number;
  context?: string;
  /** Color of the context line; defaults to the secondary text color. */
  contextColor?: SdColor;
  delta?: { value: number; positive?: 'up' | 'down' };
  icon?: string;
}

/** Choice tile for a selection group: title, description, icon and a check mark. */
export interface SdCardOptionData {
  title: string;
  description?: string;
  icon?: string;
  badge?: SdBadgeData;
}

/** Record summary: avatar, title, subtitle, badge and up to three meta fields. */
export interface SdCardEntityData {
  title: string;
  subtitle?: string;
  avatar?: { text?: string; src?: string; icon?: string };
  badge?: SdBadgeData;
  /** At most 3; rendered only at size `md`. */
  meta?: readonly { label: string; value: string }[];
}

/** File tile: thumbnail or type icon, name, type and size. */
export interface SdCardFileData {
  name: string;
  /** MIME type or extension; inferred from the extension of `name` when absent. */
  type?: string;
  /** Bytes. */
  size?: number;
  thumbnail?: string;
}

/** Navigation tile: icon, label and optional description. */
export interface SdCardShortcutData {
  label: string;
  icon: string;
  description?: string;
}
