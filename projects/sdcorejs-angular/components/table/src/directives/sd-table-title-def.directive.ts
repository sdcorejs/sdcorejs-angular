import { Directive, TemplateRef, inject, input } from '@angular/core';

@Directive({
  selector: '[sdTableTitleDef]',
})
export class SdTableTitleDefDirective {
  sdTableTitleDef = input<string>();
  templateRef = inject(TemplateRef<any>);
}
