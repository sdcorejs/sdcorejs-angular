import { Directive, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { BrowserUtilities } from '@sdcorejs/utils/fns';

@Directive({
  selector: '[sdMobile]',
  standalone: true,
})
export class SdMobileDirective {
  readonly #templateRef: TemplateRef<Record<string, never>> = inject(TemplateRef);
  readonly #viewContainerRef = inject(ViewContainerRef);

  constructor() {
    if (BrowserUtilities.isMobile()) {
      this.#viewContainerRef.createEmbeddedView(this.#templateRef);
    }
  }
}
