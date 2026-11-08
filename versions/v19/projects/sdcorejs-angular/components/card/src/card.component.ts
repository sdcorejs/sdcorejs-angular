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
  contentChild,
  effect,
  inject,
  input,
  isDevMode,
  output,
  signal,
} from '@angular/core';
import { RouterLink, type Params } from '@angular/router';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';
import { SdBadge, type SdBadgeData } from '@sdcorejs/angular/components/badge';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { ɵsdFormatBytes } from '@sdcorejs/angular/utilities/extensions';
import type { Color as SdColor } from '@sdcorejs/utils/models';
import { Subject, Subscription } from 'rxjs';
import { filter, throttleTime } from 'rxjs/operators';
import { SdCardActionsDirective } from './card-actions.directive';
import { SdCardGroup, type ɵSdCardGroupMember } from './card-group.component';
import { SD_CARD_CONFIGURATION } from './card.configuration';
import { SD_CARD_DEFAULT_COLOR } from './card.constants';
import { sdCardFileInfo, sdCardStatDelta, sdCardStatValue, type SdCardFormatContext } from './card.format';
import type { SdCardBehavior, SdCardContent, SdCardSize } from './card.model';
import { sdCardBehaviorAllowed } from './card.utils';

@Component({
  selector: 'sd-card',
  exportAs: 'sdCard',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, SdAvatar, SdBadge, SdIcon, SdTranslatePipe],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'hostRole()',
    '[attr.tabindex]': 'hostTabIndex()',
    '[attr.aria-label]': 'mode() === "link" ? null : accessibleLabel()',
    '[attr.aria-pressed]': 'mode() === "select" && !isOption() ? (selected() ? "true" : "false") : null',
    '[attr.aria-checked]': 'isOption() ? (selected() ? "true" : "false") : null',
    '[attr.aria-disabled]': 'mode() === "select" ? (effectiveDisabled() ? "true" : "false") : null',
    '[attr.data-autoid]': 'resolvedAutoId()',
    '[attr.data-selected]': 'selected() ? "true" : "false"',
    '[attr.data-disabled]': 'effectiveDisabled() ? "true" : "false"',
    '[class.sd-card--static]': 'mode() === "static"',
    '[class.sd-card--link]': 'mode() === "link"',
    '[class.sd-card--select]': 'mode() === "select"',
    '[class.sd-card--content]': 'layout() !== undefined',
    '[class.sd-card--sm]': 'layout() !== undefined && resolvedSize() === "sm"',
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
  readonly #i18n = inject(I18nService);
  readonly #configuration = inject(SD_CARD_CONFIGURATION, { optional: true });

  /** Value used by the nearest group selection model. Required for `select` inside a group. */
  readonly value = input<NonNullable<T> | undefined>(undefined);
  /** Interaction model; defaults to `select` inside `sd-card-group` and `static` elsewhere. */
  readonly behavior = input<SdCardBehavior | undefined>(undefined);
  /** Built-in layout and its data; without it the card projects `ng-content`. */
  readonly content = input<SdCardContent | undefined>(undefined);
  /** Density; layouts without an `sm` variant (`option`, `file`) always render `md`. */
  readonly size = input<SdCardSize | undefined>(undefined);
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
  readonly #validBehavior = computed<SdCardBehavior>(() => (this.#behaviorAllowed() ? this.#requestedBehavior() : 'static'));
  protected readonly layout = computed(() => this.content()?.layout);
  /** Rendered behavior. A stat link whose value is 0 renders static so it never opens an empty list. */
  protected readonly mode = computed<SdCardBehavior>(() => {
    const behavior = this.#validBehavior();
    const content = this.content();
    if (behavior === 'link' && content?.layout === 'stat' && content.data.value === 0) return 'static';
    return behavior;
  });
  protected readonly resolvedSize = computed<SdCardSize>(() => {
    const layout = this.layout();
    if (layout === 'option' || layout === 'file') return 'md';
    return this.size() ?? 'md';
  });
  readonly #formatContext = computed<SdCardFormatContext>(() => ({
    locale: this.#i18n.locale(),
    compactDisplay: this.#configuration?.compactDisplay,
  }));
  protected readonly stat = computed(() => {
    const content = this.content();
    if (content?.layout !== 'stat') return null;
    const context = this.#formatContext();
    return { data: content.data, value: sdCardStatValue(content.data, context), delta: sdCardStatDelta(content.data, context) };
  });
  /** Accessible name of the focusable element (host for select/static, anchor for link) for built-in layouts. */
  protected readonly accessibleLabel = computed(() => {
    const entity = this.entity();
    if (entity) return sdCardJoinLabel(entity.data.title, entity.data.subtitle, sdCardBadgeText(entity.data.badge));
    const file = this.file();
    if (file) return sdCardJoinLabel(file.data.name, file.info.extension, file.info.size);
    const stat = this.stat();
    if (!stat) return null;
    const delta = stat.delta;
    let deltaText = '';
    if (delta) {
      deltaText =
        delta.direction === 'flat'
          ? this.#i18n.t('core.component.card.delta-unchanged')
          : this.#i18n.t(`core.component.card.delta-${delta.direction}`, { value: delta.display });
    }
    return sdCardJoinLabel(stat.data.label, stat.value.full, deltaText, stat.data.context);
  });
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
  /** The card renders the `option` layout as a selectable choice. */
  protected readonly isOption = computed(() => this.mode() === 'select' && this.layout() === 'option');
  /** Option cards read as checkboxes unless they sit in a single-selection group. */
  protected readonly optionMultiple = computed(() => !this.#group || this.#group.multiple());
  protected readonly checkIcon = computed(() => {
    const selected = this.selected();
    if (this.optionMultiple()) return selected ? 'check_box' : 'check_box_outline_blank';
    return selected ? 'check_circle' : 'radio_button_unchecked';
  });
  protected readonly option = computed(() => {
    const content = this.content();
    return content?.layout === 'option' ? content.data : null;
  });
  protected readonly file = computed(() => {
    const content = this.content();
    if (content?.layout !== 'file') return null;
    const { name, type, size } = content.data;
    const info = sdCardFileInfo(name, type, ɵsdFormatBytes(size, this.#i18n.locale()));
    return { data: content.data, info, meta: [info.extension, info.size].filter(Boolean).join(' · ') };
  });
  protected readonly shortcut = computed(() => {
    const content = this.content();
    return content?.layout === 'shortcut' ? content.data : null;
  });
  protected readonly actionsTemplate = contentChild(SdCardActionsDirective);
  /** Action template, rendered only for `entity` at md and for `file`. */
  protected readonly actions = computed(() => {
    const layout = this.layout();
    const supported = layout === 'file' || (layout === 'entity' && this.resolvedSize() === 'md');
    return supported ? (this.actionsTemplate() ?? null) : null;
  });
  protected readonly entity = computed(() => {
    const content = this.content();
    if (content?.layout !== 'entity') return null;
    const meta = (content.data.meta ?? []).slice(0, 3);
    return { data: content.data, meta, metaColumns: `repeat(${meta.length}, minmax(0, 1fr))` };
  });
  readonly #member: ɵSdCardGroupMember = {
    element: this.#elementRef.nativeElement,
    isOption: this.isOption,
    isEnabled: computed(() => this.mode() === 'select' && !this.effectiveDisabled()),
    selected: this.selected,
    value: this.value,
  };
  protected readonly hostRole = computed(() => {
    if (this.isOption()) return this.optionMultiple() ? 'checkbox' : 'radio';
    if (this.mode() === 'select') return 'button';
    // why: a static layout card is one labelled region; screen readers announce its summary once.
    return this.mode() === 'static' && this.accessibleLabel() ? 'group' : null;
  });
  protected readonly hostTabIndex = computed(() => {
    if (this.mode() !== 'select') return null;
    if (this.effectiveDisabled()) return -1;
    // why: a radiogroup is one tab stop; arrow keys move between its radios.
    if (this.#group?.radioMode()) return this.#group.ɵisTabStop(this.#member) ? 0 : -1;
    return 0;
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
    // why: the action area belongs to the consumer; its clicks never select, navigate or reach the card's listeners.
    if ((event.target as Element | null)?.closest?.('.sd-card__actions')) {
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
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
    this.#group?.ɵregister(this.#member);

    effect(() => {
      if (!isDevMode()) return;
      const requested = this.#requestedBehavior();
      const layout = this.content()?.layout;
      const hasLink = this.link() != null;
      const hasHref = !!this.href();
      if (!this.#behaviorAllowed()) {
        this.#report('error', 'behavior', `behavior "${requested}" is not valid for layout "${layout}"; rendering as "static".`);
      }
      if ((hasLink || hasHref) && this.#validBehavior() !== 'link') {
        this.#report('warn', 'link-ignored', '`link`/`href` is set but the resolved behavior is not "link"; the card renders no anchor.');
      }
      if (hasLink && hasHref) {
        this.#report('warn', 'link-and-href', 'both `link` and `href` are set; `link` is used.');
      }
      if (this.mode() === 'select' && this.#group && this.value() === undefined) {
        this.#report('error', 'value', 'a selectable card inside `sd-card-group` needs `value`; clicks are ignored.');
      }
      if (this.actionsTemplate() && layout !== 'entity' && layout !== 'file') {
        this.#report('warn', 'actions', '`sdCardActions` only renders for the "entity" and "file" layouts.');
      }
      const stat = this.stat();
      if (stat?.value.mismatch) {
        this.#report('warn', 'format', `stat value "${stat.value.display}" is a string but \`format\` is not "text"; it is shown as is.`);
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
    const step = SD_CARD_ARROW_STEPS[event.key];
    if (step && this.#group?.radioMode()) {
      event.preventDefault();
      this.#group.ɵmoveFocus(this.#member, step);
      return;
    }
    if (this.effectiveDisabled() || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    event.stopPropagation();
    this.#elementRef.nativeElement.click();
  }

  ngOnDestroy(): void {
    const element = this.#elementRef.nativeElement;
    element.removeEventListener('click', this.#captureClickListener, { capture: true });
    element.removeEventListener('click', this.#bubbleClickListener);
    this.#group?.ɵunregister(this.#member);
    this.#subscription.unsubscribe();
  }

  /** Logs a dev-mode diagnostic once per instance and key. */
  #report(level: 'error' | 'warn', key: string, message: string): void {
    if (this.#reported.has(key)) return;
    this.#reported.add(key);
    console[level](`[sd-card] ${message}`);
  }
}

/** Arrow keys of a radiogroup: right/down move forward, left/up move back. */
const SD_CARD_ARROW_STEPS: Readonly<Record<string, 1 | -1>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Visible text of a badge for an accessible name. */
function sdCardBadgeText(badge: SdBadgeData | undefined): string {
  if (!badge) return '';
  return [badge.label, badge.title].filter(part => part !== null && part !== undefined && part !== '').join(' ');
}

/** Joins the non-empty parts of an accessible name with commas. */
function sdCardJoinLabel(...parts: (string | null | undefined)[]): string {
  return parts.filter(part => !!part?.trim()).join(', ');
}
