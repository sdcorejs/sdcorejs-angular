import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[sdLabelDef]',
  standalone: true,
})
export class SdLabelDefDirective {
  // @Input() sdLableDef: string;
  constructor(public templateRef: TemplateRef<any>) {}
}
