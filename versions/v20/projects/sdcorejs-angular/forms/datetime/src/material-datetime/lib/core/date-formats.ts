import { InjectionToken } from '@angular/core';

export interface SdDateFormats {
  parse: {
    dateInput: string;
    datetimeInput: string;
    timeInput: string;
  };
  display: {
    dateInput: string;
    datetimeInput: string;
    timeInput: string;
    monthYearLabel: string;
    dateA11yLabel: string;
    monthYearA11yLabel: string;
    popupHeaderDateLabel: string;
  };
}

export const SD_DATE_FORMATS = new InjectionToken<SdDateFormats>('sd-date-formats');
