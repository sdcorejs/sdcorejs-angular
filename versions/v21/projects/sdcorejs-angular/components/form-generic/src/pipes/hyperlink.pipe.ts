import { Pipe, PipeTransform } from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';

/** `${key}` / `${a.b}` như `StringUtilities.templateToDisplay`. */
const TEMPLATE_TOKEN = /\$\{([A-Za-z0-9._-]*)\}/g;

/** `encodeURIComponent` không ném lỗi: surrogate UTF-16 lẻ (dữ liệu bị cắt) được thay bằng U+FFFD. */
const encode = (text: string): string => {
  try {
    return encodeURIComponent(text);
  } catch {
    return encodeURIComponent(text.replace(/[\uD800-\uDFFF]/g, '�'));
  }
};

/**
 * Link ở chế độ chỉ xem: thay `${key}` bằng giá trị trong scope (value + biến).
 *
 * why: giá trị là dữ liệu người dùng nhập — mã hoá (`encodeURIComponent`) để nó không đổi được đường
 * dẫn/query của link (`../`, `?`, `#`) hay biến một template bắt đầu bằng `${x}` thành link ngoài.
 */
@Pipe({
  name: 'hyperlink',
  standalone: true,
})
export class HyperlinkPipe implements PipeTransform {
  transform(hyperlink: string | null | undefined, scope: Readonly<Record<string, unknown>>): string {
    if (!hyperlink) return '';
    return hyperlink.replace(TEMPLATE_TOKEN, (token, key: string) =>
      key ? encode(String(Utilities.getNestedValue(scope, key) ?? '')) : token
    );
  }
}
