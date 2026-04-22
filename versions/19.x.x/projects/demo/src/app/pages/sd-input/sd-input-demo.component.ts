import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SdInput } from '@sdcorejs/angular/forms';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-input-demo-component',
  templateUrl: './sd-input-demo.component.html',
  imports: [SdInput, MatButtonModule],
})
export class SdInputDemoComponent {
  // Form dÃ¹ng chung cho cÃ¡c section khÃ´ng cáº§n validate riÃªng
  form = new FormGroup({});
  // Form riÃªng cho Section 3 (Validation - Inline Error)
  formValidation = new FormGroup({});
  // Form riÃªng cho Section 4 (Validation - Hide Inline Error)
  formHide = new FormGroup({});

  // ---- Section 1: Basic States ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  basicModel: any = 'GiÃ¡ trá»‹ máº«u';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disabledModel: any = 'KhÃ´ng thá»ƒ sá»­a';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonlyModel: any = 'Chá»‰ Ä‘á»c';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewedModel: any = 'Cháº¿ Ä‘á»™ xem';

  // ---- Section 2: Types ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeTextModel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeNumberModel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typePasswordModel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeEmailModel: any;

  // ---- Section 3: Validation â€” Inline Error ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_required: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_minlength: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_maxlength: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_pattern: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_inline: any;

  validateSection() {
    this.formValidation.markAllAsTouched();
  }

  resetSection() {
    this.formValidation.reset();
    this.formValidation.markAsUntouched();
  }

  // ---- Section 4: Validation â€” Hide Inline Error ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h_required: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h_maxlength: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h_pattern: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h_inline: any;

  validateHide() {
    this.formHide.markAllAsTouched();
  }

  resetHide() {
    this.formHide.reset();
    this.formHide.markAsUntouched();
  }

  // ---- Section 5: Special features ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feat_tooltip: any;
  feat_hyperlink: any = 'https://google.com';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feat_float: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feat_blurEnter: any;
}

