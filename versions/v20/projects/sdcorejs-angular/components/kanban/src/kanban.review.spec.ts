import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CdkDrag, CdkDragStart } from '@angular/cdk/drag-drop';
import { OverlayContainer } from '@angular/cdk/overlay';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18nService, type I18nParams } from '@sdcorejs/angular/i18n';
import { centerOf, Deferred, FakeIntersectionObserver, deferred } from '../../../testing/schedule-testing';
import { SdKanban } from './kanban.component';
import type { SdKanbanCard, SdKanbanColumn, SdKanbanLoadArgs, SdKanbanLoadResult, SdKanbanOption } from './kanban.model';
import { SdKanbanCardTemplateDirective, SdKanbanColumnActionsTemplateDirective, SdKanbanColumnTemplateDirective } from './kanban.templates';

// Regressions for the findings of the independent review R2 (reviews/kanban-R2-spec.md, kanban-R2-tests.md).

interface Dto {
  readonly owner: string;
}
type Card = SdKanbanCard<Dto>;
type Page = SdKanbanLoadResult<Dto>;

const items: readonly Card[] = [
  { id: 'x', columnId: 'open', title: 'First', data: { owner: 'Lan' } },
  { id: 'y', columnId: 'open', title: 'Second' },
  { id: 'd', columnId: 'done', title: 'Done card' },
];
const columns: readonly SdKanbanColumn[] = [
  { id: 'open', label: 'Open', summary: 'S' },
  { id: 'done', label: 'Done', summary: '0 ₫' },
  { id: 'later', label: 'Later' },
];
const card = (id: string, columnId: string): Card => ({ id, columnId, title: id.toUpperCase() });
const page = (columnId: string, ids: string[], nextCursor: string | null = null, extra: Partial<Page> = {}): Page => ({
  items: ids.map(id => card(id, columnId)),
  nextCursor,
  ...extra,
});

@Component({
  standalone: true,
  imports: [SdKanban, SdKanbanCardTemplateDirective, SdKanbanColumnTemplateDirective, SdKanbanColumnActionsTemplateDirective],
  template: `
    <sd-kanban [columns]="columns()" [items]="items()" [option]="option()" [keyword]="keyword()">
      <ng-template
        sdKanbanColumnTemplate
        let-column
        let-total="total"
        let-visible="visibleCount"
        let-summary="summary"
        let-collapsed="collapsed">
        <span class="ctx" [attr.data-for]="column.id">{{ show(total) }}|{{ visible }}|{{ show(summary) }}|{{ collapsed }}</span>
      </ng-template>
      <ng-template sdKanbanColumnActionsTemplate let-column let-total="total" let-summary="summary">
        <span class="ctx-actions" [attr.data-for]="column.id">{{ show(total) }}|{{ show(summary) }}</span>
      </ng-template>
      <ng-template [sdKanbanCardTemplate]="option()" let-card>
        <span class="tpl">{{ card.title }}·{{ card.data?.owner }}</span>
      </ng-template>
    </sd-kanban>
  `,
})
class TemplateHost {
  readonly columns = signal<readonly SdKanbanColumn[]>(columns);
  readonly items = signal<readonly Card[] | undefined>(undefined);
  readonly option = signal<SdKanbanOption<Dto>>({});
  readonly keyword = signal('');
  show(value: unknown): string {
    return value === null ? 'null' : String(value);
  }
}

describe('SdKanban · review R2 regressions', () => {
  let calls: { readonly args: SdKanbanLoadArgs; readonly wait: Deferred<Page> }[];
  const onLoad = (args: SdKanbanLoadArgs): Promise<Page> => {
    const wait = deferred<Page>();
    calls.push({ args, wait });
    return wait.promise;
  };
  const last = (columnId: string) => [...calls].reverse().find(call => call.args.columnId === columnId);
  const t = (key: string, params?: I18nParams): string => TestBed.inject(I18nService).t(`core.component.kanban.${key}`, params);

  beforeEach(() => {
    calls = [];
    TestBed.configureTestingModule({ imports: [SdKanban, TemplateHost], providers: [provideNoopAnimations()] });
  });

  describe('with a host and templates', () => {
    let fixture: ComponentFixture<TemplateHost>;
    const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const ctx = (columnId: string, kind = 'ctx'): string =>
      host().querySelector(`.${kind}[data-for="${columnId}"]`)?.textContent?.trim() ?? '(none)';
    const settle = (): void => {
      fixture.detectChanges();
      flushMicrotasks();
      fixture.detectChanges();
    };

    it('[KAN-B-08] gives the column templates total (null while unknown) and the summary of the first page', fakeAsync(() => {
      fixture = TestBed.createComponent(TemplateHost);
      fixture.componentInstance.items.set(items);
      fixture.componentInstance.keyword.set('first');
      settle();
      // items: total is the column's cards, visibleCount what the keyword leaves.
      expect(ctx('open')).toBe('2|1|S|false');
      expect(ctx('open', 'ctx-actions')).toBe('2|S');

      fixture.componentInstance.keyword.set('');
      fixture.componentInstance.items.set(undefined);
      fixture.componentInstance.option.set({ dataSource: { onLoad } });
      settle();
      expect(ctx('done')).withContext('first page on its way').toBe('null|0|0 ₫|false');
      last('done')?.wait.resolve(page('done', ['d1', 'd2'], 'c', { total: 9, summary: 'P' }));
      settle();
      expect(ctx('done')).toBe('9|2|P|false');
      expect(ctx('done', 'ctx-actions')).toBe('9|P');
      last('open')?.wait.resolve(page('open', ['a'], 'c'));
      settle();
      expect(ctx('open')).withContext('no total from the server').toBe('null|1|S|false');
      last('later')?.wait.reject(new Error('down'));
      settle();
      expect(ctx('later')).withContext('first page failed').toBe('null|0|null|false');
      flush();
    }));

    it('[KAN-B-18] draws the content of the card in its old place while reorder is off', fakeAsync(() => {
      fixture = TestBed.createComponent(TemplateHost);
      fixture.componentInstance.items.set(items);
      fixture.componentInstance.option.set({ move: { onMove: () => true } });
      settle();
      const drag = fixture.debugElement
        .queryAll(By.directive(CdkDrag))
        .map(element => element.injector.get(CdkDrag))
        .find(candidate => candidate.data.card.id === 'x')!;
      drag.started.emit({ source: drag, event: new MouseEvent('mousedown') } as CdkDragStart);
      settle();
      expect(host().querySelector('[data-origin] .tpl')?.textContent?.trim()).toBe('First·Lan');
      flush();
    }));
  });

  describe('items', () => {
    let fixture: ComponentFixture<SdKanban<Dto>>;
    const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const kanban = (): SdKanban<Dto> => fixture.componentInstance;
    const article = (id: string): HTMLElement => host().querySelector<HTMLElement>(`article[data-card-id="${id}"]`)!;
    const lane = (id: string): HTMLElement => host().querySelector<HTMLElement>(`.sd-kanban__column[data-column-id="${id}"]`)!;
    const name = (id: string): HTMLButtonElement => host().querySelector<HTMLButtonElement>(`[data-kanban-card-main="${id}"]`)!;
    const columnOf = (id: string): string | null | undefined => {
      fixture.detectChanges();
      return article(id)?.closest('[data-column-id]')?.getAttribute('data-column-id');
    };
    const drag = (id: string): CdkDrag =>
      fixture.debugElement
        .queryAll(By.directive(CdkDrag))
        .map(element => element.injector.get(CdkDrag))
        .find(candidate => candidate.data.card.id === id)!;
    const startDrag = (id: string): void => {
      const source = drag(id);
      source.started.emit({ source, event: new MouseEvent('mousedown') } as CdkDragStart);
      fixture.detectChanges();
    };
    const endDrag = (id: string): void => {
      const source = drag(id);
      source.ended.emit({ source, distance: { x: 0, y: 0 }, dropPoint: { x: 0, y: 0 }, event: new MouseEvent('mouseup') });
      fixture.detectChanges();
    };
    const alt = (id: string, key: string): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', { altKey: true, key, bubbles: true, cancelable: true });
      name(id).focus();
      name(id).dispatchEvent(event);
      return event;
    };
    const openMenu = async (id: string): Promise<HTMLButtonElement[]> => {
      host().querySelector<HTMLButtonElement>(`[data-kanban-menu="${id}"]`)!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      return Array.from(TestBed.inject(OverlayContainer).getContainerElement().querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    };
    function mount(option: SdKanbanOption<Dto>, inputs: Record<string, unknown> = {}): void {
      fixture = TestBed.createComponent(SdKanban<Dto>);
      fixture.componentRef.setInput('columns', columns.slice(0, 2));
      fixture.componentRef.setInput('items', items);
      fixture.componentRef.setInput('option', option);
      for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
      fixture.detectChanges();
    }

    it('[KAN-B-11] honours movable and droppable given as booleans (SC-05)', async () => {
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      mount({ move: { movable: false, onMove } });
      expect(drag('x').disabled).withContext('no drag').toBeTrue();
      expect(host().querySelector<HTMLButtonElement>('[data-kanban-menu="x"]')?.disabled).withContext('menu').toBeTrue();
      expect(await kanban().move('x', { columnId: 'done' })).toBeFalse();
      name('x').click();
      expect(kanban().selectedId()).withContext('still selects').toBe('x');

      mount({ move: { droppable: false, reorder: true, onMove } });
      startDrag('x');
      expect(lane('done').hasAttribute('data-blocked')).toBeTrue();
      endDrag('x');
      alt('x', 'ArrowRight');
      await fixture.whenStable();
      expect(columnOf('x')).toBe('open');
      expect(await kanban().move('x', { columnId: 'done' })).toBeFalse();
      expect(onMove).not.toHaveBeenCalled();
      expect(await kanban().move('y', { columnId: 'open', beforeId: 'x' }))
        .withContext('same column (PD R1)')
        .toBeTrue();
    });

    it('[KAN-B-13] keeps the Dismiss button of a failed card above the name overlay', async () => {
      mount({ move: { onMove: () => false } });
      expect(await kanban().move('x', { columnId: 'done' }, 'keyboard')).toBeFalse();
      fixture.detectChanges();
      const dismiss = article('x').querySelector<HTMLButtonElement>('.sd-kanban__card-status--error button')!;
      dismiss.scrollIntoView({ block: 'center', inline: 'center' });
      const point = centerOf(dismiss);
      expect(dismiss.contains(document.elementFromPoint(point.x, point.y))).toBeTrue();
    });

    it('[KAN-B-16] aligns the summary line with the label on an RTL page whose text is aligned left', () => {
      mount({});
      host().style.textAlign = 'left';
      expect(getComputedStyle(lane('open').querySelector('[data-summary]')!).textAlign).toBe('start');
    });

    it('[KAN-B-19] shows grabbing while a card is dragged, not-allowed on a refused lane', () => {
      mount({ move: { droppable: ({ to }) => to.id !== 'done', onMove: () => true } });
      expect(getComputedStyle(article('y')).cursor).toBe('grab');
      startDrag('x');
      expect(getComputedStyle(article('y')).cursor).toBe('grabbing');
      expect(getComputedStyle(name('y')).cursor).toBe('grabbing');
      expect(getComputedStyle(lane('done').querySelector('.sd-kanban__header')!).cursor).toBe('not-allowed');
      endDrag('x');
      expect(getComputedStyle(article('y')).cursor).toBe('grab');
    });

    it('[KAN-B-22] keeps a selectedId given before the items arrive', () => {
      fixture = TestBed.createComponent(SdKanban<Dto>);
      fixture.componentRef.setInput('columns', columns.slice(0, 2));
      fixture.componentRef.setInput('option', {});
      fixture.componentRef.setInput('selectedId', 'x');
      fixture.detectChanges();
      expect(kanban().selectedId()).toBe('x');
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();
      expect(kanban().selectedId()).toBe('x');
      fixture.componentRef.setInput('items', items.slice(1));
      fixture.detectChanges();
      expect(kanban().selectedId()).withContext('the card left the data').toBeNull();
    });

    it('[KAN-C-11] leaves Alt + Up / Down to the page while reorder is off', () => {
      mount({ move: { onMove: () => true } });
      expect(alt('y', 'ArrowUp').defaultPrevented).toBeFalse();
      expect(alt('x', 'ArrowRight').defaultPrevented).toBeTrue();
    });

    it('[KAN-C-19] marks a selected card that failed: selected, not pending, failed', async () => {
      mount({ move: { onMove: () => false } });
      name('x').click();
      expect(await kanban().move('x', { columnId: 'done' })).toBeFalse();
      fixture.detectChanges();
      expect(article('x').getAttribute('data-selected')).toBe('true');
      expect(article('x').hasAttribute('data-pending')).toBeFalse();
      expect(article('x').classList).toContain('sd-kanban__card--failed');
    });

    it('[KAN-B-12] keeps the menu entry of a column that has not loaded closed (data source)', async () => {
      // The menu half of KAN-B-12; the data source half is below.
      fixture = TestBed.createComponent(SdKanban<Dto>);
      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('collapsedColumns', ['later']);
      fixture.componentRef.setInput('option', { dataSource: { onLoad }, move: { onMove: () => true } });
      fixture.detectChanges();
      last('open')?.wait.resolve(page('open', ['a']));
      last('done')?.wait.resolve(page('done', ['d']));
      await fixture.whenStable();
      fixture.detectChanges();
      const entries = await openMenu('a');
      const later = entries.find(entry => entry.textContent?.includes('Later'));
      const done = entries.find(entry => entry.textContent?.includes('Done'));
      expect(done?.disabled).toBeFalse();
      expect(later?.disabled).withContext('collapsed and never loaded').toBeTrue();
    });
  });

  describe('data source', () => {
    let fixture: ComponentFixture<SdKanban<Dto>>;
    const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const kanban = (): SdKanban<Dto> => fixture.componentInstance;
    const lane = (id: string): HTMLElement => host().querySelector<HTMLElement>(`.sd-kanban__column[data-column-id="${id}"]`)!;
    const ids = (id: string): (string | null)[] =>
      Array.from(lane(id)?.querySelectorAll('article') ?? []).map(a => a.getAttribute('data-card-id'));
    const count = (id: string): HTMLElement => lane(id).querySelector<HTMLElement>('.sd-kanban__count')!;
    const name = (id: string): HTMLButtonElement =>
      host().querySelector<HTMLButtonElement>(`[data-kanban-card-main="${encodeURIComponent(id)}"]`)!;
    const settle = (): void => {
      fixture.detectChanges();
      flushMicrotasks();
      fixture.detectChanges();
    };
    const answer = (id: string, result: Page): void => {
      last(id)?.wait.resolve(result);
      settle();
    };
    const fail = (id: string): void => {
      last(id)?.wait.reject(new Error('down'));
      settle();
    };
    function mount(option: Partial<SdKanbanOption<Dto>> = {}, inputs: Record<string, unknown> = {}, cols = columns): void {
      fixture = TestBed.createComponent(SdKanban<Dto>);
      fixture.componentRef.setInput('columns', cols);
      fixture.componentRef.setInput('option', { dataSource: { onLoad }, pageSize: 2, ...option });
      for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
      settle();
    }

    it('[KAN-B-09] cleans up on destroy: loads, the keyword timer, the observer and the focus listener', fakeAsync(() => {
      const restore = FakeIntersectionObserver.install();
      try {
        mount({ loadMore: 'auto', move: { onMove: () => true } });
        const pending = last('later')!.args.signal;
        answer('open', page('open', ['a', 'b'], 'c'));
        answer('done', page('done', ['d']));
        tick();
        fixture.componentRef.setInput('keyword', 'z');
        fixture.detectChanges();
        name('a').focus();
        const removed = spyOn(document, 'removeEventListener').and.callThrough();
        void kanban().move('a', { columnId: 'done' }, 'keyboard');
        flushMicrotasks();
        fixture.destroy();
        expect(pending.aborted).withContext('the load of later').toBeTrue();
        const before = calls.length;
        tick(300);
        expect(calls.length).withContext('no load after the keyword timer').toBe(before);
        expect(FakeIntersectionObserver.instances.length).toBeGreaterThan(0);
        expect(FakeIntersectionObserver.instances.every(observer => observer.disconnected)).toBeTrue();
        expect(removed.calls.allArgs().some(([type, , capture]) => type === 'focusin' && capture === true)).toBeTrue();
      } finally {
        restore();
      }
      flush();
    }));

    it('[KAN-B-09] stops watching "Show more" when loadMore leaves auto', fakeAsync(() => {
      const restore = FakeIntersectionObserver.install();
      try {
        mount({ loadMore: 'auto' });
        answer('open', page('open', ['a', 'b'], 'c'));
        tick();
        fixture.componentRef.setInput('option', { dataSource: { onLoad }, pageSize: 2, loadMore: 'button' });
        settle();
        tick();
        answer('open', page('open', ['a', 'b'], 'c'));
        answer('done', page('done', []));
        answer('later', page('later', []));
        tick();
        const button = lane('open').querySelector('[data-load-more]')!;
        const before = calls.length;
        for (const observer of FakeIntersectionObserver.instances) observer.intersect(button);
        settle();
        expect(calls.length).toBe(before);
      } finally {
        restore();
      }
      flush();
    }));

    it('[KAN-B-10] moves before the first card and inside one column with a data source and reorder', fakeAsync(() => {
      mount({ move: { reorder: true, onMove: () => true } });
      answer('open', page('open', ['a', 'b', 'c'], null, { total: 3 }));
      answer('done', page('done', ['d', 'e'], null, { total: 2 }));
      answer('later', page('later', []));
      void kanban().move('c', { columnId: 'open', beforeId: 'a' });
      settle();
      expect(ids('open')).toEqual(['c', 'a', 'b']);
      expect(count('open').textContent?.trim()).toBe('3');
      void kanban().move('a', { columnId: 'done', beforeId: 'd' });
      settle();
      expect(ids('done')).toEqual(['a', 'd', 'e']);
      expect(ids('open')).toEqual(['c', 'b']);
      expect(count('done').textContent?.trim()).toBe('3');
      flush();
    }));

    it('[KAN-B-12] treats a column without its first page as no destination', fakeAsync(() => {
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      mount({ move: { onMove } });
      answer('open', page('open', ['a']));
      fail('done');
      answer('later', page('later', ['l']));
      // Alt + Right skips the failed column.
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'ArrowRight', bubbles: true, cancelable: true });
      name('a').focus();
      name('a').dispatchEvent(event);
      settle();
      expect(ids('later')).toContain('a');
      // A drag fades it.
      const drag = fixture.debugElement
        .queryAll(By.directive(CdkDrag))
        .map(element => element.injector.get(CdkDrag))
        .find(candidate => candidate.data.card.id === 'l')!;
      drag.started.emit({ source: drag, event: new MouseEvent('mousedown') } as CdkDragStart);
      fixture.detectChanges();
      expect(lane('done').hasAttribute('data-blocked')).toBeTrue();
      // move() refuses it, and a column that is loading again.
      onMove.calls.reset();
      let result: boolean | undefined;
      void kanban()
        .move('l', { columnId: 'done' })
        .then(value => (result = value));
      settle();
      expect(result).toBeFalse();
      kanban().reload('open');
      settle();
      void kanban()
        .move('l', { columnId: 'open' })
        .then(value => (result = value));
      settle();
      expect(result).withContext('open is loading again').toBeFalse();
      expect(onMove).not.toHaveBeenCalled();
      flush();
    }));

    it('[KAN-B-14] loads more with loadMore auto when the column id needs encoding', fakeAsync(() => {
      const restore = FakeIntersectionObserver.install();
      try {
        mount({ loadMore: 'auto' }, {}, [{ id: 'đã huỷ', label: 'Đã huỷ' }]);
        answer('đã huỷ', page('đã huỷ', ['a', 'b'], 'c1'));
        tick();
        const button = lane(encodeURIComponent('đã huỷ')).querySelector('[data-load-more]')!;
        for (const observer of FakeIntersectionObserver.instances) observer.intersect(button);
        settle();
        expect(last('đã huỷ')?.args.cursor).toBe('c1');
      } finally {
        restore();
      }
      flush();
    }));

    it('[KAN-B-15] gives the count a spoken name only when the total is known', fakeAsync(() => {
      mount();
      expect(count('open').textContent?.trim()).toBe('–');
      expect(count('open').hasAttribute('aria-label')).toBeFalse();
      answer('open', page('open', ['a', 'b'], 'c'));
      expect(count('open').textContent?.trim()).toBe('2+');
      expect(count('open').hasAttribute('aria-label')).toBeFalse();
      answer('done', page('done', ['d'], null, { total: 5 }));
      expect(count('done').getAttribute('aria-label')).toBe(t('count', { count: 5 }));
      flush();
    }));

    it('[KAN-B-17] says "no matching cards" for an empty column while a keyword is set', fakeAsync(() => {
      mount();
      answer('open', page('open', [], null, { total: 0 }));
      expect(lane('open').querySelector('.sd-kanban__empty')?.textContent?.trim()).toBe(t('empty-column'));
      fixture.componentRef.setInput('keyword', 'zzz');
      settle();
      tick(300);
      answer('open', page('open', [], null, { total: 0 }));
      expect(lane('open').querySelector('.sd-kanban__empty')?.textContent?.trim()).toBe(t('no-results'));
      flush();
    }));

    it('[KAN-B-20] drops a loaded card whose id is blank or not a string', fakeAsync(() => {
      spyOn(console, 'warn');
      mount();
      const odd = [card('a', 'open'), { id: '  ', columnId: 'open', title: 'Blank' }, { id: 7, columnId: 'open', title: 'Seven' }];
      answer('open', { items: odd as unknown as Card[], nextCursor: null });
      expect(ids('open')).toEqual(['a']);
      flush();
    }));

    it('[KAN-B-21] clears the summary of the server when the first page fails again', fakeAsync(() => {
      mount();
      answer('done', page('done', ['d'], null, { summary: 'P' }));
      expect(lane('done').querySelector('[data-summary]')?.textContent?.trim()).toBe('P');
      kanban().reload('done');
      settle();
      fail('done');
      expect(lane('done').querySelector('[data-summary]')?.textContent?.trim()).toBe('0 ₫');
      flush();
    }));

    it('[KAN-B-22] keeps a selectedId given before the first pages arrive', fakeAsync(() => {
      mount({}, { selectedId: 'b' });
      expect(kanban().selectedId()).toBe('b');
      answer('open', page('open', ['a', 'b']));
      answer('done', page('done', []));
      answer('later', page('later', []));
      expect(kanban().selectedId()).toBe('b');
      kanban().reload('open');
      settle();
      answer('open', page('open', ['a']));
      expect(kanban().selectedId()).withContext('the card left the data').toBeNull();
      flush();
    }));
  });
});
