/** Mức bố cục của form, chọn theo bề rộng FORM (không phải màn hình). */
export type SdFormGenericBreakpoint = 'mobile' | 'tablet' | 'desktop';

/** Ngưỡng (px, bề rộng form) bắt đầu mức tablet và desktop. */
export interface SdFormGenericBreakpoints {
  tablet: number;
  desktop: number;
}

/**
 * Ngưỡng mặc định: < 600px là mobile, 600–1023px là tablet, từ 1024px là desktop.
 * Portal ghi đè từng phần qua `provideSdFormGeneric({ breakpoints })`.
 */
export const SD_FORM_GENERIC_BREAKPOINTS = Object.freeze({ tablet: 600, desktop: 1024 } as const);
