import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Utilities } from '@sdcorejs/utils/fns';
import { SelectorActionComponent } from './selector-action.component';

describe('Table selection toolbar layout and overflow', () => {
  let fixture: ComponentFixture<SelectorActionComponent>;
  let callbacks: jasmine.Spy[];
  let actions: any[];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SelectorActionComponent, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SelectorActionComponent);
    callbacks = [0, 1, 2, 3].map(i => jasmine.createSpy('action' + i));
    actions = callbacks.map((click, i) => ({ title: 'Action ' + i, icon: 'check', click }));
    fixture.componentRef.setInput('autoId', 'employees');
    fixture.componentRef.setInput('tableOption', { type: 'local', columns: [], selector: { actions, message: 'Selected 2 invoices' } });
    fixture.componentRef.setInput(
      'selectedTableItems',
      [1, 2].map(id => ({
        data: { id },
        meta: { id: String(id), selector: { actions: actions.map(action => Utilities.hash(action)) } },
      }))
    );
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('stays in document flow and shows the custom selection count only once', () => {
    const bar = fixture.nativeElement.querySelector('.c-quick-action');
    expect(getComputedStyle(bar).position).toBe('relative');
    expect(fixture.nativeElement.textContent.match(/2/g)?.length).toBe(1);
  });

  it('keeps two actions visible and invokes an overflow action with the whole selection', () => {
    expect(fixture.nativeElement.querySelectorAll('.sd-selection-direct').length).toBe(2);
    fixture.nativeElement.querySelector('.sd-selection-more button').click();
    fixture.detectChanges();
    const menu = TestBed.inject(OverlayContainer).getContainerElement();
    const overflowAction = Array.from(menu.querySelectorAll<HTMLButtonElement>('button')).find(button =>
      button.textContent?.includes('Action 3')
    )!;
    expect(overflowAction).toBeTruthy();
    overflowAction.click();
    expect(callbacks[3]).toHaveBeenCalledOnceWith([{ id: 1 }, { id: 2 }]);
    expect(callbacks[0]).not.toHaveBeenCalled();
  });

  it('names the clear button and only clears when it is activated', () => {
    const clear = jasmine.createSpy('clear');
    fixture.componentInstance.clear.subscribe(clear);
    const button = fixture.nativeElement.querySelector('.sd-selection-clear');
    expect(button.getAttribute('aria-label')).toBeTruthy();
    expect(clear).not.toHaveBeenCalled();
    button.click();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('opens compact child actions from the native button and returns focus after Escape', async () => {
    const group = { title: 'Reports', children: actions.slice(2) };
    fixture.componentRef.setInput('tableOption', { type: 'local', columns: [], selector: { actions: [group] } });
    fixture.detectChanges();
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.sd-selection-direct button') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    const menu = TestBed.inject(OverlayContainer).getContainerElement().querySelector('[role="menu"]') as HTMLElement;
    expect(menu.classList).toContain('sd-table-action-menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(menu.id);
    const first = menu.querySelector('button')!;
    expect(first.getBoundingClientRect().height).toBeLessThanOrEqual(36);
    expect(document.activeElement).toBe(first);
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(TestBed.inject(OverlayContainer).getContainerElement().querySelector('[role="menu"]')).toBeNull();
  });

  it('dismisses child actions after running them and removes an open menu when selection clears', async () => {
    const group = { title: 'Reports', children: actions.slice(2) };
    fixture.componentRef.setInput('tableOption', { type: 'local', columns: [], selector: { actions: [group] } });
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.sd-selection-direct button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    overlay.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(callbacks[2]).toHaveBeenCalledOnceWith([{ id: 1 }, { id: 2 }]);
    expect(overlay.querySelector('[role="menu"]')).toBeNull();
    // SdButton throttles repeated pointer clicks; ArrowDown opens immediately.
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
    fixture.detectChanges();
    expect(overlay.querySelector('[role="menu"]')).toBeTruthy();
    fixture.componentRef.setInput('selectedTableItems', []);
    fixture.detectChanges();
    expect(overlay.querySelector('[role="menu"]')).toBeNull();
  });

  it('keeps grouped overflow actions and excludes children unavailable to one selected row', () => {
    const group = { title: 'Reports', children: actions.slice(2) };
    fixture.componentRef.setInput('tableOption', { type: 'local', columns: [], selector: { actions: [...actions.slice(0, 2), group] } });
    fixture.componentRef.setInput('selectedTableItems', [
      { data: { id: 1 }, meta: { selector: { actions: actions.map(action => Utilities.hash(action)) } } },
      { data: { id: 2 }, meta: { selector: { actions: actions.slice(0, 3).map(action => Utilities.hash(action)) } } },
    ]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.sd-selection-more button').click();
    fixture.detectChanges();
    const menu = TestBed.inject(OverlayContainer).getContainerElement();
    expect(menu.textContent).toContain('Reports');
    expect(menu.textContent).not.toContain('Action 3');
    Array.from(menu.querySelectorAll<HTMLButtonElement>('button'))
      .find(button => button.textContent?.includes('Action 2'))!
      .click();
    expect(callbacks[2]).toHaveBeenCalledOnceWith([{ id: 1 }, { id: 2 }]);
    expect(callbacks[3]).not.toHaveBeenCalled();
  });
});
