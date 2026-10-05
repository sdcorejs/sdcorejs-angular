import { Directive, TemplateRef, inject, input } from '@angular/core';
import { SdKanbanCardTemplateContext, SdKanbanColumnTemplateContext, SdKanbanOption } from './kanban.model';

@Directive({ selector: 'ng-template[sdKanbanCardTemplate]', standalone: true })
export class SdKanbanCardTemplateDirective<T = unknown> {
  /** Bind the option for strict generic template inference, or use the bare attribute. */
  readonly option = input<SdKanbanOption<T> | ''>('', { alias: 'sdKanbanCardTemplate' });
  readonly template = inject<TemplateRef<SdKanbanCardTemplateContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    _directive: SdKanbanCardTemplateDirective<T>,
    _context: unknown
  ): _context is SdKanbanCardTemplateContext<T> {
    return true;
  }
}
@Directive({ selector: 'ng-template[sdKanbanCardActionsTemplate]', standalone: true })
export class SdKanbanCardActionsTemplateDirective<T = unknown> {
  readonly option = input<SdKanbanOption<T> | ''>('', { alias: 'sdKanbanCardActionsTemplate' });
  readonly template = inject<TemplateRef<SdKanbanCardTemplateContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    _directive: SdKanbanCardActionsTemplateDirective<T>,
    _context: unknown
  ): _context is SdKanbanCardTemplateContext<T> {
    return true;
  }
}
@Directive({ selector: 'ng-template[sdKanbanColumnTemplate]', standalone: true })
export class SdKanbanColumnTemplateDirective {
  readonly template = inject<TemplateRef<SdKanbanColumnTemplateContext>>(TemplateRef);
  static ngTemplateContextGuard(_directive: SdKanbanColumnTemplateDirective, _context: unknown): _context is SdKanbanColumnTemplateContext {
    return true;
  }
}
@Directive({ selector: 'ng-template[sdKanbanColumnActionsTemplate]', standalone: true })
export class SdKanbanColumnActionsTemplateDirective {
  readonly template = inject<TemplateRef<SdKanbanColumnTemplateContext>>(TemplateRef);
  static ngTemplateContextGuard(
    _directive: SdKanbanColumnActionsTemplateDirective,
    _context: unknown
  ): _context is SdKanbanColumnTemplateContext {
    return true;
  }
}
