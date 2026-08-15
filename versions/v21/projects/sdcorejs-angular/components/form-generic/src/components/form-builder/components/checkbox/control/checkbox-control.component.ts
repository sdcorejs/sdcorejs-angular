import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SdFormGenericCheckbox } from '../../../../../models';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'checkbox-control',
  templateUrl: './checkbox-control.component.html',
  styleUrl: './checkbox-control.component.scss',
  imports: [CommonModule, SdTranslatePipe],
})
export class CheckboxControl {
  component!: SdFormGenericCheckbox;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericCheckbox) {
    this.component = component;
  }
}
