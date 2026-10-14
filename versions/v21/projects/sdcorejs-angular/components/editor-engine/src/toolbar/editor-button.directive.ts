import { Directive, afterRenderEffect, inject, input, output } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

/** Private editor adapter: semantics and activation belong to the native Core button. */
@Directive({ selector: 'sd-button[sdEditorButton]', standalone: true })
export class SdEditorButtonDirective {
  readonly button = inject(SdButton);
  readonly controlId = input.required<string>({ alias: 'sdEditorButton' });
  readonly pressed = input<boolean | 'mixed' | undefined>(undefined, { alias: 'sdEditorPressed' });
  readonly tabIndex = input(0, { alias: 'sdEditorTabIndex' });
  readonly allowed = input(true, { alias: 'sdEditorAllowed' });
  readonly label = input<string | undefined>(undefined, { alias: 'sdEditorLabel' });
  readonly sdEditorActivate = output<Event>();
  readonly sdEditorBeforeFocus = output<Event>();
  readonly sdEditorFocused = output<void>();

  constructor() {
    afterRenderEffect(() => {
      const native = this.button.trigger()?.nativeElement;
      if (!native) return;
      native.dataset['editorControl'] = this.controlId();
      native.tabIndex = this.tabIndex();
      const pressed = this.pressed();
      if (pressed === undefined) native.removeAttribute('aria-pressed');
      else native.setAttribute('aria-pressed', String(pressed));
      const label = this.label();
      if (label) native.setAttribute('aria-label', label);
    });
    afterRenderEffect(onCleanup => {
      const native = this.button.trigger()?.nativeElement;
      if (!native) return;
      const activate = (event: Event): void => {
        if (!this.button.hasActions() && this.allowed() && !this.button.disabled() && !this.button.loading())
          this.sdEditorActivate.emit(event);
      };
      const before = (event: Event): void => this.sdEditorBeforeFocus.emit(event);
      const focus = (): void => this.sdEditorFocused.emit();
      native.addEventListener('click', activate);
      native.addEventListener('pointerdown', before);
      native.addEventListener('focus', focus);
      onCleanup(() => {
        native.removeEventListener('click', activate);
        native.removeEventListener('pointerdown', before);
        native.removeEventListener('focus', focus);
      });
    });
  }
}
