import { Directive, TemplateRef, inject, input } from '@angular/core';

@Directive({
  selector: '[sdTableCellDef]',
})
export class SdTabelCellDefDirective {
  sdTableCellDef = input<string>();
  templateRef = inject(TemplateRef<any>);
}
