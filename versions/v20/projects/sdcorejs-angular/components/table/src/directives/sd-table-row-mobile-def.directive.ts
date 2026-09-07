import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { SdTableOption } from '../models/table-option.model';

/** Named context for the consumer-owned body of a mobile card. */
export interface SdTableRowMobileDefContext<T = any> {
  item: T;
  /** Zero-based data-row position on the current page, excluding group/expand rows. */
  index: number;
  selected: boolean;
  selectionDisabled: boolean;
  autoId: string | undefined;
}

@Directive({ selector: 'ng-template[sdTableRowMobileDef]', standalone: true })
export class SdTableRowMobileDefDirective<T = any> {
  /** Optional type witness: bind the typed table option for strict row inference. */
  readonly sdTableRowMobileDef = input<SdTableOption<T> | ''>('');
  readonly templateRef = inject<TemplateRef<SdTableRowMobileDefContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: SdTableRowMobileDefDirective<T>,
    context: unknown
  ): context is SdTableRowMobileDefContext<T> {
    return true;
  }
}
