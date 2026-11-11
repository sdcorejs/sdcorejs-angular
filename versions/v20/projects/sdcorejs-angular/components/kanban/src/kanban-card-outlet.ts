import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, input } from '@angular/core';

/**
 * Renders a card template or a card actions template of the consumer in an OnPush view of its own, so a change of the
 * board's state (a drag starts or ends, a card is selected or saved) checks only the cards whose context changed, not
 * every card of every column (kanban A-15, PD 2026-11-11). The board gives each card the same context object while the
 * card, its column, its index, `pending` and `selected` stay the same.
 *
 * `display: contents`: the outlet adds no box, so the template lays out as if it were rendered in place.
 */
@Component({
  selector: 'sd-kanban-card-outlet',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: '<ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="context()" />',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdKanbanCardOutlet<C extends object = object> {
  readonly template = input.required<TemplateRef<C>>();
  readonly context = input.required<C>();
}
