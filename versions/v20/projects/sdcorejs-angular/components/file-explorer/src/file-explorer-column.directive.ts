import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { SdFileExplorerConfig, SdFileExplorerItem } from './file-explorer.model';

export interface SdFileExplorerColumnContext<T = unknown> {
  $implicit: SdFileExplorerItem<T>;
  item: SdFileExplorerItem<T>;
  data: T | undefined;
  index: number;
}

/** List-only custom metadata column. Pass the parent option as its required type anchor. */
@Directive({ selector: 'ng-template[sdFileExplorerColumnDef]', standalone: true })
// Public column-definition name follows the reviewed Explorer contract.
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class SdFileExplorerColumnDef<T = unknown> {
  readonly id = input.required<string>({ alias: 'sdFileExplorerColumnDef' });
  readonly for = input.required<SdFileExplorerConfig<T>>({ alias: 'sdFileExplorerColumnFor' });
  readonly title = input.required<string>();
  readonly width = input<string>('160px');
  readonly template = inject<TemplateRef<SdFileExplorerColumnContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(_directive: SdFileExplorerColumnDef<T>, _context: unknown): _context is SdFileExplorerColumnContext<T> {
    return true;
  }
}
