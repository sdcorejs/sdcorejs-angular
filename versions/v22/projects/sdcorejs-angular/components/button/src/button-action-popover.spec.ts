import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton, SdButtonItem, SdButtonItemDivider } from '../index';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdButton, SdButtonItem, SdButtonItemDivider],
  template: `<form (submit)="submit($event)">
    <sd-button
      htmlType="submit"
      tooltip="Actions"
      [openOnHover]="hoverOption()"
      [disabled]="disabled()"
      [loading]="loading()"
      [type]="variant()"
      (click)="normal()">
      Actions
      @if (items()) {
        <sd-button-item prefixIcon="check" suffixIcon="chevron_right" [color]="color()" [disabled]="itemDisabled()" (click)="run()"
          >Approve</sd-button-item
        >
        <sd-button-item-divider />
        <sd-button-item disabled>Disabled</sd-button-item>
        <sd-button-item color="error" (click)="run()">Reject</sd-button-item>
      }
    </sd-button>
    <button type="button" id="after">After</button>
  </form>`,
})
class Host {
  hoverOption = signal<unknown>(false);
  disabled = signal(false);
  loading = signal(false);
  itemDisabled = signal(false);
  variant = signal<'text' | 'light'>('light');
  color = signal<'success' | 'error'>('success');
  items = signal(true);
  run = jasmine.createSpy('run');
  normal = jasmine.createSpy('normal');
  submit = jasmine.createSpy('submit').and.callFake((event: Event) => event.preventDefault());
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdButton, SdButtonItemDivider],
  template: '<sd-button title="Only divider"><sd-button-item-divider /></sd-button>',
})
class DividerHost {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdButton, SdButtonItem],
  template: `<sd-button [prefixIcon]="prefix()" [suffixIcon]="suffix()" [title]="title()" tooltip="Actions">
    {{ label() }}
    <sd-button-item>Run</sd-button-item>
  </sd-button>`,
})
class IndicatorHost {
  prefix = signal<string | undefined>('edit');
  suffix = signal<string | undefined>(undefined);
  title = signal<string | undefined>(undefined);
  label = signal('');
}

describe('SdButton action popover', () => {
  it('shows the indicator only for labeled triggers without a suffix icon and updates the square footprint', async () => {
    TestBed.configureTestingModule({ imports: [IndicatorHost, NoopAnimationsModule] });
    const fixture = TestBed.createComponent(IndicatorHost);
    fixture.detectChanges();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const indicator = () => trigger.querySelector('.c-action-indicator');
    expect(indicator()).toBeNull();
    expect(trigger.classList).toContain('c-square');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    fixture.componentInstance.label.set('Actions');
    fixture.detectChanges();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(indicator()).not.toBeNull();
    expect(trigger.classList).not.toContain('c-square');
    fixture.componentInstance.suffix.set('more_horiz');
    fixture.detectChanges();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(indicator()).toBeNull();
    expect(trigger.querySelector('.c-icon-suffix')).not.toBeNull();
    fixture.componentInstance.label.set('');
    fixture.componentInstance.prefix.set(undefined);
    fixture.detectChanges();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(trigger.classList).toContain('c-square');
    fixture.componentInstance.title.set('Actions');
    fixture.componentInstance.suffix.set(undefined);
    fixture.detectChanges();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(indicator()).not.toBeNull();
    expect(trigger.classList).not.toContain('c-square');
    fixture.destroy();
  });
  it('automatically opens without nesting buttons or submitting, executes once and returns to normal mode', () => {
    TestBed.configureTestingModule({ imports: [Host, NoopAnimationsModule] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('sd-button button');
    expect(trigger.querySelector('sd-button-item')).toBeNull();
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const menu = document.querySelector('[role="menu"]')!;
    expect(menu).not.toBeNull();
    expect(menu.querySelector('[role="separator"]')).not.toBeNull();
    (menu.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.run).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.normal).not.toHaveBeenCalled();
    expect(fixture.componentInstance.submit).not.toHaveBeenCalled();
    expect(document.querySelector('[role="menu"]')).toBeNull();
    fixture.componentInstance.items.set(false);
    fixture.detectChanges();
    trigger.click();
    expect(fixture.componentInstance.normal).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.submit).toHaveBeenCalledTimes(1);
  });
});

describe('SdButton popover interaction and lifecycle', () => {
  let fixture: ComponentFixture<Host>;
  const menu = () => document.querySelector<HTMLElement>('[role="menu"]')!;
  const buttons = () => Array.from(menu().querySelectorAll<HTMLButtonElement>('button'));
  const trigger = () => fixture.nativeElement.querySelector('sd-button button') as HTMLButtonElement;
  const key = (target: HTMLElement, value: string) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
  const open = () => {
    trigger().click();
    fixture.detectChanges();
  };
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host, NoopAnimationsModule] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());

  const hover = (target: HTMLElement, type = 'pointerenter', pointerType = 'mouse') =>
    target.dispatchEvent(new PointerEvent(type, { pointerType }));
  const enableHover = (value: unknown = '') => {
    fixture.componentInstance.hoverOption.set(value);
    fixture.detectChanges();
  };

  it('coerces the hover attribute, ignores touch and preserves focus while bridging the overlay gap', fakeAsync(() => {
    hover(trigger());
    expect(menu()).toBeNull();
    enableHover('false');
    hover(trigger());
    expect(menu()).toBeNull();
    enableHover();
    hover(trigger(), 'pointerenter', 'touch');
    expect(menu()).toBeNull();
    trigger().focus();
    hover(trigger());
    fixture.detectChanges();
    expect(menu()).not.toBeNull();
    expect(document.activeElement).toBe(trigger());
    hover(trigger(), 'pointerleave');
    tick(100);
    hover(menu());
    tick(200);
    expect(menu()).not.toBeNull();
    hover(menu(), 'pointerleave');
    tick(151);
    expect(menu()).toBeNull();
  }));

  it('supports keyboard takeover, Escape and click while hover is enabled', fakeAsync(() => {
    enableHover(true);
    hover(trigger());
    key(trigger(), 'ArrowUp');
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons()[2]);
    hover(trigger(), 'pointerleave');
    tick(200);
    expect(menu()).not.toBeNull();
    key(buttons()[2], 'Escape');
    hover(trigger());
    key(trigger(), 'Escape');
    expect(menu()).toBeNull();
    open();
    buttons()[0].click();
    expect(fixture.componentInstance.run).toHaveBeenCalledTimes(1);
  }));

  it('cleans up hover timers when disabled, items disappear, the option changes or the owner is destroyed', fakeAsync(() => {
    enableHover();
    hover(trigger());
    hover(trigger(), 'pointerleave');
    enableHover(false);
    tick(200);
    expect(menu()).toBeNull();
    enableHover();
    for (const blocked of [fixture.componentInstance.disabled, fixture.componentInstance.loading]) {
      hover(trigger());
      blocked.set(true);
      fixture.detectChanges();
      hover(trigger());
      expect(menu()).toBeNull();
      blocked.set(false);
      fixture.detectChanges();
    }
    fixture.componentInstance.items.set(false);
    fixture.detectChanges();
    hover(trigger());
    expect(menu()).toBeNull();
    fixture.componentInstance.items.set(true);
    fixture.detectChanges();
    hover(trigger());
    hover(trigger(), 'pointerleave');
    fixture.destroy();
    tick(200);
    expect(menu()).toBeNull();
  }));

  it('toggles with an independent chevron and does not allocate an overlay for normal mode', () => {
    const create = spyOn(fixture.debugElement.query(By.directive(SdButton)).injector.get(Overlay), 'create').and.callThrough();
    expect(trigger().querySelector('.c-action-indicator')).not.toBeNull();
    open();
    open();
    expect(menu()).toBeNull();
    fixture.componentInstance.items.set(false);
    fixture.detectChanges();
    expect(trigger().querySelector('.c-action-indicator')).toBeNull();
    trigger().click();
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('navigates enabled items, skips the divider/disabled item, and restores focus on Escape', () => {
    key(trigger(), 'ArrowDown');
    fixture.detectChanges();
    const rows = buttons();
    expect(document.activeElement).toBe(rows[0]);
    key(rows[0], 'ArrowDown');
    expect(document.activeElement).toBe(rows[2]);
    key(rows[2], 'ArrowDown');
    expect(document.activeElement).toBe(rows[0]);
    key(rows[0], 'ArrowUp');
    expect(document.activeElement).toBe(rows[2]);
    key(rows[2], 'Home');
    expect(document.activeElement).toBe(rows[0]);
    key(rows[0], 'End');
    expect(document.activeElement).toBe(rows[2]);
    rows[1].click();
    expect(fixture.componentInstance.run).not.toHaveBeenCalled();
    key(rows[2], 'Escape');
    fixture.detectChanges();
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    key(trigger(), 'ArrowUp');
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons()[2]);
  });

  it('closes on Tab without preventing default traversal', () => {
    open();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    buttons()[0].dispatchEvent(event);
    expect(event.defaultPrevented).toBeFalse();
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('updates semantic color and disabled state while open, then handles zero and added items', () => {
    open();
    const row = buttons()[0];
    expect(row.querySelectorAll('sd-icon').length).toBe(2);
    expect(row.style.getPropertyValue('--sd-action-accent')).toBe('var(--sd-success)');
    fixture.componentInstance.color.set('error');
    fixture.componentInstance.itemDisabled.set(true);
    fixture.detectChanges();
    expect(row.disabled).toBeTrue();
    expect(row.style.getPropertyValue('--sd-action-accent')).toBe('var(--sd-error)');
    expect(document.activeElement).toBe(buttons()[2]);
    fixture.componentInstance.items.set(false);
    fixture.detectChanges();
    expect(menu()).toBeNull();
    expect(trigger().hasAttribute('aria-haspopup')).toBeFalse();
    fixture.componentInstance.items.set(true);
    fixture.detectChanges();
    open();
    expect(buttons().length).toBe(3);
    expect(trigger().querySelector('sd-button-item')).toBeNull();
  });

  it('closes when disabled, loading or the native trigger changes', () => {
    open();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(menu()).toBeNull();
    trigger().click();
    expect(menu()).toBeNull();
    fixture.componentInstance.disabled.set(false);
    fixture.detectChanges();
    open();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(menu()).toBeNull();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    open();
    fixture.componentInstance.variant.set('text');
    fixture.detectChanges();
    expect(menu()).toBeNull();
  });

  it('cleans up on destroy and keeps menus of two buttons independent', () => {
    open();
    const other = TestBed.createComponent(Host);
    other.detectChanges();
    (other.nativeElement.querySelector('sd-button button') as HTMLButtonElement).click();
    other.detectChanges();
    expect(document.querySelectorAll('[role="menu"]').length).toBe(1);
    buttons()[0].click();
    expect(other.componentInstance.run).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.run).not.toHaveBeenCalled();
    other.destroy();
    open();
    fixture.destroy();
    expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
  });

  it('closes outside without stealing focus and closes before a callback opens another surface', () => {
    open();
    const after = fixture.nativeElement.querySelector('#after') as HTMLButtonElement;
    after.focus();
    after.click();
    fixture.detectChanges();
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(after);
    fixture.componentInstance.run.and.callFake(() => after.focus());
    open();
    buttons()[0].click();
    expect(document.activeElement).toBe(after);
  });

  it('does not treat a divider alone as an action', () => {
    const other = TestBed.createComponent(DividerHost);
    other.detectChanges();
    const button: HTMLButtonElement = other.nativeElement.querySelector('button');
    button.click();
    expect(button.hasAttribute('aria-haspopup')).toBeFalse();
    expect(menu()).toBeNull();
    other.destroy();
  });

  it('repositions on document scroll and inherits the surface token', async () => {
    const host: HTMLElement = fixture.nativeElement;
    Object.assign(host.style, { position: 'fixed', top: '40px', left: '80px' });
    open();
    await fixture.whenStable();
    const before = menu().getBoundingClientRect().top;
    host.style.transform = 'translateY(20px)';
    document.dispatchEvent(new Event('scroll'));
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(menu().getBoundingClientRect().top).toBeCloseTo(before + 20, 0);
    menu().style.setProperty('--sd-surface', 'rgb(30, 35, 40)');
    expect(getComputedStyle(menu()).backgroundColor).toBe('rgb(30, 35, 40)');
  });

  it('fits near viewport edges and flips above a trigger at the bottom', async () => {
    const host: HTMLElement = fixture.nativeElement;
    Object.assign(host.style, { position: 'fixed', bottom: '8px', right: '8px' });
    open();
    await fixture.whenStable();
    const bounds = menu().getBoundingClientRect();
    expect(bounds.bottom).toBeLessThanOrEqual(trigger().getBoundingClientRect().top);
    expect(bounds.left).toBeGreaterThanOrEqual(7);
    expect(bounds.right).toBeLessThanOrEqual(innerWidth - 7);
    expect(bounds.top).toBeGreaterThanOrEqual(7);
  });

  it('keeps all markers out of the trigger for multi-root conditional children', () => {
    expect(fixture.debugElement.query(By.directive(SdButton)).componentInstance.hasActions()).toBeTrue();
    expect(trigger().textContent).toContain('Actions');
    expect(trigger().querySelector('sd-button-item, sd-button-item-divider, button')).toBeNull();
  });
});
