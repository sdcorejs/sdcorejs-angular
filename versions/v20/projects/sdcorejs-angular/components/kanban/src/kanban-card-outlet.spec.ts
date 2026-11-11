import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdKanban } from './kanban.component';
import type { SdKanbanCard, SdKanbanColumn, SdKanbanOption } from './kanban.model';
import { SdKanbanCardActionsTemplateDirective, SdKanbanCardTemplateDirective } from './kanban.templates';

// Kanban A-15 (PD 2026-11-11): the consumer's card templates render in an OnPush outlet with a stable context, so a
// change of the board's state checks only the cards it concerns.

@Component({
  standalone: true,
  imports: [SdKanban, SdKanbanCardTemplateDirective, SdKanbanCardActionsTemplateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-kanban [columns]="columns" [items]="items" [option]="option">
      <ng-template [sdKanbanCardTemplate]="option" let-card let-selected="selected">
        <span class="title" [attr.data-selected-in-template]="selected || null">{{ seen('card', card) }}</span>
      </ng-template>
      <ng-template [sdKanbanCardActionsTemplate]="option" let-card>{{ seen('actions', card) }}</ng-template>
    </sd-kanban>
  `,
})
class CountingHost {
  readonly kanban = viewChild.required(SdKanban);
  readonly columns: readonly SdKanbanColumn[] = [
    { id: 'open', label: 'Open' },
    { id: 'done', label: 'Done' },
  ];
  readonly items: readonly SdKanbanCard<unknown>[] = [
    { id: 'a', columnId: 'open', title: 'A' },
    { id: 'b', columnId: 'open', title: 'B' },
    { id: 'c', columnId: 'done', title: 'C' },
  ];
  readonly option: SdKanbanOption<unknown> = { move: { onMove: () => true } };
  readonly renders = new Map<string, number>();

  seen(kind: string, card: SdKanbanCard<unknown>): string {
    const key = `${kind}:${card.id}`;
    this.renders.set(key, (this.renders.get(key) ?? 0) + 1);
    return card.title;
  }
}

describe('SdKanban · card outlet (A-15)', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [CountingHost], providers: [provideNoopAnimations()] }));
  afterEach(() => TestBed.resetTestingModule());

  it('[KAN-B-40] checks only the card whose context changed when the board state changes', () => {
    const fixture = TestBed.createComponent(CountingHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    expect(host.renders.get('card:b')).withContext('first render').toBeGreaterThan(0);
    host.renders.clear();
    // why: an OnPush host is not checked again; only the board, which reads the signal, is (as in an app).
    host.kanban().selectedId.set('a');
    fixture.detectChanges();
    expect(host.renders.get('card:a')).withContext('the selected card').toBeGreaterThan(0);
    expect(host.renders.get('actions:a')).withContext('its actions').toBeGreaterThan(0);
    expect(host.renders.get('card:b') ?? 0)
      .withContext('another card of the column')
      .toBe(0);
    expect(host.renders.get('card:c') ?? 0)
      .withContext('a card of another column')
      .toBe(0);
    expect(host.renders.get('actions:c') ?? 0).toBe(0);
    const selected = fixture.nativeElement.querySelector('[data-selected-in-template]') as HTMLElement | null;
    expect(selected?.textContent).toBe('A');
  });

  it('[KAN-B-40] keeps one context object per card while nothing about it changes', () => {
    const fixture = TestBed.createComponent(CountingHost);
    fixture.detectChanges();
    const kanban = fixture.componentInstance.kanban() as unknown as {
      boardColumns: () => readonly { column: SdKanbanColumn; cards: readonly { card: SdKanbanCard<unknown>; index: number }[] }[];
      cardContext: (view: unknown, column: unknown) => object;
    };
    const [open] = kanban.boardColumns();
    const first = kanban.cardContext(open.cards[0], open);
    expect(kanban.cardContext(open.cards[0], open)).toBe(first);
    fixture.componentInstance.kanban().selectedId.set('a');
    expect(kanban.cardContext(open.cards[0], open)).withContext('selected changed').not.toBe(first);
    expect(kanban.cardContext(open.cards[1], open)).toBe(kanban.cardContext(open.cards[1], open));
  });
});
