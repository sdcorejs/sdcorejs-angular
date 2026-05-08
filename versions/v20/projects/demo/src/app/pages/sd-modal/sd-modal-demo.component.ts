import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SdButton, SdModal, SdSection } from '@sdcorejs/angular/components';

@Component({
  templateUrl: './sd-modal-demo.component.html',
  standalone: true,
  imports: [CommonModule, SdSection, SdButton, SdModal],
})
export class SdModalDemoComponent {}

