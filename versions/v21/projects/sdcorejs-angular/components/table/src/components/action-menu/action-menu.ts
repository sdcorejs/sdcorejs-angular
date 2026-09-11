import { CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Directive, ElementRef, afterRenderEffect, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SdButton } from '@sdcorejs/angular/components/button';

export const TABLE_ACTION_MENU_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

// why: CDK gắn trên host sd-button, nhưng focus/ARIA và Enter/Space phải thuộc nút HTML bên trong.
@Directive({
  selector: 'sd-button[sdTableMenuButton]',
  standalone: true,
  hostDirectives: [{ directive: CdkMenuTrigger, inputs: ['cdkMenuTriggerFor: sdTableMenuButton'] }],
})
export class SdTableMenuButtonDirective {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly #trigger = inject(CdkMenuTrigger);
  readonly #sdButton = inject(SdButton);
  readonly #opened = signal(false);
  #button?: HTMLButtonElement;

  constructor() {
    this.#trigger.menuPosition = TABLE_ACTION_MENU_POSITIONS;
    const destroyRef = inject(DestroyRef);
    this.#trigger.opened.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.#opened.set(true));
    this.#trigger.closed.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      this.#opened.set(false);
      if (this.#button?.isConnected && this.#trigger.getMenu()?.nativeElement.contains(this.#host.ownerDocument.activeElement)) {
        this.#button.focus();
      }
    });
    afterRenderEffect(() => {
      this.#sdButton.type();
      this.#opened();
      this.#syncButton();
    });
    destroyRef.onDestroy(() => this.#button?.removeEventListener('keydown', this.#nativeActivation, true));
  }

  readonly #nativeActivation = (event: KeyboardEvent): void => {
    // why: để nút native tự phát click đúng một lần, không cho CDK toggle thêm ở keydown của host.
    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
  };

  #syncButton(): void {
    const button = this.#host.querySelector('button') ?? undefined;
    if (button !== this.#button) {
      this.#button?.removeEventListener('keydown', this.#nativeActivation, true);
      this.#button = button;
      button?.addEventListener('keydown', this.#nativeActivation, true);
    }
    button?.setAttribute('aria-haspopup', 'menu');
    button?.setAttribute('aria-expanded', String(this.#trigger.isOpen()));
    const menuId = this.#trigger.getMenu()?.nativeElement.id;
    if (menuId) button?.setAttribute('aria-controls', menuId);
    else button?.removeAttribute('aria-controls');
    this.#host.removeAttribute('role');
    this.#host.removeAttribute('aria-haspopup');
    this.#host.removeAttribute('aria-expanded');
    this.#host.removeAttribute('aria-controls');
  }
}
