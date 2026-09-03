import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdStorageService } from '../../../services/storage';
import { SdSplitterComponent } from './splitter.component';
import { SdSplitterPanelComponent } from './splitter-panel/splitter-panel.component';

function dispatchPointer(target: EventTarget, type: string, init: Partial<PointerEventInit>) {
  const ev = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', ...init });
  target.dispatchEvent(ev);
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 400,
      bottom: 200,
      width: 400,
      height: 200,
      toJSON: () => ({}),
    } as DOMRect);
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
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

  it('overshoot rồi kéo ngược: handle bám pointer, không bị kẹt dead-zone', async () => {
    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    spyOn(handle, 'releasePointerCapture').and.stub();
    // rAF mock toàn cục trả 0 → ghi đè #rafPending về non-null, chặn pointermove thứ 2.
    // Trả undefined để 2 move liên tiếp trong CÙNG 1 drag đều được xử lý (đúng như browser thật).
    (window.requestAnimationFrame as jasmine.Spy).and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return undefined as unknown as number;
    });

    // A=200px, container=400. Kéo vượt xa mép phải (clientX 600 → +400) — A bão hòa ở 400
    // (B co về 0, chỉ +200 áp được). Sau đó kéo ngược về clientX 450 (+250): 200+250=450>400
    // → A vẫn phải = 400. Nếu dead-zone tồn tại, A tụt sai về ~250.
    dispatchPointer(handle, 'pointerdown', { clientX: 200, clientY: 0, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 600, clientY: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 450, clientY: 0 });
    dispatchPointer(handle, 'pointerup', { clientX: 450, clientY: 0 });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.size).toBe(400);
  });

  it('snap collapse rồi kéo ngược chậm: tích lũy delta đủ minSize → expand (không kẹt)', async () => {
    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    spyOn(handle, 'releasePointerCapture').and.stub();
    (window.requestAnimationFrame as jasmine.Spy).and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return undefined as unknown as number;
    });

    // A=200px, min=50, collapsible. Kéo về 20 (<25) → snap collapse. Sau đó kéo ngược CHẬM
    // từng bước nhỏ (<50px mỗi bước). applyDelta trả 0 khi chưa đủ minSize → dragLastDelta
    // đứng yên → bước sau tích lũy đủ 50 → expand. Nếu cộng raw pointer delta thì mỗi bước
    // nhỏ <50 sẽ không bao giờ tích đủ → A kẹt ở collapsed.
    dispatchPointer(handle, 'pointerdown', { clientX: 200, clientY: 0, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 20, clientY: 0 }); // snap collapse
    dispatchPointer(handle, 'pointermove', { clientX: 30, clientY: 0 }); // +10 tích lũy, chưa đủ
    dispatchPointer(handle, 'pointermove', { clientX: 50, clientY: 0 }); // +50 tích lũy → expand
    dispatchPointer(handle, 'pointerup', { clientX: 50, clientY: 0 });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.collapsed).toBe(false);
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
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSplitterComponent, SdSplitterPanelComponent],
  template: `
    <sd-splitter orientation="vertical" style="width:200px;height:400px;">
      <sd-splitter-panel panelId="top" size="200" unit="px" minSize="50" collapsible>Top</sd-splitter-panel>
      <sd-splitter-panel panelId="bottom" size="1">Bottom</sd-splitter-panel>
    </sd-splitter>
  `,
})
class VerticalHost {}

describe('sd-splitter vertical — overshoot dead-zone', () => {
  let fix: ComponentFixture<VerticalHost>;
  let splitterEl: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [VerticalHost], providers: [SdStorageService] });
    fix = TestBed.createComponent(VerticalHost);
    fix.detectChanges();
    await fix.whenStable();
    fix.detectChanges();
    splitterEl = fix.debugElement.query(By.css('sd-splitter')).nativeElement;
    spyOn(splitterEl, 'getBoundingClientRect').and.returnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 200,
      bottom: 400,
      width: 200,
      height: 400,
      toJSON: () => ({}),
    } as DOMRect);
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return undefined as unknown as number;
    });
  });

  it('kéo trục Y vượt mép dưới rồi kéo ngược: top bám pointer, không kẹt', async () => {
    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    spyOn(handle, 'setPointerCapture').and.stub();
    spyOn(handle, 'releasePointerCapture').and.stub();

    // top=200px, container cao 400. Kéo xuống quá đáy (clientY 600 → +400) — top bão hòa ở 400.
    // Kéo ngược lên clientY 450 (+250): 200+250=450>400 → top vẫn = 400, không tụt về 250.
    dispatchPointer(handle, 'pointerdown', { clientX: 0, clientY: 200, button: 0 });
    dispatchPointer(handle, 'pointermove', { clientX: 0, clientY: 600 });
    dispatchPointer(handle, 'pointermove', { clientX: 0, clientY: 450 });
    dispatchPointer(handle, 'pointerup', { clientX: 0, clientY: 450 });
    fix.detectChanges();
    await fix.whenStable();

    const cmp = fix.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    expect(cmp.getLayout().panels.find(p => p.id === 'top')!.size).toBe(400);
  });
});

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSplitterComponent, SdSplitterPanelComponent],
  template: `
    <sd-splitter orientation="vertical" style="width:200px;height:320px;">
      <sd-splitter-panel panelId="header" size="64" unit="px">Header</sd-splitter-panel>
      <sd-splitter-panel panelId="content" size="1" unit="flex">Content</sd-splitter-panel>
      <sd-splitter-panel panelId="footer" size="100" unit="px">Footer</sd-splitter-panel>
    </sd-splitter>
  `,
})
class VerticalFixedPxHost {}

describe('sd-splitter vertical — fixed px header/footer with flex content', () => {
  let fix: ComponentFixture<VerticalFixedPxHost>;
  let splitterEl: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [VerticalFixedPxHost], providers: [SdStorageService] });
    fix = TestBed.createComponent(VerticalFixedPxHost);
    fix.detectChanges();
    await fix.whenStable();
    fix.detectChanges();
    splitterEl = fix.debugElement.query(By.css('sd-splitter')).nativeElement;
    spyOn(splitterEl, 'getBoundingClientRect').and.returnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 200,
      bottom: 320,
      width: 200,
      height: 320,
      toJSON: () => ({}),
    } as DOMRect);
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return undefined as unknown as number;
    });
  });

  function component(): SdSplitterComponent {
    return fix.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
  }

  function panel(id: string) {
    return component()
      .getLayout()
      .panels.find(p => p.id === id)!;
  }

  it('kéo divider header/content sát xuống dưới rồi kéo ngược ở drag mới không làm content kẹt 0', async () => {
    const firstHandle = splitterEl.querySelectorAll<HTMLElement>('sd-splitter-handle')[0];
    spyOn(firstHandle, 'setPointerCapture').and.stub();
    spyOn(firstHandle, 'releasePointerCapture').and.stub();

    dispatchPointer(firstHandle, 'pointerdown', { clientX: 0, clientY: 64, button: 0 });
    dispatchPointer(firstHandle, 'pointermove', { clientX: 0, clientY: 1000 });
    dispatchPointer(firstHandle, 'pointerup', { clientX: 0, clientY: 1000 });
    fix.detectChanges();
    await fix.whenStable();

    expect(panel('header').size).toBe(220);
    expect(panel('content').size).toBeGreaterThan(0);

    dispatchPointer(firstHandle, 'pointerdown', { clientX: 0, clientY: 220, button: 0 });
    dispatchPointer(firstHandle, 'pointermove', { clientX: 0, clientY: 180 });
    dispatchPointer(firstHandle, 'pointerup', { clientX: 0, clientY: 180 });
    fix.detectChanges();
    await fix.whenStable();

    expect(panel('header').size).toBe(180);
    expect(panel('content').size).toBeGreaterThan(0);
  });

  it('kéo divider content/footer sát lên trên rồi kéo ngược ở drag mới không làm content kẹt 0', async () => {
    const secondHandle = splitterEl.querySelectorAll<HTMLElement>('sd-splitter-handle')[1];
    spyOn(secondHandle, 'setPointerCapture').and.stub();
    spyOn(secondHandle, 'releasePointerCapture').and.stub();

    dispatchPointer(secondHandle, 'pointerdown', { clientX: 0, clientY: 220, button: 0 });
    dispatchPointer(secondHandle, 'pointermove', { clientX: 0, clientY: -1000 });
    dispatchPointer(secondHandle, 'pointerup', { clientX: 0, clientY: -1000 });
    fix.detectChanges();
    await fix.whenStable();

    expect(panel('footer').size).toBe(256);
    expect(panel('content').size).toBeGreaterThan(0);

    dispatchPointer(secondHandle, 'pointerdown', { clientX: 0, clientY: 64, button: 0 });
    dispatchPointer(secondHandle, 'pointermove', { clientX: 0, clientY: 104 });
    dispatchPointer(secondHandle, 'pointerup', { clientX: 0, clientY: 104 });
    fix.detectChanges();
    await fix.whenStable();

    expect(panel('footer').size).toBe(216);
    expect(panel('content').size).toBeGreaterThan(0);
  });
});

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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

// ---------------------------------------------------------------------------
// why: #syncHandles từng chạy TRỰC TIẾP trong effect(). afterRender callback chạy với
// setActiveConsumer(null) còn effect thì KHÔNG, nên khi #syncHandles được dời vào effect, mọi
// panel.resizable() nó đọc trở thành dependency ngầm — bật/tắt [resizable] của một panel làm cả
// pass chạy lại và appendChild lại TOÀN BỘ panel host element. appendChild trên node đã đúng chỗ
// vẫn là move thật: iframe/video reload, focus + scrollTop trong panel bay sạch. Suite này đo hệ
// quả quan sát được, không đo cách cài đặt.
// ---------------------------------------------------------------------------

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSplitterComponent, SdSplitterPanelComponent],
  template: `
    <sd-splitter style="width:400px;height:200px;">
      <sd-splitter-panel panelId="a" size="1" [resizable]="leftResizable()">
        <div id="scroller" style="height:60px;overflow:auto">
          <div style="height:400px">tall</div>
        </div>
        <button id="inside-a" type="button">focus me</button>
      </sd-splitter-panel>
      <sd-splitter-panel panelId="b" size="1">B</sd-splitter-panel>
      @if (showThird()) {
        <sd-splitter-panel panelId="c" size="1">C</sd-splitter-panel>
      }
    </sd-splitter>
  `,
})
class ResizableToggleHost {
  leftResizable = signal(true);
  showThird = signal(false);
}

describe('sd-splitter live DOM preservation', () => {
  let fix: ComponentFixture<ResizableToggleHost>;
  let splitterEl: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [ResizableToggleHost], providers: [SdStorageService] });
    fix = TestBed.createComponent(ResizableToggleHost);
    fix.detectChanges();
    await fix.whenStable();
    fix.detectChanges();
    splitterEl = fix.nativeElement.querySelector('sd-splitter') as HTMLElement;
  });

  async function toggleResizable(): Promise<void> {
    fix.componentInstance.leftResizable.set(false);
    fix.detectChanges();
    await fix.whenStable();
    fix.detectChanges();
  }

  it('does not re-append panel hosts when only [resizable] changed', async () => {
    const appendSpy = spyOn(splitterEl, 'appendChild').and.callThrough();

    await toggleResizable();

    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('keeps focus inside a panel while [resizable] is toggled', async () => {
    const button = splitterEl.querySelector<HTMLButtonElement>('#inside-a')!;
    button.focus();
    expect(document.activeElement).toBe(button);

    await toggleResizable();

    expect(document.activeElement).toBe(button);
  });

  it('keeps scroll position inside a panel while [resizable] is toggled', async () => {
    const scroller = splitterEl.querySelector<HTMLElement>('#scroller')!;
    scroller.scrollTop = 120;
    expect(scroller.scrollTop).toBe(120);

    await toggleResizable();

    expect(scroller.scrollTop).toBe(120);
  });

  // why: bỏ tracking đi kèm rủi ro effect KHÔNG chạy lại nữa. untracked() chỉ được cắt tracking,
  // KHÔNG được cắt tín hiệu — [resizable] vẫn phải tới được handle.
  it('still propagates [resizable] to the handle it guards', async () => {
    const handle = splitterEl.querySelector<HTMLElement>('sd-splitter-handle')!;
    expect(handle.classList.contains('sd-splitter__handle--disabled')).toBeFalse();

    await toggleResizable();

    expect(handle.classList.contains('sd-splitter__handle--disabled')).toBeTrue();
  });

  it('still interleaves panels and handles when the panel count changes', async () => {
    expect(tagSequence()).toEqual(['sd-splitter-panel', 'sd-splitter-handle', 'sd-splitter-panel']);

    fix.componentInstance.showThird.set(true);
    fix.detectChanges();
    await fix.whenStable();
    fix.detectChanges();

    expect(tagSequence()).toEqual([
      'sd-splitter-panel',
      'sd-splitter-handle',
      'sd-splitter-panel',
      'sd-splitter-handle',
      'sd-splitter-panel',
    ]);
  });

  function tagSequence(): string[] {
    return Array.from(splitterEl.children).map(child => child.tagName.toLowerCase());
  }
});
