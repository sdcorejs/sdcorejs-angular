import { Component } from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-badge-demo-component',
  templateUrl: './sd-badge-demo.component.html',
  imports: [SdBadge],
})
export class SdBadgeDemoComponent {}

