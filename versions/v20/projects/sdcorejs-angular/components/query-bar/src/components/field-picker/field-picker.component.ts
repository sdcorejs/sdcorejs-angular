import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild } from '@angular/core';

import { ɵSdSearchField, ɵSdSearchFieldInputDirective } from '@sdcorejs/angular/forms/directives';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { sdNormalizeSearchText } from '@sdcorejs/angular/utilities/extensions';

import { SdQueryField, sdQueryFieldIcon } from '../../query-bar.model';
import { ɵSdQueryPanelCloseReason, ɵSdQueryPanelDirective } from '../panel/query-panel';

/** From this many fields the picker gets a find box at the top (PD after R1, G-2). */
const FIND_MIN_FIELDS = 10;

let nextListId = 0;

interface FieldGroup {
  label: string;
  headingId: string;
  fields: SdQueryField[];
}

/**
 * Field picker of `sd-query-bar`: a listbox panel (handoff section 3). The "+" button opens it with
 * `[sdQueryPanelTrigger]="picker.panel()"`; the chosen field comes back through `(pick)`. Fields in `[usedKeys]`
 * render disabled with a check.
 *
 * Keyboard: without a find box focus moves over the options (↑ ↓ Home End, Enter picks). With the find box focus stays
 * in it and the arrows move `aria-activedescendant` (combobox). No typeahead.
 */
@Component({
  selector: 'sd-query-field-picker',
  templateUrl: './field-picker.component.html',
  styleUrl: './field-picker.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, SdIcon, ɵSdQueryPanelDirective, ɵSdSearchField, ɵSdSearchFieldInputDirective],
})
export class SdQueryFieldPicker {
  readonly #i18n = inject(I18nService);
  readonly emptyLabel = computed(() => this.#i18n.t('core.component.query-bar.field-empty'));
  readonly findLabel = computed(() => this.#i18n.t('core.component.query-bar.find-field'));
  /**
   * Name of the listbox: the label of what opens it — the + button in popover mode, the Add condition box inline. The
   * find box label is a command ("Tìm kiếm"), not a name for the list.
   */
  readonly listLabel = computed(() =>
    this.#i18n.t(this.findBox() ? 'core.component.query-bar.add-filter' : 'core.component.query-bar.add-condition')
  );

  /** Field list shown in the panel (caller-supplied; rendered in input order). */
  readonly fields = input<SdQueryField[]>([]);

  /** Set of keys already in use — those render disabled with a check. */
  readonly usedKeys = input<Set<string>>(new Set<string>());

  /** Prefix of `data-autoid` (handoff section 12). */
  readonly autoId = input<string | undefined>(undefined);

  /**
   * `false`: no find box in the panel — an input outside (the inline "Add condition" combobox) types the filter through
   * `setQuery()` and moves the active option.
   */
  readonly findBox = input(true);

  /** Emits when the user picks an enabled field. */
  readonly pick = output<SdQueryField>();
  /** The panel closed. */
  readonly closed = output<ɵSdQueryPanelCloseReason>();

  /** The panel — the trigger binds `[sdQueryPanelTrigger]="picker.panel()"`. */
  readonly panel = viewChild.required<ɵSdQueryPanelDirective>('panel');

  readonly iconFor = sdQueryFieldIcon;
  readonly listId = `sd-query-field-list-${nextListId++}`;

  /** Text typed in the find box; reset when the panel closes. */
  readonly query = signal('');
  /** Key of the option the arrows point at (`aria-activedescendant` / roving focus). */
  readonly activeKey = signal<string | null>(null);

  /** Find box from ten fields (not when an outside input types the filter). */
  readonly searchable = computed(() => this.findBox() && this.fields().length >= FIND_MIN_FIELDS);
  /** The list follows the typed text: with the find box, or with the outside combobox. */
  readonly #filterable = computed(() => this.searchable() || !this.findBox());

  /** Fields grouped by `field.group` in order of first appearance, filtered by the find box. */
  readonly groups = computed<FieldGroup[]>(() => {
    const term = this.#filterable() ? sdNormalizeSearchText(this.query().trim()) : '';
    const groups: FieldGroup[] = [];
    const byLabel = new Map<string, FieldGroup>();
    for (const field of this.fields()) {
      if (term && !sdNormalizeSearchText(field.label).includes(term)) continue;
      const label = field.group ?? '';
      let group = byLabel.get(label);
      if (!group) {
        group = { label, headingId: `${this.listId}-group-${groups.length}`, fields: [] };
        byLabel.set(label, group);
        groups.push(group);
      }
      group.fields.push(field);
    }
    return groups;
  });

  /** One group needs no heading. Counted on the whole list so filtering does not hide headings. */
  readonly showGroupHeadings = computed(() => new Set(this.fields().map(field => field.group ?? '')).size > 1);

  /** Visible fields in order, with the id of their option element. */
  readonly #visible = computed(() => {
    const ids = new Map<string, string>();
    const list = this.groups().flatMap(group => group.fields);
    list.forEach((field, index) => ids.set(field.key as string, `${this.listId}-option-${index}`));
    return { list, ids };
  });

  /** Id of the active option, for `aria-activedescendant`. */
  readonly activeId = computed(() => {
    const key = this.activeKey();
    return key === null ? null : (this.#visible().ids.get(key) ?? null);
  });

  optionId(field: SdQueryField): string {
    return this.#visible().ids.get(field.key as string) ?? '';
  }

  isDisabled(field: SdQueryField): boolean {
    return field.disabled === true || this.usedKeys().has(field.key as string);
  }

  /** "Used" check icon — when the field is in `usedKeys`. */
  isUsed(field: SdQueryField): boolean {
    return this.usedKeys().has(field.key as string);
  }

  /** Find box typed: filter, then point at the first enabled match (none while the box is empty). */
  setQuery(text: string): void {
    this.query.set(text);
    this.activeKey.set(text.trim() ? ((this.#enabled()[0]?.key as string | undefined) ?? null) : null);
  }

  /**
   * Moves the active option over the enabled ones, wrapping: `1` / `-1`, or `'first'` / `'last'`. With `focus`, the
   * option also takes focus (no find box).
   */
  move(step: 1 | -1 | 'first' | 'last', focus = false): void {
    const enabled = this.#enabled();
    if (!enabled.length) return;
    const current = enabled.findIndex(field => field.key === this.activeKey());
    let index: number;
    if (step === 'first') index = 0;
    else if (step === 'last') index = enabled.length - 1;
    else if (current < 0) index = step > 0 ? 0 : enabled.length - 1;
    else index = (current + step + enabled.length) % enabled.length;
    const key = enabled[index].key as string;
    this.activeKey.set(key);
    if (focus)
      this.panel()
        .element()
        ?.querySelector<HTMLElement>(`#${CSS.escape(this.#visible().ids.get(key) ?? '')}`)
        ?.focus();
  }

  /** Picks the active option; `false` when there is none. */
  pickActive(): boolean {
    const field = this.#enabled().find(item => item.key === this.activeKey());
    if (!field) return false;
    this.select(field);
    return true;
  }

  /** Picks `field` unless it is disabled: the panel closes first, then `(pick)` fires. */
  select(field: SdQueryField): void {
    if (this.isDisabled(field)) return;
    this.panel().close('select');
    this.pick.emit(field);
  }

  /** Keys inside the panel (find box or an option). */
  onKeydown(event: KeyboardEvent): void {
    const inFind = (event.target as HTMLElement).tagName === 'INPUT';
    switch (event.key) {
      case 'ArrowDown':
        this.move(1, !inFind);
        break;
      case 'ArrowUp':
        this.move(-1, !inFind);
        break;
      case 'Home':
      case 'End':
        // In the find box Home / End move the caret.
        if (inFind) return;
        this.move(event.key === 'Home' ? 'first' : 'last', true);
        break;
      case 'Enter':
        if (inFind) this.pickActive();
        else {
          const field = this.#visible().list.find(item => this.optionId(item) === (event.target as HTMLElement).id);
          if (field) this.select(field);
        }
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** An option took focus (roving focus, or a click): it becomes the active one. */
  onOptionFocus(field: SdQueryField): void {
    this.activeKey.set(field.key as string);
  }

  /** Panel closed: forget the find text and the active option. */
  reset(): void {
    this.query.set('');
    this.activeKey.set(null);
  }

  #enabled(): SdQueryField[] {
    return this.#visible().list.filter(field => !this.isDisabled(field));
  }
}
