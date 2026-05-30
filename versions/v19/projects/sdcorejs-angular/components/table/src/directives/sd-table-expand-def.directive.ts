import { Directive, TemplateRef, inject } from '@angular/core';
import { SdTableItem } from '../models/table-item.model';

interface Context<T = any> {
  item: SdTableItem<T>;
}

@Directive({
  selector: '[sdTableExpandDef]',
})
export class SdTableExpandDefDirective<T = any> {
  static ngTemplateContextGuard<T>(_dir: SdTableExpandDefDirective<T>, _ctx: unknown): _ctx is Context<T> {
    return true;
  }

  templateRef: TemplateRef<Context<T>> = inject(TemplateRef);
}
