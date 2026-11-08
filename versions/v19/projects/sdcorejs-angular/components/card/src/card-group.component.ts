import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model, output, signal, type Signal } from '@angular/core';
import type { Color as SdColor } from '@sdcorejs/utils/models';
import { SD_CARD_DEFAULT_COLOR } from './card.constants';

/** Compares a model item with a card value for selection. */
export type SdCardCompareWith<T> = (modelValue: T, cardValue: T) => boolean;

/**
 * What a descendant `SdCard` tells its group so the group can switch to radio semantics.
 * @internal Implemented by `SdCard` only.
 */
export interface ɵSdCardGroupMember {
  readonly element: HTMLElement;
  /** The card renders the `option` layout and behaves as `select`. */
  readonly isOption: Signal<boolean>;
  /** The card can receive focus and selection. */
  readonly isEnabled: Signal<boolean>;
  readonly selected: Signal<boolean>;
  readonly value: Signal<unknown>;
}

/** Owns single or multiple selection state for descendant `SdCard` instances. */
@Component({
  selector: 'sd-card-group',
  standalone: true,
  templateUrl: './card-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'radioMode() ? "radiogroup" : "group"',
    '[class.sd-disabled]': 'disabled()',
    '[attr.aria-disabled]': 'disabled() ? "true" : "false"',
    '[attr.data-autoid]': 'resolvedAutoId()',
    '[attr.data-disabled]': 'disabled() ? "true" : "false"',
  },
})
export class SdCardGroup<T = unknown> {
  /** Selected value, selected values, or `null` when there is no selection. */
  readonly model = model<T | T[] | null>(null);
  /** Whether more than one card can be selected. Bare attributes coerce to `true`. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Whether every descendant card is effectively disabled. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Stable suffix used by the Core UI inspector and end-to-end selectors. */
  readonly autoId = input<string | null | undefined>(undefined);
  /** Default semantic color inherited by descendant cards. */
  readonly color = input<SdColor, SdColor | null | undefined>(SD_CARD_DEFAULT_COLOR, {
    transform: value => value || SD_CARD_DEFAULT_COLOR,
  });
  /** Equality used for both selection lookup and immutable removal. */
  readonly compareWith = input<SdCardCompareWith<T>>(Object.is);
  /** Emits only after an accepted user activation changes `model`. */
  readonly sdChange = output<T | T[] | null>();
  protected readonly resolvedAutoId = computed(() => (this.autoId() ? `components-card-group-${this.autoId()}` : undefined));
  readonly #members = signal<readonly ɵSdCardGroupMember[]>([]);
  /**
   * Single selection where every card is an `option`: the group is a radiogroup with one tab stop and arrow keys.
   * @internal
   */
  readonly radioMode = computed(() => {
    const members = this.#members();
    return !this.multiple() && members.length > 0 && members.every(member => member.isOption());
  });
  /** The radio that owns the tab stop: the selected enabled one, else the first enabled one in DOM order. */
  readonly #tabStop = computed(() => {
    if (!this.radioMode()) return null;
    const enabled = this.#ordered().filter(member => member.isEnabled());
    return enabled.find(member => member.selected()) ?? enabled[0] ?? null;
  });

  /** @internal Called by descendant cards on creation. */
  ɵregister(member: ɵSdCardGroupMember): void {
    this.#members.update(members => [...members, member]);
  }

  /** @internal Called by descendant cards on destroy. */
  ɵunregister(member: ɵSdCardGroupMember): void {
    this.#members.update(members => members.filter(item => item !== member));
  }

  /** @internal Whether `member` is the radiogroup tab stop. */
  ɵisTabStop(member: ɵSdCardGroupMember): boolean {
    return this.#tabStop() === member;
  }

  /**
   * @internal Moves focus and selection to the next (`step` 1) or previous (`step` -1) enabled radio, wrapping.
   * Selecting never clears: the target is selected unless it already is.
   */
  ɵmoveFocus(from: ɵSdCardGroupMember, step: 1 | -1): void {
    if (this.disabled()) return;
    const enabled = this.#ordered().filter(member => member.isEnabled() || member === from);
    const index = enabled.indexOf(from);
    if (index < 0 || enabled.length < 2) return;
    const target = enabled[(index + step + enabled.length) % enabled.length];
    target.element.focus();
    if (!target.selected()) this.toggle(target.value() as T);
  }

  #ordered(): ɵSdCardGroupMember[] {
    // why: registration order follows creation, not DOM order (for example after an @for reorder).
    return [...this.#members()].sort((a, b) => (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }

  /** Returns whether `value` is selected under the current mode and comparator. */
  isSelected(value: T): boolean {
    const currentModel = this.model();
    const compareWith = this.compareWith();

    if (this.multiple()) {
      return Array.isArray(currentModel) && currentModel.some(modelValue => compareWith(modelValue, value));
    }

    return currentModel !== null && !Array.isArray(currentModel) && compareWith(currentModel, value);
  }

  /** Applies one accepted card activation and emits the resulting model when it changes. */
  toggle(value: T): void {
    if (this.disabled()) return;

    const currentModel = this.model();
    const compareWith = this.compareWith();
    let nextModel: T | T[] | null;

    if (this.multiple()) {
      // why: malformed external values stay untouched until interaction; the next user action
      // normalizes them without introducing an extra, synthetic change event.
      const currentValues = Array.isArray(currentModel) ? currentModel : [];
      const isAlreadySelected = currentValues.some(modelValue => compareWith(modelValue, value));
      nextModel = isAlreadySelected ? currentValues.filter(modelValue => !compareWith(modelValue, value)) : [...currentValues, value];
    } else {
      const isAlreadySelected = currentModel !== null && !Array.isArray(currentModel) && compareWith(currentModel, value);
      nextModel = isAlreadySelected ? null : value;
    }

    if (Object.is(currentModel, nextModel)) return;

    this.model.set(nextModel);
    this.sdChange.emit(nextModel);
  }
}
