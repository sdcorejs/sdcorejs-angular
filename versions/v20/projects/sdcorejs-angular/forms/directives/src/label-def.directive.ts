import { Directive, TemplateRef, inject } from '@angular/core';

type Context = Record<string, never>;

@Directive({
  selector: '[sdLabelDef]',
  standalone: true,
})
export class SdLabelDefDirective {
  readonly templateRef: TemplateRef<Context> = inject(TemplateRef);
}
