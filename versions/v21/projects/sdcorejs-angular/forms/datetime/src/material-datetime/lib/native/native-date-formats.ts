import { SdDateFormats } from '../core/date-formats';

// Native adapter uses Intl-format objects, not pattern strings. We mirror Material's
// MAT_NATIVE_DATE_FORMATS shape for date-only entries and pass through datetimeInput
// as a sentinel; the adapter's `format()` override (if any) interprets it.
export const SD_NATIVE_DATE_FORMATS: SdDateFormats = {
  parse: {
    dateInput: 'shortDate',
    datetimeInput: 'short',
    timeInput: 'shortTime',
  },
  display: {
    dateInput: 'shortDate',
    datetimeInput: 'short',
    timeInput: 'shortTime',
    monthYearLabel: { year: 'numeric', month: 'short' } as unknown as string,
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' } as unknown as string,
    monthYearA11yLabel: { year: 'numeric', month: 'long' } as unknown as string,
    popupHeaderDateLabel: { weekday: 'short', month: 'short', day: 'numeric' } as unknown as string,
  },
};
