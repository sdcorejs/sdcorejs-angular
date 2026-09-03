import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, Input, output } from '@angular/core';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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
  readonly modelChange = output<number>();

  onChange = (value: any) => {
    this.modelChange.emit(value);
  };
}
