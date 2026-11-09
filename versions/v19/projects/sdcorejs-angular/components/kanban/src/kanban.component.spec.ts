import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { OverlayContainer } from '@angular/cdk/overlay';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { deferred } from '../../../testing/schedule-testing';
import { SdKanban } from './kanban.component';
import type { SdKanbanCard, SdKanbanMoveRequest, SdKanbanOption } from './kanban.model';

interface Dto {
  readonly owner: string;
}
type Card = SdKanbanCard<Dto>;
type OnMove = NonNullable<SdKanbanOption<Dto>['move']>['onMove'];

const dto: Dto = { owner: 'Lan' };
const data: readonly Card[] = [
  { id: 'x', columnId: 'open', title: 'First', data: dto },
  { id: 'hidden', columnId: 'done', title: 'Hidden' },
  { id: 'y', columnId: 'open', title: 'Second' },
];
const columns = [
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done' },
];
// why: until checkpoint 2 reads `reorder`, the board keeps main's ordering; the specs state it explicitly.
const withMove = (onMove: OnMove = () => true): SdKanbanOption<Dto> => ({ move: { reorder: true, onMove } });
const option = withMove();

describe('SdKanban', () => {
  let fixture: ComponentFixture<SdKanban<Dto>>;
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const cards = (): readonly Card[] => fixture.componentInstance['cards']();
  const lastRequest = (spy: jasmine.Spy): SdKanbanMoveRequest<Dto> => spy.calls.mostRecent().args[0] as SdKanbanMoveRequest<Dto>;
  const handle = (id: string): HTMLButtonElement => host().querySelector<HTMLButtonElement>(`[data-kanban-handle="${id}"]`)!;
  const setOption = (value: SdKanbanOption<Dto>): void => {
    fixture.componentRef.setInput('option', value);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdKanban], providers: [provideNoopAnimations()] }).compileComponents();
    fixture = TestBed.createComponent(SdKanban<Dto>);
    fixture.componentRef.setInput('option', option);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('items', data);
    fixture.detectChanges();
  });

  describe('wave 1 look (neutral lanes, dot, text count, borderless-shadow cards)', () => {
    const column = (id: string): HTMLElement => host().querySelector<HTMLElement>(`.sd-kanban__column[data-column-id="${id}"]`)!;
    beforeEach(() => {
      // Distinct token values so each rule is checked without loading the theme; no transition delay.
      const style = host().style;
      style.setProperty('--sd-kanban-lane-bg', 'rgb(10, 10, 10)');
      style.setProperty('--sd-kanban-lane-target-bg', 'rgb(20, 20, 20)');
      style.setProperty('--sd-kanban-lane-target-border', 'rgb(30, 30, 30)');
      style.setProperty('--sd-kanban-drop-slot-border', 'rgb(40, 40, 40)');
      style.setProperty('--sd-kanban-card-border', 'rgb(50, 50, 50)');
      style.setProperty('--sd-kanban-card-hover-border', 'rgb(60, 60, 60)');
      style.setProperty('--sd-text-secondary', 'rgb(70, 70, 70)');
      style.setProperty('--sd-duration-fast', '0s');
    });

    it('[KAN-R-09] paints every lane with the neutral lane token instead of the column tint', () => {
      fixture.componentRef.setInput('columns', [
        { id: 'open', label: 'Open', color: 'success' },
        { id: 'done', label: 'Done', color: 'error' },
      ]);
      fixture.detectChanges();
      for (const id of ['open', 'done']) expect(getComputedStyle(column(id)).backgroundColor).toBe('rgb(10, 10, 10)');
    });

    it('[KAN-R-09] marks the column colour with an 8px aria-hidden dot before the label, or with the prefix icon', () => {
      fixture.componentRef.setInput('columns', [
        { id: 'open', label: 'Open', color: 'success' },
        { id: 'done', label: 'Done', prefixIcon: 'check_circle' },
      ]);
      fixture.detectChanges();
      const open = column('open');
      const dot = open.querySelector<HTMLElement>('.sd-kanban__dot')!;
      expect(dot).withContext('dot').not.toBeNull();
      expect(dot.getAttribute('aria-hidden')).toBe('true');
      expect(dot.getBoundingClientRect().width).toBe(8);
      expect(dot.getBoundingClientRect().height).toBe(8);
      expect(dot.getBoundingClientRect().right).toBeLessThanOrEqual(open.querySelector('h3')!.getBoundingClientRect().left + 0.5);
      const done = column('done');
      expect(done.querySelector('.sd-kanban__dot')).withContext('the icon replaces the dot').toBeNull();
      expect(done.querySelector('h3 sd-icon')).not.toBeNull();
    });

    it('[KAN-R-09] keeps the dot between the toggle and the count in a collapsed lane', () => {
      column('open').querySelector<HTMLButtonElement>('.sd-kanban__header button[aria-expanded]')!.click();
      fixture.detectChanges();
      const lane = column('open');
      const top = (selector: string) => lane.querySelector<HTMLElement>(selector)!.getBoundingClientRect().top;
      expect(top('.sd-kanban__header button[aria-expanded]')).toBeLessThan(top('.sd-kanban__dot'));
      expect(top('.sd-kanban__dot')).toBeLessThan(top('.sd-kanban__count'));
    });

    it('[KAN-R-09] shows the count as 13px secondary tabular text, "visible/total" while filtering', () => {
      const count = column('open').querySelector<HTMLElement>('.sd-kanban__count')!;
      const style = getComputedStyle(count);
      expect(style.fontSize).toBe('13px');
      expect(style.color).toBe('rgb(70, 70, 70)');
      expect(style.fontVariantNumeric).toBe('tabular-nums');
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(count.textContent?.trim()).toBe('2');
      fixture.componentInstance.keyword.set('First');
      fixture.detectChanges();
      expect(count.textContent?.replace(/\s+/g, '')).toBe('1/2');
      expect(count.getAttribute('aria-label')).toBeTruthy();
    });

    it('[KAN-R-09] draws cards with the card border token and no shadow', () => {
      const card = host().querySelector<HTMLElement>('.sd-kanban__card')!;
      expect(getComputedStyle(card).borderTopColor).toBe('rgb(50, 50, 50)');
      expect(getComputedStyle(card).boxShadow).toBe('none');
    });

    it('[KAN-R-09] hides the card tools with opacity on a fine pointer until the card is hovered or focused', () => {
      if (!matchMedia('(hover: hover) and (pointer: fine)').matches) {
        pending('this browser does not report a fine hover pointer');
        return;
      }
      const card = host().querySelector<HTMLElement>('.sd-kanban__card')!;
      const tools = card.querySelector<HTMLElement>('.sd-kanban__card-tools')!;
      expect(getComputedStyle(tools).opacity).toBe('0');
      expect(getComputedStyle(tools).visibility).withContext('still reachable by Tab').toBe('visible');
      card.querySelector<HTMLButtonElement>('[data-kanban-handle]')!.focus();
      expect(getComputedStyle(tools).opacity).withContext(':focus-within').toBe('1');
    });

    it('[KAN-C-12] highlights only the lane being dragged into and draws the placeholder as a dashed slot', () => {
      const lane = column('done');
      const list = lane.querySelector<HTMLElement>('.sd-kanban__cards')!;
      list.classList.add('cdk-drop-list-dragging');
      expect(getComputedStyle(lane).backgroundColor).toBe('rgb(20, 20, 20)');
      expect(getComputedStyle(lane).borderTopColor).toBe('rgb(30, 30, 30)');
      expect(getComputedStyle(column('open')).backgroundColor).toBe('rgb(10, 10, 10)');
      list.classList.remove('cdk-drop-list-dragging');

      const card = host().querySelector<HTMLElement>('.sd-kanban__card')!;
      card.classList.add('cdk-drag-placeholder');
      const style = getComputedStyle(card);
      expect(style.opacity).toBe('1');
      expect(style.borderTopStyle).toBe('dashed');
      expect(style.borderTopWidth).toBe('2px');
      expect(style.borderTopColor).toBe('rgb(40, 40, 40)');
      expect(style.backgroundColor).toBe('rgb(20, 20, 20)');
      expect(getComputedStyle(card.querySelector<HTMLElement>('.sd-kanban__card-body')!).visibility).toBe('hidden');
      card.classList.remove('cdk-drag-placeholder');
    });
  });

  it('[KAN-C-01] renders the items in their columns, in array order', () => {
    const titles = (id: string): string[] =>
      Array.from(host().querySelectorAll(`[data-column-id="${id}"] .sd-kanban__card-title`)).map(item => item.textContent!.trim());
    expect(titles('open')).toEqual(['First', 'Second']);
    expect(titles('done')).toEqual(['Hidden']);
    expect(host().querySelector('[data-card-id="x"]')).not.toBeNull();
  });

  it('[KAN-SC-09] accepts a move once, updates its copy of the items and emits sdMove', async () => {
    const moved = jasmine.createSpy('moved');
    fixture.componentInstance.sdMove.subscribe(moved);
    expect(await fixture.componentInstance.move('x', { columnId: 'done', beforeId: null })).toBeTrue();
    expect(cards().find(item => item.id === 'x')?.columnId).toBe('done');
    expect(cards().find(item => item.id === 'x')?.data).withContext('SC-02').toBe(dto);
    expect(fixture.componentInstance.items()).withContext('the input is not changed').toBe(data);
    expect(moved).toHaveBeenCalledTimes(1);
    expect(lastRequest(moved).to).toEqual({ columnId: 'done', index: 1, beforeId: null });
    expect(lastRequest(moved).from).toEqual({ columnId: 'open', index: 0 });
  });

  it('[KAN-R-01] waits for confirmation and blocks duplicate and competing moves', async () => {
    const confirmation = deferred<boolean>();
    const persist = jasmine.createSpy('persist').and.returnValue(confirmation.promise);
    setOption(withMove(persist));
    const result = fixture.componentInstance.move('x', { columnId: 'done' });
    expect(cards()).toBe(data);
    expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeFalse();
    expect(await fixture.componentInstance.move('y', { columnId: 'done' })).toBeFalse();
    expect(persist).toHaveBeenCalledTimes(1);
    confirmation.resolve(true);
    expect(await result).toBeTrue();
  });

  it('[KAN-SC-11] [KAN-SC-13] keeps the data on rejection or a thrown persistence error', async () => {
    const error = jasmine.createSpy('error');
    fixture.componentInstance.sdMoveError.subscribe(error);
    setOption(withMove(() => Promise.resolve(false)));
    expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeFalse();
    expect(cards()).toBe(data);
    expect(error.calls.mostRecent().args[0].reason).toBe('rejected');
    setOption(withMove(() => Promise.reject(new Error('private backend detail'))));
    expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeFalse();
    fixture.detectChanges();
    expect(error.calls.mostRecent().args[0].reason).toBe('error');
    expect(host().textContent).not.toContain('private backend detail');
    expect(cards()).toBe(data);
  });

  it('[KAN-R-02] discards a late response when new items arrive', async () => {
    const confirmation = deferred<boolean>();
    const persist = jasmine.createSpy('persist').and.returnValue(confirmation.promise);
    setOption(withMove(persist));
    const result = fixture.componentInstance.move('x', { columnId: 'done' });
    const replacement: Card[] = [{ ...data[0], title: 'Fresh server data' }];
    fixture.componentRef.setInput('items', replacement);
    fixture.detectChanges();
    confirmation.resolve(true);
    expect(await result).toBeFalse();
    expect(cards()).toBe(replacement);
    expect(persist.calls.mostRecent().args[0].signal.aborted).toBeTrue();
  });

  it('[KAN-C-01] replaces its copy with a new items reference after an accepted move', async () => {
    expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeTrue();
    expect(cards()).not.toBe(data);
    const fresh: Card[] = [{ id: 'n', columnId: 'open', title: 'New' }];
    fixture.componentRef.setInput('items', fresh);
    fixture.detectChanges();
    expect(cards()).toBe(fresh);
  });

  it('[KAN-SC-15] aborts on destruction and never emits a late successful move', async () => {
    const confirmation = deferred<boolean>();
    const persist = jasmine.createSpy('persist').and.returnValue(confirmation.promise);
    const moved = jasmine.createSpy('moved');
    setOption(withMove(persist));
    fixture.componentInstance.sdMove.subscribe(moved);
    const result = fixture.componentInstance.move('x', { columnId: 'done' });
    fixture.destroy();
    confirmation.resolve(true);
    expect(await result).toBeFalse();
    expect(moved).not.toHaveBeenCalled();
  });

  for (const lock of ['disabled', 'readonly']) {
    it(`[KAN-SC-15] blocks movement when ${lock}`, async () => {
      fixture.componentRef.setInput(lock, true);
      fixture.detectChanges();
      expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeFalse();
      expect(cards()).toBe(data);
    });
  }

  for (const changed of ['option', 'columns']) {
    it(`[KAN-R-02] invalidates an async result when ${changed} is replaced`, async () => {
      const confirmation = deferred<boolean>();
      const persist = jasmine.createSpy('persist').and.returnValue(confirmation.promise);
      setOption(withMove(persist));
      const result = fixture.componentInstance.move('x', { columnId: 'done' });
      fixture.componentRef.setInput(
        changed,
        changed === 'option'
          ? withMove(persist)
          : [
              { id: 'open', label: 'Open' },
              { id: 'done', label: 'Finished' },
            ]
      );
      confirmation.resolve(true);
      expect(await result).toBeFalse();
      expect(cards()).toBe(data);
      expect(persist.calls.mostRecent().args[0].signal.aborted).toBeTrue();
    });
  }

  it('[KAN-R-01] releases the pending lock after rejection so a retry can succeed', async () => {
    const persist = jasmine.createSpy('persist').and.returnValues(Promise.resolve(false), Promise.resolve(true));
    setOption(withMove(persist));
    expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeFalse();
    expect(fixture.componentInstance.pendingId()).toBeNull();
    expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeTrue();
  });

  it('[KAN-R-09] renders full and filtered counts without changing the order', () => {
    fixture.componentRef.setInput('keyword', 'First');
    fixture.detectChanges();
    expect(host().querySelectorAll('article').length).toBe(1);
    expect(host().querySelector('[data-column-id="open"] .sd-kanban__count')!.textContent!.replace(/\s+/g, ' ').trim()).toBe('1/2');
    expect(cards()).toBe(data);
    fixture.componentRef.setInput('keyword', '');
    fixture.detectChanges();
    expect(host().querySelectorAll('article').length).toBe(3);
  });

  it('[KAN-C-17] filters by searchText, falling back to the title', () => {
    fixture.componentRef.setInput('items', [{ ...data[0], searchText: 'alpha' }, data[1], data[2]]);
    fixture.componentRef.setInput('keyword', 'ALPHA');
    fixture.detectChanges();
    expect(Array.from(host().querySelectorAll('article')).map(item => item.getAttribute('data-card-id'))).toEqual(['x']);
    fixture.componentRef.setInput('keyword', 'second');
    fixture.detectChanges();
    expect(Array.from(host().querySelectorAll('article')).map(item => item.getAttribute('data-card-id'))).toEqual(['y']);
  });

  it('[KAN-U-06] resolves a filtered drag insertion against the loaded cards', () => {
    const shown: Card[] = [
      { ...data[0], searchText: 'show' },
      { ...data[1], searchText: 'nope' },
      { ...data[2], searchText: 'show' },
      { id: 'z', columnId: 'done', title: 'Visible', searchText: 'show' },
    ];
    fixture.componentRef.setInput('items', shown);
    fixture.componentRef.setInput('keyword', 'show');
    fixture.detectChanges();
    const lists = fixture.debugElement.queryAll(By.directive(CdkDropList)).map(element => element.injector.get(CdkDropList));
    const drag = fixture.debugElement
      .queryAll(By.directive(CdkDrag))
      .map(element => element.injector.get(CdkDrag))
      .find(candidate => candidate.data.card.id === 'x')!;
    const moved = jasmine.createSpy('moved');
    fixture.componentInstance.sdMove.subscribe(moved);
    lists[1].dropped.emit({
      previousIndex: 0,
      currentIndex: 0,
      item: drag,
      container: lists[1],
      previousContainer: lists[0],
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 },
      event: new MouseEvent('mouseup'),
    });
    return fixture.whenStable().then(() => {
      expect(cards().filter(item => item.columnId === 'done').map(item => item.id)).toEqual(['hidden', 'x', 'z']);
      expect(lastRequest(moved).to).toEqual({ columnId: 'done', index: 1, beforeId: 'z' });
      expect(lastRequest(moved).source).toBe('drag');
    });
  });

  it('[KAN-R-04] routes keyboard reordering through the same move pipeline', async () => {
    const moved = jasmine.createSpy('moved');
    fixture.componentInstance.sdMove.subscribe(moved);
    handle('x').focus();
    handle('x').dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: 'ArrowDown' }));
    await fixture.whenStable();
    expect(cards().filter(item => item.columnId === 'open').map(item => item.id)).toEqual(['y', 'x']);
    expect(lastRequest(moved).source).toBe('keyboard');
  });

  it('[KAN-C-10] routes movement menu actions through the same move pipeline', async () => {
    const moved = jasmine.createSpy('moved');
    fixture.componentInstance.sdMove.subscribe(moved);
    host().querySelector<HTMLButtonElement>('[data-kanban-menu="x"]')!.click();
    fixture.detectChanges();
    const menuButtons = TestBed.inject(OverlayContainer).getContainerElement().querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    expect(menuButtons[0].disabled).withContext('the first card cannot go up').toBeTrue();
    menuButtons[1].click();
    await fixture.whenStable();
    expect(lastRequest(moved).source).toBe('menu');
    expect(lastRequest(moved).to).toEqual({ columnId: 'open', index: 1, beforeId: null });
  });

  it('[KAN-R-08] keeps a collapsed column and expands it when a move into it is accepted', async () => {
    fixture.componentRef.setInput('collapsedColumns', ['done']);
    fixture.detectChanges();
    expect(host().querySelector<HTMLElement>('[data-column-id="done"] .sd-kanban__cards')!.hidden).toBeTrue();
    expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeTrue();
    expect(fixture.componentInstance.collapsedColumns()).toEqual([]);
  });

  it('[KAN-SC-01] fails closed for duplicate ids and unknown columns', async () => {
    fixture.componentRef.setInput('items', [data[0], { ...data[1], id: 'x' }]);
    fixture.detectChanges();
    expect(host().querySelectorAll('article').length).toBe(0);
    expect(host().querySelector('sd-data-state')).not.toBeNull();
    expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeFalse();
    fixture.componentRef.setInput('items', [{ ...data[0], columnId: 'unknown' }]);
    fixture.detectChanges();
    expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeFalse();
  });

  for (const trailing of [false, true]) {
    it(`[KAN-U-03] ignores an unchanged filtered slot with ${trailing ? 'trailing' : 'interleaved'} hidden cards`, async () => {
      const hidden: Card = { ...data[1], columnId: 'open', searchText: 'nope' };
      const shown = (card: Card): Card => ({ ...card, searchText: 'show' });
      const items = trailing ? [shown(data[0]), hidden] : [shown(data[0]), hidden, shown(data[2])];
      const persist = jasmine.createSpy('persist').and.resolveTo(true);
      const moved = jasmine.createSpy('moved');
      fixture.componentRef.setInput('items', items);
      fixture.componentRef.setInput('keyword', 'show');
      setOption(withMove(persist));
      fixture.componentInstance.sdMove.subscribe(moved);
      const list = fixture.debugElement.queryAll(By.directive(CdkDropList))[0].injector.get(CdkDropList);
      const drag = fixture.debugElement.queryAll(By.directive(CdkDrag))[0].injector.get(CdkDrag);
      list.dropped.emit({
        previousIndex: 0,
        currentIndex: 0,
        item: drag,
        container: list,
        previousContainer: list,
        isPointerOverContainer: true,
        distance: { x: 2, y: 2 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('mouseup'),
      });
      await fixture.whenStable();
      expect(cards()).toBe(items);
      expect(fixture.componentInstance.pendingId()).toBeNull();
      expect(persist).not.toHaveBeenCalled();
      expect(moved).not.toHaveBeenCalled();
    });
  }

  it('[KAN-R-06] keeps an API move in another board from taking focus from a matching card id', async () => {
    const other = TestBed.createComponent(SdKanban<Dto>);
    other.componentRef.setInput('option', option);
    other.componentRef.setInput('columns', columns);
    other.componentRef.setInput('items', data);
    other.detectChanges();
    // TestBed's second root creation removes the first root from the document.
    document.body.appendChild(host());
    handle('x').focus();
    expect(document.activeElement).toBe(handle('x'));
    expect(await other.componentInstance.move('x', { columnId: 'done' })).toBeTrue();
    other.detectChanges();
    await other.whenStable();
    expect(document.activeElement).toBe(handle('x'));
    other.destroy();
  });

  for (const outcome of ['accepted', 'rejected', 'error'] as const) {
    it(`[KAN-R-05] preserves focus in an outside input after a pending keyboard move is ${outcome}`, async () => {
      const confirmation = deferred<boolean>();
      setOption(withMove(() => confirmation.promise));
      handle('x').focus();
      expect(document.activeElement).toBe(handle('x'));
      const result = fixture.componentInstance.move('x', { columnId: 'done' }, 'keyboard');
      fixture.detectChanges();
      const outside = document.createElement('input');
      document.body.appendChild(outside);
      try {
        outside.focus();
        expect(document.activeElement).toBe(outside);
        if (outcome === 'error') confirmation.reject(new Error('synthetic failure'));
        else confirmation.resolve(outcome === 'accepted');
        expect(await result).toBe(outcome === 'accepted');
        fixture.detectChanges();
        await fixture.whenStable();
        expect(document.activeElement).toBe(outside);
      } finally {
        outside.remove();
      }
    });
  }

  it('[KAN-C-17] draws the board search with the shared search field (sm, 280px) and keeps its name and keyword binding', () => {
    fixture.componentRef.setInput('searchable', true);
    fixture.detectChanges();
    const field = host().querySelector<HTMLElement>('sd-search-field.sd-kanban__search')!;
    expect(field).withContext('board search uses sd-search-field').not.toBeNull();
    expect(field.classList).toContain('sd-sm');
    expect(field.getBoundingClientRect().height).toBe(32);
    expect(field.getBoundingClientRect().width).toBe(280);
    const search = field.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(search.getAttribute('aria-label')).toBeTruthy();
    search.value = 'x';
    search.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.keyword()).toBe('x');
  });

  it('[KAN-C-17] has no board search by default', () => {
    expect(host().querySelector('sd-search-field')).toBeNull();
  });

  it('[KAN-R-05] preserves focus moved to this board search while persistence is pending', async () => {
    const confirmation = deferred<boolean>();
    fixture.componentRef.setInput('searchable', true);
    setOption(withMove(() => confirmation.promise));
    handle('x').focus();
    const result = fixture.componentInstance.move('x', { columnId: 'done' }, 'keyboard');
    fixture.detectChanges();
    const search = host().querySelector<HTMLInputElement>('input[type="search"]')!;
    search.focus();
    expect(document.activeElement).toBe(search);
    confirmation.resolve(true);
    expect(await result).toBeTrue();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(search);
  });

  it('[KAN-R-05] does not restore queued focus after the user explicitly focuses and blurs another control', async () => {
    handle('x').focus();
    expect(await fixture.componentInstance.move('x', { columnId: 'done' }, 'keyboard')).toBeTrue();
    const outside = document.createElement('input');
    document.body.appendChild(outside);
    try {
      outside.focus();
      expect(document.activeElement).toBe(outside);
      outside.blur();
      expect(document.activeElement).toBe(document.body);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(document.activeElement).toBe(document.body);
    } finally {
      outside.remove();
    }
  });

  for (const accepted of [true, false]) {
    it(`[KAN-R-04] restores the initiating control after ${accepted ? 'acceptance' : 'rejection'} when pending disables it`, async () => {
      const confirmation = deferred<boolean>();
      setOption(withMove(() => confirmation.promise));
      handle('x').focus();
      expect(document.activeElement).toBe(handle('x'));
      const result = fixture.componentInstance.move('x', { columnId: 'done' }, 'keyboard');
      fixture.detectChanges();
      expect(handle('x').disabled).toBeTrue();
      confirmation.resolve(accepted);
      expect(await result).toBe(accepted);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(document.activeElement).toBe(handle('x'));
    });
  }

  it('[KAN-SC-29] restores the moved card after an owned asynchronous menu action closes its overlay', async () => {
    const confirmation = deferred<boolean>();
    setOption(withMove(() => confirmation.promise));
    const trigger = host().querySelector<HTMLButtonElement>('[data-kanban-menu="x"]')!;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const actions = TestBed.inject(OverlayContainer).getContainerElement().querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    actions[2].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.pendingId()).toBe('x');
    confirmation.resolve(true);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cards().find(item => item.id === 'x')?.columnId).toBe('done');
    expect(document.activeElement).toBe(handle('x'));
  });

  describe('card-anchored move feedback', () => {
    const card = (id: string): HTMLElement => host().querySelector<HTMLElement>(`[data-card-id="${id}"]`)!;
    const t = (key: string): string => TestBed.inject(I18nService).t(`core.component.kanban.${key}`);

    it('[KAN-R-07] shows the pending state only on the affected card', async () => {
      const confirmation = deferred<boolean>();
      setOption(withMove(() => confirmation.promise));
      const result = fixture.componentInstance.move('x', { columnId: 'done' });
      fixture.detectChanges();
      expect(card('x').classList).toContain('sd-kanban__card--pending');
      expect(card('x').querySelector('.sd-kanban__card-status--pending')?.textContent).toContain(t('saving'));
      expect(card('y').querySelector('.sd-kanban__card-status')).toBeNull();
      expect(host().querySelector('.sd-kanban__pending')).toBeNull();
      confirmation.resolve(true);
      expect(await result).toBeTrue();
      fixture.detectChanges();
      expect(host().querySelector('.sd-kanban__card-status')).toBeNull();
    });

    for (const reason of ['rejected', 'error'] as const) {
      it(`[KAN-R-07] anchors a ${reason} move on the card without a board-wide alert`, async () => {
        setOption(withMove(() => (reason === 'rejected' ? Promise.resolve(false) : Promise.reject(new Error('private backend detail')))));
        expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeFalse();
        fixture.detectChanges();
        const status = card('x').querySelector<HTMLElement>('.sd-kanban__card-status--error')!;
        expect(status.textContent).toContain(t(reason));
        expect(host().querySelector('.sd-kanban__failure')).toBeNull();
        expect(host().textContent).not.toContain('private backend detail');
        const message = status.querySelector<HTMLElement>('[id]')!;
        expect(message.textContent!.trim()).toBe(t(reason));
        expect(handle('x').getAttribute('aria-describedby')!.split(' ')).toContain(message.id);
        expect(cards()).toBe(data);
        expect(card('x').closest('[data-column-id]')!.getAttribute('data-column-id')).toBe('open');
        status.querySelector<HTMLButtonElement>('button')!.click();
        fixture.detectChanges();
        expect(card('x').querySelector('.sd-kanban__card-status')).toBeNull();
        expect(document.activeElement).toBe(handle('x'));
      });
    }

    it('[KAN-R-07] falls back to the board message when the failed card is not rendered', async () => {
      setOption(withMove(() => Promise.resolve(false)));
      expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeFalse();
      fixture.componentRef.setInput('keyword', 'Second');
      fixture.detectChanges();
      expect(host().querySelector('.sd-kanban__card-status')).toBeNull();
      expect(host().querySelector('.sd-kanban__failure')?.textContent).toContain(t('rejected'));
    });

    it('[KAN-R-07] clears a card failure when the next move starts', async () => {
      const persist = jasmine.createSpy('persist').and.returnValues(Promise.resolve(false), Promise.resolve(true));
      setOption(withMove(persist));
      expect(await fixture.componentInstance.move('x', { columnId: 'done' })).toBeFalse();
      fixture.detectChanges();
      expect(card('x').querySelector('.sd-kanban__card-status--error')).not.toBeNull();
      expect(await fixture.componentInstance.move('y', { columnId: 'done' })).toBeTrue();
      fixture.detectChanges();
      expect(host().querySelector('.sd-kanban__card-status')).toBeNull();
      expect(host().querySelector('.sd-kanban__failure')).toBeNull();
    });
  });

  it('[KAN-R-09] applies the column palette through data-color', () => {
    fixture.componentRef.setInput('columns', [
      { id: 'open', label: 'Open', color: 'info' },
      { id: 'done', label: 'Done' },
    ]);
    fixture.detectChanges();
    expect(host().querySelector('[data-column-id="open"]')!.getAttribute('data-color')).toBe('info');
    expect(host().querySelector('[data-column-id="done"]')!.getAttribute('data-color')).toBe('secondary');
  });

  for (const cancel of ['replacement', 'destroy']) {
    it(`[KAN-SC-15] removes its pending focus listener on ${cancel}`, async () => {
      const confirmation = deferred<boolean>();
      setOption(withMove(() => confirmation.promise));
      const add = spyOn(document, 'addEventListener').and.callThrough();
      const remove = spyOn(document, 'removeEventListener').and.callThrough();
      handle('x').focus();
      const result = fixture.componentInstance.move('x', { columnId: 'done' }, 'keyboard');
      const listener = add.calls.allArgs().find(args => args[0] === 'focusin' && args[2] === true);
      expect(listener).toBeDefined();
      if (cancel === 'destroy') fixture.destroy();
      else {
        fixture.componentRef.setInput('items', [...data]);
        fixture.detectChanges();
      }
      expect(remove).toHaveBeenCalledWith('focusin', listener![1], true);
      confirmation.resolve(true);
      expect(await result).toBeFalse();
    });
  }

  it('[KAN-SC-38] puts data-autoid only with autoId, with the encoded card id', () => {
    expect(host().querySelector('[data-autoid]')).toBeNull();
    fixture.componentRef.setInput('autoId', 'tasks');
    fixture.componentRef.setInput('items', [{ id: 'a b/1', columnId: 'open', title: 'Spaced' }]);
    fixture.detectChanges();
    expect(host().querySelector('[data-autoid="components-kanban-tasks"]')).not.toBeNull();
    expect(host().querySelector(`[data-autoid="components-kanban-tasks-card-${encodeURIComponent('a b/1')}"]`)).not.toBeNull();
  });
});
