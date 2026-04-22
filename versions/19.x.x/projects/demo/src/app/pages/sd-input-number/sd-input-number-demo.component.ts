import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SdInputNumber } from '@sdcorejs/angular/forms';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-input-number-demo-component',
  templateUrl: './sd-input-number-demo.component.html',
  imports: [SdInputNumber, MatButtonModule],
})
export class SdInputNumberDemoComponent {
  form = new FormGroup({});
  formValidation = new FormGroup({});
  formHide = new FormGroup({});

  // Section 1
  basicModel: number | null = null;
  disabledModel: number | null = 12345;
  readonlyModel: number | null = 9999;
  viewedModel: number | null = 42;

  // Section 2
  v_required: number | null = null;
  v_min: number | null = null;
  v_max: number | null = null;
  v_inline: number | null = null;

  validateSection() { this.formValidation.markAllAsTouched(); }
  resetSection() { this.formValidation.reset(); this.formValidation.markAsUntouched(); }

  // Section 3
  h_required: number | null = null;
  h_min: number | null = null;
  h_max: number | null = null;

  validateHide() { this.formHide.markAllAsTouched(); }
  resetHide() { this.formHide.reset(); this.formHide.markAsUntouched(); }
}

