import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
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
 *
 * why: `values` / `lazy-values` đã chuyển sang `<sd-select [viewed]="'inline'">` — sd-select
 * tự quản click→edit + focusout→thoát + bare editor, nên các nhánh đó KHÔNG dùng
 * `enterEdit` / `onFocusOut` / `#editing` nữa. Các nhánh còn lại (boolean / date / datetime /
 * BETWEEN) vẫn dùng lifecycle thủ công cho tới khi control tương ứng có inline mode (rollout).
 */
@Component({
  selector: 'sd-query-inline-chip',
  templateUrl: './inline-chip.component.html',
  styleUrl: './inline-chip.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, SdOperator, SdDate, SdDateRange, SdDatetime, SdSelect],
})
export class SdQueryInlineChip {
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

  /**
   * Edit toggle for the BOOLEAN branch only — viewed (false) ↔ toggle buttons (true).
   * why: boolean isn't a `viewed`-aware form control (no inline mode); it keeps the chip's own
   * click-to-edit. values/date/datetime/BETWEEN delegate to their control's `viewed='inline'`.
   */
  readonly #editing = signal(false);
  readonly editing = this.#editing.asReadonly();

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

  /** Enter edit mode (BOOLEAN branch — shows the toggle buttons; exits on toggle commit). */
  enterEdit(): void {
    if (this.#editing()) return;
    this.#editing.set(true);
  }

  // ---------------------------------------------------------------------------
  // Commit handlers — single emit per category
  // ---------------------------------------------------------------------------

  /**
   * Single-value commit (sd-date, sd-datetime, single sd-select).
   * why: date/datetime/values render via `viewed='inline'` (self-managed) — the chip only
   * forwards the value; it no longer toggles `#editing` (that's boolean-only now).
   */
  emitSingleCommit(v: unknown): void {
    this.commit.emit(v);
  }

  /** BETWEEN commit — sd-date-range (viewed='inline') emits `{from, to}`; chip just forwards it. */
  emitRangeCommit(ev: { from: unknown; to: unknown } | null): void {
    this.commitRange.emit(ev ?? null);
  }

  /** Multi-select live emit (sd-select inline). */
  emitLive(v: unknown): void {
    this.liveChange.emit(v);
  }

  /** Boolean toggle commit — exits edit. */
  emitBoolean(v: boolean): void {
    this.commit.emit(v);
    this.#editing.set(false);
  }
}
