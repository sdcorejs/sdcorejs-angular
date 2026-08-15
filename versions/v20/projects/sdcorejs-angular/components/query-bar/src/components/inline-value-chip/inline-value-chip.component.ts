import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdInlineText } from '@sdcorejs/angular/forms/inline-text';
import { Operator } from '@sdcorejs/utils/models';

import { SD_QUERY_NO_DATA_OPERATORS, SdQueryField, sdQueryFieldIcon } from '../../query-bar.model';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

interface Range {
  from?: any;
  to?: any;
}
type ChipState = 'pending' | 'active' | 'focus' | 'error';

/**
 * Seamless inline value chip for `string` / `number` fields (inline mode only).
 *
 * why: the pill itself IS the input — one border, no nested rectangle control. The
 * label + value + remove live in three flush segments inside a single pill envelope.
 * Mirrors refs/design_handoff_sd_query_bar "Seamless string/number chip" handoff.
 *
 * Commit model matches inline mode: edits write back via `(valueChange)` immediately
 * (host folds into `filters` without emitting); the bar's Search button stays the only
 * query trigger. Enter commits + blurs, Esc reverts + blurs, blur commits.
 */
@Component({
  selector: 'sd-query-inline-value-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, SdOperator, SdInlineText],
  templateUrl: './inline-value-chip.component.html',
  styleUrl: './inline-value-chip.component.scss',
})
export class SdQueryInlineValueChip {
  readonly #i18n = inject(I18nService);

  /** Field this chip filters by — must be kind `string` or `number`. */
  readonly field = input.required<SdQueryField>();
  /** Active operator (drives BETWEEN dual-input + no-data hiding). */
  readonly operator = input<Operator>('CONTAIN');
  /** Current value: scalar for most operators, `{ from, to }` for BETWEEN. */
  readonly value = input<unknown>(null);
  readonly density = input<'compact' | 'comfortable'>('compact');
  /** Show the operator label as a small pill inside the label segment. */
  readonly showOperator = input(false);
  /** Prefix for the inner input's `data-autoid`. */
  readonly autoId = input<string | undefined>(undefined);
  /** Focus the first input on creation — used for the in-progress build chip. */
  readonly autofocus = input(false);

  /** Emitted on commit (Enter / blur) with the parsed next value. */
  readonly valueChange = output<unknown>();
  /** Emitted when the user clicks the × segment. */
  readonly remove = output<void>();

  private readonly firstInput = viewChild<SdInlineText>('firstInput');

  readonly focused = signal(false);
  readonly hasError = signal(false);

  /** Editable drafts — single value, plus from/to for BETWEEN. Seeded from `value`. */
  readonly draft = signal('');
  readonly draftFrom = signal('');
  readonly draftTo = signal('');

  readonly isNumber = computed(() => this.field().type === 'number');
  readonly isBetween = computed(() => this.operator() === 'BETWEEN');
  readonly isNoData = computed(() => SD_QUERY_NO_DATA_OPERATORS.includes(this.operator()));

  readonly icon = computed(() => sdQueryFieldIcon(this.field()));

  // why: placeholder của field số và field chuỗi khác nhau về cách viết hoa/dấu ba chấm nên phải
  // là key riêng — không tự ghép được từ một chuỗi chung cho mọi ngôn ngữ.
  readonly ph = computed(() =>
    this.#i18n.t(this.isNumber() ? 'core.component.query-bar.placeholder.value' : 'core.component.query-bar.placeholder.text')
  );
  readonly phFrom = computed(() =>
    this.#i18n.t(this.isNumber() ? 'core.component.query-bar.placeholder.from-number' : 'core.component.query-bar.placeholder.from-text')
  );
  readonly phTo = computed(() =>
    this.#i18n.t(this.isNumber() ? 'core.component.query-bar.placeholder.to-number' : 'core.component.query-bar.placeholder.to-text')
  );

  readonly hasValue = computed(() => {
    if (this.isNoData()) return true;
    const v = this.value();
    if (this.isBetween()) {
      const r = (v ?? {}) as Range;
      return (r.from != null && r.from !== '') || (r.to != null && r.to !== '');
    }
    return v != null && v !== '';
  });

  readonly state = computed<ChipState>(() => {
    if (this.hasError()) return 'error';
    if (this.focused()) return 'focus';
    return this.hasValue() ? 'active' : 'pending';
  });

  constructor() {
    // Reseed drafts whenever the bound value / operator / kind changes. While the user
    // types, none of those change (commit is on blur), so this never clobbers an edit.
    effect(() => {
      const v = this.value();
      if (this.isBetween()) {
        const r = (v ?? {}) as Range;
        this.draftFrom.set(this.#format(r.from));
        this.draftTo.set(this.#format(r.to));
      } else {
        this.draft.set(this.#format(v));
      }
    });

    // why: the build chip lands focused (autofocus) so the user types straight away —
    // <sd-inline-text> owns that via its own [autofocus] input, so no afterNextRender here.
  }

  /** Click anywhere in the pill (except × or an input) focuses the first input. */
  focusFromShell(ev: Event): void {
    const target = ev.target as HTMLElement;
    if (target.closest('.c-seamless__x') || target.closest('input')) return;
    this.firstInput()?.focus();
  }

  onFocus(): void {
    this.focused.set(true);
  }

  /** Commit a single-value field (string / number, non-BETWEEN). */
  commitSingle(): void {
    this.focused.set(false);
    const parsed = this.#parse(this.draft());
    if (!parsed.ok) {
      this.hasError.set(true);
      return;
    }
    this.hasError.set(false);
    this.valueChange.emit(parsed.value);
  }

  /** Commit a BETWEEN range — both ends parsed, emitted as `{ from, to }`. */
  commitRange(): void {
    this.focused.set(false);
    const from = this.#parse(this.draftFrom());
    const to = this.#parse(this.draftTo());
    if (!from.ok || !to.ok) {
      this.hasError.set(true);
      return;
    }
    this.hasError.set(false);
    this.valueChange.emit({ from: from.value, to: to.value });
  }

  /** Esc — revert drafts to the committed value and blur without emitting. */
  revertAndBlur(ref?: { blur: () => void }): void {
    const v = this.value();
    if (this.isBetween()) {
      const r = (v ?? {}) as Range;
      this.draftFrom.set(this.#format(r.from));
      this.draftTo.set(this.#format(r.to));
    } else {
      this.draft.set(this.#format(v));
    }
    this.hasError.set(false);
    this.focused.set(false);
    ref?.blur();
  }

  onRemove(ev: Event): void {
    ev.stopPropagation();
    this.remove.emit();
  }

  /** Format a stored value for display — number → vi-VN grouped digits. */
  #format(v: any): string {
    if (v == null || v === '') return '';
    if (this.isNumber()) {
      const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g, ''));
      return Number.isFinite(n) ? n.toLocaleString('vi-VN') : String(v);
    }
    return String(v);
  }

  /** Parse a draft back to a stored value. Number kind rejects non-numeric input. */
  #parse(s: string): { ok: boolean; value: any } {
    const t = (s ?? '').trim();
    if (t === '') return { ok: true, value: this.isNumber() ? null : '' };
    if (this.isNumber()) {
      // vi-VN groups thousands with '.', so strip dots + spaces, then require a plain
      // (optionally negative) integer — anything else (letters, stray symbols) is an error.
      const cleaned = t.replace(/[.\s]/g, '');
      if (!/^-?\d+$/.test(cleaned)) return { ok: false, value: t };
      const n = Number(cleaned);
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false, value: t };
    }
    return { ok: true, value: t };
  }
}
