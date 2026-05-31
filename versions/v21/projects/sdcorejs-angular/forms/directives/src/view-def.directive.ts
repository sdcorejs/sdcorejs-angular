import { Directive, TemplateRef, inject } from '@angular/core';

interface Context<TValue = unknown, TItem = unknown> {
  value?: TValue | null;
  selectedItem?: TItem | null;
  selectedItems?: TItem[] | null;
}

@Directive({
  selector: '[sdViewDef]',
  standalone: true,
})
export class SdViewDefDirective<TValue = unknown, TItem = unknown> {
  static ngTemplateContextGuard<TValue, TItem>(_dir: SdViewDefDirective<TValue, TItem>, _ctx: unknown): _ctx is Context<TValue, TItem> {
    return true;
  }

  readonly templateRef: TemplateRef<Context<TValue, TItem>> = inject(TemplateRef);
}
