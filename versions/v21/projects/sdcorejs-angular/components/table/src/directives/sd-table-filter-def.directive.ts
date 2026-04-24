import { Directive, Input, TemplateRef } from '@angular/core';

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
  @Input() sdTableFilterDef?: string;
  defaultShowing?: boolean;
  @Input('defaultShowing') set _defaultShowing(val: boolean | '' | undefined) {
    this.defaultShowing = val === '' || val;
  }
  constructor(public templateRef?: TemplateRef<any>) {}
}
