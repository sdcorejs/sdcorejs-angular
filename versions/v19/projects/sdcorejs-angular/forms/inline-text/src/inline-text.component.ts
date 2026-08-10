import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SdFormControl } from '@sdcorejs/angular/forms/models';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/** Visual / `data-state` of the inline input. `'auto'` derives from focus + value. */
export type SdInlineTextState = 'auto' | 'pending' | 'active' | 'focus' | 'error';
/** `'standalone'` draws its own affordance (hover bg + focus ring); `'seamless'` defers all chrome to the host. */
export type SdInlineTextChrome = 'standalone' | 'seamless';

/**
 * Borderless, content-hugging text input — the seamless primitive shared by
 * `sd-input` / `sd-input-number` (`viewed='inline'`) and the query-bar / query-builder chips.
 *
 * why: a native `<input>` inside `mat-form-field` cannot hug its content, so inline-edit
 * looked like a full-width input rather than text. This primitive renders a raw `<input>`
 * sized via the native `size` attribute (clamped) so the click/hover target tracks the value.
 *
 * It is intentionally unopinionated about commit/parse/format: it forwards the raw DOM events
 * (focus / blur / keydown / paste / composition / Enter / Escape) so each consumer keeps its own
 * logic (e.g. sd-input-number's vi-VN formatting). Two binding modes:
 *  - **uncontrolled** via `[(value)]` — used by the chips' signal drafts;
 *  - **controlled** via `[control]` (an external `SdFormControl`) — used by the form controls.
 */
@Component({
  selector: 'sd-inline-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, CommonModule, ReactiveFormsModule],
  templateUrl: './inline-text.component.html',
  styleUrl: './inline-text.component.scss',
  host: {
    class: 'sd-inline-text',
    '[class.sd-inline-text--standalone]': "chrome() === 'standalone'",
    '[class.sd-inline-text--seamless]': "chrome() === 'seamless'",
    '[attr.data-state]': 'effectiveState()',
  },
})
export class SdInlineText {
  /** Uncontrolled value (two-way). Ignored when `[control]` is provided. */
  readonly value = model<string>('');
  /** Optional external FormControl (controlled mode) — used by sd-input / sd-input-number. */
  readonly control = input<SdFormControl | undefined>(undefined);
  readonly placeholder = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Show a hover/value-gated clear-× (default `true`). */
  readonly clearable = input(true, { transform: booleanAttribute });
  /** `'auto'` derives state from focus + value; pass an explicit value (e.g. `'error'`) to override. */
  readonly state = input<SdInlineTextState>('auto');
  readonly chrome = input<SdInlineTextChrome>('standalone');
  readonly autoId = input<string | undefined>(undefined);
  readonly autofocus = input(false, { transform: booleanAttribute });
  /** Lower bound (chars) so short/empty values keep a clickable target. */
  readonly minSize = input(2);

  readonly sdCleared = output<void>();
  readonly sdKeyupEnter = output<void>();
  readonly sdKeydownEscape = output<void>();
  readonly sdFocus = output<FocusEvent>();
  readonly sdBlur = output<FocusEvent>();
  readonly sdKeydown = output<KeyboardEvent>();
  readonly sdPaste = output<ClipboardEvent>();
  readonly sdCompositionStart = output<CompositionEvent>();
  readonly sdCompositionEnd = output<CompositionEvent>();

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  /** Bumped on input/blur/composition + bound-control changes so size/state methods re-eval under OnPush. */
  protected readonly tick = signal(0);
  protected readonly focused = signal(false);

  constructor() {
    // why: a bound control's value can change programmatically (sd-input-number reformats
    // on blur) without a DOM input event — subscribe so the size/state still refresh.
    effect(onCleanup => {
      const c = this.control();
      if (!c) return;
      const sub = c.valueChanges.subscribe(() => this.tick.update(n => n + 1));
      onCleanup(() => sub.unsubscribe());
    });

    afterNextRender(() => {
      if (this.autofocus()) this.focus();
    });
  }

  /**
   * Current text — from the bound control in controlled mode, else the value model.
   * why: `tick` is a tracked dependency so the computed re-runs when a bound control's
   * value changes programmatically (control.value itself is not a signal).
   */
  protected readonly currentText = computed<string>(() => {
    this.tick();
    const c = this.control();
    const raw = c ? c.value : this.value();
    return raw == null ? '' : String(raw);
  });

  protected readonly hasValue = computed(() => this.currentText().length > 0);

  protected readonly sizeOf = computed(() => {
    const text = this.currentText();
    const base = text.length > 0 ? text.length : this.placeholder().length;
    return Math.max(this.minSize(), base);
  });

  protected readonly showClear = computed(() => this.clearable() && this.hasValue() && !this.disabled());

  protected readonly effectiveState = computed<SdInlineTextState>(() => {
    const s = this.state();
    if (s !== 'auto') return s;
    if (this.focused()) return 'focus';
    return this.hasValue() ? 'active' : 'pending';
  });

  // ── event handlers ─────────────────────────────────────────────────────────
  protected onInput(ev: Event): void {
    const el = ev.target as HTMLInputElement;
    // why: only the uncontrolled mode owns the value model; in controlled mode the bound
    // FormControl carries the value natively (ReactiveForms), so we must not double-write.
    if (!this.control()) this.value.set(el.value);
    this.tick.update(n => n + 1);
  }

  protected onFocus(ev: FocusEvent): void {
    this.focused.set(true);
    this.sdFocus.emit(ev);
  }

  protected onBlur(ev: FocusEvent): void {
    this.focused.set(false);
    this.tick.update(n => n + 1);
    this.sdBlur.emit(ev);
  }

  protected onKeyup(ev: KeyboardEvent): void {
    if (ev.key === 'Enter') this.sdKeyupEnter.emit();
  }

  protected onKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') this.sdKeydownEscape.emit();
    this.sdKeydown.emit(ev);
  }

  protected onPaste(ev: ClipboardEvent): void {
    this.sdPaste.emit(ev);
  }

  protected onCompositionStart(ev: CompositionEvent): void {
    this.sdCompositionStart.emit(ev);
  }

  protected onCompositionEnd(ev: CompositionEvent): void {
    this.tick.update(n => n + 1);
    this.sdCompositionEnd.emit(ev);
  }

  protected clear(ev: Event): void {
    ev.stopPropagation();
    const c = this.control();
    if (c) c.setValue('');
    else this.value.set('');
    this.tick.update(n => n + 1);
    this.sdCleared.emit();
  }

  // ── public API ───────────────────────────────────────────────────────────
  /** Focus the native input. */
  focus(): void {
    this.inputRef()?.nativeElement.focus();
  }

  /** Blur the native input. */
  blur(): void {
    this.inputRef()?.nativeElement.blur();
  }
}
