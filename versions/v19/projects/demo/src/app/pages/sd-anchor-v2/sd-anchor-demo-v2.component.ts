import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdAnchorItemV2, SdAnchorV2 } from '@sdcorejs/angular/components';
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-anchor-v2-demo-component',
  templateUrl: './sd-anchor-demo-v2.component.html',
  imports: [SdAnchorV2, SdAnchorItemV2],
})
export class SdAnchorDemoV2Component implements OnInit {
  form = new FormGroup({});
  title = 'TiÃªu Ä‘á» 1';
  showtieude2 = true;
  ngOnInit() {
    // Sau 3 giÃ¢y thÃ¬ áº©n section
    setTimeout(() => {
      this.showtieude2 = false;
    }, 3000);

    // Sau 5 giÃ¢y Ä‘á»•i tiÃªu Ä‘á»
    setTimeout(() => {
      this.title = 'TiÃªu Ä‘á» thay Ä‘á»•i sau 5 giÃ¢y';
      console.log(this.title);
    }, 5000);
  }
}

