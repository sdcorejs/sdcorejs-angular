/**
 * Danh sách token màu public của Core UI (không kèm tiền tố `--sd-`): palette gốc của 2.15, ramp 50–950 và
 * các vai trò semantic. `scripts/theme-token-list.test.mjs` giữ danh sách này khớp với output của `sd.theme()`.
 *
 * Token component (`--sd-{component}-{role}`) và thang space/radius/typography… không nằm ở đây: chúng là hook
 * tuỳ biến, không phải màu nền tảng để app tự dùng.
 */
export const SD_COLOR_TOKENS = [
  // Primitive palette (2.15)
  'primary',
  'primary-light',
  'primary-dark',
  'primary-contrast',
  'secondary',
  'secondary-light',
  'secondary-dark',
  'secondary-contrast',
  'info',
  'info-light',
  'info-dark',
  'info-contrast',
  'success',
  'success-light',
  'success-dark',
  'success-contrast',
  'warning',
  'warning-light',
  'warning-dark',
  'warning-contrast',
  'error',
  'error-light',
  'error-dark',
  'error-contrast',
  'surface',
  'surface-muted',
  'text',
  'text-secondary',
  'text-muted',
  'border',
  'border-strong',
  'disabled-bg',
  'disabled-text',
  // Ramps 50–950
  'primary-50',
  'primary-100',
  'primary-200',
  'primary-300',
  'primary-400',
  'primary-500',
  'primary-600',
  'primary-700',
  'primary-800',
  'primary-900',
  'primary-950',
  'secondary-50',
  'secondary-100',
  'secondary-200',
  'secondary-300',
  'secondary-400',
  'secondary-500',
  'secondary-600',
  'secondary-700',
  'secondary-800',
  'secondary-900',
  'secondary-950',
  'info-50',
  'info-100',
  'info-200',
  'info-300',
  'info-400',
  'info-500',
  'info-600',
  'info-700',
  'info-800',
  'info-900',
  'info-950',
  'success-50',
  'success-100',
  'success-200',
  'success-300',
  'success-400',
  'success-500',
  'success-600',
  'success-700',
  'success-800',
  'success-900',
  'success-950',
  'warning-50',
  'warning-100',
  'warning-200',
  'warning-300',
  'warning-400',
  'warning-500',
  'warning-600',
  'warning-700',
  'warning-800',
  'warning-900',
  'warning-950',
  'error-50',
  'error-100',
  'error-200',
  'error-300',
  'error-400',
  'error-500',
  'error-600',
  'error-700',
  'error-800',
  'error-900',
  'error-950',
  'neutral-50',
  'neutral-100',
  'neutral-200',
  'neutral-300',
  'neutral-400',
  'neutral-500',
  'neutral-600',
  'neutral-700',
  'neutral-800',
  'neutral-900',
  'neutral-950',
  // Semantic roles
  'status-info-bg',
  'status-info-fg',
  'status-success-bg',
  'status-success-fg',
  'status-warning-bg',
  'status-warning-fg',
  'status-error-bg',
  'status-error-fg',
  'link',
  'surface-inverse',
  'text-on-solid',
  'border-focus',
  'border-danger',
  'overlay-backdrop',
  'focus-ring-color',
] as const;

/** Tên một token màu public của Core UI, ví dụ `'primary'`, `'primary-600'`, `'status-error-fg'`. */
export type SdColorToken = (typeof SD_COLOR_TOKENS)[number];

/**
 * Đọc giá trị của các token màu từ computed style của `element` (mặc định `<html>`).
 *
 * - Giá trị là text của custom property sau khi trình duyệt đã thay mọi `var()` — ví dụ `'#005cbb'`, hoặc
 *   `'color-mix(in srgb, #005cbb 14%, white)'` với token dẫn xuất (gán cho một thuộc tính màu để có màu cụ thể).
 * - Chỉ trả những token đang có giá trị trên phần tử đó (theme chưa được include thì thiếu).
 * - Không có `document` / `window` (SSR), hoặc phần tử thuộc một document không hiển thị: trả `{}`.
 *
 * @example readSdTokens()['primary'] // '#005cbb'
 * @example readSdTokens(dialogEl, ['surface', 'text']) // giá trị trong scope của dialog (vd scope dark)
 */
export function readSdTokens(
  element?: Element | null,
  tokens: readonly SdColorToken[] = SD_COLOR_TOKENS
): Partial<Record<SdColorToken, string>> {
  const target = element ?? (typeof document === 'undefined' ? null : document.documentElement);
  const view = target?.ownerDocument?.defaultView;
  if (!target || !view) return {};
  const style = view.getComputedStyle(target);
  const result: Partial<Record<SdColorToken, string>> = {};
  for (const token of tokens) {
    const value = style.getPropertyValue(`--sd-${token}`).trim();
    if (value) result[token] = value;
  }
  return result;
}
