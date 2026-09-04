import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, Input, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdSelect } from '@sdcorejs/angular/forms/select';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'attribute-select',
  templateUrl: './attribute-select.component.html',
  imports: [SdSelect],
})
export class AttributeSelect {
  readonly form = input<FormGroup>();

  label?: string | null;
  @Input('label') set _label(label: string | undefined | null) {
    this.label = label;
  }

  disabled = false;
  @Input('disabled') set _disabled(val: '' | boolean | undefined | null) {
    this.disabled = val === '' || !!val;
  }

  multiple = false;
  @Input('multiple') set _multiple(val: '' | boolean | undefined | null) {
    this.multiple = val === '' || !!val;
  }

  items: Item[] = [];
  @Input({ alias: 'items', required: true }) set _items(items: Item[] | undefined | null) {
    if (Array.isArray(items) && this.items !== items) {
      this.items = items || [];
    } else {
      items = [];
    }
  }

  model?: any | any[];
  @Input('model') set _model(model: any | any[] | undefined | null) {
    if (this.model !== model) {
      this.model = model;
    }
  }
  readonly modelChange = output<string>();
  readonly sdChange = output<string>();

  onChange = (value: any) => {
    this.modelChange.emit(value);
    this.sdChange.emit(value);
  };
}

interface Item {
  value: string;
  display: string;
}
