import { Directive, TemplateRef, inject } from '@angular/core';

@Directive({
  selector: '[sdTableExpandDef]',
})
export class SdMaterialSubInformationDefDirective {
  templateRef = inject(TemplateRef<any>);
}
