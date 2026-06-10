import { Directive, TemplateRef, inject, input } from '@angular/core';

export interface SdSelectFooterActionContext {
  searchText: string;
}

@Directive({
  selector: 'ng-template[sdSelectFooterAction]',
  standalone: true,
})
export class SdSelectFooterActionDirective {
  readonly templateRef = inject(TemplateRef<SdSelectFooterActionContext>);

  readonly when = input<'always' | 'empty' | 'has-result'>('always');
}
