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
 * Completed inline chip (non-string/number — those use `<sd-query-inline-value-chip>`).
 *
 * why: tách edit lifecycle ra khỏi parent `<sd-query-bar>` — child tự quản lý
 * `isEditing` signal, auto-open picker, focusout exit. Parent chỉ pass field/filter
 * và nhận commit/remove outputs.
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

  /** Resolved field — parent passes it (no lookup needed inside). */
  readonly field = input.required<SdQueryField>();

  /** The chip's Filter — used for `data` + `operator`. */
  readonly filter = input.required<Filter>();

  /** Density preset — sizes the `.c-token` row. */
  readonly density = input<Density>('compact');

  /** Whether the active operator is a multi-select (IN/NOT_IN). */
  readonly multiple = input(false);

  /** Show `<sd-operator>` (disabled badge) on the chip; otherwise show `':'` separator. */
  readonly showOperator = input(false);

  /** autoId prefix for inner controls (parent passes `inlineAutoId(i, 'value')`). */
  readonly autoId = input<string>('');

  /** Pre-computed display text — parent owns `chipValueText(filter)` so we don't recompute. */
  readonly valueText = input<string>('');

  /** No-data operator (NULL/NOT_NULL) — hide entire value slot when true. */
  readonly isNoData = input(false);

  // ---------------------------------------------------------------------------
  // Outputs
  // ---------------------------------------------------------------------------

  /** Single-value commit — parent runs `updateFilter(i, { data })`. */
  readonly commit = output<unknown>();

  /** BETWEEN commit (date/datetime) — parent runs `setFilterRange(i, ev)`. */
  readonly commitRange = output<{ from: unknown; to: unknown } | null>();

  /** Live edit during multi-select — parent runs `editValueFn(i)(v)`. */
  readonly liveChange = output<unknown>();

  /** × removal. */
  readonly remove = output<void>();

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  /** Edit toggle — viewed (false) ↔ editable (true). */
  readonly #editing = signal(false);
  readonly editing = this.#editing.asReadonly();

  /** Active picker reference — auto-opened right after entering edit. */
  private readonly chipPicker = viewChild<SdSelect | SdDate | SdDatetime | SdDateRange>('chipPicker');

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------

  readonly iconName = computed<string>(() => sdQueryFieldIcon(this.field()));

  /** Operator code — convenience accessor for template. */
  readonly operator = computed<Operator>(() => (this.filter() as any).operator as Operator);

  /** Data payload — convenience accessor for template. */
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
   * why: focusout fires for every internal blur — only exit when relatedTarget
   * is OUTSIDE the wrapper AND không thuộc cdk-overlay (mat-select panel, mat-calendar,
   * datetime overlay đều render trong document.body). Tick option trong panel multi-
   * select sẽ chuyển focus sang `<mat-option>` (nằm trong cdk-overlay-container) →
   * nếu exit ngay sẽ flip viewed → kill panel sớm. Chỉ exit khi panel đã close
   * (relatedTarget không nằm trong overlay). markForCheck vì overlay focusout
   * không kéo theo CD cho OnPush parent.
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
      // why: sd-date-range / sd-datetime đôi khi emit sdChange NGAY SAU focusout —
      // viewed flip xảy ra trước khi model mới về tới [model] input → viewed text
      // format dùng giá trị cũ. Schedule thêm 1 CD pass để re-render với model mới
      // (user-visible bug: "click ra lần đầu chưa update, click vào rồi ra lần 2 mới đúng").
      queueMicrotask(() => this.#cdr.markForCheck());
    }
  }

  /** Test-only shim — direct call avoids dispatching real FocusEvent in JSDOM. */
  onFocusOutForTest(ev: FocusEvent): void {
    this.onFocusOut(ev);
  }

  // ---------------------------------------------------------------------------
  // Commit handlers — single emit per category
  // ---------------------------------------------------------------------------

  /** Single-value commit (sd-date, sd-datetime, single sd-select). */
  emitSingleCommit(v: unknown): void {
    this.commit.emit(v);
    this.#editing.set(false);
  }

  /**
   * BETWEEN commit — sd-date-range emits {from, to}.
   * why: nếu cả from + to đều có giá trị → coi như range đã chọn xong → exit edit
   * ngay tại commit (đồng bộ với model.set của parent), không chờ focusout. Tránh
   * race "focusout firing trước sdChange" làm viewed text render với model cũ.
   */
  emitRangeCommit(ev: { from: unknown; to: unknown } | null): void {
    this.commitRange.emit(ev ?? null);
    if (ev && ev.from != null && ev.to != null) {
      this.#editing.set(false);
      this.#cdr.markForCheck();
    }
  }

  /** Multi-select live emit — does NOT exit edit (focusout handles exit). */
  emitLive(v: unknown): void {
    this.liveChange.emit(v);
  }

  /** Boolean toggle commit — exits edit. */
  emitBoolean(v: boolean): void {
    this.commit.emit(v);
    this.#editing.set(false);
  }
}
