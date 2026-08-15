import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DateUtilities, NumberUtilities } from '@sdcorejs/utils/fns';
import { SdImportExcelItem, SdUploadExcelColumn } from '../import-excel.model';

@Pipe({
  name: 'columnTransform',
  standalone: true,
})
export class ColumnTransformPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  // Chuyển thành async để hỗ trợ Promise từ bên ngoài
  async transform(item: SdImportExcelItem, column: SdUploadExcelColumn): Promise<string | SafeHtml> {
    const { type, transform, field } = column;
    const value = item.data[field];

    // 1. Ưu tiên hiển thị dữ liệu gốc nếu có lỗi
    if (item.meta.error[field]) {
      return item.meta.origin[field] ?? value ?? '';
    }

    // 2. Custom Transform (Hỗ trợ cả Sync và Async)
    if (transform) {
      // await sẽ hoạt động đúng dù transform trả về value thường hay Promise
      const result = await transform(item.data, value);
      return result ?? '';
    }

    // 3. Xử lý logic hiển thị
    switch (type) {
      case 'number':
        return NumberUtilities.toVN(value) ?? '';

      case 'bool':
        if (typeof value === 'boolean') {
          const html = `<div class="text-center"><input type="checkbox" ${value ? 'checked' : ''} disabled></div>`;
          // Bắt buộc bypass security để hiển thị được input checkbox
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
