import { Directive, TemplateRef, inject, input } from '@angular/core';
import { SdTableColumn } from '../models/table-column.model';

interface Context<T = any> {
  column: SdTableColumn<T>;
  field: string;
  disabled?: boolean;
}

@Directive({
  selector: '[sdTableColumnFilterDef]',
})
export class SdTableColumnFilterDefDirective<T = any> {
  static ngTemplateContextGuard<T>(_dir: SdTableColumnFilterDefDirective<T>, _ctx: unknown): _ctx is Context<T> {
    return true;
  }

  sdTableColumnFilterDef = input.required<string>();
  templateRef: TemplateRef<Context<T>> = inject(TemplateRef);
}
