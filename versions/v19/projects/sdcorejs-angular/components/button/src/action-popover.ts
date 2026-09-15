import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DestroyRef, InjectionToken, TemplateRef, ViewContainerRef, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import type { SdButtonItem } from './button-item.component';
import type { SdButtonItemDivider } from './button-item-divider.component';

export const SD_BUTTON_ENTRY = new InjectionToken<SdButtonItem | SdButtonItemDivider>('SD_BUTTON_ENTRY');

const POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

/** Component-local overlay owner; deliberately independent of action data and callbacks. */
export class SdActionPopover {
  static #nextId = 0;
  readonly id = `sd-action-popover-${SdActionPopover.#nextId++}`;
  readonly opened = signal(false);
  readonly #overlay = inject(Overlay);
  readonly #views = inject(ViewContainerRef);
  #ref?: OverlayRef;
  #trigger?: HTMLButtonElement;
  #subscriptions = new Subscription();
  #focused?: HTMLElement;
  #closeTimer?: ReturnType<typeof setTimeout>;
  #hoverOpened = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.close());
  }

  open(template: TemplateRef<unknown>, trigger: HTMLButtonElement, last = false, hover = false): void {
    this.cancelHoverClose();
    if (this.opened()) {
      if (!hover) {
        this.#hoverOpened = false;
        this.focus(last ? -1 : 0);
      }
      return;
    }
    this.#hoverOpened = hover;
    this.#trigger = trigger;
    const position = this.#overlay
      .position()
      .flexibleConnectedTo(trigger)
      .withPositions(POSITIONS)
      .withViewportMargin(8)
      .withPush(true)
      .withFlexibleDimensions(true);
    const ref = this.#overlay.create({
      positionStrategy: position,
      scrollStrategy: this.#overlay.scrollStrategies.reposition(),
      maxWidth: 'calc(100vw - 16px)',
      maxHeight: 'calc(100dvh - 16px)',
    });
    this.#ref = ref;
    this.opened.set(true);
    ref.attach(new TemplatePortal(template, this.#views)).detectChanges();
    this.#subscriptions.add(
      ref.outsidePointerEvents().subscribe(event => {
        if (!trigger.contains(event.target as Node)) this.close();
      })
    );
    if (!hover) this.focus(last ? -1 : 0);
  }

  cancelHoverClose(): void {
    clearTimeout(this.#closeTimer);
    this.#closeTimer = undefined;
  }

  scheduleHoverClose(): void {
    this.cancelHoverClose();
    if (!this.#hoverOpened) return;
    // Bridge the gap between the trigger and the separately attached overlay.
    this.#closeTimer = setTimeout(() => this.close(), 150);
  }

  retainForKeyboard(): void {
    this.cancelHoverClose();
    this.#hoverOpened = false;
  }

  disableHover(): void {
    if (this.#hoverOpened) this.close();
    else this.cancelHoverClose();
  }

  close(restore = false): void {
    this.cancelHoverClose();
    this.#hoverOpened = false;
    const trigger = this.#trigger;
    this.#subscriptions.unsubscribe();
    this.#subscriptions = new Subscription();
    this.#ref?.dispose();
    this.#ref = undefined;
    this.#focused = undefined;
    this.opened.set(false);
    if (restore && trigger?.isConnected && !trigger.disabled) trigger.focus();
  }

  private items(): HTMLButtonElement[] {
    return Array.from(this.#ref?.overlayElement.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not(:disabled)') ?? []);
  }

  private focus(index: number): void {
    const items = this.items();
    const target = items.length
      ? items[(index + items.length) % items.length]
      : this.#ref?.overlayElement.querySelector<HTMLElement>('[role="menu"]');
    target?.focus();
    this.#focused = target ?? undefined;
  }

  /** Run after rendering so removed/disabled definitions cannot leave focus on a stale item. */
  reconcile(trigger: HTMLButtonElement | undefined): void {
    if (!this.opened()) return;
    if (trigger !== this.#trigger || !trigger?.isConnected) {
      this.close();
      return;
    }
    if (this.#focused && (!this.#focused.isConnected || this.#focused.matches(':disabled'))) this.focus(0);
    this.#ref?.updatePosition();
  }

  keydown(event: KeyboardEvent): void {
    const items = this.items();
    const index = items.indexOf(event.target as HTMLButtonElement);
    switch (event.key) {
      case 'ArrowDown':
        this.focus(index + 1);
        break;
      case 'ArrowUp':
        this.focus(index < 0 ? -1 : index - 1);
        break;
      case 'Home':
        this.focus(0);
        break;
      case 'End':
        this.focus(-1);
        break;
      case 'Escape':
        this.close(true);
        break;
      case 'Tab':
        this.close(true);
        event.stopPropagation();
        return;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  }
}
