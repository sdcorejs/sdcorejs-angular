import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components';

@Component({
  templateUrl: './sd-section.component.html',
  imports: [CommonModule, SdSection],
})
export class SdSectionDemoComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  form = new FormGroup({});
  
  isCollapsed = false;
  isCollapsable = true;

  toggleCollapse = () => {
    this.isCollapsed = !this.isCollapsed;
  };
}

