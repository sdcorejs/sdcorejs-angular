import { inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OPERATORS } from '@sdcorejs/utils/constants';
import { Operator } from '@sdcorejs/utils/models';
import { I18nService } from '@sdcorejs/angular/i18n';

/** Inner SVG markup (hình phễu) dùng khi chưa chọn operator. */
export const ɵSD_OPERATOR_FALLBACK_ICON = '<path d="M4 5h16l-6.5 7.5V19l-3 2v-8.5z"/>';

export interface ɵSdOperatorItem {
  value: Operator;
  icon: SafeHtml;
  display: string;
}

/** Icon, nhãn đã dịch và danh sách item của các operator — dùng chung cho `sd-operator` và chip operator. */
export interface ɵSdOperatorResolver {
  /** Operator cho phép → item theo đúng thứ tự truyền vào; operator không có trong `OPERATORS` bị bỏ. */
  items(operators: readonly Operator[]): ɵSdOperatorItem[];
  /** Icon SVG của operator, hoặc hình phễu khi chưa chọn / không tìm thấy. */
  icon(value: Operator | undefined): SafeHtml;
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
  // bộ, không phải input người dùng) để Angular không strip svg con. Kích thước do CSS nơi dùng quyết định.
  const svg = (inner: string): SafeHtml =>
    sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
    );

  return {
    items: operators => {
      const out: ɵSdOperatorItem[] = [];
      for (const value of operators) {
        const resolved = resolve(value);
        if (resolved) out.push({ value, icon: svg(resolved.icon), display: resolved.display });
      }
      return out;
    },
    icon: value => svg(resolve(value)?.icon ?? ɵSD_OPERATOR_FALLBACK_ICON),
    label: value => resolve(value)?.display ?? '',
  };
}
