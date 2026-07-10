import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Platform } from '@angular/cdk/platform';
import { SdDateAdapter } from '../core/date-adapter';
import { SdDateFormats, SD_DATE_FORMATS } from '../core/date-formats';
import { SdNativeDateAdapter } from './native-date-adapter';
import { SD_NATIVE_DATE_FORMATS } from './native-date-formats';

export function provideSdNativeDateAdapter(
  formats: SdDateFormats = SD_NATIVE_DATE_FORMATS,
): EnvironmentProviders {
  const providers: Provider[] = [
    Platform,
    SdNativeDateAdapter,
    { provide: DateAdapter, useExisting: SdNativeDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
    { provide: SdDateAdapter, useExisting: SdNativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: formats },
    { provide: SD_DATE_FORMATS, useValue: formats },
  ];
  return makeEnvironmentProviders(providers);
}
