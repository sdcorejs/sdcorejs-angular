import { NgTemplateOutlet } from '@angular/common';
import {
  AfterRenderRef,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormControl, ValidatorFn } from '@angular/forms';
import { Utilities } from '@sdcorejs/utils/fns';
import { Color, Size } from '@sdcorejs/utils/models';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdInlineErrorValidator, ɵSdFormControlParent, ɵsdFormControlConnector } from '@sdcorejs/angular/forms/models';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import {
  SdSegmentedItem,
  SdSegmentedItemTemplateContext,
  SdSegmentedModel,
  SdSegmentedOption,
  SdSegmentedType,
  SdSegmentedValue,
} from './segmented.model';

@Directive({ selector: 'ng-template[sdSegmentedItemTemplate]', standalone: true })
export class SdSegmentedItemTemplateDirective<T extends SdSegmentedValue = SdSegmentedValue> {
  /** Optional items binding supplies strict template type inference. */
  readonly items = input<readonly SdSegmentedItem<T>[] | ''>('', { alias: 'sdSegmentedItemTemplate' });
  readonly template = inject<TemplateRef<SdSegmentedItemTemplateContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T extends SdSegmentedValue>(
    _directive: SdSegmentedItemTemplateDirective<T>,
    _context: unknown
  ): _context is SdSegmentedItemTemplateContext<T> {
    return true;
  }
}

/** Segmented control: a form-integrated choice control; the consumer owns any associated content. */
@Component({
  selector: 'sd-segmented',
  standalone: true,
  imports: [NgTemplateOutlet, SdIcon, SdLabel, SdTranslatePipe],
  templateUrl: './segmented.component.html',
  styleUrl: './segmented.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-color]': 'color()', '[attr.data-size]': 'size()', '[attr.data-type]': 'type()' },
})
export class SdSegmentedComponent<T extends SdSegmentedValue = SdSegmentedValue> {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #i18n = inject(I18nService);
  #revealRef?: AfterRenderRef;
  #revealTarget?: HTMLButtonElement;
  readonly id = `sd-segmented-${Utilities.generateUuid()}`;
  readonly items = input<readonly SdSegmentedItem<T>[], readonly SdSegmentedItem<T>[] | null | undefined>([], {
    transform: v => v ?? [],
  });
  readonly option = input<SdSegmentedOption, SdSegmentedOption | null | undefined>({}, { transform: v => v ?? {} });
  readonly model = model<SdSegmentedModel<T>>(null);
  readonly label = input<string | null | undefined>();
  readonly ariaLabel = input<string | null | undefined>();
  readonly size = input<Size>('md');
  readonly color = input<Color>('primary');
  readonly type = input<SdSegmentedType>('light');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly inlineError = input<string | null | undefined>();
  readonly validator = input<ValidatorFn | readonly ValidatorFn[] | null | undefined>();
  readonly form = input<ɵSdFormControlParent>();
  readonly name = input<string | null | undefined>();
  readonly autoId = input<string | null | undefined>();
  readonly sdChange = output<SdSegmentedModel<T>>();
  readonly formControl = new FormControl<SdSegmentedModel<T>>(null);
  readonly #connector = ɵsdFormControlConnector<SdSegmentedModel<T>, SdSegmentedModel<T>>({
    form: this.form,
    name: computed(() => this.name() ?? this.id),
    control: computed(() => this.formControl),
    model: this.model,
    modelToControl: value => value,
    controlToModel: value => value,
    writeModel: value => {
      this.model.set(value);
      this.sdChange.emit(value);
    },
    modelEquals: equalSegmentedModel,
    controlEquals: equalSegmentedModel,
    required: this.required,
    disabled: this.disabled,
    readonly: this.readonly,
    validators: computed(() => {
      const validator = this.validator();
      const validators = validator ? (typeof validator === 'function' ? [validator] : [...validator]) : [];
      if (this.inlineError()) validators.push(SdInlineErrorValidator);
      return validators;
    }),
  });
  protected readonly state = this.#connector.state;
  protected readonly itemTemplate = contentChild(SdSegmentedItemTemplateDirective<T>);
  protected readonly multiple = computed(() => !!this.option().multiple);
  protected readonly focused = signal<T | undefined>(undefined);
  protected readonly dataInvalid = computed(() => {
    const seen = new Set<T>();
    return this.items().some(item => {
      if (
        !item ||
        typeof item.label !== 'string' ||
        !item.label.trim() ||
        seen.has(item.value) ||
        !['string', 'number', 'boolean'].includes(typeof item.value) ||
        (typeof item.value === 'number' && !Number.isFinite(item.value))
      )
        return true;
      seen.add(item.value);
      return false;
    });
  });
  protected readonly blocked = computed(
    () => this.disabled() || this.state().disabled || this.readonly() || this.loading() || this.dataInvalid()
  );
  protected readonly selectedValues = computed<readonly T[]>(() => {
    const value = this.model();
    if (Array.isArray(value)) return this.multiple() ? value : [];
    return value == null ? [] : [value as T];
  });
  protected readonly tabValue = computed(() => {
    const enabled = this.items().filter(item => !item.disabled);
    const focus = enabled.find(item => Object.is(item.value, this.focused()));
    const selected = enabled.find(item => this.selected(item));
    return (focus ?? selected ?? enabled[0])?.value;
  });
  protected readonly errorMessage = computed(() => {
    if (!this.state().invalid) return undefined;
    return this.inlineError() || (this.formControl.hasError('required') ? this.#i18n.t('core.form.segmented.required') : undefined);
  });
  protected readonly groupLabel = computed(() => this.ariaLabel() || this.#i18n.t('core.form.segmented.label'));
  protected selected(item: SdSegmentedItem<T>): boolean {
    return this.selectedValues().some(value => Object.is(value, item.value));
  }
  protected context(item: SdSegmentedItem<T>): SdSegmentedItemTemplateContext<T> {
    return { $implicit: item, item, selected: this.selected(item) };
  }

  protected choose(item: SdSegmentedItem<T>): void {
    if (this.blocked() || item.disabled) return;
    const current = this.selectedValues();
    let next: SdSegmentedModel<T>;
    if (this.multiple()) {
      const values = this.selected(item) ? current.filter(value => !Object.is(value, item.value)) : [...current, item.value];
      const known = this.items()
        .map(candidate => candidate.value)
        .filter(value => values.some(selected => Object.is(value, selected)));
      next = [...known, ...values.filter(value => !this.items().some(candidate => Object.is(value, candidate.value)))];
    } else {
      if (this.selected(item) && !this.option().allowEmpty) return;
      next = this.selected(item) ? null : item.value;
    }
    this.formControl.markAsDirty();
    this.formControl.setValue(next);
  }

  protected keydown(event: KeyboardEvent, item: SdSegmentedItem<T>): void {
    if (this.blocked()) return;
    const vertical = this.option().orientation === 'vertical';
    const rtl = getComputedStyle(this.#host.nativeElement).direction === 'rtl';
    const previous = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const next = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    if (![previous, next, 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const enabled = this.items().filter(candidate => !candidate.disabled);
    if (!enabled.length) return;
    const index = enabled.findIndex(candidate => Object.is(candidate.value, item.value));
    const targetIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? enabled.length - 1
          : (index + (event.key === previous ? -1 : 1) + enabled.length) % enabled.length;
    const target = enabled[targetIndex];
    this.focused.set(target.value);
    const actualIndex = this.items().indexOf(target);
    const button = this.#host.nativeElement.querySelector<HTMLButtonElement>(`[data-segmented-index="${actualIndex}"]`);
    // Native focus scrolling moves ancestors and clips the outward ring; this track reveals it instead.
    button?.focus({ preventScroll: true });
    if (!this.multiple() && !this.selected(target)) this.choose(target);
    if (button) this.#reveal(button, vertical);
  }

  /**
   * After the selected styling renders, scroll only this control's track (instantly, active axis) so the
   * focused choice plus its outward focus ring is fully visible, moving no further than that.
   */
  #reveal(button: HTMLButtonElement, vertical: boolean): void {
    this.#revealRef?.destroy();
    this.#revealTarget = button;
    this.#revealRef = afterNextRender(
      () => {
        this.#revealRef = undefined;
        const track = button.parentElement;
        const document = button.ownerDocument;
        const view = document.defaultView;
        // Stale work is skipped, never refocused: a newer key, focus moved away, or the choice left the control.
        if (this.#revealTarget !== button || !track || !view || document.activeElement !== button) return;
        if (!this.#host.nativeElement.contains(track)) return;
        this.#revealTarget = undefined;
        const buttonStyle = view.getComputedStyle(button);
        // Reserve the focus indicator (not the larger inline padding, which would over-scroll): the settled ring
        // from the stylesheet's tokens/fallbacks, or the drawn outline if larger. The drawn value alone is not
        // reliable: no outline is drawn when `:focus-visible` heuristics miss after script focus, and a consumer
        // transition (e.g. reduced-motion `* { transition-duration: 0.01ms }`) still reports its start
        // (3px + 0 offset) here, a frame before the final 2px + 2px ring.
        const settled =
          px(buttonStyle.getPropertyValue('--sd-focus-ring-width'), 2) + px(buttonStyle.getPropertyValue('--sd-focus-ring-offset'), 2);
        const drawn = buttonStyle.outlineStyle === 'none' ? 0 : px(buttonStyle.outlineWidth, 0) + px(buttonStyle.outlineOffset, 0);
        const ring = Math.max(0, settled, drawn);
        const box = track.getBoundingClientRect();
        const item = button.getBoundingClientRect();
        // Physical coordinates, so RTL's negative scrollLeft needs no special case.
        const axis = vertical
          ? { start: item.top, end: item.bottom, clip: box.top + track.clientTop, size: track.clientHeight }
          : { start: item.left, end: item.right, clip: box.left + track.clientLeft, size: track.clientWidth };
        const start = axis.start - ring;
        const end = axis.end + ring;
        const delta =
          start < axis.clip ? Math.floor(start - axis.clip) : end > axis.clip + axis.size ? Math.ceil(end - axis.clip - axis.size) : 0;
        if (delta) track.scrollBy(vertical ? { top: delta, behavior: 'instant' } : { left: delta, behavior: 'instant' });
      },
      { injector: this.#injector }
    );
  }

  protected blur(event: FocusEvent): void {
    if (!event.relatedTarget || !this.#host.nativeElement.contains(event.relatedTarget as Node)) {
      this.focused.set(undefined);
      this.#connector.markAsTouched();
    }
  }
  /** Refresh validators in existing Core UI form submission flows. */
  reValidate(): void {
    this.formControl.updateValueAndValidity({ emitEvent: true });
  }
}

/** A computed length in px, or `fallback` when it is missing or not a plain length. */
function px(value: string, fallback: number): number {
  const length = parseFloat(value);
  return Number.isFinite(length) ? length : fallback;
}

function equalSegmentedModel<T extends SdSegmentedValue>(left: SdSegmentedModel<T>, right: SdSegmentedModel<T>): boolean {
  if (!Array.isArray(left) || !Array.isArray(right)) return Object.is(left, right);
  return left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}
