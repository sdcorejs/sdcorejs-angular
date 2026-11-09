import { InteractivityChecker } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { hasModifierKey } from '@angular/cdk/keycodes';
import { ConnectedPosition, Overlay, OverlayContainer, OverlayRef } from '@angular/cdk/overlay';
import { _getEventTarget } from '@angular/cdk/platform';
import { TemplatePortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  Injector,
  TemplateRef,
  ViewContainerRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Subject } from 'rxjs';

/** Popup type of a query bar panel; it is also the `aria-haspopup` value of its trigger. */
export type ɵSdQueryPanelRole = 'listbox' | 'dialog' | 'menu';

/**
 * Why a panel closed. `switch`: another panel of the bar (or the same panel for another trigger) opened; `detach`: the
 * panel or its trigger went away. Neither moves focus.
 */
export type ɵSdQueryPanelCloseReason = 'escape' | 'outside' | 'tab' | 'select' | 'close' | 'switch' | 'detach';

export interface ɵSdQueryPanelOpenOptions {
  /** Receives focus when the panel closes, instead of the trigger (a table header icon that asked for a chip). */
  returnFocusTo?: HTMLElement | null;
  /** Opened from the keyboard: a list without a find box focuses its first option instead of the panel. */
  keyboard?: boolean;
}

// why: thứ tự vị trí như Action Popover của sd-button (`components/button/src/action-popover.ts`) — dưới trước, thiếu
// chỗ thì lật lên, cách trigger 4px — nhưng mặc định canh trái (start); bộ lọc đã lưu canh phải như `xPosition="before"`.
const START_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
];
const END_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

let nextPanelId = 0;

const TABBABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';
// A layer stacked above the panel holding one of these is the popup of a control (sd-select panel, date picker,
// sd-operator menu): Escape belongs to it. A tooltip holds none of them.
const INTERACTIVE = `${TABBABLE}, [role="listbox"], [role="menu"], [role="dialog"], [role="grid"], [role="tree"]`;
const FIRST_OPTION = '[role="option"]:not([aria-disabled="true"]), [role="menuitem"]:not(:disabled):not([aria-disabled="true"])';

/**
 * One open panel per query bar: opening a panel closes the other one first (handoff section 2.2, "Nhiều panel").
 * Provided by `SdQueryBar`; a panel without a group only closes itself.
 */
@Injectable()
export class ɵSdQueryPanelGroup {
  #open?: ɵSdQueryPanelDirective;

  activate(panel: ɵSdQueryPanelDirective): void {
    if (this.#open && this.#open !== panel) this.#open.close('switch');
    this.#open = panel;
  }

  release(panel: ɵSdQueryPanelDirective): void {
    if (this.#open === panel) this.#open = undefined;
  }
}

/**
 * Content of a query bar panel, rendered in a CDK overlay next to its trigger: field picker (`listbox`), chip popover
 * (`dialog`) and saved filters (`menu`). Replaces the Material menu the bar used before (handoff section 2.2).
 *
 * The template has one root element carrying `sd-query-panel`, its modifier and its role; the panel gives it the `id`
 * the trigger's `aria-controls` points to (unless `sdQueryPanelControls` names the element inside that has the role)
 * and `tabindex="-1"`. A form panel marks the wrapper of its first value control
 * with `data-sd-query-panel-initial`.
 *
 * Internal (`ɵ`): not part of SemVer.
 */
@Directive({
  selector: 'ng-template[sdQueryPanel]',
  exportAs: 'sdQueryPanel',
  standalone: true,
})
export class ɵSdQueryPanelDirective {
  readonly id = `sd-query-panel-${nextPanelId++}`;

  readonly #template = inject<TemplateRef<unknown>>(TemplateRef);
  readonly #views = inject(ViewContainerRef);
  readonly #overlay = inject(Overlay);
  readonly #container = inject(OverlayContainer);
  readonly #checker = inject(InteractivityChecker);
  readonly #injector = inject(Injector);
  readonly #document = inject(DOCUMENT);
  readonly #dir = inject(Directionality, { optional: true });
  readonly #group = inject(ɵSdQueryPanelGroup, { optional: true });

  /** Popup type: `listbox` and `menu` are lists, `dialog` is a form. */
  readonly role = input.required<ɵSdQueryPanelRole>({ alias: 'sdQueryPanel' });
  /** Horizontal alignment with the trigger; flips when there is no room. */
  readonly align = input<'start' | 'end'>('start', { alias: 'sdQueryPanelAlign' });
  /**
   * Id of the element inside the panel that carries the popup role, when it is not the root (the field picker's listbox
   * sits under its find box). The trigger's `aria-controls` points there.
   */
  readonly controls = input<string | undefined>(undefined, { alias: 'sdQueryPanelControls' });
  /** Id the trigger's `aria-controls` names. */
  readonly controlledId = computed(() => this.controls() ?? this.id);

  /** The panel opened and took focus. */
  readonly opened = output<void>();
  /**
   * The panel closed; `reason` says how. Not emitted for `detach`: the panel or its trigger is being destroyed, and
   * outputs of a destroyed view must not fire (NG0953).
   */
  readonly closed = output<ɵSdQueryPanelCloseReason>();

  readonly #isOpen = signal(false);
  readonly #origin = signal<HTMLElement | undefined>(undefined);
  /** Whether the panel is open. */
  readonly isOpen = this.#isOpen.asReadonly();
  /** The trigger the panel is open for (kept until `closed` has been emitted). */
  readonly origin = this.#origin.asReadonly();
  readonly #kind = computed(() => (this.role() === 'dialog' ? 'form' : 'list'));

  /** @internal Triggers listen here, so an opening made through `open()` still reaches the trigger it uses. */
  readonly ɵopening = new Subject<HTMLElement>();
  /** @internal */
  readonly ɵclosing = new Subject<{ origin: HTMLElement; reason: ɵSdQueryPanelCloseReason }>();

  #ref?: OverlayRef;
  #root?: HTMLElement;
  #returnFocusTo?: HTMLElement;
  #teardown: (() => void)[] = [];
  #destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      // why: output của directive đã huỷ không được phát nữa (NG0953) — đóng im lặng.
      this.#destroyed = true;
      this.close('detach');
      this.ɵopening.complete();
      this.ɵclosing.complete();
    });
  }

  /** The panel's root element while open. */
  element(): HTMLElement | undefined {
    return this.#root;
  }

  /** Opens the panel next to `origin`. Open for another trigger: closes for that one first (`switch`). */
  open(origin: HTMLElement, options: ɵSdQueryPanelOpenOptions = {}): void {
    if (this.#destroyed) return;
    if (this.#ref && this.#origin() === origin) {
      this.#returnFocusTo = options.returnFocusTo ?? undefined;
      return;
    }
    this.close('switch');
    this.#group?.activate(this);
    this.#returnFocusTo = options.returnFocusTo ?? undefined;
    this.#origin.set(origin);
    // why: phát trước khi gắn nội dung — chip popover seed field/giá trị ở đây, nên nội dung vẽ lần đầu và focus đầu
    // tiên đã đúng field (không vẽ field cũ rồi đổi).
    this.ɵopening.next(origin);

    const ref = this.#overlay.create({
      positionStrategy: this.#overlay
        .position()
        .flexibleConnectedTo(origin)
        .withPositions(this.align() === 'end' ? END_POSITIONS : START_POSITIONS)
        .withViewportMargin(8)
        .withPush(true)
        .withFlexibleDimensions(true),
      scrollStrategy: this.#overlay.scrollStrategies.reposition(),
      panelClass: 'sd-query-panel-pane',
      maxWidth: 'calc(100vw - 16px)',
      maxHeight: 'calc(100dvh - 16px)',
      direction: this.#dir?.value,
    });
    this.#ref = ref;
    this.#isOpen.set(true);
    ref.attach(new TemplatePortal(this.#template, this.#views)).detectChanges();
    ref.updatePosition();
    this.#root = ref.overlayElement.querySelector<HTMLElement>('.sd-query-panel') ?? undefined;
    if (this.#root) {
      this.#root.id = this.id;
      if (!this.#root.hasAttribute('tabindex')) this.#root.tabIndex = -1;
    }
    this.#listen(ref, origin);

    const keyboard = !!options.keyboard;
    // why: nội dung chưa vẽ xong (binding của cha chưa chạy) thì thử lại sau lượt render kế tiếp.
    if (!this.#focusInitial(keyboard)) {
      afterNextRender(
        () => {
          if (this.#ref === ref) this.#focusInitial(keyboard, true);
        },
        { injector: this.#injector }
      );
    }
    this.opened.emit();
  }

  /** Closes the panel. Focus returns to `returnFocusTo` or the trigger, except as described for each reason. */
  close(reason: ɵSdQueryPanelCloseReason = 'close'): void {
    this.#close(reason);
  }

  #close(reason: ɵSdQueryPanelCloseReason, focusMoved = false): void {
    const ref = this.#ref;
    const origin = this.#origin();
    if (!ref || !origin) return;
    const active = this.#document.activeElement;
    // why: bấm ra ngoài vào một phần tử nhận focus thì focus đã ở đó — không kéo về; bấm vào chỗ trống thì focus còn
    // trong panel (hoặc rơi về body) nên trả về trigger như Esc. `focusMoved`: focus đang chuyển sang phần tử khác.
    const restore =
      reason === 'switch' || reason === 'detach' || focusMoved
        ? false
        : reason === 'outside'
          ? !active || active === this.#document.body || ref.overlayElement.contains(active)
          : true;
    const returnTo = this.#returnFocusTo ?? origin;
    this.#ref = undefined;
    this.#root = undefined;
    this.#returnFocusTo = undefined;
    for (const stop of this.#teardown.splice(0)) stop();
    ref.dispose();
    this.#isOpen.set(false);
    this.#group?.release(this);
    if (restore && returnTo.isConnected && !(returnTo as HTMLButtonElement).disabled) returnTo.focus();
    if (!this.#destroyed) this.ɵclosing.next({ origin, reason });
    if (!this.#destroyed && reason !== 'detach') this.closed.emit(reason);
    // why: một listener của `closed` có thể đã mở lại panel (cho trigger khác) — khi đó giữ origin mới.
    if (!this.#ref) this.#origin.set(undefined);
  }

  #listen(ref: OverlayRef, origin: HTMLElement): void {
    const outside = ref.outsidePointerEvents().subscribe(event => {
      const target = _getEventTarget<Element>(event);
      if (target && (origin.contains(target) || this.#returnFocusTo?.contains(target) || this.#inStackedLayer(target))) return;
      this.close('outside');
    });
    const pane = ref.overlayElement;
    // why: Esc bắt ở hai nơi. Focus luôn ở trong panel nên keydown của pane nhận trước — tooltip của một nút khác (gắn sau
    // panel, nằm trên cùng) không nuốt được Esc qua OverlayKeyboardDispatcher (R1 · N-1). keydownEvents() chỉ còn cho
    // trường hợp focus ở ngoài pane (bấm vào chỗ trống); phím gõ trong popup của một control (menu của sd-operator, lịch
    // của sd-date) là của popup đó.
    const keys = ref.keydownEvents().subscribe(event => {
      const target = _getEventTarget<Element>(event);
      if (target && (pane.contains(target) || this.#inStackedLayer(target))) return;
      this.#escape(event);
    });
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') this.#escape(event);
      // why: nội dung đã dùng Tab (bộ lọc đã lưu: nút áp → nút xoá của cùng hàng) thì không đóng.
      else if (event.key === 'Tab' && !event.defaultPrevented && this.#leavesByTab(event)) this.close('tab');
    };
    const onFocusOut = (event: FocusEvent): void => {
      const next = event.relatedTarget as Element | null;
      // why: relatedTarget null = focus rơi về body hoặc cửa sổ mất focus — bấm ra ngoài đã có outsidePointerEvents.
      if (!next || pane.contains(next) || origin.contains(next) || this.#returnFocusTo?.contains(next) || this.#inStackedLayer(next))
        return;
      this.#close('outside', true);
    };
    pane.addEventListener('keydown', onKeydown);
    pane.addEventListener('focusout', onFocusOut);
    this.#teardown.push(
      () => outside.unsubscribe(),
      () => keys.unsubscribe(),
      () => pane.removeEventListener('keydown', onKeydown),
      () => pane.removeEventListener('focusout', onFocusOut)
    );
  }

  /**
   * Escape closes the panel unless the popup of a control is open above it (an sd-select panel closes first).
   * why: không dựa vào `defaultPrevented` — sd-input-number chặn mọi phím ngoài danh sách cho phép (cả Esc) bằng
   * preventDefault, nên cờ đó không nói control đã dùng Esc; popup tương tác chồng lên trên mới nói được.
   */
  #escape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.#ref || hasModifierKey(event) || this.#interactiveLayerAbove()) return;
    event.preventDefault();
    this.close('escape');
  }

  /** An overlay layer stacked above this panel that a user can interact with (not a tooltip). */
  #interactiveLayerAbove(): boolean {
    const host = this.#ref?.hostElement;
    if (!host) return false;
    return Array.from(this.#container.getContainerElement().children).some(
      layer =>
        layer !== host && !!(host.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING) && !!layer.querySelector(INTERACTIVE)
    );
  }

  /**
   * Tab leaves a list at once (focus goes back to the trigger and the browser moves on from there, like the Action
   * Popover). In a form it leaves from the last control, Shift+Tab from the first.
   */
  #leavesByTab(event: KeyboardEvent): boolean {
    if (this.#kind() === 'list') return true;
    const root = this.#root;
    if (!root) return true;
    const tabbables = this.#tabbables(root);
    const target = event.target as HTMLElement;
    if (!tabbables.length) return true;
    return event.shiftKey ? target === tabbables[0] || target === root : target === tabbables[tabbables.length - 1];
  }

  #focusInitial(keyboard: boolean, last = false): boolean {
    const root = this.#root;
    if (!root) return false;
    let target: HTMLElement | null | undefined;
    if (this.#kind() === 'form') {
      const marked = root.querySelector<HTMLElement>('[data-sd-query-panel-initial]');
      target = marked ? this.#tabbables(marked)[0] : this.#tabbables(root)[0];
      if (!target && !last) return false;
    } else {
      target = root.querySelector<HTMLElement>('input:not([disabled])');
      if (!target && keyboard) target = root.querySelector<HTMLElement>(FIRST_OPTION);
    }
    (target ?? root).focus();
    return true;
  }

  #tabbables(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
      element => this.#checker.isFocusable(element) && this.#checker.isTabbable(element)
    );
  }

  /**
   * Whether `node` sits in an overlay layer stacked above this panel: the panel of an sd-select, a date picker, the menu
   * of sd-operator. Clicks and focus there belong to a control of the panel, so they are not "outside". Layers below it
   * (a dialog that hosts the bar) are outside.
   */
  #inStackedLayer(node: Node): boolean {
    const host = this.#ref?.hostElement;
    const container = this.#container.getContainerElement();
    if (!host || !container.contains(node) || host.contains(node)) return false;
    let layer: Node | null = node;
    while (layer && layer.parentNode !== container) layer = layer.parentNode;
    return !!layer && !!(host.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING);
  }
}

/**
 * Button (or `div[role=button]`) that opens a `ɵSdQueryPanelDirective`: click, Enter, Space. Sets `aria-haspopup`,
 * `aria-expanded` and `aria-controls`; a second activation closes the panel.
 *
 * Internal (`ɵ`): not part of SemVer.
 */
@Directive({
  selector: '[sdQueryPanelTrigger]',
  exportAs: 'sdQueryPanelTrigger',
  standalone: true,
  host: {
    class: 'sd-query-panel-trigger',
    '[attr.aria-haspopup]': 'panel()?.role() ?? null',
    '[attr.aria-expanded]': 'panel() ? expanded() : null',
    '[attr.aria-controls]': 'expanded() ? panel()!.controlledId() : null',
    '(pointerdown)': 'onPointerDown()',
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class ɵSdQueryPanelTriggerDirective {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  #pointer = false;
  #destroyed = false;

  readonly panel = input<ɵSdQueryPanelDirective | null | undefined>(undefined, { alias: 'sdQueryPanelTrigger' });

  /** The panel is opening for this trigger — emitted before its content renders. */
  readonly panelOpened = output<void>();
  /** The panel closed for this trigger. */
  readonly panelClosed = output<ɵSdQueryPanelCloseReason>();

  /** The panel is open for this trigger. */
  readonly expanded = computed(() => {
    const panel = this.panel();
    return !!panel && panel.isOpen() && panel.origin() === this.#host;
  });

  constructor() {
    effect(onCleanup => {
      const panel = this.panel();
      if (!panel) return;
      const opening = panel.ɵopening.subscribe(origin => {
        if (origin === this.#host && !this.#destroyed) this.panelOpened.emit();
      });
      const closing = panel.ɵclosing.subscribe(({ origin, reason }) => {
        if (origin === this.#host && !this.#destroyed && reason !== 'detach') this.panelClosed.emit(reason);
      });
      onCleanup(() => {
        opening.unsubscribe();
        closing.unsubscribe();
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.#destroyed = true;
      if (this.expanded()) this.panel()?.close('detach');
    });
  }

  /** Opens the panel for this trigger (no-op when already open). `returnFocusTo` gets focus back on close. */
  openMenu(returnFocusTo?: HTMLElement | null): void {
    if (!this.expanded()) this.panel()?.open(this.#host, { keyboard: true, returnFocusTo });
  }

  /** Closes the panel when it is open for this trigger. */
  closeMenu(): void {
    if (this.expanded()) this.panel()?.close('close');
  }

  protected onPointerDown(): void {
    this.#pointer = true;
  }

  protected onClick(): void {
    // why: click do Enter / Space trên <button> không có pointerdown đi trước — mở bằng bàn phím.
    const keyboard = !this.#pointer;
    this.#pointer = false;
    this.#toggle(keyboard);
  }

  protected onKeydown(event: KeyboardEvent): void {
    // <button> đã tự biến Enter / Space thành click.
    if (this.#host.tagName === 'BUTTON' || (event.key !== 'Enter' && event.key !== ' ')) return;
    if (event.target !== this.#host) return;
    event.preventDefault();
    this.#toggle(true);
  }

  #toggle(keyboard: boolean): void {
    const panel = this.panel();
    if (!panel) return;
    if (this.expanded()) panel.close('close');
    else panel.open(this.#host, { keyboard });
  }
}
