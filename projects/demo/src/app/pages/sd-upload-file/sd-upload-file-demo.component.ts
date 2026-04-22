import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdUploadFile } from '@sdcorejs/angular/components';
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-upload-file-demo-component',
  templateUrl: './sd-upload-file-demo.component.html',
  imports: [CommonModule, SdUploadFile],
})
export class SdUploadFileDemoComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  form = new FormGroup({});
}

