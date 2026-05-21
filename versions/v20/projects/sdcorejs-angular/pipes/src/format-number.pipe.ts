import { Inject, Injectable, Optional, Pipe, PipeTransform } from '@angular/core';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { NumberUtilities } from '@sdcorejs/angular/utilities/extensions';
@Pipe({
  name: 'sdFormatNumber',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class SdFormatNumberPipe implements PipeTransform {
  constructor(@Inject(SD_CORE_CONFIGURATION) @Optional() private readonly coreConfiguration: ISdCoreConfiguration | undefined) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(value: any, digits?: number, format?: '1,234,567.89' | '1.234.567,89') {
    const resolvedFormat = format ?? this.coreConfiguration?.format?.number;
    const fixedValue = NumberUtilities.isNumber(value) ? (+value).toFixed(digits ?? 2) : null;
    if (resolvedFormat === '1.234.567,89') {
      return NumberUtilities.toVN(fixedValue);
    }
    return NumberUtilities.toISO(fixedValue);
  }
}

