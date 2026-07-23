import { sdParseTime } from './time-value';

export interface SdTimePickerAdapter<TPickerValue> {
  toPickerValue(value: string | null | undefined): TPickerValue;
  fromPickerValue(value: TPickerValue): string | null;
}

/**
 * Bridges the public time-only string contract to Date-based picker controls.
 * The fixed date never escapes this adapter, so timezone/calendar data cannot
 * leak into the model.
 */
export class SdDateTimePickerAdapter implements SdTimePickerAdapter<Date> {
  toPickerValue(value: string | null | undefined): Date {
    const parsed = sdParseTime(value) ?? { hour: 0, minute: 0 };
    return new Date(2000, 0, 1, parsed.hour, parsed.minute, 0, 0);
  }

  fromPickerValue(value: Date): string | null {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }
}
