import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SdChipCalendar } from '@sdcorejs/angular/forms';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-chip-calendar-demo-component',
  templateUrl: './sd-chip-calendar.component.html',
  imports: [CommonModule, SdChipCalendar, MatButtonModule],
})
export class SdChipCalendarDemoComponent {
  form = new FormGroup({});
  formValidation = new FormGroup({});
  formHide = new FormGroup({});

  // Section 1: Basic
  basicDates: string[] = ['2025/01/15', '2025/01/20'];
  disabledDates: string[] = ['2025/01/10'];

  // Section 2: Validation inline
  v_required: string[] = [];
  v_min: string[] = ['2025/01/01']; // 1 date, min=3 â†’ lá»—i minlength

  validateSection() { this.formValidation.markAllAsTouched(); }
  resetSection() { this.formValidation.reset(); this.formValidation.markAsUntouched(); }

  // Section 3: Hide inline
  h_required: string[] = [];
  h_min: string[] = ['2025/01/01']; // 1 date, min=3 â†’ lá»—i

  validateHide() { this.formHide.markAllAsTouched(); }
  resetHide() { this.formHide.reset(); this.formHide.markAsUntouched(); }
}

