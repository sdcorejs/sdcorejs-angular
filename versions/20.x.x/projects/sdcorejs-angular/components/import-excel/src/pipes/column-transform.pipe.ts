import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DateUtilities, NumberUtilities } from '@sdcorejs/angular/utilities';
import { SdImportExcelItem, SdUploadExcelColumn } from '../import-excel.model';

@Pipe({
  name: 'columnTransform',
  standalone: true,
})
export class ColumnTransformPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  // Chuyá»ƒn thÃ nh async Ä‘á»ƒ há»— trá»£ Promise tá»« bÃªn ngoÃ i
  async transform(item: SdImportExcelItem, column: SdUploadExcelColumn): Promise<string | SafeHtml> {
    const { type, transform, field } = column;
    const value = item.data[field];

    // 1. Æ¯u tiÃªn hiá»ƒn thá»‹ dá»¯ liá»‡u gá»‘c náº¿u cÃ³ lá»—i
    if (item.meta.error[field]) {
      return item.meta.origin[field] ?? value ?? '';
    }

    // 2. Custom Transform (Há»— trá»£ cáº£ Sync vÃ  Async)
    if (transform) {
      // await sáº½ hoáº¡t Ä‘á»™ng Ä‘Ãºng dÃ¹ transform tráº£ vá» value thÆ°á»ng hay Promise
      const result = await transform(item.data, value);
      return result ?? '';
    }

    // 3. Xá»­ lÃ½ logic hiá»ƒn thá»‹
    switch (type) {
      case 'number':
        return NumberUtilities.toVN(value) ?? '';

      case 'bool':
        if (typeof value === 'boolean') {
          const html = `<div class="text-center"><input type="checkbox" ${value ? 'checked' : ''} disabled></div>`;
          // Báº¯t buá»™c bypass security Ä‘á»ƒ hiá»ƒn thá»‹ Ä‘Æ°á»£c input checkbox
          return this.sanitizer.bypassSecurityTrustHtml(html);
        }
        return '';

      case 'date':
        return DateUtilities.toFormat(value, column.format || 'dd/MM/yyyy') ?? '';

      case 'datetime':
        return DateUtilities.toFormat(value, column.format || 'dd/MM/yyyy HH:mm') ?? '';

      default:
        return value ?? '';
    }
  }
}
