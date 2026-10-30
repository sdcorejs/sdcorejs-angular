import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, NgZone } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSelect } from './select.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSelect],
  template: `@for (cell of cells; track cell) {
    <sd-select [items]="items" />
  }`,
})
class GridHost {
  readonly cells = Array.from({ length: 700 }, (_, index) => index);
  readonly items = ['One', 'Two'];
}

// Read the callback identity to distinguish sd-select registrations from framework listeners.
const retryHandler = (select: SdSelect<any>): EventListener => (select as any).focusReadRetry;

describe('SdSelect document keyboard listener lifecycle', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SdSelect, GridHost, NoopAnimationsModule] }));

  function setup(multiple = false, virtualScroll = false) {
    const fixture = TestBed.createComponent(SdSelect);
    fixture.componentRef.setInput('items', ['One', 'Two']);
    fixture.componentRef.setInput('multiple', multiple);
    fixture.componentRef.setInput('virtualScroll', virtualScroll);
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    return { fixture, select: fixture.componentInstance };
  }

  it('registers no document retry listeners for 700 rendered, closed selects', fakeAsync(() => {
    const add = spyOn(document, 'addEventListener').and.callThrough();
    const fixture = TestBed.createComponent(GridHost);
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    const selects = fixture.debugElement.queryAll(By.directive(SdSelect)).map(el => el.componentInstance as SdSelect);
    const handlers = new Set<EventListenerOrEventListenerObject>(selects.map(retryHandler));
    expect(selects.length).toBe(700);
    expect(add.calls.allArgs().filter(([type, listener]) => type === 'keydown' && handlers.has(listener)).length).toBe(0);
    fixture.destroy();
  }));

  for (const multiple of [false, true]) {
    for (const virtualScroll of [false, true]) {
      it(`listens only while open and removes the same callback on close/destroy (multiple=${multiple}, virtual=${virtualScroll})`, fakeAsync(() => {
        const add = spyOn(document, 'addEventListener').and.callThrough();
        const remove = spyOn(document, 'removeEventListener').and.callThrough();
        const { fixture, select } = setup(multiple, virtualScroll);
        const handler = retryHandler(select);
        const registrations = () => add.calls.allArgs().filter(([type, listener]) => type === 'keydown' && listener === handler);
        const removals = () => remove.calls.allArgs().filter(([type, listener]) => type === 'keydown' && listener === handler);
        expect(registrations().length).toBe(0);

        for (let cycle = 0; cycle < 3; cycle++) {
          select.open();
          fixture.detectChanges();
          tick(600);
          fixture.detectChanges();
          expect(select.selectRef()!.panelOpen).toBeTrue();
          expect(registrations().length).toBe(cycle + 1);
          expect(registrations()[cycle][2]).toBe(true);
          select.selectRef()!.close();
          fixture.detectChanges();
          tick(600);
          fixture.detectChanges();
          expect(removals().length).toBe(cycle + 1);
          expect(removals()[cycle][2]).toBe(true);
        }

        select.open();
        fixture.detectChanges();
        tick(600);
        expect(registrations().length).toBe(4);
        fixture.destroy();
        expect(removals().length).toBeGreaterThanOrEqual(4);
      }));
    }
  }

  it('does not dispatch to closed selects, duplicate an open listener, or retain a destroyed select', fakeAsync(() => {
    const first = setup();
    const second = setup();
    const firstHandler = spyOn<any>(first.select, 'focusReadRetry').and.callThrough();
    const secondHandler = spyOn<any>(second.select, 'focusReadRetry').and.callThrough();
    const press = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
    press();
    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).not.toHaveBeenCalled();

    first.select.open();
    first.fixture.detectChanges();
    tick(600);
    first.select.onOpenedChange(true);
    tick(600);
    press();
    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).not.toHaveBeenCalled();

    first.select.selectRef()!.close();
    first.fixture.detectChanges();
    tick(600);
    press();
    expect(firstHandler).toHaveBeenCalledTimes(1);
    second.select.open();
    second.fixture.detectChanges();
    tick(600);
    press();
    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).toHaveBeenCalledTimes(1);
    second.fixture.destroy();
    press();
    expect(secondHandler).toHaveBeenCalledTimes(1);
    first.fixture.destroy();
  }));

  it('handles unrelated document keys outside Angular while the panel is open', fakeAsync(() => {
    const { fixture, select } = setup();
    const zones: boolean[] = [];
    spyOn<any>(select, 'focusReadRetry').and.callFake(() => zones.push(NgZone.isInAngularZone()));
    fixture.ngZone!.run(() => select.open());
    fixture.detectChanges();
    tick(600);
    fixture.ngZone!.runOutsideAngular(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' })));
    expect(zones).toEqual([false]);
    fixture.destroy();
  }));

  for (const changedInput of ['viewed', 'virtualScroll']) {
    it(`removes the listener when ${changedInput} replaces the open Material select`, fakeAsync(() => {
      const add = spyOn(document, 'addEventListener').and.callThrough();
      const remove = spyOn(document, 'removeEventListener').and.callThrough();
      const { fixture, select } = setup();
      const handler = retryHandler(select);
      const registrations = () => add.calls.allArgs().filter(([type, listener]) => type === 'keydown' && listener === handler).length;
      const removals = () => remove.calls.allArgs().filter(([type, listener]) => type === 'keydown' && listener === handler).length;
      select.open();
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();
      expect(registrations()).toBe(1);
      const before = removals();
      fixture.componentRef.setInput(changedInput, true);
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();
      expect(select.selectRef()?.panelOpen ?? false).toBeFalse();
      expect(removals()).toBeGreaterThan(before);

      fixture.componentRef.setInput(changedInput, false);
      fixture.detectChanges();
      tick(600);
      select.open();
      fixture.detectChanges();
      tick(600);
      expect(select.selectRef()!.panelOpen).toBeTrue();
      expect(registrations()).toBe(2);
      fixture.destroy();
    }));
  }
});
