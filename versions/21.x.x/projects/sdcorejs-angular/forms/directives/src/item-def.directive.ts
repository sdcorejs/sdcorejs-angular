import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[sdItemDef]',
  standalone: true,
})
export class SdItemDefDefDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
