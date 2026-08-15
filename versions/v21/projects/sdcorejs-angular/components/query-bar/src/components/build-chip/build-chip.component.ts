import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';

import { SdOperator } from '@sdcorejs/angular/components/operator';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { Operator } from '@sdcorejs/utils/models';

import { SdQueryInlineValueChip } from '../inline-value-chip/inline-value-chip.component';
import { BuildingChip } from '../../query-bar.model';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

type Density = 'compact' | 'comfortable';

/**
 * Visual block for the in-progress build chip (inline mode token builder).
 *
 * why: tách khỏi `<sd-query-bar>` để parent chỉ giữ state (`building()` signal +
 * step transitions) — tất cả render logic của 2 step (operator picker / value
 * picker) cộng với 7 nhánh field type sống tại đây.
 *
 * The chip has two visually distinct branches:
 *  - **Seamless** (`string` / `number`) — the entire pill IS an `<sd-query-inline-value-chip>`
 *    (its own border, autofocused input). The host's `.c-token-building` shell is skipped.
 *  - **Token** (`values` / `lazy-values` / `date` / `datetime` / `boolean` / other) —
 *    `.c-token.c-token-building` dashed pill with field label + operator (menu in
 *    operator step, disabled badge in value step) + the per-type picker + × cancel.
 */
@Component({
  selector: 'sd-query-build-chip',
  templateUrl: './build-chip.component.html',
  styleUrl: './build-chip.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, CommonModule, SdOperator, SdDate, SdDateRange, SdDatetime, SdInput, SdInputNumber, SdSelect, SdQueryInlineValueChip],
})
export class SdQueryBuildChip {
  readonly #i18n = inject(I18nService);

  // why: nhãn mặc định của field boolean phải trùng với nhãn parent dựng cho chip đã hoàn thành
  // (`SdQueryBar.chipValueText`), nếu không cùng một field sẽ hiện hai ngôn ngữ giữa lúc đang tạo
  // chip và lúc chip xong.
  readonly booleanTrueLabel = computed(() => this.#i18n.t('core.component.query-bar.boolean.true'));
  readonly booleanFalseLabel = computed(() => this.#i18n.t('core.component.query-bar.boolean.false'));

  /** Current build state — drives every visual branch. */
  readonly building = input.required<BuildingChip>();

  /** Density preset — forwarded to the seamless chip + sizes the .c-token row. */
  readonly density = input<Density>('compact');

  /** Operator set offered in the operator-step menu (parent's `allowedOperatorsFor(field)`). */
  readonly allowedOperators = input<Operator[]>([]);

  /** Whether the active operator is a multi-select (`IN`/`NOT_IN`) — drives sd-select [multiple]. */
  readonly multiple = input(false);

  /** Show the operator label on the seamless chip's pill (forwarded to inline-value-chip). */
  readonly showOperator = input(false);

  /**
   * Prefix for `data-autoid` on the inner picker / seamless input.
   * why: parent originally hard-coded `'qb-build-value'` everywhere; default preserves that
   * for backward compatibility with existing e2e selectors.
   */
  readonly autoId = input<string>('qb-build-value');

  // ---------------------------------------------------------------------------
  // Outputs
  // ---------------------------------------------------------------------------

  /** Operator chosen from the operator-step menu — parent advances to value step. */
  readonly pickOperator = output<Operator>();

  /**
   * Value committed from a non-seamless picker (sd-select / sd-date / sd-date-range /
   * sd-datetime) or a boolean toggle. Parent pushes the completed chip and clears building.
   */
  readonly commitValue = output<unknown>();

  /** × button — abandon the build (parent clears `building` signal). */
  readonly cancel = output<void>();

  /**
   * Commit from the seamless (string / number) branch. Parent decides empty → cancel
   * vs push complete (see `onBuildSeamlessCommit`); this just forwards the raw value.
   */
  readonly seamlessCommit = output<unknown>();

  /** Fallback editor (boolean ng-template / other) — staged draft on every change. */
  readonly draftChange = output<unknown>();

  /** Fallback editor — Enter / click commits the staged draft. */
  readonly draftCommit = output<void>();

  // ---------------------------------------------------------------------------
  // Internal refs — used by parent via public open*() methods
  // ---------------------------------------------------------------------------

  /** Operator-step menu — auto-opened by parent right after `building` enters operator step. */
  private readonly opMenu = viewChild<SdOperator>('buildOperator');

  /** Value-step picker (the active bare control) — auto-opened by parent at value step. */
  private readonly picker = viewChild<SdSelect | SdDate | SdDatetime | SdDateRange>('bPicker');

  /** Open the operator menu — parent calls after rendering the operator step. */
  openOperator(): void {
    this.opMenu()?.open();
  }

  /** Open the value-step picker's native panel — parent calls after rendering the value step. */
  openPicker(): void {
    (this.picker() as any)?.open?.();
  }

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------

  /** True when the seamless branch (string/number value step) should be rendered. */
  readonly isSeamless = computed<boolean>(() => {
    const b = this.building();
    if (b.step !== 'value') return false;
    const t = b.field.type;
    return t === 'string' || t === 'number';
  });
}
