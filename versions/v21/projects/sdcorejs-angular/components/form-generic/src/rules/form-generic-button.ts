import type { Color } from '@sdcorejs/utils/models';
import type { SdFormGenericButton, SdFormGenericButtonAlign, SdFormGenericButtonVariant } from '../models/form-generic-element.model';
import { sdNonFieldIssues } from '../models/form-generic-schema';

// why: one mapping from a schema button to sd-button inputs and to the action it runs — the renderer and the
// builder canvas show the same button, and the action pipeline reads the same intent.

/** Input của `sd-button` cho một button của schema. */
export interface SdFormGenericButtonAppearance {
  type: SdFormGenericButtonVariant;
  color: Color;
  align: SdFormGenericButtonAlign;
  /** `align: 'stretch'` — chiếm hết ô. */
  block: boolean;
  prefixIcon: string | null;
}

/** Action mà button chạy: tên được phát và có chạy `validate()` trước hay không. */
export interface SdFormGenericButtonIntent {
  kind: 'submit' | 'reset' | 'custom';
  action: string;
  validates: boolean;
}

const VARIANTS: ReadonlySet<string> = new Set(['fill', 'light', 'outline', 'text']);
const ALIGNS: ReadonlySet<string> = new Set(['start', 'center', 'end', 'stretch']);

/** Mặc định: submit fill / primary, reset và custom light / secondary; căn trái. */
export const sdButtonAppearance = (button: SdFormGenericButton): SdFormGenericButtonAppearance => {
  const submit = button.action === 'submit';
  const align = ALIGNS.has(button.align as string) ? (button.align as SdFormGenericButtonAlign) : 'start';
  const icon = typeof button.icon === 'string' ? button.icon.trim() : '';
  return {
    type: VARIANTS.has(button.variant as string) ? (button.variant as SdFormGenericButtonVariant) : submit ? 'fill' : 'light',
    color: button.color || (submit ? 'primary' : 'secondary'),
    align,
    block: align === 'stretch',
    prefixIcon: icon || null,
  };
};

/** Intent của button, hoặc `null` khi button sai ngữ pháp (renderer không render nó). */
export const sdButtonIntent = (button: SdFormGenericButton): SdFormGenericButtonIntent | null => {
  if (sdNonFieldIssues(button).length) return null;
  if (button.action === 'submit') return { kind: 'submit', action: 'submit', validates: true };
  if (button.action === 'reset') return { kind: 'reset', action: 'reset', validates: false };
  return { kind: 'custom', action: (button.name as string).trim(), validates: button.validate === true };
};
