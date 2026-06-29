import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, input, contentChild, computed } from '@angular/core';
import { SdHrefDirective } from '@sdcorejs/angular/directives';
import { SdViewPipe } from '@sdcorejs/angular/pipes';

/**
 * `<sd-view>` — pure read-only display of a value (text, hyperlink, or a custom template).
 *
 * Presentational proxy with no state of its own: the parent form control (`<sd-select>`,
 * `<sd-input>`, …) computes the display string + resolved selection and passes them in;
 * `<sd-view>` only decides WHICH template renders. It is the single rendering path for every
 * "viewed" state across the form controls (DETAIL `viewed=true` and the `viewed='inline'`
 * text face), so a custom `valueTemplate` (e.g. `sdViewDef` / `#sdValue`) looks identical in
 * both. OnPush — re-renders only when an input signal changes.
 */
@Component({
  selector: 'sd-view',
  standalone: true,
  imports: [SdViewPipe, SdHrefDirective, NgTemplateOutlet],
  templateUrl: './view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdView {
  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================

  /** Optional label rendered above the value (omitted when a parent supplies its own label). */
  label = input<string | null | undefined>();

  /** Raw selected value — NOT rendered directly; only exposed in the `valueTemplate` context as `value`. */

  value = input<any>();

  /**
   * Display string — what shows when no custom value template is bound.
   * why: `input.required()` forces the parent to bind `[display]` (compile error otherwise),
   * so the component never has to guess a fallback string from `value`.
   */
  display = input.required<unknown>();

  /** When set, the value renders as a link (`<a [sdHref]>`) instead of plain text. */
  hyperlink = input<string | null | undefined>();

  /** Label template handed down by a parent control (wins over `label` + `#sdLabel`). */

  labelTemplate = input<TemplateRef<any> | undefined>();

  /** Value template handed down by a parent control (wins over `display` + `#sdValue`). */

  valueTemplate = input<TemplateRef<any> | undefined>();

  /**
   * Resolved selected-item objects passed by the parent (e.g. `<sd-select>`).
   * why: the parent owns option/lazy resolution — `<sd-view>` is a proxy and must NOT rebuild
   * the list. Exposed in the value-template context so a "head +N" template can read `displayField`.
   */

  selectedItems = input<any[] | undefined>();

  // ==========================================
  // 2. SIGNAL QUERIES (replace @ContentChild)
  // ==========================================

  /** `#sdLabel` template projected directly into `<sd-view>` (fallback when no `[labelTemplate]`). */

  contentLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');

  /** `#sdValue` template projected directly into `<sd-view>` (fallback when no `[valueTemplate]`). */

  contentValueTemplate = contentChild<TemplateRef<any>>('sdValue');

  // ==========================================
  // 3. COMPUTED SIGNALS (replace getters)
  // ==========================================

  /**
   * Effective label template: input from parent wins, else the projected `#sdLabel`.
   * why: `computed` caches the choice so the template's `@if (activeLabelTemplate())` doesn't
   * re-evaluate two content-child reads on every change-detection pass.
   */
  activeLabelTemplate = computed(() => this.labelTemplate() ?? this.contentLabelTemplate());

  /** Effective value template: input from parent wins, else the projected `#sdValue`. Cached for the same reason. */
  activeValueTemplate = computed(() => this.valueTemplate() ?? this.contentValueTemplate());
}
