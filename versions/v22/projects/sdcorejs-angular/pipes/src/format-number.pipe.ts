import { inject, Injectable, Pipe, PipeTransform } from '@angular/core';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { NumberUtilities } from '@sdcorejs/utils/fns';
@Pipe({
  name: 'sdFormatNumber',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class SdFormatNumberPipe implements PipeTransform {
  private readonly coreConfiguration: ISdCoreConfiguration | null = inject(SD_CORE_CONFIGURATION, { optional: true });

  transform(value: any, digits?: number, format?: '1,234,567.89' | '1.234.567,89') {
    const resolvedFormat = format ?? this.coreConfiguration?.format?.number;
    const fixedValue = NumberUtilities.isNumber(value) ? (+value).toFixed(digits ?? 2) : null;
    if (resolvedFormat === '1.234.567,89') {
      return NumberUtilities.toVN(fixedValue);
    }
    return NumberUtilities.toISO(fixedValue);
  }
}
