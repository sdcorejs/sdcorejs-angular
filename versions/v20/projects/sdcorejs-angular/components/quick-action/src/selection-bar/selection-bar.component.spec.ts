import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSelectionBar } from './selection-bar.component';
import { SdSelectionBarAction, SdSelectionBarActionNormal } from './selection-bar.model';

/** ResizeObserver giả: test tự báo bề rộng, không phụ thuộc layout thật của Karma. */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  readonly targets: Element[] = [];
  disconnected = false;

  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.push(target);
  }

  unobserve(): void {}

  disconnect(): void {
    this.disconnected = true;
  }

  emit(width: number): void {
    this.callback([{ contentRect: { width } } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
}

@Component({
  standalone: true,
  imports: [SdSelectionBar],
  template: `
    <sd-selection-bar
      [opened]="opened()"
      [message]="message()"
      [actions]="actions()"
      [autoId]="autoId()"
      [actionAutoIdPrefix]="prefix()"
      (action)="ran.push($event)"
      (clear)="cleared = cleared + 1" />
  `,
})
class BarHostComponent {
  readonly opened = signal(true);
  readonly message = signal('Đã chọn 2 mục');
  readonly autoId = signal<string | null>('components-table-orders');
  readonly prefix = signal('action');
  readonly actions = signal<SdSelectionBarAction[]>(
    ['Duyệt', 'Xuất', 'Gán nhãn', 'Xoá'].map(title => ({ variant: 'normal', title, icon: 'check', click: () => undefined }))
  );
  readonly ran: SdSelectionBarActionNormal[] = [];
  cleared = 0;
}

describe('ɵSdSelectionBar', () => {
  let fixture: ComponentFixture<BarHostComponent>;
  let host: HTMLElement;
  let component: BarHostComponent;
  const nativeObserver = window.ResizeObserver;

  const create = async () => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, BarHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(BarHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement;
  };
  const bar = () => host.querySelector<HTMLElement>('sd-selection-bar')!;
  const overlay = () => TestBed.inject(OverlayContainer).getContainerElement();

  beforeEach(() => {
    FakeResizeObserver.instances = [];
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
  });
  afterEach(() => {
    window.ResizeObserver = nativeObserver;
    document.documentElement.style.removeProperty('--sd-primary-light');
    document.documentElement.style.removeProperty('--sd-primary');
  });

  it('SB-01 contained frame, 13/20 message and a primary icon cell', async () => {
    document.documentElement.style.setProperty('--sd-primary-light', 'rgb(1, 2, 3)');
    document.documentElement.style.setProperty('--sd-primary', 'rgb(4, 5, 6)');
    await create();

    const frame = host.querySelector<HTMLElement>('.c-quick-action.contained')!;
    const frameStyle = getComputedStyle(frame);
    expect(frameStyle.position).toBe('relative');
    expect(frameStyle.boxShadow).toBe('none');
    expect(frameStyle.borderTopWidth).toBe('1px');
    expect(frameStyle.borderTopLeftRadius).toBe('10px');
    expect(frameStyle.paddingTop).toBe('10px');
    expect(frameStyle.paddingLeft).toBe('12px');
    expect(frameStyle.marginTop).toBe('8px');
    expect(frameStyle.columnGap).toBe('16px');

    const message = host.querySelector<HTMLElement>('.sd-selection-message')!;
    expect(message.querySelector(':scope > span:last-child')!.textContent!.trim()).toBe('Đã chọn 2 mục');
    expect(message.getAttribute('role')).toBe('status');
    expect(getComputedStyle(message).fontSize).toBe('13px');
    expect(getComputedStyle(message).lineHeight).toBe('20px');

    const icon = host.querySelector<HTMLElement>('.sd-selection-icon')!;
    const iconStyle = getComputedStyle(icon);
    expect(icon.getBoundingClientRect().width).toBe(28);
    expect(icon.getBoundingClientRect().height).toBe(28);
    expect(iconStyle.borderTopLeftRadius).toBe('8px');
    expect(iconStyle.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(iconStyle.color).toBe('rgb(4, 5, 6)');
    expect(icon.querySelector('sd-icon')!.textContent!.trim()).toBe('check_circle_outline');
    expect(getComputedStyle(icon.querySelector('sd-icon')!).fontSize).toBe('18px');
  });

  it('SB-01 renders nothing while closed', async () => {
    await create();
    component.opened.set(false);
    fixture.detectChanges();
    expect(host.querySelector('.c-quick-action')).toBeNull();
    expect(bar().getBoundingClientRect().height).toBe(0);
  });

  it('SB-01 autoIds: actions by prefix and index, the "more" button and the clear button', async () => {
    await create();
    const ids = () => Array.from(host.querySelectorAll('[data-autoid]')).map(element => element.getAttribute('data-autoid'));
    expect(ids()).toEqual([
      'components-button-components-table-orders-action-0',
      'components-button-components-table-orders-action-1',
      'components-button-components-table-orders-more-actions',
      'components-button-components-table-orders-clear-selection',
    ]);

    component.autoId.set('components-tree-menu');
    component.prefix.set('selection-action');
    fixture.detectChanges();
    expect(ids().slice(0, 2)).toEqual([
      'components-button-components-tree-menu-selection-action-0',
      'components-button-components-tree-menu-selection-action-1',
    ]);
    expect(ids()[3]).toBe('components-button-components-tree-menu-clear-selection');

    component.autoId.set(null);
    fixture.detectChanges();
    expect(ids()).toEqual([]);
  });

  it('SB-03 lays out narrow from its own width, not from the viewport', async () => {
    await create();
    const observer = FakeResizeObserver.instances[0];
    expect(observer.targets).toEqual([bar()]);
    expect(bar().classList).not.toContain('sd-selection-bar--narrow');

    observer.emit(599);
    fixture.detectChanges();
    expect(bar().classList).toContain('sd-selection-bar--narrow');

    const frame = getComputedStyle(host.querySelector('.c-quick-action.contained')!);
    expect(frame.flexWrap).toBe('wrap');
    expect(frame.rowGap).toBe('8px');
    expect(getComputedStyle(host.querySelector('.sd-selection-message')!).paddingRight).toBe('36px');
    const clear = host.querySelector<HTMLElement>('.sd-selection-clear')!;
    expect(getComputedStyle(clear).position).toBe('absolute');
    expect(clear.getBoundingClientRect().width).toBe(40);
    expect(clear.getBoundingClientRect().height).toBe(40);
    const frameBox = host.querySelector('.c-quick-action.contained')!.getBoundingClientRect();
    expect(clear.getBoundingClientRect().right).toBeLessThanOrEqual(frameBox.right);
    expect(clear.getBoundingClientRect().top - frameBox.top).toBeLessThan(8);
    const button = host.querySelector<HTMLElement>('.sd-selection-direct button')!;
    expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);

    observer.emit(600);
    fixture.detectChanges();
    expect(bar().classList).not.toContain('sd-selection-bar--narrow');
    expect(getComputedStyle(clear).position).toBe('static');

    // A hidden or detached bar reports 0: that is not "narrow".
    observer.emit(0);
    fixture.detectChanges();
    expect(bar().classList).not.toContain('sd-selection-bar--narrow');

    fixture.destroy();
    expect(observer.disconnected).toBeTrue();
  });

  it('SB-03 the viewport media query is gone', async () => {
    await create();
    const rules = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules))
      .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule)
      .filter(rule => Array.from(rule.cssRules).some(inner => (inner as CSSStyleRule).selectorText?.includes('sd-selection')));
    expect(rules).toEqual([]);
  });

  it('SB-03 works without ResizeObserver', async () => {
    delete (window as unknown as { ResizeObserver?: unknown }).ResizeObserver;
    await expectAsync(create()).toBeResolved();
    expect(bar().classList).not.toContain('sd-selection-bar--narrow');
    expect(host.querySelector('.c-quick-action.contained')).not.toBeNull();
    expect(() => fixture.destroy()).not.toThrow();
  });

  it('SB-04 two actions stay direct, the rest go under "more", and every one emits itself', async () => {
    await create();
    const actions = component.actions();
    const direct = Array.from(host.querySelectorAll<HTMLElement>('.sd-selection-direct'));
    expect(direct.map(element => element.querySelector('.c-title')!.textContent!.trim())).toEqual(['Duyệt', 'Xuất']);

    const more = host.querySelector<HTMLElement>('.sd-selection-more')!;
    expect(more.querySelector('.c-icon-suffix')!.textContent!.trim()).toBe('more_horiz');
    expect(more.querySelector('button')!.classList).toContain('c-light');

    direct[1].querySelector('button')!.click();
    more.querySelector('button')!.click();
    fixture.detectChanges();
    const items = Array.from(overlay().querySelectorAll<HTMLButtonElement>('.sd-action-item'));
    expect(items.map(item => item.querySelector('.sd-action-label')!.textContent!.trim())).toEqual(['Gán nhãn', 'Xoá']);
    items[1].click();

    expect(component.ran).toEqual([actions[1] as SdSelectionBarActionNormal, actions[3] as SdSelectionBarActionNormal]);
  });

  it('SB-04 two actions or fewer need no "more" button; a group opens its own menu', async () => {
    await create();
    const child: SdSelectionBarActionNormal = { variant: 'normal', title: 'PDF', click: () => undefined };
    component.actions.set([{ variant: 'children', title: 'Xuất', children: [child] }, component.actions()[0]]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.sd-selection-more')).toBeNull();
    const group = host.querySelector<HTMLButtonElement>('.sd-selection-direct button')!;
    expect(group.getAttribute('aria-haspopup')).toBe('menu');
    group.click();
    fixture.detectChanges();
    overlay().querySelector<HTMLButtonElement>('.sd-action-item')!.click();
    expect(component.ran).toEqual([child]);
  });

  it('SB-04 the clear button is named and emits clear', async () => {
    await create();
    const clear = host.querySelector<HTMLButtonElement>('.sd-selection-clear')!;
    expect(clear.getAttribute('aria-label')).toBeTruthy();
    clear.click();
    expect(component.cleared).toBe(1);
  });
});
