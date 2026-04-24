import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[sdTableColumnFilterDef]',
})
export class SdTableColumnFilterDefDirective {
  @Input() sdTableColumnFilterDef?: string;
  constructor(public templateRef: TemplateRef<any>) {}
}
