import { booleanAttribute, computed, Signal } from '@angular/core';

/**
 * Three display states shared by sd-form-controls:
 * - `false`  → full edit chrome (input / dropdown).
 * - `true`   → static read-only view (`<sd-view>` text), no editor.
 * - `'inline'` → the editor is STILL rendered (so its panel works), but its chrome is
 *   hidden; the `<sd-view>` text is the visible face / trigger. Click the text to open
 *   the picker's panel. The text is retained while the panel is open — it only changes
 *   when a new value is committed (JIRA-style click-to-edit).
 */
export type SdViewed = boolean | 'inline';
export type SdViewedInput = SdViewed | '' | null | undefined;

/**
 * `viewed` input transform. Keeps `booleanAttribute` coercion so a bare attribute
 * (`<sd-select viewed>`) still resolves to `true`, but intercepts the literal
 * `'inline'` first — `booleanAttribute('inline')` would otherwise coerce it to `true`.
 */
export function sdViewedTransform(v: SdViewedInput): SdViewed {
  return v === 'inline' ? 'inline' : booleanAttribute(v);
}

export interface SdViewedInlineApi {
  /** `viewed() === 'inline'` — editor rendered but chrome hidden; sd-view text is the trigger face. */
  readonly isInline: Signal<boolean>;
  /** `viewed() === true` — static read-only view (no editor rendered). */
  readonly isViewed: Signal<boolean>;
  /** Open the picker from the inline text face. No-op unless `'inline'`. */
  enterInlineEdit(): void;
}

/**
 * Compose the tri-state `viewed` semantics into a control. `open` opens the control's
 * native picker (mat-select panel / mat-calendar / overlay). In `'inline'` mode the editor
 * is always rendered (chrome hidden via CSS), so `open()` can fire immediately on click —
 * no render-swap, the view text never disappears.
 *
 * @param viewed   the control's `viewed` input signal.
 * @param open     opens the control's picker; called by `enterInlineEdit`.
 * @param disabled the control's disabled state. why: a disabled `'inline'` field must behave
 *   like `viewed=true` (static, NOT click-to-edit) — you can't edit a disabled control.
 */
export function sdViewedInline(viewed: Signal<SdViewed>, open?: () => void, disabled?: Signal<boolean>): SdViewedInlineApi {
  // why: disabled biến 'inline' thành static view (isInline=false, isViewed=true) — không cho sửa.
  const isInline = computed(() => viewed() === 'inline' && !disabled?.());
  const isViewed = computed(() => viewed() === true || (viewed() === 'inline' && !!disabled?.()));
  const enterInlineEdit = (): void => {
    if (isInline()) open?.();
  };
  return { isInline, isViewed, enterInlineEdit };
}
