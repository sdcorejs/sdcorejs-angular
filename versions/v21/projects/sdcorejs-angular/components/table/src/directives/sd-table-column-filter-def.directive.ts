import { Directive, TemplateRef, inject, input } from '@angular/core';

@Directive({
  selector: '[sdTableColumnFilterDef]',
})
export class SdTableColumnFilterDefDirective {
  sdTableColumnFilterDef = input<string>();
  templateRef = inject(TemplateRef<any>);
}
