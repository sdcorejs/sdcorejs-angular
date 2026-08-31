import { Directive, TemplateRef, inject } from '@angular/core';
import { SdTreeItemContext } from './tree.model';

@Directive({
  selector: '[sdTreeItemDef]',
  standalone: true,
})
// why: Angular cannot infer a projected directive generic from the parent
// `sd-tree` option when this directive has no generic input of its own. `any`
// preserves the documented strictTemplates syntax; the Tree models still
// default to `unknown` so this compatibility fallback stays narrowly scoped.
export class SdTreeItemDefDirective<T = any> {
  static ngTemplateContextGuard<T>(_dir: SdTreeItemDefDirective<T>, ctx: unknown): ctx is SdTreeItemContext<T> {
    return true;
  }

  readonly templateRef: TemplateRef<SdTreeItemContext<T>> = inject(TemplateRef);
}
