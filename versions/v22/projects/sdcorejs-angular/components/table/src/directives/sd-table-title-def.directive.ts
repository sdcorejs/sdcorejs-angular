import { Directive, TemplateRef, inject, input } from '@angular/core';
import { SdTableColumn } from '../models/table-column.model';

interface Context<T = any> {
  column: SdTableColumn<T>;
}

@Directive({
  selector: '[sdTableTitleDef]',
})
export class SdTableTitleDefDirective<T = any> {
  static ngTemplateContextGuard<T>(_dir: SdTableTitleDefDirective<T>, _ctx: unknown): _ctx is Context<T> {
    return true;
  }

  sdTableTitleDef = input.required<string>();
  templateRef: TemplateRef<Context<T>> = inject(TemplateRef);
}
