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
  transform(value: any, digits?: number) {
    const fixedValue = NumberUtilities.isNumber(value) ? (+value).toFixed(digits ?? 2) : null;
    // Náº¿u format VN thÃ¬ dÃ¹ng Ä‘á»‹nh dáº¡ng VN
    if(this.coreConfiguration?.format?.number === '1.234.567,89') {
      return NumberUtilities.toVN(fixedValue);
    }
    // NgÆ°á»£c láº¡i dÃ¹ng Ä‘á»‹nh dáº¡ng ISO
      return NumberUtilities.toISO(fixedValue);
  }
}

