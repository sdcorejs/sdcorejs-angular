import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[sdSuffixDef]',
})
export class SdSuffixDefDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
