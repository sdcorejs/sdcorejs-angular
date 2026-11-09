import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Deferred, FakeIntersectionObserver, deferred } from '../../../testing/schedule-testing';
import { SdKanban } from './kanban.component';
import type { SdKanbanCard, SdKanbanColumn, SdKanbanLoadArgs, SdKanbanLoadError, SdKanbanLoadResult, SdKanbanOption } from './kanban.model';

interface Dto {
  readonly amount: number;
}
type Card = SdKanbanCard<Dto>;
type Page = SdKanbanLoadResult<Dto>;

const columns: readonly SdKanbanColumn[] = [
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done', summary: '0 ₫' },
  { id: 'later', label: 'Later' },
];
const card = (id: string, columnId: string): Card => ({ id, columnId, title: id.toUpperCase(), data: { amount: 1 } });
const page = (columnId: string, ids: string[], nextCursor: string | null = null, extra: Partial<Page> = {}): Page => ({
  items: ids.map(id => card(id, columnId)),
  nextCursor,
  ...extra,
});

describe('SdKanban · dataSource by column', () => {
  let fixture: ComponentFixture<SdKanban<Dto>>;
  let calls: { readonly args: SdKanbanLoadArgs; readonly wait: Deferred<Page> }[];
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const kanban = (): SdKanban<Dto> => fixture.componentInstance;
  const lane = (columnId: string): HTMLElement => host().querySelector<HTMLElement>(`.sd-kanban__column[data-column-id="${columnId}"]`)!;
  const ids = (columnId: string): (string | null)[] =>
    Array.from(lane(columnId)?.querySelectorAll('article') ?? []).map(item => item.getAttribute('data-card-id'));
  const count = (columnId: string): string => lane(columnId)?.querySelector('.sd-kanban__count')?.textContent?.replace(/\s+/g, '') ?? '';
  const loadsOf = (columnId: string): SdKanbanLoadArgs[] => calls.filter(call => call.args.columnId === columnId).map(call => call.args);
  const last = (columnId: string): { readonly args: SdKanbanLoadArgs; readonly wait: Deferred<Page> } | undefined =>
    [...calls].reverse().find(call => call.args.columnId === columnId);
  const answer = (columnId: string, result: Page): void => {
    last(columnId)?.wait.resolve(result);
    settle();
  };
  const fail = (columnId: string, error: unknown = new Error('SECRET')): void => {
    last(columnId)?.wait.reject(error);
    settle();
  };
  const t = (key: string, params?: Record<string, string | number>): string =>
    TestBed.inject(I18nService).t(`core.component.kanban.${key}`, params);
  const settle = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };
  const onLoad = (args: SdKanbanLoadArgs): Promise<Page> => {
    const wait = deferred<Page>();
    calls.push({ args, wait });
    return wait.promise;
  };

  function mount(option: Partial<SdKanbanOption<Dto>> = {}, inputs: Record<string, unknown> = {}): jasmine.Spy {
    calls = [];
    fixture = TestBed.createComponent(SdKanban<Dto>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('option', { dataSource: { onLoad }, pageSize: 2, ...option });
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    const errors = jasmine.createSpy('sdLoadError');
    fixture.componentInstance.sdLoadError.subscribe(errors);
    settle();
    return errors;
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [SdKanban], providers: [provideNoopAnimations()] }));

  it('[KAN-C-02] loads every column that is not collapsed, with the first-page arguments', fakeAsync(() => {
    mount({}, { collapsedColumns: ['later'] });
    expect(calls.map(call => call.args.columnId)).toEqual(['open', 'done']);
    const args = loadsOf('open')[0];
    expect(args ? { ...args, signal: undefined } : undefined).toEqual({
      columnId: 'open',
      cursor: null,
      pageSize: 2,
      keyword: '',
      signal: undefined,
    });
    expect(args?.signal instanceof AbortSignal).toBeTrue();
    expect(lane('open')?.getAttribute('data-status')).toBe('loading');
    expect(lane('open')?.querySelectorAll('[data-skeleton]').length).toBe(3);
    expect(lane('open')?.querySelector('.sd-kanban__cards')?.getAttribute('aria-busy')).toBe('true');
    answer('open', page('open', ['a', 'b']));
    expect(ids('open')).toEqual(['a', 'b']);
    expect(lane('open')?.getAttribute('data-status')).toBe('idle');
    expect(lane('open')?.querySelector('[data-skeleton]')).toBeNull();
    flush();
  }));

  it('[KAN-C-03] loads a collapsed column when it is opened the first time; its count is – before', fakeAsync(() => {
    mount({}, { collapsedColumns: ['later'] });
    expect(count('later')).toBe('–');
    lane('later')?.querySelector<HTMLButtonElement>('button[aria-expanded]')?.click();
    settle();
    expect(loadsOf('later').length).toBe(1);
    flush();
  }));

  it('[KAN-C-04] loads the next page with nextCursor, from the button and from loadMore(); no button at the end', fakeAsync(() => {
    mount();
    answer('open', page('open', ['a', 'b'], 'c1', { total: 3 }));
    const more = (): HTMLButtonElement | null => lane('open')?.querySelector<HTMLButtonElement>('[data-load-more]') ?? null;
    expect(more()?.textContent?.trim()).toBe(t('load-more', { count: 1 }));
    more()?.click();
    settle();
    expect(loadsOf('open')[1]?.cursor).toBe('c1');
    expect(lane('open')?.getAttribute('data-status')).toBe('loading-more');
    expect(lane('open')?.textContent).toContain(t('loading'));
    answer('open', page('open', ['c'], null));
    expect(ids('open')).toEqual(['a', 'b', 'c']);
    expect(more()).toBeNull();
    kanban().loadMore('open');
    settle();
    expect(loadsOf('open').length).withContext('nothing left').toBe(2);
    answer('done', page('done', ['d'], 'n1'));
    kanban().loadMore('done');
    settle();
    expect(loadsOf('done')[1]?.cursor).toBe('n1');
    flush();
  }));

  it("[KAN-C-04] loadMore 'auto' loads when the button comes into view, and keeps the button without IntersectionObserver", fakeAsync(() => {
    const restore = FakeIntersectionObserver.install();
    try {
      mount({ loadMore: 'auto' });
      answer('open', page('open', ['a', 'b'], 'c1'));
      const button = lane('open')?.querySelector('[data-load-more]');
      expect(button).not.toBeNull();
      for (const observer of FakeIntersectionObserver.instances) observer.intersect(button!);
      settle();
      expect(loadsOf('open')[1]?.cursor).toBe('c1');
    } finally {
      restore();
    }
    const none = FakeIntersectionObserver.install(null);
    try {
      mount({ loadMore: 'auto' });
      answer('open', page('open', ['a', 'b'], 'c1'));
      expect(lane('open')?.querySelector('[data-load-more]')).not.toBeNull();
    } finally {
      none();
    }
    flush();
  }));

  it('[KAN-C-05] reads total and summary from the first page only; counts "n+" without total', fakeAsync(() => {
    mount();
    answer('open', page('open', ['a', 'b'], 'c1', { total: 9, summary: '18,4 triệu ₫' }));
    expect(count('open')).toBe('9');
    expect(lane('open')?.querySelector('[data-summary]')?.textContent?.trim()).toBe('18,4 triệu ₫');
    lane('open')?.querySelector<HTMLButtonElement>('[data-load-more]')?.click();
    settle();
    answer('open', page('open', ['c'], null, { total: 1, summary: 'other' }));
    expect(count('open')).toBe('9');
    expect(lane('open')?.querySelector('[data-summary]')?.textContent?.trim()).toBe('18,4 triệu ₫');
    answer('done', page('done', ['d', 'e'], 'n1'));
    expect(count('done')).toBe('2+');
    expect(lane('done')?.querySelector('[data-summary]')?.textContent?.trim()).withContext('column.summary').toBe('0 ₫');
    flush();
  }));

  it('[KAN-C-06] waits 300ms after the keyword, then loads every loaded column again and aborts the old loads', fakeAsync(() => {
    mount();
    answer('open', page('open', ['a']));
    const pendingDone = last('done');
    fixture.componentRef.setInput('keyword', '  DH-1 ');
    settle();
    tick(299);
    expect(calls.length).toBe(2);
    tick(1);
    settle();
    expect(pendingDone?.args.signal.aborted).toBeTrue();
    expect(loadsOf('open')[1]).toEqual(jasmine.objectContaining({ cursor: null, keyword: 'DH-1' }));
    expect(loadsOf('done')[1]).toEqual(jasmine.objectContaining({ cursor: null, keyword: 'DH-1' }));
    flush();
  }));

  it('[KAN-C-07] loads only new columns, aborts removed ones and keeps the others', fakeAsync(() => {
    mount();
    answer('open', page('open', ['a']));
    const pendingDone = last('done');
    fixture.componentRef.setInput('columns', [columns[0], columns[2], { id: 'new', label: 'New' }]);
    settle();
    expect(pendingDone?.args.signal.aborted).toBeTrue();
    expect(loadsOf('open').length).toBe(1);
    expect(ids('open')).toEqual(['a']);
    expect(loadsOf('new').length).toBe(1);
    flush();
  }));

  it('[KAN-C-08] [KAN-SC-23] reload() and reload(columnId) load from the first page and keep the cards until the result', fakeAsync(() => {
    mount();
    answer('open', page('open', ['a'], 'c1'));
    answer('done', page('done', ['d']));
    kanban().reload('open');
    settle();
    expect(loadsOf('open')[1]?.cursor).toBeNull();
    expect(loadsOf('done').length).toBe(1);
    expect(ids('open')).withContext('kept until the result').toEqual(['a']);
    kanban().reload();
    settle();
    expect(loadsOf('open')[1]?.signal.aborted).toBeTrue();
    expect(loadsOf('done').length).toBe(2);
    answer('open', page('open', ['z']));
    expect(ids('open')).toEqual(['z']);
    flush();
  }));

  it('[KAN-C-09] [KAN-SC-24] [KAN-SC-16] shows a first-page error and a later-page error with Retry, per column', fakeAsync(() => {
    const errors = mount({ move: { onMove: () => true } });
    fail('open');
    expect(lane('open')?.getAttribute('data-status')).toBe('error');
    expect(lane('open')?.querySelector('[data-load-error]')?.textContent).toContain(t('load-error'));
    expect(host().textContent).not.toContain('SECRET');
    expect(errors).toHaveBeenCalledTimes(1);
    expect((errors.calls.mostRecent()?.args[0] as SdKanbanLoadError | undefined)?.columnId).toBe('open');
    lane('open')?.querySelector<HTMLButtonElement>('[data-action="retry"]')?.click();
    settle();
    expect(loadsOf('open')[1]?.cursor).toBeNull();
    answer('open', page('open', ['a'], 'c1'));
    lane('open')?.querySelector<HTMLButtonElement>('[data-load-more]')?.click();
    settle();
    fail('open', 'SECRET');
    expect(ids('open')).withContext('a later page keeps the cards').toEqual(['a']);
    expect(lane('open')?.querySelector('[data-load-more]')).toBeNull();
    lane('open')?.querySelector<HTMLButtonElement>('[data-action="retry"]')?.click();
    settle();
    expect(loadsOf('open')[2]?.cursor).toBe('c1');
    answer('done', page('done', ['d']));
    answer('later', page('later', []));
    expect(kanban().move('d', { columnId: 'later' })).withContext('other columns still move').toBeDefined();
    flushMicrotasks();
    settle();
    expect(ids('later')).toEqual(['d']);
    flush();
  }));

  it('[KAN-SC-24] does not emit sdLoadError for an aborted load', fakeAsync(() => {
    const errors = mount();
    const first = last('open');
    kanban().reload('open');
    settle();
    first?.wait.reject(new Error('late'));
    settle();
    expect(errors).not.toHaveBeenCalled();
    flush();
  }));

  it('[KAN-C-13] puts an accepted card at the top of the target column and updates both totals without loading', fakeAsync(() => {
    mount({ move: { onMove: () => true } });
    answer('open', page('open', ['a', 'b'], null, { total: 2 }));
    answer('done', page('done', ['d'], null, { total: 5 }));
    answer('later', page('later', []));
    const before = calls.length;
    void kanban().move('b', { columnId: 'done' });
    settle();
    expect(ids('done')).toEqual(['b', 'd']);
    expect(ids('open')).toEqual(['a']);
    expect(count('open')).toBe('1');
    expect(count('done')).toBe('6');
    expect(calls.length).toBe(before);
    flush();
  }));

  it('[KAN-C-13] with reorder on, puts the card before beforeId or after the last loaded card', fakeAsync(() => {
    mount({ move: { reorder: true, onMove: () => true } });
    answer('open', page('open', ['a', 'b']));
    answer('done', page('done', ['d', 'e'], 'n1'));
    answer('later', page('later', []));
    void kanban().move('a', { columnId: 'done', beforeId: 'e' });
    settle();
    expect(ids('done')).toEqual(['d', 'a', 'e']);
    void kanban().move('b', { columnId: 'done', beforeId: null });
    settle();
    expect(ids('done')).toEqual(['d', 'a', 'e', 'b']);
    flush();
  }));

  it('[KAN-SC-22] passes a signal, aborts it when the option changes and drops the late result', fakeAsync(() => {
    mount();
    const first = last('open');
    fixture.componentRef.setInput('option', { dataSource: { onLoad }, pageSize: 2 });
    settle();
    expect(first?.args.signal.aborted).toBeTrue();
    first?.wait.resolve(page('open', ['late']));
    settle();
    expect(ids('open')).not.toContain('late');
    answer('open', page('open', ['fresh']));
    expect(ids('open')).toEqual(['fresh']);
    flush();
  }));

  it('[KAN-SC-25] uses the data source when items are given too, and warns once', fakeAsync(() => {
    const warn = spyOn(console, 'warn');
    mount({}, { items: [card('item', 'open')] });
    fixture.componentRef.setInput('items', [card('item2', 'open')]);
    settle();
    expect(loadsOf('open').length).toBe(1);
    expect(ids('open')).not.toContain('item');
    expect(warn.calls.allArgs().filter(args => String(args[0]).includes('items')).length).toBe(1);
    flush();
  }));

  it('[KAN-SC-15] reloading the source or target column aborts a waiting move; loading more does not', fakeAsync(() => {
    const wait = deferred<boolean>();
    const onMove = jasmine.createSpy('onMove').and.returnValue(wait.promise);
    mount({ move: { onMove } });
    answer('open', page('open', ['a'], 'c1'));
    answer('done', page('done', ['d']));
    answer('later', page('later', []));
    void kanban().move('a', { columnId: 'done' });
    settle();
    kanban().loadMore('open');
    settle();
    expect(onMove.calls.mostRecent()?.args[0]?.signal.aborted).withContext('load more').toBeFalse();
    kanban().reload('done');
    settle();
    expect(onMove.calls.mostRecent()?.args[0]?.signal.aborted).withContext('reload of the target').toBeTrue();
    wait.resolve(true);
    settle();
    expect(ids('done')).not.toContain('a');
    flush();
  }));

  it('[KAN-SC-01] leaves out cards of another column, without a title or seen before, with a dev warning', fakeAsync(() => {
    const warn = spyOn(console, 'warn');
    mount();
    answer('open', {
      items: [card('a', 'open'), card('b', 'done'), { id: 'c', columnId: 'open', title: ' ' }, card('a', 'open')],
      nextCursor: null,
    });
    expect(ids('open')).toEqual(['a']);
    expect(warn).toHaveBeenCalled();
    expect(host().querySelector('sd-data-state')).withContext('the board is not blocked').toBeNull();
    flush();
  }));

  it('[KAN-C-05] shows column.summary under the label with items too', fakeAsync(() => {
    calls = [];
    fixture = TestBed.createComponent(SdKanban<Dto>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('option', {});
    fixture.componentRef.setInput('items', [card('a', 'done')]);
    settle();
    expect(lane('done')?.querySelector('[data-summary]')?.textContent?.trim()).toBe('0 ₫');
    expect(lane('open')?.querySelector('[data-summary]')).toBeNull();
    expect(lane('open')?.hasAttribute('data-status')).withContext('items mode has no status').toBeFalse();
  }));
});
