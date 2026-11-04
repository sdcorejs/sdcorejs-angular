/** Drag distance after which a released handle closes the sheet. */
export const SD_TABLE_SHEET_DISMISS_DISTANCE = 80;

/**
 * Browser Back for the phone sheets (handoff table-mobile 15.6). Each level pushes one history entry with the same URL
 * and state, so the router sees no navigation; Back pops the entry and runs the level's handler instead of leaving the
 * page. When the UI closes levels itself, `release` takes their entries back off the history.
 *
 * The sheets open `sd-modal` with `closeOnNavigation: false`, otherwise Material would close them on that popstate.
 *
 * Off while the table sits in an overlay (a dialog, a bottom sheet): every popstate, the ones `release` causes
 * included, makes Material close that overlay (`closeOnNavigation`). Back then closes the overlay, as before.
 */
export class SdTableSheetHistory {
  readonly #window: Window | null;
  readonly #owner: Element | null;
  readonly #levels: (() => void)[] = [];
  /** URL when the first level opened; `release` leaves the history alone once the page moved on. */
  #href?: string;
  /** `popstate` events caused by `release` (history.go), not by the user. */
  #ignore = 0;
  #listening = false;
  readonly #onPopState = (): void => {
    if (this.#ignore > 0) {
      this.#ignore--;
      this.#sync();
      return;
    }
    const back = this.#levels.pop();
    this.#sync();
    back?.();
  };

  /** `owner`: an element of the table, to tell whether it sits in an overlay. */
  constructor(window: Window | null, owner?: Element | null) {
    this.#window = window;
    this.#owner = owner ?? null;
  }

  get depth(): number {
    return this.#levels.length;
  }

  /** Opens a level: Back now runs `onBack` (which must not call `release`). */
  push(onBack: () => void): void {
    const window = this.#window;
    if (!window || this.#owner?.closest('.cdk-overlay-pane')) return;
    if (!this.#levels.length) this.#href = window.location.href;
    this.#levels.push(onBack);
    this.#sync();
    window.history.pushState(window.history.state, '');
  }

  /**
   * The UI closed `count` levels itself (all by default): drop their entries from the history. When the URL changed
   * since the first level opened (the router navigated, the app wrote query params), the entries are only forgotten:
   * going back would undo that navigation.
   */
  release(count = this.#levels.length): void {
    const window = this.#window;
    const levels = Math.min(count, this.#levels.length);
    if (!window || !levels) return;
    this.#levels.splice(this.#levels.length - levels, levels);
    if (window.location.href !== this.#href) {
      this.#sync();
      return;
    }
    // why: history.go() is asynchronous; the popstate it causes must not run another level's handler.
    this.#ignore++;
    this.#sync();
    window.history.go(-levels);
  }

  /** Destroy: stop listening. A sheet that was open has already released its levels when its modal closed. */
  dispose(): void {
    this.#levels.length = 0;
    this.#ignore = 0;
    this.#sync();
  }

  /** One listener while a level is open or a release is pending. */
  #sync(): void {
    const needed = this.#levels.length > 0 || this.#ignore > 0;
    if (needed === this.#listening || !this.#window) return;
    this.#listening = needed;
    if (needed) this.#window.addEventListener('popstate', this.#onPopState);
    else this.#window.removeEventListener('popstate', this.#onPopState);
  }
}

/**
 * Swipe down on the handle and header of a bottom sheet (`element` inside the Material container) to close it. The
 * container follows the finger; a release past `SD_TABLE_SHEET_DISMISS_DISTANCE` calls `onDismiss`, a shorter one puts
 * it back. Listeners are passive (they never cancel scrolling); the dragged area has `touch-action: none` in CSS.
 * Returns the cleanup.
 */
export const sdTableSheetSwipe = (element: HTMLElement, onDismiss: () => void): (() => void) => {
  let start: number | undefined;
  let distance = 0;
  const container = (): HTMLElement | null => element.closest<HTMLElement>('.mat-bottom-sheet-container, .mat-mdc-bottom-sheet-container');
  const reset = (): void => {
    const panel = container();
    if (panel) {
      panel.style.transition = '';
      panel.style.transform = '';
    }
    start = undefined;
    distance = 0;
  };
  const down = (event: PointerEvent): void => {
    if (event.button !== 0 || (event.target as Element | null)?.closest('button, a, input')) return;
    start = event.clientY;
    distance = 0;
    // why: keep receiving moves when the finger leaves the header while the sheet follows it. Throws for a pointer
    // that is no longer active; the drag then works without capture.
    try {
      element.setPointerCapture?.(event.pointerId);
    } catch {
      /* not capturable */
    }
    const panel = container();
    if (panel) panel.style.transition = 'none';
  };
  const move = (event: PointerEvent): void => {
    if (start === undefined) return;
    distance = Math.max(0, event.clientY - start);
    const panel = container();
    if (panel) panel.style.transform = distance ? `translateY(${distance}px)` : '';
  };
  const up = (): void => {
    if (start === undefined) return;
    const dismiss = distance > SD_TABLE_SHEET_DISMISS_DISTANCE;
    reset();
    if (dismiss) onDismiss();
  };
  const options: AddEventListenerOptions = { passive: true };
  element.addEventListener('pointerdown', down, options);
  element.addEventListener('pointermove', move, options);
  element.addEventListener('pointerup', up, options);
  element.addEventListener('pointercancel', reset, options);
  return () => {
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerup', up);
    element.removeEventListener('pointercancel', reset);
  };
};
