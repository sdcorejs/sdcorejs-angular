import { inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OPERATORS } from '@sdcorejs/utils/constants';
import { Operator } from '@sdcorejs/utils/models';
import { I18nService } from '@sdcorejs/angular/i18n';

/** Inner SVG markup (hình phễu) dùng khi chưa chọn operator. */
export const ɵSD_OPERATOR_FALLBACK_ICON = '<path d="M4 5h16l-6.5 7.5V19l-3 2v-8.5z"/>';

/** Cỡ và độ dày nét của một glyph operator (handoff sd-operator mục 3.1 và 4). */
export interface ɵSdOperatorGlyph {
  readonly size: number;
  readonly stroke: number;
}

/** Glyph theo cỡ trigger: nét dày dần khi glyph nhỏ lại để vẫn đọc được (C7). Hàng menu dùng cỡ `md`. */
export const ɵSD_OPERATOR_GLYPHS = {
  xs: { size: 14, stroke: 2.5 },
  sm: { size: 16, stroke: 2.25 },
  md: { size: 18, stroke: 2.1 },
} as const satisfies Record<string, ɵSdOperatorGlyph>;

// Họ operator (B2): menu chèn đường chia khi hai mục liền nhau khác họ. Nội bộ, không export, không thêm vào utils.
const FAMILIES: Readonly<Record<Operator, string>> = {
  EQUAL: 'compare',
  NOT_EQUAL: 'compare',
  GREATER_THAN: 'compare',
  LESS_THAN: 'compare',
  GREATER_OR_EQUAL: 'compare',
  LESS_OR_EQUAL: 'compare',
  CONTAIN: 'text',
  NOT_CONTAIN: 'text',
  START_WITH: 'text',
  NOT_START_WITH: 'text',
  END_WITH: 'text',
  NOT_END_WITH: 'text',
  IN: 'list',
  NOT_IN: 'list',
  BETWEEN: 'range',
  NULL: 'empty',
  NOT_NULL: 'empty',
};

// Danh sách tới 4 mục thì không chia họ.
const SEPARATE_ABOVE = 4;

export interface ɵSdOperatorItem {
  value: Operator;
  icon: SafeHtml;
  display: string;
  /** Mục mở đầu một họ khác mục trước: menu vẽ đường chia phía trên. */
  separated: boolean;
}

/** Icon, nhãn đã dịch và danh sách item của các operator — dùng chung cho `sd-operator` và chip operator. */
export interface ɵSdOperatorResolver {
  /**
   * Operator cho phép → item theo đúng thứ tự truyền vào (không sắp xếp lại); operator không có trong `OPERATORS` bị
   * bỏ. Icon ở cỡ hàng menu.
   */
  items(operators: readonly Operator[]): ɵSdOperatorItem[];
  /** Icon SVG của operator ở `glyph` (mặc định cỡ `md`), hoặc hình phễu khi chưa chọn / không tìm thấy. */
  icon(value: Operator | undefined, glyph?: ɵSdOperatorGlyph): SafeHtml;
  /** Nhãn đã dịch, '' khi chưa chọn / không tìm thấy. */
  label(value: Operator | undefined): string;
}

/**
 * Tạo resolver cho bảng `OPERATORS` dùng chung. Gọi trong injection context.
 *
 * Nội bộ (`ɵ`): không nằm trong SemVer, ứng dụng không dùng trực tiếp.
 */
export function ɵsdOperatorResolver(): ɵSdOperatorResolver {
  const i18n = inject(I18nService);
  const sanitizer = inject(DomSanitizer);

  // why: OPERATORS[].display là i18n KEY ('core.operator.*.display'), KHÔNG phải text — phải dịch qua
  // I18nService, nếu không UI hiện key thô (code) thay vì nhãn đã dịch.
  const resolve = (value: Operator | undefined): { icon: string; display: string } | undefined => {
    if (value == null) return undefined;
    const entry = OPERATORS.find(o => o.value === value);
    return entry ? { icon: entry.icon, display: i18n.t(entry.display) } : undefined;
  };

  // why: OPERATORS.icon là inner SVG (path/line/rect). Bọc <svg> + bypass sanitizer (nguồn là hằng số nội
  // bộ, không phải input người dùng) để Angular không strip svg con. Cỡ và nét theo nơi dùng; glyph luôn ẩn khỏi
  // trình đọc màn hình vì tên nằm ở nút / hàng chứa nó.
  const svg = (inner: string, { size, stroke }: ɵSdOperatorGlyph): SafeHtml =>
    sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`
    );

  return {
    items: operators => {
      const out: ɵSdOperatorItem[] = [];
      for (const value of operators) {
        const resolved = resolve(value);
        if (resolved) out.push({ value, icon: svg(resolved.icon, ɵSD_OPERATOR_GLYPHS.md), display: resolved.display, separated: false });
      }
      if (out.length > SEPARATE_ABOVE) {
        for (let index = 1; index < out.length; index++)
          out[index].separated = FAMILIES[out[index].value] !== FAMILIES[out[index - 1].value];
      }
      return out;
    },
    icon: (value, glyph = ɵSD_OPERATOR_GLYPHS.md) => svg(resolve(value)?.icon ?? ɵSD_OPERATOR_FALLBACK_ICON, glyph),
    label: value => resolve(value)?.display ?? '',
  };
}
