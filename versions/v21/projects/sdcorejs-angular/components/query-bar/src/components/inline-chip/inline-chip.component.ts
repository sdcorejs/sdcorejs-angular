/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { SdOperator } from '@sdcorejs/angular/components/operator';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { Filter, Operator } from '@sdcorejs/utils/models';

import { SdQueryField, sdQueryFieldIcon } from '../../query-bar.model';

type Density = 'compact' | 'comfortable';

/**
 * Completed inline chip (non-string/number â€” those use `<sd-query-inline-value-chip>`).
 *
 * why: tÃ¡ch edit lifecycle ra khá»i parent `<sd-query-bar>` â€” child tá»± quáº£n lÃ½
 * `isEditing` signal, auto-open picker, focusout exit. Parent chá»‰ pass field/filter
 * vÃ  nháº­n commit/remove outputs.
 *
 * Covers types: boolean, date, datetime, values, lazy-values, plus a fallback else
 * branch. BETWEEN (date / datetime) uses a single `<sd-date-range>` (datetime
 * downgrades to date precision).
 */
@Component({
  selector: 'sd-query-inline-chip',
  templateUrl: './inline-chip.component.html',
  styleUrl: './inline-chip.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    SdOperator,
    SdDate,
    SdDateRange,
    SdDatetime,
    SdSelect,
  ],
})
export class SdQueryInlineChip {
  readonly #injector = inject(Injector);
  readonly #cdr = inject(ChangeDetectorRef);

  // ---------------------------------------------------------------------------
  // Inputs
  // ---------------------------------------------------------------------------

  /** Resolved field â€” parent passes it (no lookup needed inside). */
  readonly field = input.required<SdQueryField>();

  /** The chip's Filter â€” used for `data` + `operator`. */
  readonly filter = input.required<Filter>();

  /** Density preset â€” sizes the `.c-token` row. */
  readonly density = input<Density>('compact');

  /** Whether the active operator is a multi-select (IN/NOT_IN). */
  readonly multiple = input(false);

  /** Show `<sd-operator>` (disabled badge) on the chip; otherwise show `':'` separator. */
  readonly showOperator = input(false);

  /** autoId prefix for inner controls (parent passes `inlineAutoId(i, 'value')`). */
  readonly autoId = input<string>('');

  /** Pre-computed display text â€” parent owns `chipValueText(filter)` so we don't recompute. */
  readonly valueText = input<string>('');

  /** No-data operator (NULL/NOT_NULL) â€” hide entire value slot when true. */
  readonly isNoData = input(false);

  // ---------------------------------------------------------------------------
  // Outputs
  // ---------------------------------------------------------------------------

  /** Single-value commit â€” parent runs `updateFilter(i, { data })`. */
  readonly commit = output<unknown>();

  /** BETWEEN commit (date/datetime) â€” parent runs `setFilterRange(i, ev)`. */
  readonly commitRange = output<{ from: unknown; to: unknown } | null>();

  /** Live edit during multi-select â€” parent runs `editValueFn(i)(v)`. */
  readonly liveChange = output<unknown>();

  /** Ã— removal. */
  readonly remove = output<void>();

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  /** Edit toggle â€” viewed (false) â†” editable (true). */
  readonly #editing = signal(false);
  readonly editing = this.#editing.asReadonly();

  /** Active picker reference â€” auto-opened right after entering edit. */
  private readonly chipPicker = viewChild<SdSelect | SdDate | SdDatetime | SdDateRange>('chipPicker');

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------

  readonly iconName = computed<string>(() => sdQueryFieldIcon(this.field()));

  /** Operator code â€” convenience accessor for template. */
  readonly operator = computed<Operator>(() => (this.filter() as any).operator as Operator);

  /** Data payload â€” convenience accessor for template. */
  readonly data = computed<unknown>(() => (this.filter() as any).data);

  // ---------------------------------------------------------------------------
  // Edit lifecycle
  // ---------------------------------------------------------------------------

  /** Enter edit mode + auto-open the picker on next render. */
  enterEdit(): void {
    if (this.#editing()) return;
    this.#editing.set(true);
    afterNextRender(
      () => (this.chipPicker() as any)?.open?.(),
      { injector: this.#injector },
    );
  }

  /**
   * Exit edit only when focus actually leaves the wrapper subtree.
   * why: focusout fires for every internal blur â€” only exit when relatedTarget
   * is OUTSIDE the wrapper AND khÃ´ng thuá»™c cdk-overlay (mat-select panel, mat-calendar,
   * datetime overlay Ä‘á»u render trong document.body). Tick option trong panel multi-
   * select sáº½ chuyá»ƒn focus sang `<mat-option>` (náº±m trong cdk-overlay-container) â†’
   * náº¿u exit ngay sáº½ flip viewed â†’ kill panel sá»›m. Chá»‰ exit khi panel Ä‘Ã£ close
   * (relatedTarget khÃ´ng náº±m trong overlay). markForCheck vÃ¬ overlay focusout
   * khÃ´ng kÃ©o theo CD cho OnPush parent.
   */
  onFocusOut(ev: FocusEvent): void {
    const wrapper = ev.currentTarget as HTMLElement | null;
    const next = ev.relatedTarget as Node | null;
    if (!wrapper) return;
    if (next && wrapper.contains(next)) return;
    if (next instanceof Element && next.closest('.cdk-overlay-container')) return;
    if (this.#editing()) {
      this.#editing.set(false);
      this.#cdr.markForCheck();
      // why: sd-date-range / sd-datetime Ä‘Ã´i khi emit sdChange NGAY SAU focusout â€”
      // viewed flip xáº£y ra trÆ°á»›c khi model má»›i vá» tá»›i [model] input â†’ viewed text
      // format dÃ¹ng giÃ¡ trá»‹ cÅ©. Schedule thÃªm 1 CD pass Ä‘á»ƒ re-render vá»›i model má»›i
      // (user-visible bug: "click ra láº§n Ä‘áº§u chÆ°a update, click vÃ o rá»“i ra láº§n 2 má»›i Ä‘Ãºng").
      queueMicrotask(() => this.#cdr.markForCheck());
    }
  }

  /** Test-only shim â€” direct call avoids dispatching real FocusEvent in JSDOM. */
  onFocusOutForTest(ev: FocusEvent): void {
    this.onFocusOut(ev);
  }

  // ---------------------------------------------------------------------------
  // Commit handlers â€” single emit per category
  // ---------------------------------------------------------------------------

  /** Single-value commit (sd-date, sd-datetime, single sd-select). */
  emitSingleCommit(v: unknown): void {
    this.commit.emit(v);
    this.#editing.set(false);
  }

  /**
   * BETWEEN commit â€” sd-date-range emits {from, to}.
   * why: náº¿u cáº£ from + to Ä‘á»u cÃ³ giÃ¡ trá»‹ â†’ coi nhÆ° range Ä‘Ã£ chá»n xong â†’ exit edit
   * ngay táº¡i commit (Ä‘á»“ng bá»™ vá»›i model.set cá»§a parent), khÃ´ng chá» focusout. TrÃ¡nh
   * race "focusout firing trÆ°á»›c sdChange" lÃ m viewed text render vá»›i model cÅ©.
   */
  emitRangeCommit(ev: { from: unknown; to: unknown } | null): void {
    this.commitRange.emit(ev ?? null);
    if (ev && ev.from != null && ev.to != null) {
      this.#editing.set(false);
      this.#cdr.markForCheck();
    }
  }

  /** Multi-select live emit â€” does NOT exit edit (focusout handles exit). */
  emitLive(v: unknown): void {
    this.liveChange.emit(v);
  }

  /** Boolean toggle commit â€” exits edit. */
  emitBoolean(v: boolean): void {
    this.commit.emit(v);
    this.#editing.set(false);
  }
}

