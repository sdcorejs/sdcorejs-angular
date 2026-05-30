import { Directive, TemplateRef, inject, input } from '@angular/core';
import { SdTableColumn } from '../models/table-column.model';

interface Context<T = any> {
  item: T;
  column: SdTableColumn<T>;
  autoId: string;
}

@Directive({
  selector: '[sdTableCellDef]',
})
export class SdTableCellDefDirective<T = any> {
  static ngTemplateContextGuard<T>(_dir: SdTableCellDefDirective<T>, _ctx: unknown): _ctx is Context<T> {
    return true;
  }

  sdTableCellDef = input.required<string>();
  templateRef: TemplateRef<Context<T>> = inject(TemplateRef);
}
