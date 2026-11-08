import type { SdCardStatData } from './card.model';

type SdCardNumberFormat = 'number' | 'compact' | 'percent';

/** Locale context for card number formatting. */
export interface SdCardFormatContext {
  readonly locale: string;
  readonly compactDisplay?: 'short' | 'long';
}

/** Placeholder for a missing or failed value. */
export const SD_CARD_EMPTY_VALUE = '—';

/** Formats `value` for display using one of the stat number formats (`card.md` §5). */
export function sdCardFormatNumber(
  value: number,
  format: SdCardNumberFormat,
  precision: number | undefined,
  context: SdCardFormatContext
): string {
  const digits = precision ?? 0;
  switch (format) {
    case 'compact':
      return new Intl.NumberFormat(context.locale, {
        notation: 'compact',
        compactDisplay: context.compactDisplay ?? (context.locale.toLowerCase().startsWith('vi') ? 'long' : 'short'),
        maximumSignificantDigits: 3,
      }).format(value);
    case 'percent':
      return new Intl.NumberFormat(context.locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
    default:
      return new Intl.NumberFormat(context.locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  }
}

/**
 * Unabridged number for `title` and the accessible name: plain grouping, never compact. Percent keeps the percent
 * style, since a ratio such as 0.427 reads wrong as a plain number.
 */
export function sdCardFormatFull(
  value: number,
  format: SdCardNumberFormat,
  precision: number | undefined,
  context: SdCardFormatContext
): string {
  if (format === 'percent') {
    return new Intl.NumberFormat(context.locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 4 }).format(value);
  }
  const digits = precision ?? 0;
  return new Intl.NumberFormat(context.locale, { minimumFractionDigits: digits, maximumFractionDigits: Math.max(digits, 3) }).format(value);
}

/** Display state of a stat value. */
export interface SdCardStatValue {
  /** Text shown in the card. */
  readonly display: string;
  /** Unabridged text for `title` and the accessible name. */
  readonly full: string;
  /** A string value arrived with a numeric format and is shown as is. */
  readonly mismatch: boolean;
}

/** Resolves what a stat shows for its value. */
export function sdCardStatValue(data: SdCardStatData, context: SdCardFormatContext): SdCardStatValue {
  const { value } = data;
  const format = data.format ?? 'number';
  if (value === null || value === undefined) return { display: SD_CARD_EMPTY_VALUE, full: SD_CARD_EMPTY_VALUE, mismatch: false };
  if (typeof value === 'string') return { display: value, full: value, mismatch: format !== 'text' };
  if (format === 'text') return { display: String(value), full: String(value), mismatch: false };
  return {
    display: sdCardFormatNumber(value, format, data.precision, context),
    full: sdCardFormatFull(value, format, data.precision, context),
    mismatch: false,
  };
}

/** Direction and tone of a stat delta chip. */
export interface SdCardStatDelta {
  readonly tone: 'good' | 'bad' | 'flat';
  readonly direction: 'up' | 'down' | 'flat';
  /** Absolute delta in the stat's format; empty for `flat`. */
  readonly display: string;
}

/** Resolves the delta chip: good is up for `positive: 'up'` (default) and down for `positive: 'down'`. */
export function sdCardStatDelta(data: SdCardStatData, context: SdCardFormatContext): SdCardStatDelta | null {
  const delta = data.delta;
  if (!delta) return null;
  if (delta.value === 0) return { tone: 'flat', direction: 'flat', display: '' };
  const direction = delta.value > 0 ? 'up' : 'down';
  const good = direction === (delta.positive ?? 'up');
  const format = data.format === 'compact' || data.format === 'percent' ? data.format : 'number';
  return { tone: good ? 'good' : 'bad', direction, display: sdCardFormatNumber(Math.abs(delta.value), format, data.precision, context) };
}
