/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';

@Component({
  selector: 'attribute-textarea',
  templateUrl: './attribute-textarea.component.html',
  imports: [SdTextarea],
})
export class AttributeTextarea {
  @Input() form?: FormGroup;

  label?: string | null;
  @Input('label') set _label(label: string | undefined | null) {
    this.label = label;
  }

  disabled = false;
  @Input('disabled') set _disabled(val: '' | boolean | undefined | null) {
    this.disabled = val === '' || !!val;
  }

  model?: string | null;
  @Input('model') set _model(model: string | undefined | null) {
    if (this.model !== model) {
      this.model = model;
    }
  }
  @Output() modelChange = new EventEmitter<string>();
  @Output() sdChange = new EventEmitter<string>();

  onChange = (value: any) => {
    this.modelChange.emit(value);
    this.sdChange.emit(value);
  };
}
