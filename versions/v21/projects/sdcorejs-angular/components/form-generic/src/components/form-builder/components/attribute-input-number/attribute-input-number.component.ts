import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';

@Component({
  selector: 'attribute-input-number',
  templateUrl: './attribute-input-number.component.html',
  imports: [SdInputNumber],
})
export class AttributeInputNumber {
  label?: string | null;
  @Input('label') set _label(label: string | undefined | null) {
    this.label = label;
  }

  disabled = false;
  @Input('disabled') set _disabled(val: '' | boolean | undefined | null) {
    this.disabled = val === '' || !!val;
  }

  model?: number | null;
  @Input('model') set _model(model: number | undefined | null) {
    if (this.model !== model) {
      this.model = model;
    }
  }
  @Output() modelChange = new EventEmitter<number>();

  onChange = (value: any) => {
    this.modelChange.emit(value);
  };
}
