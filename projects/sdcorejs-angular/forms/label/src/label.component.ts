/* eslint-disable @angular-eslint/no-input-rename */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'sd-label',
  templateUrl: './label.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
})
export class SdLabel {
  label?: string | null;
  @Input('label') set _label(val: string | undefined | null) {
    this.label = val;
  }
  description?: string | null;
  @Input('description') set _description(description: string | undefined | null) {
    this.description = description;
  }
  required = false;
  @Input('required') set _required(val: boolean | '' | undefined | null) {
    this.required = val === '' || !!val;
  }

  helperText?: string;
  @Input('helperText') set _helperText(val: string | undefined) {
    this.helperText = val;
  }
}
