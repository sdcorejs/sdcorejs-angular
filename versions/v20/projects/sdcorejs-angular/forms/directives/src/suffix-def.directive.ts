import { Directive, TemplateRef, inject } from '@angular/core';

type Context = Record<string, never>;

@Directive({
  selector: '[sdSuffixDef]',
  standalone: true,
})
export class SdSuffixDefDirective {
  readonly templateRef: TemplateRef<Context> = inject(TemplateRef);
}
