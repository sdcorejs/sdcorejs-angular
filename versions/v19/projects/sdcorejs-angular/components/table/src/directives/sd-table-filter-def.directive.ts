import { Directive, TemplateRef, booleanAttribute, inject, input } from '@angular/core';

interface Context {
  externalFilter?: Record<string, unknown>;
}

@Directive({
  selector: '[sdTableFilterDef]',
})
export class SdTableFilterDefDirective {
  static ngTemplateContextGuard(_dir: SdTableFilterDefDirective, _ctx: unknown): _ctx is Context {
    return true;
  }

  sdTableFilterDef = input.required<string>();
  defaultShowing = input(false, { transform: booleanAttribute });
  templateRef: TemplateRef<Context> | null = inject(TemplateRef, { optional: true });
}
