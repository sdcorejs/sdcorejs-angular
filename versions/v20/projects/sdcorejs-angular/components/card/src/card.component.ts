import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Signal,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { Color as SdColor } from '@sdcorejs/utils/models';
import { Subject, Subscription } from 'rxjs';
import { filter, throttleTime } from 'rxjs/operators';
import { SdCardGroup } from './card-group.component';
import { SD_CARD_DEFAULT_COLOR } from './card.constants';

@Component({
  selector: 'sd-card',
  exportAs: 'sdCard',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'button',
    '[attr.tabindex]': 'effectiveDisabled() ? -1 : 0',
    '[attr.aria-pressed]': 'selected() ? "true" : "false"',
    '[attr.aria-disabled]': 'effectiveDisabled() ? "true" : "false"',
    '[attr.data-autoid]': 'resolvedAutoId()',
    '[attr.data-selected]': 'selected() ? "true" : "false"',
    '[attr.data-disabled]': 'effectiveDisabled() ? "true" : "false"',
    '[class.sd-selected]': 'selected()',
    '[class.sd-disabled]': 'effectiveDisabled()',
    '[class.sd-c-primary]': 'effectiveColor() === "primary"',
    '[class.sd-c-secondary]': 'effectiveColor() === "secondary"',
    '[class.sd-c-info]': 'effectiveColor() === "info"',
    '[class.sd-c-success]': 'effectiveColor() === "success"',
    '[class.sd-c-warning]': 'effectiveColor() === "warning"',
    '[class.sd-c-error]': 'effectiveColor() === "error"',
    '(keydown)': 'onKeydown($event)',
  },
})
/** Selectable card shell that projects arbitrary consumer content and can also operate standalone. */
export class SdCard<T = unknown> implements OnInit, OnDestroy {
  readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  // why: Angular DI erases generic parameters; the card value supplies the matching
  // compile-time type while the runtime token must remain the concrete nearest group.
  readonly #group = inject(SdCardGroup, { optional: true }) as SdCardGroup<NonNullable<T>> | null;
  readonly #standaloneSelected = signal(false);
  readonly #clickSubject = new Subject<Event>();
  readonly #subscription = new Subscription();

  /** Required non-null value used by the nearest group selection model. */
  readonly value = input.required<NonNullable<T>>();
  /** Whether this card is disabled independently of its group. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Stable suffix used by the Core UI inspector and end-to-end selectors. */
  readonly autoId = input<string | null | undefined>(undefined);
  /** Optional semantic color override; otherwise the nearest group or Core UI default is used. */
  readonly color = input<SdColor | undefined, SdColor | null | undefined>(undefined, {
    transform: value => value || undefined,
  });
  /** Emits the accepted native `Event` after selection state has been updated. */
  readonly click = output<Event>();
  /** Read-only reactive selection state; grouped cards derive it exclusively from the group model. */
  readonly selected: Signal<boolean> = computed(() => (this.#group ? this.#group.isSelected(this.value()) : this.#standaloneSelected()));
  protected readonly effectiveDisabled = computed(() => this.disabled() || (this.#group?.disabled() ?? false));
  protected readonly effectiveColor = computed(() => this.color() ?? this.#group?.color() ?? SD_CARD_DEFAULT_COLOR);
  protected readonly resolvedAutoId = computed(() => (this.autoId() ? `components-card-${this.autoId()}` : undefined));

  readonly #captureClickListener = (event: Event): void => {
    if (!this.effectiveDisabled()) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  readonly #bubbleClickListener = (event: Event): void => {
    // why: the host has a custom output named `click`; stopImmediatePropagation prevents Angular
    // consumers from receiving this native event as well as the explicit output.
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (this.effectiveDisabled()) return;
    this.#clickSubject.next(event);
  };

  constructor() {
    const element = this.#elementRef.nativeElement;
    element.addEventListener('click', this.#captureClickListener, { capture: true });
    element.addEventListener('click', this.#bubbleClickListener);
  }

  ngOnInit(): void {
    this.#subscription.add(
      this.#clickSubject
        .pipe(
          throttleTime(300, undefined, { leading: true, trailing: false }),
          filter(() => !this.effectiveDisabled())
        )
        .subscribe(event => {
          // why: consumers must observe the new selected/model state from their click handler,
          // and grouped cards must deliver sdChange before the card click output.
          if (this.#group) {
            this.#group.toggle(this.value());
          } else {
            this.#standaloneSelected.update(selected => !selected);
          }

          this.click.emit(event);
        })
    );
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.effectiveDisabled() || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    event.stopPropagation();
    this.#elementRef.nativeElement.click();
  }

  ngOnDestroy(): void {
    const element = this.#elementRef.nativeElement;
    element.removeEventListener('click', this.#captureClickListener, { capture: true });
    element.removeEventListener('click', this.#bubbleClickListener);
    this.#subscription.unsubscribe();
  }
}
