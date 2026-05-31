import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdStep, SdStepper } from '@sdcorejs/angular/components/stepper';

@Component({
  selector: 'app-stepper-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    SdStepper,
    SdStep,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    JsonPipe,
  ],
  templateUrl: './stepper-demo.component.html',
  styleUrls: ['./stepper-demo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperDemoComponent {
  // -------- 1. Basic horizontal --------
  readonly basicIndex = signal(0);

  // -------- 2. Vertical orientation --------
  readonly verticalIndex = signal(0);

  // -------- 3. Linear + FormGroup gating (wizard) --------
  readonly linearStepper = viewChild<SdStepper>('linear');

  readonly accountForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  readonly profileForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    phone: new FormControl('', Validators.required),
  });
  readonly confirmForm = new FormGroup({
    agree: new FormControl(false, Validators.requiredTrue),
  });

  // Helper exposed as field for template-side access in linear "done" section
  submittedData = signal<unknown>(null);

  submitWizard() {
    this.submittedData.set({
      account: this.accountForm.value,
      profile: this.profileForm.value,
      agree: this.confirmForm.value.agree,
    });
  }

  resetWizard() {
    this.accountForm.reset();
    this.profileForm.reset();
    this.confirmForm.reset({ agree: false });
    this.submittedData.set(null);
    this.linearStepper()?.reset();
  }

  // -------- 4. Optional step --------
  readonly optionalIndex = signal(0);

  // -------- 5. Error state --------
  readonly errorIndex = signal(1);
  readonly errorState = signal<'error' | undefined>('error');

  toggleError() {
    this.errorState.update((s) => (s === 'error' ? undefined : 'error'));
  }

  // -------- 6. Custom labelPosition --------
  readonly labelPos = signal<'end' | 'bottom'>('bottom');

  // -------- 7. Color palette --------
  // (nothing â€” colors hard-coded in template)

  // -------- 8. External Next/Previous controls --------
  readonly externalStepper = viewChild<SdStepper>('external');
  readonly externalIndex = signal(0);

  externalNext() {
    this.externalStepper()?.next();
  }
  externalPrev() {
    this.externalStepper()?.previous();
  }
  externalReset() {
    this.externalStepper()?.reset();
  }
  externalGoLast() {
    this.externalStepper()?.goTo(2);
  }

  // -------- 9. Non-editable (no return) --------
  readonly nonEditableIndex = signal(0);
}

