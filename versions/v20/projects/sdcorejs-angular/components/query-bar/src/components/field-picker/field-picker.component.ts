import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';

import { SdQueryField, sdQueryFieldIcon } from '../../query-bar.model';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdNormalizeSearchText } from '@sdcorejs/angular/utilities/extensions';

/** More fields than this get a find box at the top of the picker. */
const FIND_THRESHOLD = 8;

/** Keys the find box leaves to mat-menu: close, move into the list, leave the menu. */
const MENU_KEYS = new Set(['Escape', 'ArrowDown', 'ArrowUp', 'Tab']);

interface FieldGroup {
  label: string;
  fields: SdQueryField[];
}

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
  readonly #injector = inject(Injector);
  readonly emptyLabel = computed(() => this.#i18n.t('core.component.query-bar.field-empty'));
  readonly findLabel = computed(() => this.#i18n.t('core.component.query-bar.find-field'));

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

  // ---------------------------------------------------------------------------
  // Groups + find box (long field lists, e.g. sd-table "Bộ lọc" / "Cột")
  // ---------------------------------------------------------------------------

  /** Text typed in the find box; reset when the menu closes. */
  readonly query = signal('');

  /** Find box above more than eight fields. */
  readonly searchable = computed(() => this.fields().length > FIND_THRESHOLD);

  /** Fields grouped by `field.group` in order of first appearance, filtered by the find box. */
  readonly groups = computed<FieldGroup[]>(() => {
    const term = this.searchable() ? sdNormalizeSearchText(this.query().trim()) : '';
    const groups: FieldGroup[] = [];
    const byLabel = new Map<string, FieldGroup>();
    for (const field of this.fields()) {
      if (term && !sdNormalizeSearchText(field.label).includes(term)) continue;
      const label = field.group ?? '';
      let group = byLabel.get(label);
      if (!group) {
        group = { label, fields: [] };
        byLabel.set(label, group);
        groups.push(group);
      }
      group.fields.push(field);
    }
    return groups;
  });

  /** One group needs no heading. Counted on the whole list so filtering does not hide headings. */
  readonly showGroupHeadings = computed(() => new Set(this.fields().map(field => field.group ?? '')).size > 1);

  private readonly findInput = viewChild<ElementRef<HTMLInputElement>>('findInput');

  /**
   * Called by the trigger's `(menuOpened)`: land in the find box. why: mat-menu focuses its first
   * item after rendering (afterNextRender), so the find box takes focus in a later render callback.
   */
  focusFind(): void {
    if (!this.searchable()) return;
    afterNextRender(() => this.findInput()?.nativeElement.focus(), { injector: this.#injector });
  }

  onFindKeydown(event: KeyboardEvent): void {
    if (!MENU_KEYS.has(event.key)) event.stopPropagation();
  }

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
