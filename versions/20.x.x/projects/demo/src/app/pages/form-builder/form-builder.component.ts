import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdFormBuilder } from '@sdcorejs/angular/components';
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'form-builder-component',
  templateUrl: './form-builder.component.html',
  imports: [SdFormBuilder],
})
export class FormBuilderComponent {
  form = new FormGroup({});
}

