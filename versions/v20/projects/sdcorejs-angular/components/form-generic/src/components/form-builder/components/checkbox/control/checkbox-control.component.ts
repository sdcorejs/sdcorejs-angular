/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SdFormGenericCheckbox } from '../../../../../models';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'checkbox-control',
  templateUrl: './checkbox-control.component.html',
  styleUrls: ['./checkbox-control.component.scss'],
  imports: [CommonModule, TranslatePipe],
})
export class CheckboxControl {
  component!: SdFormGenericCheckbox;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericCheckbox) {
    this.component = component;
  }
}

