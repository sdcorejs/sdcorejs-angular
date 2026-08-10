import { booleanAttribute, ChangeDetectionStrategy, Component, input, output, TemplateRef, viewChild } from '@angular/core';
import { AbstractControl } from '@angular/forms';

export type SdStepState = 'pending' | 'active' | 'completed' | 'error' | string;

@Component({
  selector: 'sd-step',
  standalone: true,
  // why: identical pattern to <sd-tab> — capture projected content via #body
  // template ref so <sd-stepper> can render it inside mat-step's matStepContent
  // (lazy mount + animation-friendly).
  template: `<ng-template #body><ng-content></ng-content></ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdStep {
  label = input.required<string>();
  // Optional Material icon name shown when the step is in 'pending' state
  // (overrides the default numbered indicator).
  icon = input<string | null | undefined>(undefined);
  // Set true to mark the step skippable in linear mode.
  optional = input(false, { transform: booleanAttribute });
  // When false, user cannot return to this step after it's been completed.
  editable = input(true, { transform: booleanAttribute });
  // Reactive form / control. When the stepper is linear, the user can only
  // proceed past this step once stepControl.valid is true.
  stepControl = input<AbstractControl | null | undefined>(undefined);
  // Override the auto-derived state (eg force 'error' from outside on async validation).
  state = input<SdStepState | undefined>(undefined);
  // Error message rendered next to the step header when state is 'error'.
  errorMessage = input<string | undefined>(undefined);

  // Emitted when this step transitions to selected.
  sdSelectChange = output<void>();

  // Body template captured from projected <ng-content>.
  bodyTpl = viewChild.required<TemplateRef<unknown>>('body');
}
