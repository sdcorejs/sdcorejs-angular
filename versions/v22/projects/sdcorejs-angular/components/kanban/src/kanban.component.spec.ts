import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { OverlayContainer } from '@angular/cdk/overlay';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdKanban } from './kanban.component';
import { SdKanbanOption } from './kanban.model';

interface Card {
  id: string;
  state: string;
  title: string;
}
const data: readonly Card[] = [
  { id: 'x', state: 'open', title: 'First' },
  { id: 'hidden', state: 'done', title: 'Hidden' },
  { id: 'y', state: 'open', title: 'Second' },
];
const option: SdKanbanOption<Card> = {
  getId: item => item.id,
  getColumnId: item => item.state,
  getTitle: item => item.title,
  withColumn: (item, id) => ({ ...item, state: String(id) }),
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('SdKanban', () => {
  let fixture: ComponentFixture<SdKanban<Card>>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdKanban], providers: [provideNoopAnimations()] }).compileComponents();
    fixture = TestBed.createComponent(SdKanban<Card>);
    fixture.componentRef.setInput('option', option);
    fixture.componentRef.setInput('columns', [
      { id: 'open', label: 'Open' },
      { id: 'done', label: 'Done' },
    ]);
    fixture.componentRef.setInput('model', data);
    fixture.detectChanges();
  });
  it('commits a local move once and emits the complete dataset', async () => {
    const change = jasmine.createSpy('change');
    const moved = jasmine.createSpy('moved');
    fixture.componentInstance.sdChange.subscribe(change);
    fixture.componentInstance.sdMove.subscribe(moved);
    expect(await fixture.componentInstance.move('x', 'done', 1)).toBeTrue();
    expect(fixture.componentInstance.model().find(item => item.id === 'x')?.state).toBe('done');
    expect(change).toHaveBeenCalledTimes(1);
    expect(moved).toHaveBeenCalledTimes(1);
    expect(change.calls.mostRecent().args[0].length).toBe(3);
  });
  it('waits for confirmation and blocks duplicate and competing moves', async () => {
    const confirmation = deferred<boolean>();
    const persist = jasmine.createSpy('persist').and.returnValue(confirmation.promise);
    fixture.componentRef.setInput('option', { ...option, move: persist });
    fixture.detectChanges();
    const result = fixture.componentInstance.move('x', 'done');
    expect(fixture.componentInstance.model()).toBe(data);
    expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
    expect(await fixture.componentInstance.move('y', 'done')).toBeFalse();
    expect(persist).toHaveBeenCalledTimes(1);
    confirmation.resolve(true);
    expect(await result).toBeTrue();
  });
  it('keeps data on rejection or thrown persistence error', async () => {
    const error = jasmine.createSpy('error');
    fixture.componentInstance.sdMoveError.subscribe(error);
    fixture.componentRef.setInput('option', { ...option, move: () => Promise.resolve(false) });
    fixture.detectChanges();
    expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
    expect(fixture.componentInstance.model()).toBe(data);
    expect(error.calls.mostRecent().args[0].reason).toBe('rejected');
    fixture.componentRef.setInput('option', { ...option, move: () => Promise.reject(new Error('private backend detail')) });
    fixture.detectChanges();
    expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
    fixture.detectChanges();
    expect(error.calls.mostRecent().args[0].reason).toBe('error');
    expect(fixture.nativeElement.textContent).not.toContain('private backend detail');
    expect(fixture.componentInstance.model()).toBe(data);
  });
  it('discards a late response when new input data arrives', async () => {
    const confirmation = deferred<boolean>();
    const persist = jasmine.createSpy('persist').and.returnValue(confirmation.promise);
    fixture.componentRef.setInput('option', { ...option, move: persist });
    fixture.detectChanges();
    const result = fixture.componentInstance.move('x', 'done');
    const replacement = [{ ...data[0], title: 'Fresh server data' }];
    fixture.componentRef.setInput('model', replacement);
    fixture.detectChanges();
    confirmation.resolve(true);
    expect(await result).toBeFalse();
    expect(fixture.componentInstance.model()).toBe(replacement);
    expect(persist.calls.mostRecent().args[0].signal.aborted).toBeTrue();
  });
  it('aborts on destruction and never emits a late successful move', async () => {
    const confirmation = deferred<boolean>();
    const persist = jasmine.createSpy('persist').and.returnValue(confirmation.promise);
    const moved = jasmine.createSpy('moved');
    fixture.componentRef.setInput('option', { ...option, move: persist });
    fixture.detectChanges();
    fixture.componentInstance.sdMove.subscribe(moved);
    const result = fixture.componentInstance.move('x', 'done');
    fixture.destroy();
    confirmation.resolve(true);
    expect(await result).toBeFalse();
    expect(moved).not.toHaveBeenCalled();
  });
  for (const lock of ['disabled', 'readonly', 'loading', 'error']) {
    it(`blocks movement when ${lock}`, async () => {
      fixture.componentRef.setInput(lock, lock === 'error' ? 'Load failed' : true);
      fixture.detectChanges();
      expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
      expect(fixture.componentInstance.model()).toBe(data);
    });
  }
  for (const changed of ['option', 'columns']) {
    it(`invalidates an async result when ${changed} is replaced`, async () => {
      const confirmation = deferred<boolean>();
      const persist = jasmine.createSpy('persist').and.returnValue(confirmation.promise);
      fixture.componentRef.setInput('option', { ...option, move: persist });
      fixture.detectChanges();
      const result = fixture.componentInstance.move('x', 'done');
      fixture.componentRef.setInput(
        changed,
        changed === 'option'
          ? { ...option }
          : [
              { id: 'open', label: 'Open' },
              { id: 'done', label: 'Finished' },
            ]
      );
      confirmation.resolve(true);
      expect(await result).toBeFalse();
      expect(fixture.componentInstance.model()).toBe(data);
      expect(persist.calls.mostRecent().args[0].signal.aborted).toBeTrue();
    });
  }
  it('honors permission veto before calling persistence', async () => {
    const persist = jasmine.createSpy('persist');
    fixture.componentRef.setInput('option', { ...option, canMove: () => false, move: persist });
    fixture.detectChanges();
    expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
    expect(persist).not.toHaveBeenCalled();
  });
  it('releases the pending lock after rejection so a retry can succeed', async () => {
    const persist = jasmine.createSpy('persist').and.returnValues(Promise.resolve(false), Promise.resolve(true));
    fixture.componentRef.setInput('option', { ...option, move: persist });
    fixture.detectChanges();
    expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
    expect(fixture.componentInstance.pendingId()).toBeNull();
    expect(await fixture.componentInstance.move('x', 'done')).toBeTrue();
  });
  it('renders full and filtered counts without changing model order', () => {
    fixture.componentRef.setInput('keyword', 'First');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(1);
    expect(
      fixture.nativeElement.querySelector('[data-column-id="string-open"] .sd-kanban__count').textContent.replace(/\s+/g, ' ').trim()
    ).toBe('1 / 2');
    expect(fixture.componentInstance.model()).toBe(data);
    fixture.componentRef.setInput('keyword', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(3);
  });
  it('resolves filtered drag insertion using the full-data anchor', () => {
    const changedData = [...data, { id: 'z', state: 'done', title: 'Visible' }];
    fixture.componentRef.setInput('model', changedData);
    fixture.componentRef.setInput('option', { ...option, filter: (item: Card) => item.title !== 'Hidden' });
    fixture.detectChanges();
    const lists = fixture.debugElement.queryAll(By.directive(CdkDropList)).map(element => element.injector.get(CdkDropList));
    const drag = fixture.debugElement
      .queryAll(By.directive(CdkDrag))
      .map(element => element.injector.get(CdkDrag))
      .find(candidate => candidate.data.id === 'x')!;
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
    expect(
      fixture.componentInstance
        .model()
        .filter(item => item.state === 'done')
        .map(item => item.id)
    ).toEqual(['hidden', 'x', 'z']);
    expect(moved.calls.mostRecent().args[0].toIndex).toBe(1);
    expect(moved.calls.mostRecent().args[0].source).toBe('drag');
  });
  it('routes keyboard reordering through the same move pipeline', () => {
    const moved = jasmine.createSpy('moved');
    fixture.componentInstance.sdMove.subscribe(moved);
    const handle = fixture.nativeElement.querySelector('[data-kanban-handle="string-x"]') as HTMLButtonElement;
    handle.focus();
    handle.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: 'ArrowDown' }));
    expect(
      fixture.componentInstance
        .model()
        .filter(item => item.state === 'open')
        .map(item => item.id)
    ).toEqual(['y', 'x']);
    expect(moved.calls.mostRecent().args[0].source).toBe('keyboard');
  });
  it('routes movement menu actions through the same move pipeline', () => {
    const moved = jasmine.createSpy('moved');
    fixture.componentInstance.sdMove.subscribe(moved);
    (fixture.nativeElement.querySelector('[data-kanban-menu="string-x"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const menuButtons = TestBed.inject(OverlayContainer).getContainerElement().querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    expect(menuButtons[0].disabled).toBeTrue();
    menuButtons[1].click();
    expect(moved.calls.mostRecent().args[0].source).toBe('menu');
  });
  it('preserves collapsed data and expands a collapsed destination on accepted movement', async () => {
    fixture.componentRef.setInput('collapsedColumns', ['done']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-column-id="string-done"] .sd-kanban__cards').hidden).toBeTrue();
    expect(await fixture.componentInstance.move('x', 'done')).toBeTrue();
    expect(fixture.componentInstance.collapsedColumns()).toEqual([]);
  });
  it('fails closed for duplicate IDs and unknown columns', async () => {
    fixture.componentRef.setInput('model', [data[0], { ...data[1], id: 'x' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(0);
    expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
    fixture.componentRef.setInput('model', [{ ...data[0], state: 'unknown' }]);
    fixture.detectChanges();
    expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
  });

  for (const trailing of [false, true]) {
    it(`ignores an unchanged filtered slot with ${trailing ? 'trailing' : 'interleaved'} hidden cards`, async () => {
      const hidden = { ...data[1], state: 'open' };
      const items = trailing ? [data[0], hidden] : [data[0], hidden, data[2]];
      const persist = jasmine.createSpy('persist').and.resolveTo(true);
      const changed = jasmine.createSpy('changed');
      const moved = jasmine.createSpy('moved');
      fixture.componentRef.setInput('model', items);
      fixture.componentRef.setInput('option', { ...option, filter: (item: Card) => item.id !== 'hidden', move: persist });
      fixture.componentInstance.sdChange.subscribe(changed);
      fixture.componentInstance.sdMove.subscribe(moved);
      fixture.detectChanges();
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
      expect(fixture.componentInstance.model()).toBe(items);
      expect(fixture.componentInstance.pendingId()).toBeNull();
      expect(persist).not.toHaveBeenCalled();
      expect(changed).not.toHaveBeenCalled();
      expect(moved).not.toHaveBeenCalled();
    });
  }

  it('keeps an API move in another board from taking focus from a matching card ID', async () => {
    const other = TestBed.createComponent(SdKanban<Card>);
    other.componentRef.setInput('option', option);
    other.componentRef.setInput('columns', fixture.componentInstance.columns());
    other.componentRef.setInput('model', data);
    other.detectChanges();
    // TestBed's second root creation removes the first root from the document.
    document.body.appendChild(fixture.nativeElement);
    const handle = fixture.nativeElement.querySelector('[data-kanban-handle="string-x"]') as HTMLButtonElement;
    handle.focus();
    expect(document.activeElement).toBe(handle);
    expect(await other.componentInstance.move('x', 'done')).toBeTrue();
    other.detectChanges();
    await other.whenStable();
    expect(document.activeElement).toBe(handle);
    other.destroy();
  });

  for (const outcome of ['accepted', 'rejected', 'error'] as const) {
    it(`preserves focus in an outside input after a pending keyboard move is ${outcome}`, async () => {
      const confirmation = deferred<boolean>();
      fixture.componentRef.setInput('option', { ...option, move: () => confirmation.promise });
      fixture.detectChanges();
      const handle = fixture.nativeElement.querySelector('[data-kanban-handle="string-x"]') as HTMLButtonElement;
      handle.focus();
      expect(document.activeElement).toBe(handle);
      const result = fixture.componentInstance.move('x', 'done', undefined, 'keyboard');
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

  it('preserves focus moved to this board search while persistence is pending', async () => {
    const confirmation = deferred<boolean>();
    fixture.componentRef.setInput('option', { ...option, move: () => confirmation.promise });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-kanban-handle="string-x"]') as HTMLButtonElement).focus();
    const result = fixture.componentInstance.move('x', 'done', undefined, 'keyboard');
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.focus();
    expect(document.activeElement).toBe(search);
    confirmation.resolve(true);
    expect(await result).toBeTrue();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(search);
  });

  it('does not restore queued focus after the user explicitly focuses and blurs another control', async () => {
    const handle = fixture.nativeElement.querySelector('[data-kanban-handle="string-x"]') as HTMLButtonElement;
    handle.focus();
    expect(await fixture.componentInstance.move('x', 'done', undefined, 'keyboard')).toBeTrue();
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
    it(`restores the initiating handle after ${accepted ? 'acceptance' : 'rejection'} when pending disables it`, async () => {
      const confirmation = deferred<boolean>();
      fixture.componentRef.setInput('option', { ...option, move: () => confirmation.promise });
      fixture.detectChanges();
      const handle = fixture.nativeElement.querySelector('[data-kanban-handle="string-x"]') as HTMLButtonElement;
      handle.focus();
      expect(document.activeElement).toBe(handle);
      const result = fixture.componentInstance.move('x', 'done', undefined, 'keyboard');
      fixture.detectChanges();
      expect(handle.disabled).toBeTrue();
      confirmation.resolve(accepted);
      expect(await result).toBe(accepted);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('[data-kanban-handle="string-x"]'));
    });
  }

  it('restores the moved handle after an owned asynchronous menu action closes its overlay', async () => {
    const confirmation = deferred<boolean>();
    fixture.componentRef.setInput('option', { ...option, move: () => confirmation.promise });
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[data-kanban-menu="string-x"]') as HTMLButtonElement;
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
    expect(fixture.componentInstance.model().find(item => item.id === 'x')?.state).toBe('done');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('[data-kanban-handle="string-x"]'));
  });

  describe('card-anchored move feedback', () => {
    const card = (id: string) => fixture.nativeElement.querySelector(`[data-card-id="string-${id}"]`) as HTMLElement;
    const t = (key: string) => TestBed.inject(I18nService).t(`core.component.kanban.${key}`);

    it('shows the pending state only on the affected card', async () => {
      const confirmation = deferred<boolean>();
      fixture.componentRef.setInput('option', { ...option, move: () => confirmation.promise });
      fixture.detectChanges();
      const result = fixture.componentInstance.move('x', 'done');
      fixture.detectChanges();
      expect(card('x').classList).toContain('sd-kanban__card--pending');
      expect(card('x').querySelector('.sd-kanban__card-status--pending')?.textContent).toContain(t('saving'));
      expect(card('y').querySelector('.sd-kanban__card-status')).toBeNull();
      expect(fixture.nativeElement.querySelector('.sd-kanban__pending')).toBeNull();
      confirmation.resolve(true);
      expect(await result).toBeTrue();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.sd-kanban__card-status')).toBeNull();
    });

    for (const reason of ['rejected', 'error'] as const) {
      it(`anchors a ${reason} move on the card without a board-wide alert`, async () => {
        fixture.componentRef.setInput('option', {
          ...option,
          move: () => (reason === 'rejected' ? Promise.resolve(false) : Promise.reject(new Error('private backend detail'))),
        });
        fixture.detectChanges();
        expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
        fixture.detectChanges();
        const status = card('x').querySelector('.sd-kanban__card-status--error') as HTMLElement;
        expect(status.textContent).toContain(t(reason));
        expect(fixture.nativeElement.querySelector('.sd-kanban__failure')).toBeNull();
        expect(fixture.nativeElement.textContent).not.toContain('private backend detail');
        const message = status.querySelector('[id]') as HTMLElement;
        expect(message.textContent!.trim()).toBe(t(reason));
        const handle = card('x').querySelector('[data-kanban-handle]') as HTMLButtonElement;
        expect(handle.getAttribute('aria-describedby')!.split(' ')).toContain(message.id);
        expect(fixture.componentInstance.model()).toBe(data);
        expect(card('x').closest('[data-column-id]')!.getAttribute('data-column-id')).toBe('string-open');
        (status.querySelector('button') as HTMLButtonElement).click();
        fixture.detectChanges();
        expect(card('x').querySelector('.sd-kanban__card-status')).toBeNull();
        expect(document.activeElement).toBe(card('x').querySelector('[data-kanban-handle]'));
      });
    }

    it('falls back to the board alert when the failed card is not rendered', async () => {
      fixture.componentRef.setInput('option', { ...option, move: () => Promise.resolve(false) });
      fixture.detectChanges();
      expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
      fixture.componentRef.setInput('keyword', 'Second');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.sd-kanban__card-status')).toBeNull();
      expect(fixture.nativeElement.querySelector('.sd-kanban__failure')?.textContent).toContain(t('rejected'));
    });

    it('clears a card failure when the next move starts', async () => {
      const persist = jasmine.createSpy('persist').and.returnValues(Promise.resolve(false), Promise.resolve(true));
      fixture.componentRef.setInput('option', { ...option, move: persist });
      fixture.detectChanges();
      expect(await fixture.componentInstance.move('x', 'done')).toBeFalse();
      fixture.detectChanges();
      expect(card('x').querySelector('.sd-kanban__card-status--error')).not.toBeNull();
      expect(await fixture.componentInstance.move('y', 'done')).toBeTrue();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.sd-kanban__card-status')).toBeNull();
      expect(fixture.nativeElement.querySelector('.sd-kanban__failure')).toBeNull();
    });
  });

  it('applies the column palette through data-color', () => {
    fixture.componentRef.setInput('columns', [
      { id: 'open', label: 'Open', color: 'info' },
      { id: 'done', label: 'Done' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-column-id="string-open"]').getAttribute('data-color')).toBe('info');
    expect(fixture.nativeElement.querySelector('[data-column-id="string-done"]').getAttribute('data-color')).toBe('secondary');
  });

  for (const cancel of ['replacement', 'destroy']) {
    it(`removes its pending focus listener on ${cancel}`, async () => {
      const confirmation = deferred<boolean>();
      fixture.componentRef.setInput('option', { ...option, move: () => confirmation.promise });
      fixture.detectChanges();
      const add = spyOn(document, 'addEventListener').and.callThrough();
      const remove = spyOn(document, 'removeEventListener').and.callThrough();
      (fixture.nativeElement.querySelector('[data-kanban-handle="string-x"]') as HTMLButtonElement).focus();
      const result = fixture.componentInstance.move('x', 'done', undefined, 'keyboard');
      const listener = add.calls.allArgs().find(args => args[0] === 'focusin' && args[2] === true);
      expect(listener).toBeDefined();
      if (cancel === 'destroy') fixture.destroy();
      else {
        fixture.componentRef.setInput('model', [...data]);
        fixture.detectChanges();
      }
      expect(remove).toHaveBeenCalledWith('focusin', listener![1], true);
      confirmation.resolve(true);
      expect(await result).toBeFalse();
    });
  }
});
