import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[sdTableExpandDef]',
})
export class SdMaterialSubInformationDefDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
