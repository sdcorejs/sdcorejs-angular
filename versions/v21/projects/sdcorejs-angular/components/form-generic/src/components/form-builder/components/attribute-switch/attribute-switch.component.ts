/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'attribute-switch',
  templateUrl: './attribute-switch.component.html',
  imports: [SdSelect, TranslatePipe],
})
export class AttributeSwitch {
  @Input() form?: FormGroup;

  label?: string | null;
  @Input('label') set _label(label: string | undefined | null) {
    this.label = label;
  }

  model?: boolean;
  @Input('model') set _model(val: boolean | undefined | null) {
    if (this.model !== !!val) {
      this.model = !!val;
    }
  }
  @Output() modelChange = new EventEmitter<boolean>();

  onChange = (value: any) => {
    this.modelChange.emit(!!value);
  };
}

