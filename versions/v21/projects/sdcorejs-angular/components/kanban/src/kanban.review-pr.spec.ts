import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Deferred, FakeIntersectionObserver, deferred } from '../../../testing/schedule-testing';
import { SdKanban } from './kanban.component';
import type { SdKanbanCard, SdKanbanColumn, SdKanbanLoadArgs, SdKanbanLoadResult, SdKanbanMoveError, SdKanbanOption } from './kanban.model';

// Regressions for the findings of the review of PR #142 (after R2').

type Card = SdKanbanCard<unknown>;
type Page = SdKanbanLoadResult<unknown>;

const columns: readonly SdKanbanColumn[] = [
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done' },
  { id: 'later', label: 'Later' },
];
const card = (id: string, columnId: string): Card => ({ id, columnId, title: id.toUpperCase() });
const page = (columnId: string, ids: string[], nextCursor: string | null = null): Page => ({
  items: ids.map(id => card(id, columnId)),
  nextCursor,
});

describe('SdKanban · review of PR #142', () => {
  let fixture: ComponentFixture<SdKanban<unknown>>;
  let calls: { readonly args: SdKanbanLoadArgs; readonly wait: Deferred<Page> }[];
  const onLoad = (args: SdKanbanLoadArgs): Promise<Page> => {
    const wait = deferred<Page>();
    calls.push({ args, wait });
    return wait.promise;
  };
  const last = (columnId: string) => [...calls].reverse().find(call => call.args.columnId === columnId);
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const kanban = (): SdKanban<unknown> => fixture.componentInstance;
  const lane = (id: string): HTMLElement => host().querySelector<HTMLElement>(`.sd-kanban__column[data-column-id="${id}"]`)!;
  const ids = (id: string): (string | null)[] => Array.from(lane(id).querySelectorAll('article')).map(a => a.getAttribute('data-card-id'));
  const settle = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };
  const answer = (id: string, result: Page): void => {
    last(id)?.wait.resolve(result);
    settle();
  };

  function mount(option: Partial<SdKanbanOption<unknown>> = {}, inputs: Record<string, unknown> = {}): void {
    fixture = TestBed.createComponent(SdKanban<unknown>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('option', { dataSource: { onLoad }, pageSize: 2, ...option });
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    settle();
  }

  beforeEach(() => {
    calls = [];
    TestBed.configureTestingModule({ imports: [SdKanban], providers: [provideNoopAnimations()] });
  });

  it('[KAN-B-26] keeps a card that changed column on the server when the columns load again in any order', fakeAsync(() => {
    mount();
    answer('open', page('open', ['a', 'x']));
    answer('done', page('done', ['d']));
    answer('later', page('later', []));
    kanban().reload();
    settle();
    // On the server x went from open to done; done answers first while open still shows its old page.
    answer('done', page('done', ['x', 'd']));
    expect(ids('done')).withContext('x is not taken for a second card of the old page').toEqual(['x', 'd']);
    expect(ids('open')).withContext('the old page of open no longer shows x').toEqual(['a']);
    answer('open', page('open', ['a']));
    answer('later', page('later', []));
    expect(ids('open')).toEqual(['a']);
    expect(ids('done')).toEqual(['x', 'd']);
    flush();
  }));

  it('[KAN-B-26] still drops a second card with the id of a card of a settled column', fakeAsync(() => {
    spyOn(console, 'warn');
    mount();
    answer('open', page('open', ['a', 'x']));
    answer('done', page('done', ['x', 'd']));
    answer('later', page('later', []));
    expect(ids('done')).toEqual(['d']);
    flush();
  }));

  it('[KAN-B-27] asks the next page and a retry with the keyword of the loaded pages, not one still waiting 300ms', fakeAsync(() => {
    mount();
    answer('open', page('open', ['a', 'b'], 'c1'));
    answer('done', page('done', ['d', 'e'], 'c2'));
    answer('later', page('later', []));
    fixture.componentRef.setInput('keyword', 'ab');
    settle();
    kanban().loadMore('open');
    expect(last('open')?.args).toEqual(jasmine.objectContaining({ cursor: 'c1', keyword: '' }));
    kanban().loadMore('done');
    last('done')?.wait.reject(new Error('down'));
    settle();
    host().querySelector<HTMLButtonElement>('[data-column-id="done"] [data-action="retry"]')!.click();
    settle();
    expect(last('done')?.args).toEqual(jasmine.objectContaining({ cursor: 'c2', keyword: '' }));
    tick(300);
    expect(last('open')?.args).toEqual(jasmine.objectContaining({ cursor: null, keyword: 'ab' }));
    expect(last('done')?.args).toEqual(jasmine.objectContaining({ cursor: null, keyword: 'ab' }));
    flush();
  }));

  it('[KAN-B-28] loads every column again when the keyword comes back to one only a newly opened column has', fakeAsync(() => {
    mount({}, { collapsedColumns: ['later'] });
    answer('open', page('open', ['a']));
    answer('done', page('done', ['d']));
    fixture.componentRef.setInput('keyword', 'a');
    settle();
    // Inside the 300ms wait, opening a column loads it with the new keyword; the others still have the pages of ''.
    fixture.componentRef.setInput('collapsedColumns', []);
    settle();
    expect(last('later')?.args.keyword).toBe('a');
    answer('later', page('later', []));
    tick(100);
    fixture.componentRef.setInput('keyword', 'ab');
    settle();
    tick(100);
    fixture.componentRef.setInput('keyword', 'a');
    settle();
    tick(300);
    expect(last('open')?.args.keyword).withContext('open was asked with "" so far').toBe('a');
    expect(last('done')?.args.keyword).toBe('a');
    flush();
  }));

  it('[KAN-B-29] watches "Show more" again once its column has its first page again (loadMore auto)', fakeAsync(() => {
    const restore = FakeIntersectionObserver.install();
    try {
      mount({ loadMore: 'auto' });
      answer('open', page('open', ['a', 'b'], 'c1'));
      answer('done', page('done', []));
      answer('later', page('later', []));
      tick();
      kanban().reload('open');
      settle();
      tick();
      const button = lane('open').querySelector('[data-load-more]')!;
      // The button comes into view while open loads its first page again: loadMore ignores that report.
      for (const observer of FakeIntersectionObserver.instances) observer.intersect(button);
      settle();
      expect(last('open')?.args.cursor).toBeNull();
      const log: string[] = [];
      spyOn(FakeIntersectionObserver.prototype, 'observe').and.callFake(function (this: FakeIntersectionObserver, target: Element) {
        log.push(`observe:${target === button}`);
        this.targets.add(target);
      });
      spyOn(FakeIntersectionObserver.prototype, 'unobserve').and.callFake(function (this: FakeIntersectionObserver, target: Element) {
        log.push(`unobserve:${target === button}`);
        this.targets.delete(target);
      });
      answer('open', page('open', ['a', 'b'], 'c2'));
      tick();
      expect(lane('open').querySelector('[data-load-more]')).withContext('the same button').toBe(button);
      // A real observer reports a target once when it starts observing it, and ignores observe() of a watched one.
      expect(log).toEqual(['unobserve:true', 'observe:true']);
    } finally {
      restore();
    }
    flush();
  }));

  it('[KAN-B-30] is no longer pending when sdMoveError is emitted, so the handler can move the card again', fakeAsync(() => {
    const onMove = jasmine.createSpy('onMove').and.returnValues(false, true);
    fixture = TestBed.createComponent(SdKanban<unknown>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('items', [card('x', 'open')]);
    fixture.componentRef.setInput('option', { move: { onMove } });
    settle();
    let pendingAtError: string | null | undefined;
    let again: boolean | undefined;
    kanban().sdMoveError.subscribe((error: SdKanbanMoveError<unknown>) => {
      pendingAtError = kanban().pendingId();
      void kanban()
        .move(error.request.card.id, { columnId: 'later' })
        .then(result => (again = result));
    });
    void kanban().move('x', { columnId: 'done' });
    settle();
    settle();
    expect(pendingAtError).toBeNull();
    expect(again).toBeTrue();
    expect(ids('later')).toEqual(['x']);
    expect(kanban().pendingId()).toBeNull();
    flush();
  }));

  it('[KAN-B-31] treats a malformed onLoad result as a load error and drops empty cards', fakeAsync(() => {
    spyOn(console, 'warn');
    mount();
    const errors = jasmine.createSpy('sdLoadError');
    kanban().sdLoadError.subscribe(errors);
    answer('open', undefined as unknown as Page);
    expect(lane('open').querySelector('[data-load-error]')).withContext('not a skeleton forever').not.toBeNull();
    expect(errors).toHaveBeenCalledOnceWith(jasmine.objectContaining({ columnId: 'open' }));
    answer('done', { items: [null, card('d', 'done')], nextCursor: null } as unknown as Page);
    expect(ids('done')).toEqual(['d']);
    flush();
  }));
});
