import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SdInput } from '@sdcorejs/angular/forms';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'sd-layout-search-field',
  standalone: true,
  imports: [SdIcon, SdInput],
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdLayoutSearchFieldComponent {
  model = input('');
  placeholder = input.required<string>();
  autoId = input.required<string>();
  sdChange = output<string>();
}
