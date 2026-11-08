import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Signal,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  output,
  signal,
} from '@angular/core';
import { RouterLink, type Params } from '@angular/router';
import type { Color as SdColor } from '@sdcorejs/utils/models';
import { Subject, Subscription } from 'rxjs';
import { filter, throttleTime } from 'rxjs/operators';
import { SdCardGroup } from './card-group.component';
import { SD_CARD_DEFAULT_COLOR } from './card.constants';
import type { SdCardBehavior, SdCardContent } from './card.model';
import { sdCardBehaviorAllowed } from './card.utils';

@Component({
  selector: 'sd-card',
  exportAs: 'sdCard',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'hostRole()',
    '[attr.tabindex]': 'hostTabIndex()',
    '[attr.aria-pressed]': 'mode() === "select" ? (selected() ? "true" : "false") : null',
    '[attr.aria-disabled]': 'mode() === "select" ? (effectiveDisabled() ? "true" : "false") : null',
    '[attr.data-autoid]': 'resolvedAutoId()',
    '[attr.data-selected]': 'selected() ? "true" : "false"',
    '[attr.data-disabled]': 'effectiveDisabled() ? "true" : "false"',
    '[class.sd-card--static]': 'mode() === "static"',
    '[class.sd-card--link]': 'mode() === "link"',
    '[class.sd-card--select]': 'mode() === "select"',
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
/** Card surface: static, link or selectable, projecting consumer content or rendering a built-in layout. */
export class SdCard<T = unknown> implements OnInit, OnDestroy {
  readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  // why: Angular DI erases generic parameters; the card value supplies the matching
  // compile-time type while the runtime token must remain the concrete nearest group.
  readonly #group = inject(SdCardGroup, { optional: true }) as SdCardGroup<NonNullable<T>> | null;
  readonly #standaloneSelected = signal(false);
  readonly #clickSubject = new Subject<Event>();
  readonly #subscription = new Subscription();
  readonly #reported = new Set<string>();

  /** Value used by the nearest group selection model. Required for `select` inside a group. */
  readonly value = input<NonNullable<T> | undefined>(undefined);
  /** Interaction model; defaults to `select` inside `sd-card-group` and `static` elsewhere. */
  readonly behavior = input<SdCardBehavior | undefined>(undefined);
  /** Built-in layout and its data; without it the card projects `ng-content`. */
  readonly content = input<SdCardContent | undefined>(undefined);
  /** Router commands for `behavior="link"` (rendered through `RouterLink`). */
  readonly link = input<string | readonly unknown[] | undefined>(undefined);
  /** Query params that go with `link`. */
  readonly queryParams = input<Params | undefined>(undefined);
  /** External URL or file download for `behavior="link"`; `link` wins when both are set. */
  readonly href = input<string | undefined>(undefined);
  /** Anchor target; only applies to `href`. */
  readonly target = input<string | undefined>(undefined);
  /** Whether this card is disabled independently of its group. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Stable suffix used by the Core UI inspector and end-to-end selectors. */
  readonly autoId = input<string | null | undefined>(undefined);
  /** Optional semantic color override; otherwise the nearest group or Core UI default is used. */
  readonly color = input<SdColor | undefined, SdColor | null | undefined>(undefined, {
    transform: value => value || undefined,
  });
  /** `select`: emits the accepted native `Event` after the selection changed. `link`: emits after navigation started. */
  readonly click = output<Event>();

  /** Behavior requested by the consumer or implied by the presence of a group. */
  readonly #requestedBehavior = computed<SdCardBehavior>(() => this.behavior() ?? (this.#group ? 'select' : 'static'));
  readonly #behaviorAllowed = computed(() => sdCardBehaviorAllowed(this.content()?.layout, this.#requestedBehavior()));
  /** Behavior after layout validation; an invalid combination falls back to `static`. */
  protected readonly mode = computed<SdCardBehavior>(() => (this.#behaviorAllowed() ? this.#requestedBehavior() : 'static'));
  /** Read-only selection state; always `false` unless the card behaves as `select`. */
  readonly selected: Signal<boolean> = computed(() => {
    if (this.mode() !== 'select') return false;
    if (!this.#group) return this.#standaloneSelected();
    const value = this.value();
    return value !== undefined && this.#group.isSelected(value);
  });
  protected readonly effectiveDisabled = computed(() => this.disabled() || (this.#group?.disabled() ?? false));
  protected readonly effectiveColor = computed(() => this.color() ?? this.#group?.color() ?? SD_CARD_DEFAULT_COLOR);
  protected readonly resolvedAutoId = computed(() => (this.autoId() ? `components-card-${this.autoId()}` : undefined));
  protected readonly hostRole = computed(() => (this.mode() === 'select' ? 'button' : null));
  protected readonly hostTabIndex = computed(() => {
    if (this.mode() !== 'select') return null;
    return this.effectiveDisabled() ? -1 : 0;
  });
  /** Router link when present; otherwise the external href. */
  protected readonly routerCommands = computed(() => this.link() ?? null);

  readonly #captureClickListener = (event: Event): void => {
    if (this.mode() === 'static' || !this.effectiveDisabled()) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  readonly #bubbleClickListener = (event: Event): void => {
    const mode = this.mode();
    // why: a static card is a plain surface; its native click must reach ancestors untouched.
    if (mode === 'static') return;
    // why: the host has a custom output named `click`; stopImmediatePropagation prevents Angular
    // consumers from receiving this native event as well as the explicit output.
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (this.effectiveDisabled()) return;
    if (mode === 'link') {
      // why: the anchor's own listeners (RouterLink) ran before the click bubbled here, so navigation already started.
      if ((event.target as Element | null)?.closest('.sd-card__link')) this.click.emit(event);
      return;
    }
    this.#clickSubject.next(event);
  };

  constructor() {
    const element = this.#elementRef.nativeElement;
    element.addEventListener('click', this.#captureClickListener, { capture: true });
    element.addEventListener('click', this.#bubbleClickListener);

    effect(() => {
      if (!isDevMode()) return;
      const requested = this.#requestedBehavior();
      const layout = this.content()?.layout;
      const hasLink = this.link() != null;
      const hasHref = !!this.href();
      if (!this.#behaviorAllowed()) {
        this.#report('error', 'behavior', `behavior "${requested}" is not valid for layout "${layout}"; rendering as "static".`);
      }
      if ((hasLink || hasHref) && this.mode() !== 'link') {
        this.#report('warn', 'link-ignored', '`link`/`href` is set but the resolved behavior is not "link"; the card renders no anchor.');
      }
      if (hasLink && hasHref) {
        this.#report('warn', 'link-and-href', 'both `link` and `href` are set; `link` is used.');
      }
      if (this.mode() === 'select' && this.#group && this.value() === undefined) {
        this.#report('error', 'value', 'a selectable card inside `sd-card-group` needs `value`; clicks are ignored.');
      }
    });
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
            const value = this.value();
            if (value === undefined) return;
            this.#group.toggle(value);
          } else {
            this.#standaloneSelected.update(selected => !selected);
          }

          this.click.emit(event);
        })
    );
  }

  protected onKeydown(event: KeyboardEvent): void {
    // why: only the host itself is the button; keys from the inner anchor or action buttons keep their native meaning.
    if (this.mode() !== 'select' || event.target !== this.#elementRef.nativeElement) return;
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

  /** Logs a dev-mode diagnostic once per instance and key. */
  #report(level: 'error' | 'warn', key: string, message: string): void {
    if (this.#reported.has(key)) return;
    this.#reported.add(key);
    console[level](`[sd-card] ${message}`);
  }
}
