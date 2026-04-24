import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SdTextarea } from '@sdcorejs/angular/forms';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-textarea-demo-component',
  templateUrl: './sd-textarea-demo.component.html',
  imports: [SdTextarea, MatButtonModule],
})
export class SdTextAreaDemoComponent {
  form = new FormGroup({});
  formValidation = new FormGroup({});
  formHide = new FormGroup({});

  // Section 1: Basic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  basicModel: any = 'GiÃ¡ trá»‹ máº«u';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disabledModel: any = 'KhÃ´ng thá»ƒ sá»­a';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonlyModel: any = 'Chá»‰ Ä‘á»c';

  // Section 2: Validation inline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_required: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_maxlength: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_inline: any;

  validateSection() { this.formValidation.markAllAsTouched(); }
  resetSection() { this.formValidation.reset(); this.formValidation.markAsUntouched(); }

  // Section 3: Hide inline error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h_required: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h_maxlength: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h_inline: any;

  validateHide() { this.formHide.markAllAsTouched(); }
  resetHide() { this.formHide.reset(); this.formHide.markAsUntouched(); }
}

