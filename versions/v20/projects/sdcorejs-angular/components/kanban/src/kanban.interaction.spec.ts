import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { centerOf, clickWithJitter, deferred, mouse, mouseDrag, press, touch } from '../../../testing/schedule-testing';
import { SdKanban } from './kanban.component';
import type { SdKanbanCard, SdKanbanColumn, SdKanbanOption } from './kanban.model';
import { SdKanbanCardActionsTemplateDirective, SdKanbanCardTemplateDirective } from './kanban.templates';

interface Dto {
  readonly owner: string;
}
type Card = SdKanbanCard<Dto>;

const dto: Dto = { owner: 'Lan' };
const data: readonly Card[] = [
  { id: 'x', columnId: 'open', title: 'First', data: dto },
  { id: 'y', columnId: 'open', title: 'Second' },
  { id: 'd', columnId: 'done', title: 'Done card' },
];
const columns: readonly SdKanbanColumn[] = [
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done' },
];

@Component({
  standalone: true,
  imports: [SdKanban, SdKanbanCardTemplateDirective, SdKanbanCardActionsTemplateDirective],
  template: `
    <sd-kanban [columns]="columns" [items]="items" [option]="option()">
      @if (interactive()) {
        <ng-template sdKanbanCardTemplate let-card>
          <span>{{ card.title }}</span>
          <button type="button">Inside the name</button>
        </ng-template>
      }
      <ng-template sdKanbanCardActionsTemplate let-card>
        <button type="button" class="test-action" (click)="acted.set(card.id)">Act</button>
      </ng-template>
    </sd-kanban>
  `,
})
class HostComponent {
  readonly columns = columns;
  readonly items = data;
  readonly option = signal<SdKanbanOption<Dto>>({ move: { onMove: () => true } });
  readonly interactive = signal(false);
  readonly acted = signal<string | null>(null);
}

describe('SdKanban · selection, whole-card drag and the name button', () => {
  let fixture: ComponentFixture<SdKanban<Dto>>;
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const kanban = (): SdKanban<Dto> => fixture.componentInstance;
  const name = (id: string): HTMLButtonElement => {
    const button = host().querySelector<HTMLButtonElement>(`[data-kanban-card-main="${id}"]`);
    expect(button).withContext(`name button of ${id}`).not.toBeNull();
    return button ?? document.createElement('button');
  };
  const article = (id: string): HTMLElement => host().querySelector<HTMLElement>(`article[data-card-id="${id}"]`)!;
  const lane = (columnId: string): HTMLElement => host().querySelector<HTMLElement>(`.sd-kanban__cards[id$="-list-${columnId}"]`)!;
  const live = (): string => host().querySelector('[aria-live="polite"]')?.textContent?.trim() ?? '';
  const t = (key: string, title: string): string => TestBed.inject(I18nService).t(`core.component.kanban.${key}`, { title });
  const settle = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };

  function mount(option: SdKanbanOption<Dto> = { move: { onMove: () => true } }, inputs: Record<string, unknown> = {}): jasmine.Spy {
    fixture = TestBed.createComponent(SdKanban<Dto>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('items', data);
    fixture.componentRef.setInput('option', option);
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    const selected = jasmine.createSpy('sdSelect');
    fixture.componentInstance.sdSelect.subscribe(selected);
    fixture.detectChanges();
    return selected;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SdKanban, HostComponent], providers: [provideNoopAnimations()] });
  });

  describe('selection (SC-26…28)', () => {
    it('[KAN-SC-26] selects with a click, a click with a 3px jitter, Enter, Space and a tap', fakeAsync(() => {
      const selected = mount();
      name('x').click();
      settle();
      expect(kanban().selectedId()).toBe('x');
      expect(selected).toHaveBeenCalledTimes(1);
      expect((selected.calls.mostRecent()?.args[0] as Card | undefined)?.data)
        .withContext('the card as given')
        .toBe(dto);
      expect(live()).toBe(t('selected', 'First'));
      name('x').click();
      settle();
      expect(selected).withContext('a click on the selected card emits again').toHaveBeenCalledTimes(2);
      clickWithJitter(name('y'));
      settle();
      expect(kanban().selectedId()).toBe('y');
      for (const key of ['Enter', ' ']) {
        kanban().selectedId.set(null);
        settle();
        press(name('x'), key);
        settle();
        expect(kanban().selectedId()).withContext(key).toBe('x');
      }
      kanban().selectedId.set(null);
      settle();
      const point = centerOf(name('y'));
      touch(name('y'), 'touchstart', point);
      touch(name('y'), 'touchend', point);
      mouse(name('y'), 'click', point);
      settle();
      expect(kanban().selectedId()).withContext('tap').toBe('y');
      flush();
    }));

    it('[KAN-SC-26] [KAN-C-14] clears the selection with Esc and marks the selected card', fakeAsync(() => {
      mount();
      name('x').click();
      settle();
      expect(article('x').getAttribute('aria-current')).toBe('true');
      expect(article('x').getAttribute('data-selected')).toBe('true');
      expect(article('y').hasAttribute('aria-current')).toBeFalse();
      press(name('x'), 'Escape');
      settle();
      expect(kanban().selectedId()).toBeNull();
      expect(article('x').hasAttribute('data-selected')).toBeFalse();
    }));

    it('[KAN-SC-27] goes back to null when the selected card is no longer in the data', fakeAsync(() => {
      mount();
      name('x').click();
      settle();
      fixture.componentRef.setInput(
        'items',
        data.filter(card => card.id !== 'x')
      );
      settle();
      expect(kanban().selectedId()).toBeNull();
    }));

    it('[KAN-SC-28] selects while readonly, not while disabled', fakeAsync(() => {
      const selected = mount(undefined, { readonly: true });
      name('x').click();
      settle();
      expect(kanban().selectedId()).toBe('x');
      fixture.componentRef.setInput('readonly', false);
      fixture.componentRef.setInput('disabled', true);
      kanban().selectedId.set(null);
      settle();
      expect(name('y').disabled).toBeTrue();
      name('y').click();
      press(name('y'), 'Enter');
      settle();
      expect(kanban().selectedId()).toBeNull();
      expect(selected).toHaveBeenCalledTimes(1);
    }));
  });

  describe('whole-card drag', () => {
    it('[KAN-C-15] drags the whole card without a handle; a drag does not select', fakeAsync(() => {
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      const selected = mount({ move: { onMove } });
      expect(host().querySelector('[data-kanban-handle]')).toBeNull();
      expect(fixture.debugElement.queryAll(By.directive(CdkDragHandle)).length).toBe(0);
      const drag = fixture.debugElement.query(By.css('article[data-card-id="x"]')).injector.get(CdkDrag);
      expect(drag.dragStartDelay).toEqual({ touch: 400, mouse: 0 });
      mouseDrag(name('x'), centerOf(lane('done')), { step: settle });
      settle();
      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove.calls.mostRecent()?.args[0]?.source).toBe('drag');
      expect(selected).not.toHaveBeenCalled();
      flush();
    }));

    it('[KAN-C-14] does not select from the click that may follow a drag, but from the next press', fakeAsync(() => {
      const selected = mount({ move: { onMove: () => 'cancel' } });
      mouseDrag(name('x'), centerOf(lane('done')), { step: settle });
      settle();
      // A browser that sends the click to the same element after the drag.
      mouse(name('x'), 'click', centerOf(name('x')));
      settle();
      expect(selected).not.toHaveBeenCalled();
      clickWithJitter(name('x'));
      settle();
      expect(selected).toHaveBeenCalledTimes(1);
      flush();
    }));

    it('[KAN-C-15] keeps selection when movable refuses the card', fakeAsync(() => {
      const onMove = jasmine.createSpy('onMove');
      mount({ move: { movable: card => card.id !== 'x', onMove } });
      const drag = fixture.debugElement.query(By.css('article[data-card-id="x"]')).injector.get(CdkDrag);
      expect(drag.disabled).toBeTrue();
      mouseDrag(name('x'), centerOf(lane('done')), { step: settle });
      expect(onMove).not.toHaveBeenCalled();
      name('x').click();
      settle();
      expect(kanban().selectedId()).toBe('x');
      flush();
    }));

    it('[KAN-C-19] marks the card that waits for onMove', fakeAsync(() => {
      const wait = deferred<boolean>();
      mount({ move: { onMove: () => wait.promise } });
      void kanban().move('x', { columnId: 'done' });
      settle();
      expect(article('x').getAttribute('data-pending')).toBe('true');
      expect(article('y').hasAttribute('data-pending')).toBeFalse();
      wait.resolve(true);
      settle();
      expect(host().querySelector('[data-pending]')).toBeNull();
    }));
  });

  describe('the name button covers the card', () => {
    it('[KAN-C-16] is the Tab stop of a card; the move menu and the actions stay on top and do not start a drag', fakeAsync(() => {
      const hosted = TestBed.createComponent(HostComponent);
      hosted.detectChanges();
      const root = hosted.nativeElement as HTMLElement;
      const card = root.querySelector<HTMLElement>('article[data-card-id="x"]')!;
      const main = card.querySelector<HTMLButtonElement>('[data-kanban-card-main]');
      expect(main?.tagName).toBe('BUTTON');
      expect(main?.textContent?.trim()).toBe('First');
      const menu = card.querySelector<HTMLButtonElement>('[data-kanban-menu]') ?? document.createElement('button');
      const action = card.querySelector<HTMLButtonElement>('.test-action') ?? document.createElement('button');
      for (const control of [menu, action]) {
        // why: elementFromPoint only sees the viewport; in the full suite other specs' leftovers push the host down.
        control.scrollIntoView({ block: 'center', inline: 'center' });
        const point = centerOf(control);
        expect(control.contains(document.elementFromPoint(point.x, point.y)))
          .withContext(control.className)
          .toBeTrue();
      }
      action.click();
      expect(hosted.componentInstance.acted()).toBe('x');
      const onMove = jasmine.createSpy('onMove');
      hosted.componentInstance.option.set({ move: { onMove } });
      hosted.detectChanges();
      const target = root.querySelector<HTMLElement>('.sd-kanban__column[data-column-id="done"]')!;
      mouseDrag(action, centerOf(target), { step: () => hosted.detectChanges() });
      hosted.detectChanges();
      flushMicrotasks();
      expect(onMove).withContext('no drag from the actions').not.toHaveBeenCalled();
      expect(document.querySelector('.cdk-drag-preview')).toBeNull();
      flush();
    }));

    it('[KAN-C-18] warns once in dev mode when the card template has an interactive control', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      const hosted = TestBed.createComponent(HostComponent);
      hosted.componentInstance.interactive.set(true);
      hosted.detectChanges();
      flush();
      hosted.detectChanges();
      flush();
      const warnings = warn.calls.allArgs().filter(args => String(args[0]).includes('sdKanbanCardTemplate'));
      expect(warnings.length).toBe(1);
    }));

    it('[KAN-C-14] describes the keys under the name: column moves only, or reorder too', fakeAsync(() => {
      mount();
      const text = (): string | undefined =>
        document.getElementById((name('x').getAttribute('aria-describedby') ?? '').split(' ')[0])?.textContent?.trim();
      const i18n = TestBed.inject(I18nService);
      expect(text()).toBe(i18n.t('core.component.kanban.instructions-column'));
      fixture.componentRef.setInput('option', { move: { reorder: true, onMove: () => true } });
      settle();
      expect(text()).toBe(i18n.t('core.component.kanban.instructions'));
    }));

    it('[KAN-SC-29] moves with Alt + arrow on the name and keeps the focus on it', fakeAsync(() => {
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      mount({ move: { onMove } });
      name('x').focus();
      press(name('x'), 'ArrowRight', { alt: true });
      settle();
      tick();
      settle();
      expect(onMove).toHaveBeenCalledTimes(1);
      expect(name('x').closest('[data-column-id]')?.getAttribute('data-column-id')).toBe('done');
      expect(document.activeElement).toBe(name('x'));
    }));
  });
});
