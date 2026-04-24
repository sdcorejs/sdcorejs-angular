import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';

@Directive({
  selector: '[sdMobile]',
})
export class SdMobileDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef
  ) {
    if (SdUtilities.isMobile()) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    }
  }
}

