import { Directive, TemplateRef, inject } from '@angular/core';
import type { SdTimelineItem } from './timeline.model';

/** Context of the item templates: the entry itself. */
export interface SdTimelineItemTemplateContext<T = unknown> {
  $implicit: SdTimelineItem<T>;
}

/** Replaces the body of every layout; the marker and the first line stay. `let-item` is the entry. */
@Directive({ selector: 'ng-template[sdTimelineItemContent]', standalone: true })
export class SdTimelineItemContentDirective<T = unknown> {
  readonly template = inject<TemplateRef<SdTimelineItemTemplateContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    _directive: SdTimelineItemContentDirective<T>,
    _context: unknown
  ): _context is SdTimelineItemTemplateContext<T> {
    return true;
  }
}

/** Action area at the end of the first line (for example an edit/delete menu). `let-item` is the entry. */
@Directive({ selector: 'ng-template[sdTimelineItemActions]', standalone: true })
export class SdTimelineItemActionsDirective<T = unknown> {
  readonly template = inject<TemplateRef<SdTimelineItemTemplateContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    _directive: SdTimelineItemActionsDirective<T>,
    _context: unknown
  ): _context is SdTimelineItemTemplateContext<T> {
    return true;
  }
}

/** Replaces the empty state. */
@Directive({ selector: 'ng-template[sdTimelineEmpty]', standalone: true })
export class SdTimelineEmptyDirective {
  readonly template = inject<TemplateRef<void>>(TemplateRef);
  static ngTemplateContextGuard(_directive: SdTimelineEmptyDirective, _context: unknown): _context is void {
    return true;
  }
}
