import { Directive, TemplateRef, inject } from '@angular/core';
import { SdOrgChartItem, SdOrgChartItemContext } from './org-chart.model';

@Directive({
  selector: '[sdOrgChartItemDef]',
})
export class SdOrgChartItemDefDirective<T extends SdOrgChartItem = SdOrgChartItem> {
  static ngTemplateContextGuard<T extends SdOrgChartItem>(
    _dir: SdOrgChartItemDefDirective<T>,
    _ctx: unknown
  ): _ctx is SdOrgChartItemContext<T> {
    return true;
  }

  readonly templateRef: TemplateRef<SdOrgChartItemContext<T>> = inject(TemplateRef);
}
