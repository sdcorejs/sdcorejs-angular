import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CdkDrag, CdkDragStart, CdkDropList } from '@angular/cdk/drag-drop';
import { OverlayContainer } from '@angular/cdk/overlay';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18nService, type I18nParams } from '@sdcorejs/angular/i18n';
import { findCssRule } from '../../../testing';
import { deferred } from '../../../testing/schedule-testing';
import { SdKanban } from './kanban.component';
import type { SdKanbanCard, SdKanbanColumn, SdKanbanDropContext, SdKanbanMoveRequest, SdKanbanOption } from './kanban.model';

interface Dto {
  readonly owner: string;
}
type Card = SdKanbanCard<Dto>;
type Move = NonNullable<SdKanbanOption<Dto>['move']>;

const dto: Dto = { owner: 'Lan' };
const data: readonly Card[] = [
  { id: 'x', columnId: 'open', title: 'First', data: dto },
  { id: 'y', columnId: 'open', title: 'Second' },
  { id: 'd', columnId: 'done', title: 'Done card' },
];
const columns: readonly SdKanbanColumn[] = [
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done' },
  { id: 'later', label: 'Later' },
];

describe('SdKanban · move pipeline', () => {
  let fixture: ComponentFixture<SdKanban<Dto>>;
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const kanban = (): SdKanban<Dto> => fixture.componentInstance;
  /** Read through the DOM (TESTING §0.3); the board is rendered first. */
  const columnOf = (id: string): string | null | undefined => {
    fixture.detectChanges();
    return host().querySelector(`article[data-card-id="${id}"]`)?.closest('[data-column-id]')?.getAttribute('data-column-id');
  };
  const order = (): (string | null)[] => {
    fixture.detectChanges();
    return Array.from(host().querySelectorAll('article')).map(card => card.getAttribute('data-card-id'));
  };
  const live = (): string => host().querySelector('[aria-live="polite"]')?.textContent?.trim() ?? '';
  const t = (key: string, params?: I18nParams): string => TestBed.inject(I18nService).t(`core.component.kanban.${key}`, params);
  const article = (id: string): HTMLElement => host().querySelector<HTMLElement>(`[data-card-id="${id}"]`)!;
  const focusTarget = (id: string): HTMLButtonElement => {
    const button = host().querySelector<HTMLButtonElement>(`[data-kanban-card-main="${id}"]`);
    expect(button).withContext(`name button of ${id}`).not.toBeNull();
    return button ?? document.createElement('button');
  };
  const drags = (): CdkDrag[] => fixture.debugElement.queryAll(By.directive(CdkDrag)).map(element => element.injector.get(CdkDrag));
  const drag = (id: string): CdkDrag => drags().find(candidate => candidate.data.card.id === id)!;
  const lists = (): CdkDropList[] =>
    fixture.debugElement.queryAll(By.directive(CdkDropList)).map(element => element.injector.get(CdkDropList));
  const list = (columnId: string): CdkDropList => lists().find(candidate => candidate.data.column.id === columnId)!;
  const lane = (columnId: string): HTMLElement => host().querySelector<HTMLElement>(`.sd-kanban__column[data-column-id="${columnId}"]`)!;
  const menuItems = (): HTMLButtonElement[] =>
    Array.from(TestBed.inject(OverlayContainer).getContainerElement().querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
  const openMenu = async (id: string): Promise<HTMLButtonElement[]> => {
    host().querySelector<HTMLButtonElement>(`[data-kanban-menu="${id}"]`)!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    return menuItems();
  };
  const press = (id: string, key: string): void => {
    const target = focusTarget(id);
    target.focus();
    target.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key, bubbles: true, cancelable: true }));
  };
  const closeMenu = async (): Promise<void> => {
    TestBed.inject(OverlayContainer).getContainerElement().querySelector<HTMLElement>('.cdk-overlay-backdrop')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
  };
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
  const drop = (id: string, columnId: string, currentIndex = 0, over = true): void => {
    const from = list(columnOf(id)!);
    const to = list(columnId);
    to.dropped.emit({
      previousIndex: 0,
      currentIndex,
      item: drag(id),
      container: over ? to : from,
      previousContainer: from,
      isPointerOverContainer: over,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 },
      event: new MouseEvent('mouseup'),
    });
  };
  const settle = async (): Promise<void> => {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const mount = (move: Move | undefined, inputs: Record<string, unknown> = {}): void => {
    fixture.componentRef.setInput('option', move ? { move } : {});
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdKanban], providers: [provideNoopAnimations()] }).compileComponents();
    fixture = TestBed.createComponent(SdKanban<Dto>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('items', data);
  });

  it('[KAN-SC-07] has no dragging, no move menu and no Alt + arrow moves without option.move', async () => {
    mount(undefined);
    expect(drags().every(candidate => candidate.disabled)).toBeTrue();
    expect(host().querySelector('[data-kanban-menu]')).toBeNull();
    press('x', 'ArrowRight');
    await settle();
    expect(columnOf('x')).toBe('open');
    expect(await kanban().move('x', { columnId: 'done' })).toBeFalse();
  });

  describe('movable and droppable (SC-06, SC-08)', () => {
    it('[KAN-SC-06] evaluates movable again right before onMove', async () => {
      let allow = true;
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      mount({ movable: () => allow, onMove });
      expect(drag('x').disabled).withContext('movable at render').toBeFalse();
      allow = false;
      expect(await kanban().move('x', { columnId: 'done' })).toBeFalse();
      expect(onMove).not.toHaveBeenCalled();
      // why: the board is OnPush; the consumer's next render comes with new data or a new option.
      fixture.componentRef.setInput('items', [...data]);
      fixture.detectChanges();
      expect(drag('x').disabled).withContext('the next render').toBeTrue();
      expect(host().querySelector<HTMLButtonElement>('[data-kanban-menu="x"]')!.disabled).toBeTrue();
      expect(focusTarget('x')).withContext('the card can still be reached').not.toBeNull();
    });

    it('[KAN-SC-06] evaluates droppable again right before onMove', async () => {
      let allow = true;
      const onMove = jasmine.createSpy('onMove').and.callFake(() => {
        return true;
      });
      const droppable = jasmine.createSpy('droppable').and.callFake(() => allow);
      mount({ droppable, onMove });
      startDrag('x');
      expect(lane('done').hasAttribute('data-blocked')).toBeFalse();
      allow = false;
      drop('x', 'done');
      await settle();
      expect(onMove).not.toHaveBeenCalled();
      expect(columnOf('x')).toBe('open');
    });

    it('[KAN-SC-08] refuses a column for a drag, the menu, Alt + arrow and move()', async () => {
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      const droppable = (context: SdKanbanDropContext<Dto>): boolean => context.to.id !== 'done';
      mount({ droppable, onMove });
      expect(await kanban().move('x', { columnId: 'done' }))
        .withContext('move()')
        .toBeFalse();
      const items = await openMenu('x');
      const doneItem = items.find(item => item.textContent!.includes('Done'))!;
      const laterItem = items.find(item => item.textContent!.includes('Later'))!;
      expect(doneItem.disabled).withContext('menu').toBeTrue();
      expect(laterItem.disabled).toBeFalse();
      await closeMenu();
      press('x', 'ArrowRight');
      await settle();
      expect(columnOf('x')).withContext('Alt + Right skips the refused column').toBe('later');
      expect(onMove).toHaveBeenCalledTimes(1);
      expect((onMove.calls.mostRecent()?.args[0] as SdKanbanMoveRequest<Dto> | undefined)?.to.columnId).toBe('later');
    });

    it('[KAN-C-10] works out droppable once when a drag starts, marks refused lanes and clears them when it ends', () => {
      const droppable = jasmine.createSpy('droppable').and.callFake((context: SdKanbanDropContext<Dto>) => context.to.id !== 'done');
      mount({ droppable, onMove: () => true });
      startDrag('x');
      expect(droppable).toHaveBeenCalledTimes(2);
      expect(droppable.calls.allArgs().map(args => (args[0] as SdKanbanDropContext<Dto>).to.id)).toEqual(['done', 'later']);
      expect(lane('done').getAttribute('data-blocked')).toBe('true');
      expect(lane('done').querySelector('.sd-kanban__cards')!.getAttribute('aria-disabled')).toBe('true');
      expect(lane('later').hasAttribute('data-blocked')).toBeFalse();
      expect(lane('open').hasAttribute('data-blocked')).withContext('the source column').toBeFalse();
      expect(list('done').enterPredicate(drag('x'), list('done'))).toBeFalse();
      expect(list('later').enterPredicate(drag('x'), list('later'))).toBeTrue();
      expect(getComputedStyle(lane('done').querySelector('.sd-kanban__cards')!).opacity).toBe('0.45');
      endDrag('x');
      expect(lane('done').hasAttribute('data-blocked')).toBeFalse();
    });

    it('[KAN-C-10] announces drop-blocked for a drop on a refused lane', async () => {
      const onMove = jasmine.createSpy('onMove');
      mount({ droppable: context => context.to.id !== 'done', onMove });
      startDrag('x');
      spyOn(document, 'elementFromPoint').and.returnValue(lane('done'));
      drop('x', 'done', 0, false);
      await settle();
      expect(onMove).not.toHaveBeenCalled();
      expect(live()).toBe(t('drop-blocked', { column: 'Done' }));
    });
  });

  describe('reorder', () => {
    it('[KAN-C-11] reorder off: no sorting, no slot, null index and beforeId, no Up/Down, Alt + Up/Down does nothing', async () => {
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      mount({ onMove });
      expect(lists().every(candidate => candidate.sortingDisabled)).toBeTrue();
      expect(await kanban().move('x', { columnId: 'done', beforeId: 'd' })).toBeTrue();
      expect((onMove.calls.mostRecent()?.args[0] as SdKanbanMoveRequest<Dto> | undefined)?.to).toEqual({
        columnId: 'done',
        index: null,
        beforeId: null,
      });
      // x comes before d in the items array, so it stays above d in Done.
      expect(order()).withContext('keeps the place in the array').toEqual(['y', 'x', 'd']);
      expect(await kanban().move('y', { columnId: 'open', beforeId: 'x' }))
        .withContext('same column')
        .toBeFalse();
      fixture.detectChanges();
      const items = await openMenu('y');
      expect(items.map(item => item.textContent!.trim())).not.toContain(t('move-up'));
      expect(items.map(item => item.textContent!.trim())).not.toContain(t('move-down'));
      await closeMenu();
      const calls = onMove.calls.count();
      press('y', 'ArrowDown');
      press('y', 'ArrowUp');
      await settle();
      expect(onMove.calls.count()).toBe(calls);
    });

    it('[KAN-C-11] reorder off: the old place stays at .4 opacity in the source lane while dragging, with no slot', () => {
      mount({ onMove: () => true });
      startDrag('x');
      const origin = lane('open').querySelector<HTMLElement>('[data-origin]')!;
      expect(origin).not.toBeNull();
      expect(origin.getAttribute('aria-hidden')).toBe('true');
      expect(getComputedStyle(origin).opacity).toBe('0.4');
      expect(host().querySelector('[data-origin]')!.closest('[data-column-id]')!.getAttribute('data-column-id')).toBe('open');
      endDrag('x');
      expect(host().querySelector('[data-origin]')).toBeNull();
      // No drop slot: the CDK placeholder of a card is an element that is not displayed.
      expect(findCssRule(/sd-kanban__no-slot/)?.getPropertyValue('display')).toBe('none');
    });

    it('[KAN-C-12] reorder on: sorting, Up/Down in the menu and Alt + Up/Down', async () => {
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      mount({ reorder: true, onMove });
      expect(lists().every(candidate => !candidate.sortingDisabled)).toBeTrue();
      const items = await openMenu('x');
      expect(items.map(item => item.textContent!.trim())).toContain(t('move-down'));
      await closeMenu();
      press('x', 'ArrowDown');
      await settle();
      expect((onMove.calls.mostRecent()?.args[0] as SdKanbanMoveRequest<Dto> | undefined)?.to).toEqual({
        columnId: 'open',
        index: 1,
        beforeId: null,
      });
    });
  });

  describe('onMove answers (SC-09…13)', () => {
    type Answer = 'true' | 'void' | 'false' | 'cancel' | 'throw';
    const answer = (kind: Answer): unknown => {
      if (kind === 'throw') throw new Error('nope');
      return { true: true, void: undefined, false: false, cancel: 'cancel' }[kind];
    };
    const codes: Record<Answer, string> = {
      true: 'KAN-SC-09',
      void: 'KAN-SC-10',
      false: 'KAN-SC-11',
      cancel: 'KAN-SC-12',
      throw: 'KAN-SC-13',
    };
    for (const kind of ['true', 'void', 'false', 'cancel', 'throw'] as const) {
      for (const async of [false, true]) {
        it(`[${codes[kind]}] answer ${kind}${async ? ' through a promise' : ''}: data, card, outputs and announcement`, async () => {
          const onMove = (): ReturnType<Move['onMove']> =>
            (async ? Promise.resolve().then(() => answer(kind)) : answer(kind)) as ReturnType<Move['onMove']>;
          mount({ onMove });
          const moved = jasmine.createSpy('moved');
          const failed = jasmine.createSpy('failed');
          kanban().sdMove.subscribe(moved);
          kanban().sdMoveError.subscribe(failed);
          const accepted = kind === 'true' || kind === 'void';
          expect(await kanban().move('x', { columnId: 'done' })).toBe(accepted);
          fixture.detectChanges();
          expect(columnOf('x')).toBe(accepted ? 'done' : 'open');
          expect(moved).toHaveBeenCalledTimes(accepted ? 1 : 0);
          expect(article('x').classList.contains('sd-kanban__card--failed')).toBe(kind === 'false' || kind === 'throw');
          expect(failed).toHaveBeenCalledTimes(kind === 'false' || kind === 'throw' ? 1 : 0);
          if (kind === 'false') expect(failed.calls.mostRecent().args[0].reason).toBe('rejected');
          if (kind === 'throw') expect(failed.calls.mostRecent().args[0].reason).toBe('error');
          const announced = {
            true: t('moved', { title: 'First', column: 'Done', position: 1 }),
            void: t('moved', { title: 'First', column: 'Done', position: 1 }),
            false: t('rejected'),
            cancel: t('cancelled', { title: 'First' }),
            throw: t('error'),
          }[kind];
          expect(live()).toBe(announced);
          expect(kanban().pendingId()).toBeNull();
        });
      }
    }

    for (const kind of ['true', 'false', 'cancel', 'throw'] as const) {
      it(`[KAN-SC-29] puts the focus back on the card after a keyboard move answered ${kind}`, async () => {
        const wait = deferred<void>();
        mount({
          onMove: async () => {
            await wait.promise;
            return answer(kind) as boolean | 'cancel' | void;
          },
        });
        press('x', 'ArrowRight');
        fixture.detectChanges();
        wait.resolve();
        await settle();
        expect(document.activeElement).toBe(focusTarget('x'));
      });
    }
  });

  it('[KAN-SC-14] ignores a second move by drag, key or move() while one waits', async () => {
    const wait = deferred<boolean>();
    const onMove = jasmine.createSpy('onMove').and.returnValue(wait.promise);
    mount({ onMove });
    const first = kanban().move('x', { columnId: 'done' });
    fixture.detectChanges();
    drop('y', 'done');
    press('y', 'ArrowRight');
    expect(await kanban().move('y', { columnId: 'later' })).toBeFalse();
    expect(onMove).toHaveBeenCalledTimes(1);
    wait.resolve(true);
    expect(await first).toBeTrue();
  });

  for (const cause of ['items', 'option', 'columns', 'readonly', 'disabled', 'destroy'] as const) {
    it(`[KAN-SC-15] aborts the waiting move when ${cause} changes and drops the late answer`, async () => {
      const wait = deferred<boolean>();
      const onMove = jasmine.createSpy('onMove').and.returnValue(wait.promise);
      const move: Move = { onMove };
      mount(move);
      const moved = jasmine.createSpy('moved');
      kanban().sdMove.subscribe(moved);
      const result = kanban().move('x', { columnId: 'done' });
      const request = onMove.calls.mostRecent().args[0] as SdKanbanMoveRequest<Dto>;
      if (cause === 'destroy') fixture.destroy();
      else {
        const next: Record<string, unknown> = {
          items: [...data],
          option: { move: { ...move } },
          columns: [...columns],
          readonly: true,
          disabled: true,
        };
        fixture.componentRef.setInput(cause, next[cause]);
        fixture.detectChanges();
      }
      expect(request.signal.aborted).toBeTrue();
      wait.resolve(true);
      expect(await result).toBeFalse();
      expect(moved).not.toHaveBeenCalled();
      if (cause !== 'destroy') expect(columnOf('x')).toBe('open');
    });
  }

  it('[KAN-R-03] drops the proposal when the consumer replaces the items inside onMove', async () => {
    const replacement: Card[] = [{ ...data[0], title: 'Reloaded' }, data[1], data[2]];
    mount({
      onMove: () => {
        fixture.componentRef.setInput('items', replacement);
        fixture.detectChanges();
        return true;
      },
    });
    expect(await kanban().move('x', { columnId: 'done' })).toBeFalse();
    fixture.detectChanges();
    expect(article('x').textContent).toContain('Reloaded');
    expect(columnOf('x')).toBe('open');
  });

  it('[KAN-SC-16] never shows the text of an error', async () => {
    mount({
      onMove: () => {
        throw new Error('SECRET');
      },
    });
    await kanban().move('x', { columnId: 'done' });
    fixture.detectChanges();
    expect(host().textContent).not.toContain('SECRET');
  });

  it('[KAN-SC-17] move() resolves true only when onMove accepts', async () => {
    const answers: (boolean | 'cancel' | Error)[] = [];
    mount({
      movable: card => card.id !== 'locked',
      droppable: context => context.to.id !== 'later',
      onMove: () => {
        const next = answers.shift();
        if (next instanceof Error) throw next;
        return next ?? true;
      },
    });
    fixture.componentRef.setInput('items', [...data, { id: 'locked', columnId: 'open', title: 'Locked' }]);
    fixture.componentRef.setInput('columns', [...columns, { id: 'off', label: 'Off', disabled: true }]);
    fixture.detectChanges();
    expect(await kanban().move('missing', { columnId: 'done' }))
      .withContext('unknown card')
      .toBeFalse();
    expect(await kanban().move('x', { columnId: 'missing' }))
      .withContext('unknown column')
      .toBeFalse();
    expect(await kanban().move('x', { columnId: 'off' }))
      .withContext('disabled column')
      .toBeFalse();
    expect(await kanban().move('locked', { columnId: 'done' }))
      .withContext('movable false')
      .toBeFalse();
    expect(await kanban().move('x', { columnId: 'later' }))
      .withContext('droppable false')
      .toBeFalse();
    expect(await kanban().move('x', { columnId: 'open' }))
      .withContext('same column')
      .toBeFalse();
    answers.push(false, 'cancel', new Error('x'));
    expect(await kanban().move('x', { columnId: 'done' }))
      .withContext('false')
      .toBeFalse();
    expect(await kanban().move('x', { columnId: 'done' }))
      .withContext('cancel')
      .toBeFalse();
    expect(await kanban().move('x', { columnId: 'done' }))
      .withContext('error')
      .toBeFalse();
    expect(await kanban().move('x', { columnId: 'done' }))
      .withContext('accepted')
      .toBeTrue();
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(await kanban().move('x', { columnId: 'open' }))
      .withContext('locked board')
      .toBeFalse();
  });

  describe('R1 fixes', () => {
    it('[KAN-B-01] does not bring back its old copy when an earlier items reference comes back (A, B, A)', async () => {
      mount({ onMove: () => true });
      expect(await kanban().move('x', { columnId: 'done' })).toBeTrue();
      expect(columnOf('x')).toBe('done');
      fixture.componentRef.setInput('items', [...data]);
      fixture.detectChanges();
      fixture.componentRef.setInput('items', data);
      fixture.detectChanges();
      expect(columnOf('x')).withContext('the consumer gave A again').toBe('open');
    });

    it('[KAN-B-02] does not ask droppable about a move inside the same column', async () => {
      const droppable = jasmine
        .createSpy('droppable')
        .and.callFake((context: SdKanbanDropContext<Dto>) => context.from.id !== context.to.id);
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      mount({ reorder: true, droppable, onMove });
      press('x', 'ArrowDown');
      await settle();
      expect(onMove).toHaveBeenCalledTimes(1);
      expect(order()).toEqual(['y', 'x', 'd']);
      expect(droppable.calls.allArgs().some(args => (args[0] as SdKanbanDropContext<Dto>).to.id === 'open')).toBeFalse();
      expect(await kanban().move('x', { columnId: 'open', beforeId: 'y' })).toBeTrue();
    });

    it('[KAN-B-03] sizes the old place from the card before the CDK takes it out of the lane', () => {
      mount({ onMove: () => true });
      const card = article('x');
      const height = card.getBoundingClientRect().height;
      card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      // What the CDK does when the drag starts: the card leaves the lane, hidden and fixed.
      card.style.display = 'none';
      startDrag('x');
      expect(lane('open').querySelector<HTMLElement>('[data-origin]')!.getBoundingClientRect().height).toBe(height);
    });

    it('[KAN-B-04] exposes pendingId read-only', () => {
      mount({ onMove: () => true });
      expect('set' in kanban().pendingId).toBeFalse();
      expect(kanban().pendingId()).toBeNull();
    });

    it('[KAN-B-05] has no member named after the removed canMove option', () => {
      mount({ onMove: () => true });
      expect('canMove' in kanban()).toBeFalse();
    });
  });

  it('[KAN-SC-18] undoes an accepted move with move(…, "api") without taking the focus', async () => {
    mount({ onMove: () => true });
    expect(await kanban().move('x', { columnId: 'done' })).toBeTrue();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    try {
      outside.focus();
      expect(await kanban().move('x', { columnId: 'open' }, 'api')).toBeTrue();
      await settle();
      expect(columnOf('x')).toBe('open');
      expect(document.activeElement).toBe(outside);
    } finally {
      outside.remove();
    }
  });
});
