import { SD_BUTTON_ENTRY, SdActionPopover } from './action-popover';
import { SdButtonItem } from './button-item.component';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  contentChildren,
  viewChild,
  TemplateRef,
  afterRenderEffect,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Color } from '@sdcorejs/utils/models';
import { SdIcon, type SdIconSet } from '@sdcorejs/angular/modules/icon';
import { Subject, Subscription } from 'rxjs';
import { filter, throttleTime } from 'rxjs/operators';

// Export các Type ra ngoài để tái sử dụng ở file config/interface
export type SdButtonType = 'fill' | 'light' | 'outline' | 'text';
export type SdButtonSize = 'sm' | 'md' | 'lg';
export type SdButtonHtmlType = 'button' | 'submit' | 'reset';
export type SdButtonColor = Color | 'black';

@Component({
  selector: 'sd-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss', './action-popover.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, SdIcon],
  host: {
    '[class.sd-disabled]': 'disabled()',
    '[class.sd-loading]': 'loading()',
    '[class.sd-block]': 'block()',
    '[attr.disabled]': 'disabled() ? "true" : null',
  },
})
export class SdButton implements OnInit, OnDestroy {
  readonly entries = contentChildren(SD_BUTTON_ENTRY);
  readonly hasActions = computed(() => this.entries().some(entry => entry.kind === 'item'));
  readonly trigger = viewChild<ElementRef<HTMLButtonElement>, ElementRef<HTMLButtonElement>>('trigger', { read: ElementRef });
  readonly definitions = viewChild.required<ElementRef<HTMLElement>>('definitions');
  readonly projectedLabel = viewChild<ElementRef<HTMLElement>>('projectedLabel');
  readonly hasProjectedLabel = signal(false);
  readonly isIconOnly = computed(() => !!(this.prefixIcon() || this.suffixIcon()) && !this.title() && !this.hasProjectedLabel());
  readonly menuTemplate = viewChild.required<TemplateRef<unknown>>('actionMenu');
  readonly popover = new SdActionPopover();

  onTriggerPointerEnter(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || !this.openOnHover() || !this.hasActions() || this.disabled() || this.loading()) return;
    const trigger = this.trigger()?.nativeElement;
    if (trigger) this.popover.open(this.menuTemplate(), trigger, false, true);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (!this.hasActions() || this.disabled() || this.loading()) return;
    if (this.popover.opened() && (event.key === 'Escape' || event.key === 'Tab')) {
      this.popover.keydown(event);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      const trigger = this.trigger()?.nativeElement;
      if (trigger) this.popover.open(this.menuTemplate(), trigger, event.key === 'ArrowUp');
    }
  }

  activateItem(item: SdButtonItem, event: Event): void {
    event.stopPropagation();
    if (item.disabled()) return;
    this.popover.close(true);
    item.click.emit(event);
  }

  // ==========================================
  // 1. INJECTS
  // ==========================================
  private el = inject(ElementRef);

  // ==========================================
  // 2. SIGNAL INPUTS (Bảo mật 100% với Null/Undefined)
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });

  type = input<SdButtonType, SdButtonType | undefined | null>('light', {
    transform: value => value || 'light',
  });

  color = input<SdButtonColor, SdButtonColor | undefined | null>('secondary', {
    transform: value => value || 'secondary',
  });

  size = input<SdButtonSize, SdButtonSize | undefined | null>('sm', {
    transform: value => value || 'sm',
  });

  fontSet = input<SdIconSet | undefined, SdIconSet | undefined | null>(undefined, {
    transform: value => value ?? undefined,
  });

  title = input<string | undefined | null>(undefined);
  width = input<string | undefined | null>(undefined);
  tooltip = input<string | undefined | null>(undefined);
  prefixIcon = input<string | undefined | null>(undefined);
  suffixIcon = input<string | undefined | null>(undefined);

  disabled = input(false, { transform: booleanAttribute });
  readonly openOnHover = input(false, { transform: booleanAttribute });
  loading = input(false, { transform: booleanAttribute });
  block = input(false, { transform: booleanAttribute });

  htmlType = input<SdButtonHtmlType, SdButtonHtmlType | undefined | null>('button', {
    transform: value => value || 'button',
  });

  // ==========================================
  // 3. COMPUTED STATE
  // ==========================================
  autoId = computed(() => (this.autoIdInput() ? `components-button-${this.autoIdInput()}` : undefined));

  /**
   * Accessible name of the trigger. Menu triggers use title/tooltip; icon-only buttons use the tooltip
   * because their icon is `aria-hidden` and they have no visible text.
   */
  readonly ariaLabel = computed(() => {
    if (this.hasActions()) return this.title() || this.tooltip() || null;
    // why: nút chỉ có icon thì icon bị aria-hidden → không set aria-label là nút không có tên với screen reader.
    return this.isIconOnly() ? this.tooltip() || null : null;
  });

  buttonClasses = computed(() => ({
    'c-square': this.isIconOnly(),
    'c-sm': this.size() === 'sm',
    'c-md': this.size() === 'md',
    'c-lg': this.size() === 'lg',
    'c-black': this.color() === 'black',
    'c-disabled': this.disabled(),
    'c-block': this.block(),
  }));

  // ==========================================
  // 4. OUTPUT & RXJS STREAMS
  // ==========================================
  click = output<Event>();

  #clickSubject = new Subject<Event>();
  #subscription = new Subscription();

  constructor() {
    // Projected text can change without changing our content queries or inputs.
    afterRenderEffect(onCleanup => {
      const label = this.trigger()?.nativeElement.querySelector<HTMLElement>('.c-projected-label');
      if (!label) return;
      const update = () => this.hasProjectedLabel.set(!!label.textContent?.trim());
      update();
      const observer = new MutationObserver(update);
      observer.observe(label, { childList: true, characterData: true, subtree: true });
      onCleanup(() => observer.disconnect());
    });
    afterRenderEffect(() => {
      const entries = this.entries();
      const definitions = this.definitions().nativeElement;
      // Angular projects multi-root @if blocks into the default slot. Relocate only
      // our inert definition hosts; their Angular views and label templates stay owned by the consumer.
      for (const entry of entries) {
        if (entry.kind === 'item') {
          entry.disabled();
          entry.color();
          entry.prefixIcon();
          entry.suffixIcon();
        }
        const host = entry.element.nativeElement;
        if (host.parentElement !== definitions) definitions.appendChild(host);
      }
      const actionable = this.hasActions() && !this.disabled() && !this.loading();
      const hover = this.openOnHover();
      const trigger = this.trigger()?.nativeElement;
      untracked(() => {
        if (!hover) this.popover.disableHover();
        if (!actionable) this.popover.close();
        else this.popover.reconcile(trigger);
      });
    });
    // Kỹ thuật Đánh chặn sự kiện (Capture Phase)
    // Tóm sống mọi sự kiện click ngay khi nó vừa chạm vào component
    this.el.nativeElement.addEventListener(
      'click',
      (event: Event) => {
        if (this.disabled() || this.loading()) {
          // Nghiền nát sự kiện, không cho Angular phát (click) ra component cha
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      },
      { capture: true }
    );
  }

  ngOnInit() {
    this.#subscription.add(
      this.#clickSubject
        .pipe(
          throttleTime(300, undefined, { leading: true, trailing: false }),
          filter(() => !this.disabled() && !this.loading())
        )
        .subscribe(event => {
          this.click.emit(event);
        })
    );
  }

  // Nhận click từ thẻ button con bên trong
  onInternalClick(event: Event) {
    event.stopPropagation();

    if (this.disabled() || this.loading()) {
      return;
    }

    if (this.hasActions()) {
      event.preventDefault();
      const trigger = this.trigger()?.nativeElement;
      if (this.popover.opened()) this.popover.close(true);
      else if (trigger) this.popover.open(this.menuTemplate(), trigger);
      return;
    }
    this.#clickSubject.next(event);
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }
}
