import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdStorageService } from '../../../services/storage';
import { SdSplitterComponent } from './splitter.component';
import { SdSplitterPanelComponent } from './splitter-panel/splitter-panel.component';
import { SplitterLayoutState } from './splitter.models';

function dispatchPointer(target: EventTarget, type: string, init: Partial<PointerEventInit>) {
  const ev = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', ...init });
  target.dispatchEvent(ev);
}

@Component({
  standalone: true,
  imports: [SdSplitterComponent, SdSplitterPanelComponent],
  template: `
    <sd-splitter [storageKey]="storageKey()" [disabled]="disabled()" style="width:400px;height:200px;">
      <sd-splitter-panel panelId="a" size="200" unit="px" minSize="50" collapsible>A</sd-splitter-panel>
      <sd-splitter-panel panelId="b" size="1">B</sd-splitter-panel>
    </sd-splitter>
  `,
})
class Host {
  storageKey = signal<string | undefined>(undefined);
  disabled = signal(false);
}

describe('sd-splitter integration', () => {
  let fixture: ComponentFixture<Host>;
  let splitterEl: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [SdStorageService],
    });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    splitterEl = fixture.debugElement.query(By.css('sd-splitter')).nativeElement;
    // Mock container bounding rect cho deterministic px calculations
    spyOn(splitterEl, 'getBoundingClientRect').and.returnValue({
      x: 0, y: 0, top: 0, left: 0, right: 400, bottom: 200, width: 400, height: 200, toJSON: () => ({}),
    } as DOMRect);
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => { cb(0); return 0; });
  });

  it('mix px+flex: panel A 200px, panel B fill phần còn lại', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const panels = splitterEl.querySelectorAll<HTMLElement>('sd-splitter-panel');
    expect(panels[0].style.flex).toContain('200px');
    expect(panels[1].style.flex).toContain('1 1 0');
  });

  it('pointer drag handle → A panel size update', async () => {
    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    spyOn(handle, 'releasePointerCapture').and.stub();

    dispatchPointer(handle, 'pointerdown', { clientX: 200, clientY: 0, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 250, clientY: 0 });
    dispatchPointer(handle, 'pointerup', { clientX: 250, clientY: 0 });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.size).toBe(250);
  });

  it('drag panel A xuống dưới minSize × 0.5 → snap collapse', async () => {
    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    spyOn(handle, 'releasePointerCapture').and.stub();

    // A = 200, min = 50, snap threshold default 0.5 → snap khi A < 25
    dispatchPointer(handle, 'pointerdown', { clientX: 200, clientY: 0, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 20, clientY: 0 });
    dispatchPointer(handle, 'pointerup', { clientX: 20, clientY: 0 });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.collapsed).toBe(true);
  });

  it('disabled splitter → pointer drag không thay đổi state', async () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    dispatchPointer(handle, 'pointerdown', { clientX: 200, clientY: 0, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 300, clientY: 0 });
    dispatchPointer(handle, 'pointerup', { clientX: 300, clientY: 0 });
    fixture.detectChanges();

    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.size).toBe(200);
  });

  it('storage roundtrip: drag → re-create component → restore', async () => {
    fixture.componentInstance.storageKey.set('integration-test');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    spyOn(handle, 'releasePointerCapture').and.stub();
    dispatchPointer(handle, 'pointerdown', { clientX: 200, clientY: 0, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 270, clientY: 0 });
    dispatchPointer(handle, 'pointerup', { clientX: 270, clientY: 0 });
    fixture.detectChanges();
    await fixture.whenStable();

    // Destroy + re-create — but reuse TestBed module
    fixture.destroy();
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.storageKey.set('integration-test');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.size).toBe(270);
  });
});

@Component({
  standalone: true,
  imports: [SdSplitterComponent, SdSplitterPanelComponent],
  template: `
    <sd-splitter orientation="horizontal" style="width:400px;height:200px;">
      <sd-splitter-panel panelId="left" size="1">Left</sd-splitter-panel>
      <sd-splitter-panel panelId="right" size="2">
        <sd-splitter orientation="vertical" style="width:100%;height:100%;">
          <sd-splitter-panel panelId="top" size="1">Top</sd-splitter-panel>
          <sd-splitter-panel panelId="bottom" size="1">Bottom</sd-splitter-panel>
        </sd-splitter>
      </sd-splitter-panel>
    </sd-splitter>
  `,
})
class NestedHost {}

describe('sd-splitter nested', () => {
  let fix: ComponentFixture<NestedHost>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [NestedHost], providers: [SdStorageService] });
    fix = TestBed.createComponent(NestedHost);
    fix.detectChanges();
    await fix.whenStable();
    fix.detectChanges();
    // Outer splitter afterNextRender → triggers inner splitter afterNextRender → cần thêm 1 cycle
    await fix.whenStable();
    fix.detectChanges();
  });

  it('renders nested splitter với handle riêng (2 handles total)', () => {
    const rootEl: HTMLElement = fix.nativeElement;
    // Native DOM query vì sd-splitter-handle được tạo qua createComponent + appendChild
    // (không nằm trong Angular debugElement tree của fixture)
    const splitters = rootEl.querySelectorAll('sd-splitter');
    expect(splitters.length).toBe(2);
    // Parent có 1 handle (giữa left + right); nested có 1 handle (giữa top + bottom)
    const allHandles = rootEl.querySelectorAll('sd-splitter-handle');
    expect(allHandles.length).toBe(2);
  });
});
