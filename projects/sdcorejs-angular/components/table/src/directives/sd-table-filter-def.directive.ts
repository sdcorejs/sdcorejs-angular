import { Directive, TemplateRef, booleanAttribute, inject, input } from '@angular/core';

interface Context {
  externalFilter?: Record<string, any>;
}

@Directive({
  selector: '[sdTableFilterDef]',
})
export class SdTableFilterDefDirective {
  static ngTemplateContextGuard(dir: Context, ctx: unknown): ctx is Context {
    return true;
  }
  
  sdTableFilterDef = input<string>();
  defaultShowing = input(false, { transform: booleanAttribute });
  
  templateRef = inject(TemplateRef<any>, { optional: true });
}
