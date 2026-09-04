import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model, output } from '@angular/core';
import type { Color as SdColor } from '@sdcorejs/utils/models';
import { SD_CARD_DEFAULT_COLOR } from './card.constants';

/** Compares a model item with a card value for selection. */
export type SdCardCompareWith<T> = (modelValue: T, cardValue: T) => boolean;

/** Owns single or multiple selection state for descendant `SdCard` instances. */
@Component({
  selector: 'sd-card-group',
  standalone: true,
  templateUrl: './card-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
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
