import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, Input, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'attribute-switch',
  templateUrl: './attribute-switch.component.html',
  imports: [SdSelect, SdTranslatePipe],
})
export class AttributeSwitch {
  readonly form = input<FormGroup>();

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
  readonly modelChange = output<boolean>();

  onChange = (value: any) => {
    this.modelChange.emit(!!value);
  };
}
