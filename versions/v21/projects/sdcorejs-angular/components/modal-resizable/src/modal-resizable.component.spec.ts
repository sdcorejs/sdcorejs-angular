import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { SdLoadingService } from '@sdcorejs/angular/services';
import { SdModalResizable } from './modal-resizable.component';

describe('SdModalResizable', () => {
  let fixture: ComponentFixture<SdModalResizable>;
  let component: SdModalResizable;
  let loading: { start: jasmine.Spy; stop: jasmine.Spy };
  const createdElements: HTMLElement[] = [];

  function addPanel(classes = '', width?: number): HTMLElement {
    const panel = document.createElement('div');
    panel.className = `modal-resizable ${classes}`.trim();
    if (width !== undefined) panel.dataset['width'] = String(width);
    document.body.appendChild(panel);
    createdElements.push(panel);
    return panel;
  }

  beforeEach(() => {
    loading = { start: jasmine.createSpy('start'), stop: jasmine.createSpy('stop') };
    TestBed.configureTestingModule({
      imports: [SdModalResizable],
      providers: [{ provide: SdLoadingService, useValue: loading }],
    });
    fixture = TestBed.createComponent(SdModalResizable);
    component = fixture.componentInstance;
    // Flush afterNextRender in every test so no portal callback survives a
    // destroyed fixture and keeps the full Karma run alive.
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    createdElements.forEach(element => element.remove());
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
    expect(panel.style.right).toBe('0px');
  }));

  it('closes, resets and stops loading its panel', fakeAsync(() => {
    const panel = document.getElementById(component.id)!;
    panel.classList.add('c-minium');
    panel.dataset['width'] = '480';
    panel.style.width = '480px';
    component.isOpened.set(true);
    component.isLoading.set(true);

    component.close();
    expect(component.isOpened()).toBeFalse();
    expect(component.isLoading()).toBeFalse();
    expect(loading.stop).toHaveBeenCalledWith(`#${component.id}`);

    tick(100);
    expect(panel.style.width).toBe('0px');
    expect(panel.style.right).toBe('0px');
    expect(panel.classList).not.toContain('c-minium');
    expect(panel.classList).toContain('c-closed');
    tick(100);
  }));

  it('minimizes, restores and toggles fullscreen while arranging all visible panels', fakeAsync(() => {
    const minimized = addPanel('c-minium', 700);
    const normal = addPanel('', 420);
    const fullscreen = addPanel('c-fullscreen', 640);
    const closed = addPanel('c-closed', 900);
    const pending = addPanel();

    component.minimize();
    expect(component.isMinimum()).toBeTrue();
    tick(200);
    expect(minimized.style.width).toBe('300px');
    expect(minimized.style.right).toBe('308px');
    expect(normal.style.width).toBe('420px');
    expect(normal.style.right).toBe('616px');
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
    component.startLoading();
    expect(component.isLoading()).toBeTrue();
    expect(loading.stop).toHaveBeenCalledWith(`#${component.id}`);
    expect(loading.start).toHaveBeenCalledWith(`#${component.id}`);

    component.stopLoading();
    expect(component.isLoading()).toBeFalse();
    expect(loading.stop).toHaveBeenCalledTimes(2);
  });

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
});
