import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Action area (for example a ⋯ menu) of the `entity` and `file` layouts:
 * `<ng-template sdCardActions>…</ng-template>` inside `sd-card`.
 *
 * Clicks inside the area never trigger the card's behavior.
 */
@Directive({
  selector: 'ng-template[sdCardActions]',
  standalone: true,
})
export class SdCardActionsDirective {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}
