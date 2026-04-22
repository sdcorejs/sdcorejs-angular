import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SdDate, SdDateRange, SdDatetime } from '@sdcorejs/angular/forms';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-date-demo-component',
  templateUrl: './sd-date-demo.component.html',
  imports: [SdDate, SdDatetime, SdDateRange, MatButtonModule],
})
export class SdDateDemoComponent {
  form = new FormGroup({});
  formValidation = new FormGroup({});
  formHideDate = new FormGroup({});
  formHideDatetime = new FormGroup({});
  formHideDateRange = new FormGroup({});

  // sd-date basic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dateModel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dateDisabled: any;

  // sd-date validation inline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dv_required: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dv_inline: any;

  validateDate() { this.formValidation.markAllAsTouched(); }
  resetDate() { this.formValidation.reset(); this.formValidation.markAsUntouched(); }

  // sd-date hide inline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dh_required: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dh_inline: any;

  validateHideDate() { this.formHideDate.markAllAsTouched(); }
  resetHideDate() { this.formHideDate.reset(); this.formHideDate.markAsUntouched(); }

  // sd-datetime basic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datetimeModel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datetimeDisabled: any;

  // sd-datetime hide inline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dth_required: any;

  validateHideDatetime() { this.formHideDatetime.markAllAsTouched(); }
  resetHideDatetime() { this.formHideDatetime.reset(); this.formHideDatetime.markAsUntouched(); }

  // sd-date-range basic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dateRangeModel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dateRangeDisabled: any;

  // sd-date-range hide inline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drh_required: any;

  validateHideDateRange() { this.formHideDateRange.markAllAsTouched(); }
  resetHideDateRange() { this.formHideDateRange.reset(); this.formHideDateRange.markAsUntouched(); }
}

