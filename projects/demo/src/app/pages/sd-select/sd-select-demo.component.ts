import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SdAutocomplete, SdSelect } from '@sdcorejs/angular/forms';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-select-demo-component',
  templateUrl: './sd-select-demo.component.html',
  imports: [SdSelect, SdAutocomplete, MatButtonModule],
})
export class SdSelectDemoComponent {
  form = new FormGroup({});
  formValidation = new FormGroup({});
  formHide = new FormGroup({});
  formHide2 = new FormGroup({});

  items = [
    { value: '1', display: 'Option 1' },
    { value: '2', display: 'Option 2' },
    { value: '3', display: 'Option 3' },
    { value: '4', display: 'Option 4' },
    { value: '5', display: 'Option 5' },
  ];

  // sd-select basic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectModel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectDisabled: any = '2';

  // sd-select validation inline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sv_required: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sv_inline: any;

  validateSection() { this.formValidation.markAllAsTouched(); }
  resetSection() { this.formValidation.reset(); this.formValidation.markAsUntouched(); }

  // sd-select hide inline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sh_required: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sh_inline: any;

  validateHide() { this.formHide.markAllAsTouched(); }
  resetHide() { this.formHide.reset(); this.formHide.markAsUntouched(); }

  // sd-autocomplete basic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  acModel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  acDisabled: any = '1';

  // sd-autocomplete hide inline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ah_required: any;

  validateHide2() { this.formHide2.markAllAsTouched(); }
  resetHide2() { this.formHide2.reset(); this.formHide2.markAsUntouched(); }
}

