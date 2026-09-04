import { Directive, TemplateRef, inject, input } from '@angular/core';

export interface SdSelectFooterActionContext {
  searchText: string;
  filteredItems: unknown[];
  selectedItems: unknown[];
}

export type SdSelectFooterActionWhenFn = (ctx: SdSelectFooterActionContext) => boolean | Promise<boolean>;
export type SdSelectFooterActionWhen = 'always' | 'empty' | 'has-result' | SdSelectFooterActionWhenFn;

@Directive({
  selector: 'ng-template[sdSelectFooterAction]',
  standalone: true,
})
export class SdSelectFooterActionDirective {
  readonly templateRef = inject(TemplateRef<SdSelectFooterActionContext>);
  readonly when = input<SdSelectFooterActionWhen>('always');
}
