import { Directive, inject, TemplateRef } from '@angular/core';

/** Consumer-owned UI at the right of the optional quick-search row. */
@Directive({ selector: '[sdTableQuickSearchRightDef]' })
export class SdTableQuickSearchRightDefDirective {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}
