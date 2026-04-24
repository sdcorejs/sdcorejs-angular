import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SdChip } from '@sdcorejs/angular/forms';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-chip-demo-component',
  templateUrl: './sd-chip-demo.component.html',
  imports: [SdChip, MatButtonModule],
})
export class SdChipDemoComponent {
  form = new FormGroup({});
  formValidation = new FormGroup({});
  formHide = new FormGroup({});

  // Section 1: Basic
  chips: string[] = ['Angular', 'Material'];
  chipsSm: string[] = ['Angular', 'Material'];
  chipsDisabled: string[] = ['Chip 1', 'Chip 2'];
  chipsSmDisabled: string[] = ['Chip 1', 'Chip 2'];

  // Section 2: Validation inline
  v_required: string[] = [];
  v_min: string[] = ['A']; // 1 item, min=3 â†’ lá»—i minlength

  validateSection() { this.formValidation.markAllAsTouched(); }
  resetSection() { this.formValidation.reset(); this.formValidation.markAsUntouched(); }

  // Section 3: Hide inline
  h_required: string[] = [];
  h_min: string[] = ['X']; // 1 item, min=3 â†’ lá»—i minlength

  validateHide() { this.formHide.markAllAsTouched(); }
  resetHide() { this.formHide.reset(); this.formHide.markAsUntouched(); }
}

