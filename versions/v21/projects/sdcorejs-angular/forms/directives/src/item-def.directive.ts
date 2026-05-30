import { Directive, TemplateRef, inject } from '@angular/core';

interface Context<T = unknown> {
  $implicit?: T;
  item: T;
}

@Directive({
  selector: '[sdItemDef]',
  standalone: true,
})
export class SdItemDefDefDirective<T = unknown> {
  static ngTemplateContextGuard<T>(_dir: SdItemDefDefDirective<T>, _ctx: unknown): _ctx is Context<T> {
    return true;
  }

  readonly templateRef: TemplateRef<Context<T>> = inject(TemplateRef);
}
