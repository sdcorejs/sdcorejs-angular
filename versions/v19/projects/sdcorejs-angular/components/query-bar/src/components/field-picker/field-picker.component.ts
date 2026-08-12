import { ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild } from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';

import { SdQueryField, sdQueryFieldIcon } from '../../query-bar.model';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { I18nService } from '@sdcorejs/angular/i18n';

/**
 * Field picker mat-menu for `sd-query-bar`.
 *
 * Shared between two flows in the bar:
 * - "Add filter" — pass `[usedKeys]` (a Set of field keys already on the bar) so
 *   those entries render disabled with a check.
 * - "Đổi field" inside the chip popover — pass `[currentKey]` to disable the
 *   currently-bound field.
 *
 * Parent triggers via `[matMenuTriggerFor]="picker.menu()"` and receives the
 * chosen field through `(pick)`.
 */
@Component({
  selector: 'sd-query-field-picker',
  templateUrl: './field-picker.component.html',
  styleUrl: './field-picker.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, MatMenuModule],
})
export class SdQueryFieldPicker {
  readonly #i18n = inject(I18nService);
  readonly emptyLabel = computed(() => this.#i18n.t('core.component.query-bar.field-empty'));

  /** Field list shown in the menu (caller-supplied; rendered in input order). */
  readonly fields = input<SdQueryField[]>([]);

  /** Single key disabled with a trailing check — used in the chip-popover "Đổi field" flow. */
  readonly currentKey = input<string | undefined>(undefined);

  /** Set of keys already in use — used in the "Add filter" flow to grey out duplicates. */
  readonly usedKeys = input<Set<string>>(new Set<string>());

  /** Emits when the user picks an enabled field. */
  readonly pick = output<SdQueryField>();

  /** MatMenu instance — parent binds `[matMenuTriggerFor]="picker.menu()"`. */
  readonly menu = viewChild.required(MatMenu);

  readonly iconFor = sdQueryFieldIcon;

  /** Per-field disabled state — current key OR used key OR field's own disabled flag. */
  readonly disabledMap = computed<Set<string>>(() => {
    const set = new Set(this.usedKeys());
    const cur = this.currentKey();
    if (cur) set.add(cur);
    return set;
  });

  isDisabled(field: SdQueryField): boolean {
    return field.disabled === true || this.disabledMap().has(field.key as string);
  }

  /** "Current" check icon — only when the field matches `currentKey`. */
  isCurrent(field: SdQueryField): boolean {
    return field.key === this.currentKey();
  }

  /** "Used" check icon — when the field is in `usedKeys` (not the same as current). */
  isUsed(field: SdQueryField): boolean {
    return this.usedKeys().has(field.key as string);
  }
}
