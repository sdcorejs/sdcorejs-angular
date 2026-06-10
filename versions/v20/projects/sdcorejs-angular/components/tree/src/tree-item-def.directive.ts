import { Directive, TemplateRef, inject } from '@angular/core';
import { SdTreeItemContext } from './tree.model';

@Directive({
  selector: '[sdTreeItemDef]',
  standalone: true,
})
export class SdTreeItemDefDirective<T = any> {
  static ngTemplateContextGuard<T>(_dir: SdTreeItemDefDirective<T>, ctx: unknown): ctx is SdTreeItemContext<T> {
    return true;
  }

  readonly templateRef: TemplateRef<SdTreeItemContext<T>> = inject(TemplateRef);
}
