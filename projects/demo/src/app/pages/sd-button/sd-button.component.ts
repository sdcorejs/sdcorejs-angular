import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components';
@Component({
  templateUrl: './sd-button.component.html',
  imports: [CommonModule, SdButton],
})
export class SdButtonDemoComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  form = new FormGroup({});
  onClick = ($event: Event) => {
    console.log('123');
  };
}

