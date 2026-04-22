import { Directive, ViewContainerRef, TemplateRef } from '@angular/core';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';

@Directive({
  selector: '[sdDesktop]',
})
export class SdDesktopDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef
  ) {
    if (!SdUtilities.isMobile()) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    }
  }
}

