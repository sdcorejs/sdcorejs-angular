import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { SdLoadingService } from '@sdcorejs/angular/services';
import { SdModalResizable } from './modal-resizable.component';
import { SdModalResizableRegistry } from './modal-resizable.registry';

describe('SdModalResizable', () => {
  let fixture: ComponentFixture<SdModalResizable>;
  let component: SdModalResizable;
  let loading: { start: jasmine.Spy; stop: jasmine.Spy };
  let loadingRefs: { closed: boolean; close: jasmine.Spy }[];
  let registry: SdModalResizableRegistry;
  const createdElements: HTMLElement[] = [];
  let panelSeq = 0;

  /**
   * Panel giả lập một instance <sd-modal-resizable> KHÁC đang sống: có id và đã đăng ký
   * vào registry, đúng như panel thật do component tạo qua portal.
   */
  function addPanel(classes = '', width?: number): HTMLElement {
    const panel = addForeignPanel(classes, width);
    registry.register(panel.id);
    return panel;
  }

  /** Panel KHÔNG thuộc library: cùng class `.modal-resizable` nhưng không đăng ký registry. */
  function addForeignPanel(classes = '', width?: number): HTMLElement {
    const panel = document.createElement('div');
    panel.id = `spec-panel-${++panelSeq}`;
    panel.className = `modal-resizable ${classes}`.trim();
    if (width !== undefined) panel.dataset['width'] = String(width);
    document.body.appendChild(panel);
    createdElements.push(panel);
    return panel;
  }

  beforeEach(() => {
    loadingRefs = [];
    loading = {
      start: jasmine.createSpy('start').and.callFake(() => {
        const ref = { closed: false, close: jasmine.createSpy('close') };
        ref.close.and.callFake(() => {
          ref.closed = true;
        });
        loadingRefs.push(ref);
        return ref;
      }),
      stop: jasmine.createSpy('stop'),
    };
    TestBed.configureTestingModule({
      imports: [SdModalResizable],
      providers: [{ provide: SdLoadingService, useValue: loading }],
    });
    registry = TestBed.inject(SdModalResizableRegistry);
    fixture = TestBed.createComponent(SdModalResizable);
    component = fixture.componentInstance;
    // Flush afterNextRender in every test so no portal callback survives a
    // destroyed fixture and keeps the full Karma run alive.
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    createdElements.forEach(element => element.remove());
    createdElements.length = 0;
  });

  it('attaches its template portal to the document render surface', async () => {
    await fixture.whenStable();

    expect(document.getElementById(component.id)).not.toBeNull();
  });

  it('opens its panel, captures the rendered width, and maximizes it', fakeAsync(() => {
    const panel = document.getElementById(component.id)!;
    panel.classList.add('c-closed');
    Object.defineProperty(panel, 'offsetWidth', { configurable: true, value: 480 });

    component.open();
    expect(component.isOpened()).toBeTrue();
    expect(component.isMinimum()).toBeFalse();

    tick(100);
    expect(panel.dataset['width']).toBe('480');
    expect(panel.classList).not.toContain('c-closed');
    tick(100);
    expect(panel.style.width).toBe('480px');
    expect(panel.style.right).toBe('8px');
  }));

  it('closes, resets and stops loading its panel', fakeAsync(() => {
    const panel = document.getElementById(component.id)!;
    panel.classList.add('c-minium');
    panel.dataset['width'] = '480';
    panel.style.width = '480px';
    component.isOpened.set(true);
    component.startLoading();

    component.close();
    expect(component.isOpened()).toBeFalse();
    expect(component.isLoading()).toBeFalse();
    expect(loadingRefs[0].closed).toBeTrue();

    tick(100);
    expect(panel.style.width).toBe('0px');
    expect(panel.style.right).toBe('0px');
    expect(panel.classList).not.toContain('c-minium');
    expect(panel.classList).toContain('c-closed');
    tick(100);
  }));

  it('minimizes, restores and toggles fullscreen while arranging all visible panels', fakeAsync(() => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1200);
    spyOnProperty(document.documentElement, 'clientWidth', 'get').and.returnValue(1200);
    const minimized = addPanel('c-minium', 700);
    const normal = addPanel('', 420);
    const fullscreen = addPanel('c-fullscreen', 640);
    const closed = addPanel('c-closed', 900);
    const pending = addPanel();

    component.minimize();
    expect(component.isMinimum()).toBeTrue();
    tick(200);
    expect(minimized.style.width).toBe('300px');
    expect(minimized.style.right).toBe('8px');
    expect(normal.style.width).toBe('420px');
    expect(normal.style.right).toBe('316px');
    expect(fullscreen.style.width).toBe('calc(100% - 16px)');
    expect(fullscreen.style.right).toBe('8px');
    expect(closed.style.width).toBe('');
    expect(pending.style.width).toBe('');

    component.maximize();
    expect(component.isMinimum()).toBeFalse();
    component.toggleMaximum();
    expect(component.isMaximum()).toBeTrue();
    component.toggleMaximum();
    expect(component.isMaximum()).toBeFalse();
    tick(200);
  }));

  it('starts and stops scoped loading exactly through the loading service', () => {
    component.open();
    component.startLoading();
    expect(component.isLoading()).toBeTrue();
    expect(loading.start).toHaveBeenCalledWith(`#${component.id} .modal-resizable__body`);
    expect(loadingRefs[0].closed).toBeFalse();

    component.stopLoading();
    expect(component.isLoading()).toBeFalse();
    expect(loadingRefs[0].closed).toBeTrue();
    expect(loadingRefs[0].close).toHaveBeenCalledTimes(1);
    expect(loading.stop).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Teardown: timers hẹn giờ không được chạy sau khi component đã destroy
  // -------------------------------------------------------------------------

  it('drops the pending open() timer when the component is destroyed mid-flight', fakeAsync(() => {
    const panel = document.getElementById(component.id)!;
    panel.classList.add('c-closed');
    Object.defineProperty(panel, 'offsetWidth', { configurable: true, value: 480 });

    component.open();
    fixture.destroy();
    panel.dataset['width'] = 'released';
    panel.classList.add('c-closed');
    tick(200);

    // why: không còn timer ghi DOM sau destroy; chỉ kiểm tra node đã tháo thay vì thời điểm animation.
    expect(panel.dataset['width']).toBe('released');
    expect(panel.classList).toContain('c-closed');
  }));

  it('drops the pending close()/arrange timers when the component is destroyed mid-flight', fakeAsync(() => {
    const sibling = addPanel('', 420);
    component.isOpened.set(true);

    component.close();
    fixture.destroy();
    sibling.style.width = '123px';
    sibling.style.right = '42px';
    tick(200);

    expect(sibling.style.width).toBe('123px');
    expect(sibling.style.right).toBe('42px');
  }));

  it('stops arranging a destroyed instance panel for the instances that survive it', fakeAsync(() => {
    const survivor = addPanel('', 420);
    const ownPanel = document.getElementById(component.id)!;
    ownPanel.dataset['width'] = '300';

    fixture.destroy();
    tick(200);

    // Instance đã destroy phải rời registry → panel của nó không còn chiếm chỗ trong stack.
    expect(registry.panels()).not.toContain(ownPanel);
    expect(registry.panels()).toEqual([survivor]);
  }));

  // -------------------------------------------------------------------------
  // Scoping: chỉ chạm panel do library sở hữu
  // -------------------------------------------------------------------------

  it('leaves .modal-resizable elements it does not own untouched', fakeAsync(() => {
    const foreign = addForeignPanel('', 420);

    component.maximize();
    tick(200);

    // Trước đây querySelectorAll('.modal-resizable') ghi đè width/right lên cả phần tử này.
    expect(foreign.style.width).toBe('');
    expect(foreign.style.right).toBe('');
  }));

  it('toggles editing and publishes focus state', () => {
    const changed = jasmine.createSpy('changed');
    component.editingChanged.subscribe(changed);

    component.toggleEditable();
    expect(component.isEditing()).toBeTrue();
    expect(changed).toHaveBeenCalledWith(true);
    component.toggleEditable();
    expect(component.isEditing()).toBeFalse();
    expect(changed).toHaveBeenCalledWith(false);

    component.onFocus();
    expect(component.isHover()).toBeTrue();
    component.onBlur();
    expect(component.isHover()).toBeFalse();
  });

  it('reopens a minimized panel before the pending close callback without hiding it', fakeAsync(() => {
    const panel = document.getElementById(component.id)!;
    Object.defineProperty(panel, 'offsetWidth', { configurable: true, value: 480 });
    component.open();
    tick(200);
    component.minimize();
    tick(200);
    component.close();
    component.open();
    tick(300);
    expect(component.isOpened()).toBeTrue();
    expect(component.isMinimum()).toBeFalse();
    expect(panel.classList).not.toContain('c-closed');
    expect(panel.style.width).not.toBe('0px');
  }));

  it('keeps a closed minimized panel out of the remaining stack', fakeAsync(() => {
    const closed = addPanel('c-closed c-minium', 300);
    const visible = addPanel('', 420);
    component.maximize();
    tick(200);
    expect(closed.style.width).toBe('');
    expect(visible.style.right).toBe('8px');
  }));

  it('clamps wide and stacked panels to a small viewport', fakeAsync(() => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
    const first = addPanel('', 600);
    const second = addPanel('', 480);
    component.maximize();
    tick(200);
    for (const panel of [first, second]) {
      expect(Number.parseFloat(panel.style.width)).toBeLessThanOrEqual(374);
      expect(Number.parseFloat(panel.style.right)).toBeGreaterThanOrEqual(8);
      expect(Number.parseFloat(panel.style.width) + Number.parseFloat(panel.style.right)).toBeLessThanOrEqual(382);
    }
  }));

  it('reflows surviving panels immediately when an instance is destroyed', fakeAsync(() => {
    const own = document.getElementById(component.id)!;
    Object.defineProperty(own, 'offsetWidth', { configurable: true, value: 480 });
    component.open();
    const survivor = addPanel('', 300);
    tick(200);
    fixture.destroy();
    expect(survivor.style.right).toBe('8px');
  }));

  it('rearranges on viewport resize and removes the listener on destroy', fakeAsync(() => {
    const width = spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1200);
    const sibling = addPanel('', 600);
    component.maximize();
    tick(200);
    width.and.returnValue(390);
    window.dispatchEvent(new Event('resize'));
    tick(200);
    expect(sibling.style.width).toBe('374px');
    fixture.destroy();
    sibling.style.width = '123px';
    window.dispatchEvent(new Event('resize'));
    tick(200);
    expect(sibling.style.width).toBe('123px');
  }));

  it('exposes a named nonmodal dialog and keeps page controls reachable', fakeAsync(() => {
    component.open();
    tick(200);
    const panel = document.getElementById(component.id)!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('false');
    const heading = document.getElementById(panel.getAttribute('aria-labelledby') || '');
    expect(heading?.textContent?.trim()).toBeTruthy();
    expect(panel.querySelectorAll('sd-button')).toHaveSize(3);
    expect(panel.querySelector('[cdkTrapFocus]')).toBeNull();
  }));

  it('returns focus to the opener when closing from inside the panel', fakeAsync(() => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    createdElements.push(opener);
    opener.focus();
    component.open();
    tick(200);
    const panel = document.getElementById(component.id)!;
    expect(panel.contains(document.activeElement)).toBeTrue();
    component.close();
    expect(document.activeElement).toBe(opener);
    tick(200);
  }));

  it('does not steal focus back after the user has returned to the page', fakeAsync(() => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    createdElements.push(outside);
    component.open();
    tick(200);
    outside.focus();
    component.close();
    expect(document.activeElement).toBe(outside);
    tick(200);
  }));

  it('releases the scoped loading contribution when a loading panel is destroyed', () => {
    component.open();
    component.startLoading();
    fixture.destroy();
    expect(loadingRefs[0].close).toHaveBeenCalled();
    expect(loading.stop).not.toHaveBeenCalled();
  });

  it('uses the current requested width after reopening instead of a collapsed measurement', fakeAsync(() => {
    const panel = document.getElementById(component.id)!;
    Object.defineProperty(panel, 'offsetWidth', { configurable: true, get: () => Number.parseFloat(panel.style.width) || 0 });
    component.open();
    tick(200);
    component.close();
    tick(200);
    fixture.componentRef.setInput('width', '520px');
    fixture.detectChanges();
    component.open();
    tick(200);
    expect(panel.style.width).toBe('520px');
  }));

  it('opens correctly when open-close-open happens before the portal is attached', fakeAsync(() => {
    const early = TestBed.createComponent(SdModalResizable);
    early.componentInstance.open();
    early.componentInstance.close();
    early.componentInstance.open();
    early.detectChanges();
    tick(300);
    const panel = document.getElementById(early.componentInstance.id)!;
    expect(panel.classList).not.toContain('c-closed');
    expect(panel.style.width).not.toBe('0px');
    early.destroy();
  }));

  it('honors live width changes and restores requested width after fullscreen', fakeAsync(() => {
    const panel = document.getElementById(component.id)!;
    Object.defineProperty(panel, 'offsetWidth', { configurable: true, get: () => Number.parseFloat(panel.style.width) || 0 });
    component.open();
    tick(200);
    fixture.componentRef.setInput('width', '520px');
    fixture.detectChanges();
    tick(200);
    expect(panel.style.width).toBe('520px');
    component.toggleMaximum();
    tick(200);
    component.toggleMaximum();
    tick(200);
    expect(panel.style.width).toBe('520px');
  }));

  it('supports an explicit title, description relationship and standard autoId', fakeAsync(() => {
    fixture.componentRef.setInput('title', 'Order details');
    fixture.componentRef.setInput('ariaDescribedBy', 'order-help');
    fixture.componentRef.setInput('autoId', 'order');
    component.open();
    tick(200);
    const panel = document.getElementById(component.id)!;
    // Direct construction has no legacy selector host; explicit legacy markup keeps its old prefix.
    expect(panel.getAttribute('data-autoid')).toBe('components-window-order');
    expect(panel.getAttribute('aria-describedby')).toBe('order-help');
    expect(document.getElementById(panel.getAttribute('aria-labelledby')!)?.textContent).toContain('Order details');
    expect(Array.from(panel.querySelectorAll('button')).every(button => !!button.getAttribute('aria-label'))).toBeTrue();
  }));

  it('keeps Escape opt-in and respects a nested control that consumes it', fakeAsync(() => {
    component.open();
    tick(200);
    const panel = document.getElementById(component.id)!;
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(component.isOpened()).toBeTrue();
    fixture.componentRef.setInput('disableEscapeClose', false);
    fixture.detectChanges();
    const consumed = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    consumed.preventDefault();
    panel.dispatchEvent(consumed);
    expect(component.isOpened()).toBeTrue();
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(component.isOpened()).toBeFalse();
    tick(200);
  }));

  it('moves focus out of content before minimizing or making it inert during loading', fakeAsync(() => {
    component.open();
    tick(200);
    const panel = document.getElementById(component.id)!;
    const body = panel.querySelector<HTMLElement>('.modal-resizable__body')!;
    const field = document.createElement('input');
    body.appendChild(field);
    field.focus();
    component.minimize();
    expect(panel.querySelector('.modal-resizable__header')!.contains(document.activeElement)).toBeTrue();
    component.maximize();
    field.focus();
    component.startLoading();
    expect(body.hasAttribute('inert')).toBeTrue();
    expect(panel.querySelector('.modal-resizable__header')!.contains(document.activeElement)).toBeTrue();
    component.stopLoading();
    expect(body.hasAttribute('inert')).toBeFalse();
    tick(200);
  }));

  it('closes only its owned loading ref and leaves another caller contribution alive', () => {
    component.open();
    const selector = `#${component.id} .modal-resizable__body`;
    const consumerRef = loading.start(selector);
    component.startLoading();
    const ownRef = loadingRefs[1];
    component.stopLoading();
    expect(ownRef.close).toHaveBeenCalled();
    expect(consumerRef.close).not.toHaveBeenCalled();
    expect(loading.stop).not.toHaveBeenCalled();
  });

  it('queues pre-open loading and attaches it only when the body exists', () => {
    component.startLoading();
    expect(component.isLoading()).toBeTrue();
    expect(loading.start).not.toHaveBeenCalled();
    component.open();
    expect(loading.start).toHaveBeenCalledWith(`#${component.id} .modal-resizable__body`);
    fixture.destroy();
    expect(loadingRefs[0].close).toHaveBeenCalled();
  });

  it('does not raise an overlapping window on hover over the keyboard-focused window', () => {
    component.open();
    const foreground = addPanel('', 480);
    const control = document.createElement('button');
    foreground.appendChild(control);
    registry.activate(foreground.id);
    control.focus();
    document.getElementById(component.id)!.dispatchEvent(new MouseEvent('mouseenter'));
    expect(foreground.style.zIndex).toBe('var(--sd-z-drawer, 999)');
    expect(document.getElementById(component.id)!.style.zIndex).toBe('var(--sd-z-backdrop, 998)');
    expect(document.activeElement).toBe(control);
    document.getElementById(component.id)!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(document.activeElement).toBe(document.getElementById(component.id));
    expect(document.getElementById(component.id)!.style.zIndex).toBe('var(--sd-z-drawer, 999)');
  });

  it('uses the visible document width when a scrollbar reduces the layout viewport', () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
    spyOnProperty(document.documentElement, 'clientWidth', 'get').and.returnValue(375);
    const panel = addPanel('', 600);
    registry.arrange();
    expect(panel.style.width).toBe('359px');
    expect(panel.style.right).toBe('8px');
  });

  it('minimizes only when its surface obscures a newly focused page control', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    createdElements.push(outside);
    const panel = document.getElementById(component.id)!;
    spyOn(outside, 'getBoundingClientRect').and.returnValue(new DOMRect(20, 20, 100, 32));
    spyOn(panel, 'getBoundingClientRect').and.returnValue(new DOMRect(8, 8, 1000, 700));
    const hit = spyOn(document, 'elementFromPoint').and.returnValue(outside);
    component.open();
    component.toggleMaximum();
    outside.focus();
    expect(component.isMinimum()).toBeFalse();
    component.open();
    hit.and.returnValue(panel);
    outside.focus();
    expect(component.isMinimum()).toBeTrue();
    expect(component.isMaximum()).toBeTrue();
    expect(document.activeElement).toBe(outside);
    component.maximize();
    component.open();
    fixture.destroy();
    outside.focus();
    expect(component.isMinimum()).toBeFalse();
  });

  it('reveals page focus through two overlapping windows regardless of listener order', () => {
    const second = TestBed.createComponent(SdModalResizable);
    second.detectChanges();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    createdElements.push(outside);
    const firstPanel = document.getElementById(component.id)!;
    const secondPanel = document.getElementById(second.componentInstance.id)!;
    for (const panel of [firstPanel, secondPanel]) {
      spyOn(panel, 'getBoundingClientRect').and.returnValue(new DOMRect(8, 8, 1000, 700));
    }
    spyOn(outside, 'getBoundingClientRect').and.returnValue(new DOMRect(20, 20, 100, 32));
    spyOn(document, 'elementFromPoint').and.callFake(() =>
      !second.componentInstance.isMinimum() ? secondPanel : !component.isMinimum() ? firstPanel : outside
    );
    component.open();
    second.componentInstance.open();
    outside.focus();
    expect(component.isMinimum()).toBeTrue();
    expect(second.componentInstance.isMinimum()).toBeTrue();
    expect(document.activeElement).toBe(outside);
    second.destroy();
  });

  it('moves an obscuring minimized strip to the other edge and resets docking on restore', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    createdElements.push(outside);
    const panel = document.getElementById(component.id)!;
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(1000);
    spyOnProperty(document.documentElement, 'clientHeight', 'get').and.returnValue(1000);
    spyOn(outside, 'getBoundingClientRect').and.returnValue(new DOMRect(20, 960, 100, 32));
    spyOn(panel, 'getBoundingClientRect').and.callFake(
      () => new DOMRect(8, panel.classList.contains('modal-resizable--top') ? 8 : 952, 300, 48)
    );
    spyOn(document, 'elementFromPoint').and.returnValue(panel);
    component.open();
    component.minimize();
    outside.focus();
    expect(panel.classList).toContain('modal-resizable--top');
    expect(component.isMinimum()).toBeTrue();
    expect(document.activeElement).toBe(outside);
    component.maximize();
    expect(panel.classList).not.toContain('modal-resizable--top');
  });

  it('reveals bottom-page focus after minimizing two covering normal windows', () => {
    const second = TestBed.createComponent(SdModalResizable);
    second.detectChanges();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    createdElements.push(outside);
    const panels = [document.getElementById(component.id)!, document.getElementById(second.componentInstance.id)!];
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(1000);
    spyOnProperty(document.documentElement, 'clientHeight', 'get').and.returnValue(1000);
    for (const panel of panels) {
      spyOn(panel, 'getBoundingClientRect').and.callFake(() =>
        panel.classList.contains('c-minium')
          ? new DOMRect(8, panel.classList.contains('modal-resizable--top') ? 8 : 952, 300, 48)
          : new DOMRect(8, 80, 1000, 920)
      );
    }
    spyOn(outside, 'getBoundingClientRect').and.returnValue(new DOMRect(20, 960, 100, 32));
    spyOn(document, 'elementFromPoint').and.callFake(
      () => [...panels].reverse().find(panel => !panel.classList.contains('modal-resizable--top')) ?? outside
    );
    component.open();
    second.componentInstance.open();
    outside.focus();
    expect(panels.every(panel => panel.classList.contains('c-minium') && panel.classList.contains('modal-resizable--top'))).toBeTrue();
    expect(document.activeElement).toBe(outside);
    second.destroy();
  });

  it('reveals existing page focus when viewport resize moves a window over it', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    createdElements.push(outside);
    const panel = document.getElementById(component.id)!;
    const width = spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1500);
    const layout = spyOnProperty(document.documentElement, 'clientWidth', 'get').and.returnValue(1500);
    spyOn(outside, 'getBoundingClientRect').and.returnValue(new DOMRect(200, 200, 100, 32));
    spyOn(panel, 'getBoundingClientRect').and.callFake(() =>
      component.isMinimum() ? new DOMRect(8, 950, 300, 50) : new DOMRect(window.innerWidth === 1500 ? 1012 : 8, 80, 480, 920)
    );
    spyOn(document, 'elementFromPoint').and.callFake(() => (window.innerWidth === 1500 || component.isMinimum() ? outside : panel));
    component.open();
    outside.focus();
    expect(component.isMinimum()).toBeFalse();
    width.and.returnValue(390);
    layout.and.returnValue(390);
    window.dispatchEvent(new Event('resize'));
    expect(component.isMinimum()).toBeTrue();
    expect(document.activeElement).toBe(outside);
  });

  it('keeps a localized loading status exposed outside inert content', () => {
    component.open();
    component.startLoading();
    const panel = document.getElementById(component.id)!;
    const status = document.getElementById(`${component.id}-status`);
    expect(status).not.toBeNull();
    expect(status?.closest('[inert], [aria-hidden="true"]')).toBeNull();
    expect(status?.textContent?.trim()).toBeTruthy();
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(panel.hasAttribute('aria-busy')).toBeTrue();
    expect(status?.closest('[aria-busy="true"]')).toBeNull();
    component.stopLoading();
    expect(status?.textContent?.trim()).toBe('');
  });

  it('selects an already open window without replacing its original opener or resetting modes', () => {
    const opener = document.createElement('button');
    const selectWindow = document.createElement('button');
    document.body.appendChild(opener);
    document.body.appendChild(selectWindow);
    createdElements.push(opener, selectWindow);
    opener.focus();
    component.open();
    component.minimize();
    selectWindow.focus();
    component.open();
    expect(component.isMinimum()).toBeTrue();
    expect(document.activeElement).toBe(document.getElementById(component.id));
    component.close();
    expect(document.activeElement).toBe(opener);
  });
});
