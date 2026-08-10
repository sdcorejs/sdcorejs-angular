import { booleanAttribute, ChangeDetectionStrategy, Component, input, output, TemplateRef, viewChild } from '@angular/core';

export type SdTabBeforeClose = () => boolean | Promise<boolean>;

@Component({
  selector: 'sd-tab',
  standalone: true,
  template: `<ng-template #body><ng-content></ng-content></ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdTab {
  label = input.required<string>();
  icon = input<string | null | undefined>(undefined);
  badge = input<string | number | null | undefined>(undefined);
  disabled = input(false, { transform: booleanAttribute });
  closable = input(false, { transform: booleanAttribute });
  beforeClose = input<SdTabBeforeClose | undefined>(undefined);

  sdClose = output<void>();
  sdCloseError = output<unknown>();

  #closeRequest?: Promise<boolean>;

  requestClose = (): Promise<boolean> => {
    const guard = this.beforeClose();
    if (!guard) {
      this.forceClose();
      return Promise.resolve(true);
    }
    if (this.#closeRequest) return this.#closeRequest;

    const request = Promise.resolve()
      .then(() => guard())
      .then(canClose => {
        if (!canClose) return false;
        this.forceClose();
        return true;
      })
      .catch((error: unknown) => {
        this.sdCloseError.emit(error);
        return false;
      });

    this.#closeRequest = request;
    void request.finally(() => {
      if (this.#closeRequest === request) this.#closeRequest = undefined;
    });
    return request;
  };

  forceClose = (): void => this.sdClose.emit();

  // why: viewChild on `#body` template captures projected content so the parent
  // <sd-tab-group> can render it lazily via matTabContent + ngTemplateOutlet.
  // If we projected raw ng-content into <mat-tab> directly, mat-tab would render
  // eagerly and lose the lazy-load behavior.
  bodyTpl = viewChild.required<TemplateRef<unknown>>('body');
}
