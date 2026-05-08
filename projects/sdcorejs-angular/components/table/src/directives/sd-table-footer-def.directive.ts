import { Directive, TemplateRef, inject, input } from '@angular/core';

@Directive({
  selector: '[sdTableFooterDef]',
})
export class SdMaterialFooterDefDirective {
  sdTableFooterDef = input<string>();
  templateRef = inject(TemplateRef<any>);
}
