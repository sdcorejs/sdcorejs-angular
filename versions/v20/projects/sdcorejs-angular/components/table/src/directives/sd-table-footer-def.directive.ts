import { Directive, TemplateRef, inject, input } from '@angular/core';
import { SdTableColumn } from '../models/table-column.model';
import { SdTableItem } from '../models/table-item.model';

interface Context<T = any> {
  items: SdTableItem<T>[];
  column: SdTableColumn<T>;
}

@Directive({
  selector: '[sdTableFooterDef]',
})
export class SdMaterialFooterDefDirective<T = any> {
  static ngTemplateContextGuard<T>(_dir: SdMaterialFooterDefDirective<T>, _ctx: unknown): _ctx is Context<T> {
    return true;
  }

  sdTableFooterDef = input.required<string>();
  templateRef: TemplateRef<Context<T>> = inject(TemplateRef);
}
