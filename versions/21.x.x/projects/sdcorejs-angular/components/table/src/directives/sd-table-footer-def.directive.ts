import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[sdTableFooterDef]',
})
export class SdMaterialFooterDefDirective {
  @Input() sdTableFooterDef?: string;
  constructor(public templateRef: TemplateRef<any>) {}
}
