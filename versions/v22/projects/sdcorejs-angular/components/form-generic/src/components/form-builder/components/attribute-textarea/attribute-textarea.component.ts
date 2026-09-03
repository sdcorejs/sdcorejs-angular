import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, Input, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'attribute-textarea',
  templateUrl: './attribute-textarea.component.html',
  imports: [SdTextarea],
})
export class AttributeTextarea {
  readonly form = input<FormGroup>();

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
  readonly modelChange = output<string>();
  readonly sdChange = output<string>();

  onChange = (value: any) => {
    this.modelChange.emit(value);
    this.sdChange.emit(value);
  };
}
