import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[sdTableCellDef]',
})
export class SdTabelCellDefDirective {
  @Input() sdTableCellDef?: string;
  constructor(public templateRef: TemplateRef<any>) {}
}
