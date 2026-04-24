import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[sdViewDef]',
  standalone: true,
})
export class SdViewDefDirective {
  templateRef: TemplateRef<Context> | null;
  constructor(templateRef: TemplateRef<Context>) {
    this.templateRef = templateRef ?? null;
  }
}

interface Context {
  value?: string | null;
  selectedItems?: any[] | null;
  selectedItem?: any | null
}
