// splitter-handle.component.spec.ts
import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdSplitterHandleComponent } from './splitter-handle.component';

function dispatchKey(target: EventTarget, key: string) {
  const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  target.dispatchEvent(ev);
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSplitterHandleComponent],
  template: `
    <sd-splitter-handle
      [orientation]="orientation()"
      [disabled]="disabled()"
      [ariaValueMin]="0"
      [ariaValueMax]="100"
      [ariaValueNow]="50"
      (dragStart)="events.push('start')"
      (dragMove)="onMove($event)"
      (dragEnd)="events.push('end')">
    </sd-splitter-handle>
  `,
})
class Host {
  orientation = signal<'horizontal' | 'vertical'>('horizontal');
  disabled = signal(false);
  events: string[] = [];
  deltas: number[] = [];
  onMove(d: number) {
    this.deltas.push(d);
  }
}

function dispatchPointer(target: EventTarget, type: string, init: PointerEventInit) {
  const ev = new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'mouse', ...init });
  target.dispatchEvent(ev);
}

describe('SdSplitterHandleComponent — pointer drag', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let handleEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    handleEl = fixture.debugElement.query(By.css('sd-splitter-handle')).nativeElement;
    spyOn(handleEl, 'setPointerCapture').and.stub();
    spyOn(handleEl, 'releasePointerCapture').and.stub();
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  it('pointerdown → emit dragStart và setPointerCapture', () => {
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 0, button: 0 });
    expect(host.events).toEqual(['start']);
    expect(handleEl.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('pointermove sau pointerdown (horizontal) → emit dragMove với deltaX', () => {
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 0 });
    dispatchPointer(handleEl, 'pointermove', { pointerId: 1, clientX: 150, clientY: 0 });
    expect(host.deltas).toEqual([50]);
  });

  it('orientation=vertical → deltaY thay vì deltaX', () => {
    host.orientation.set('vertical');
    fixture.detectChanges();
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 0, clientY: 100 });
    dispatchPointer(handleEl, 'pointermove', { pointerId: 1, clientX: 0, clientY: 130 });
    expect(host.deltas).toEqual([30]);
  });

  it('pointerup → emit dragEnd + releasePointerCapture', () => {
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 0 });
    dispatchPointer(handleEl, 'pointerup', { pointerId: 1, clientX: 110, clientY: 0 });
    expect(host.events).toEqual(['start', 'end']);
    expect(handleEl.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it('pointermove khi chưa pointerdown → no-op', () => {
    dispatchPointer(handleEl, 'pointermove', { pointerId: 1, clientX: 200, clientY: 0 });
    expect(host.deltas).toEqual([]);
  });

  it('disabled=true → pointerdown không emit', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 0 });
    expect(host.events).toEqual([]);
  });
});

describe('SdSplitterHandleComponent — keyboard', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let handleEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    handleEl = fixture.debugElement.query(By.css('sd-splitter-handle')).nativeElement;
  });

  it('ArrowRight (horizontal) → emit dragMove(+keyboardStep) + dragEnd', () => {
    dispatchKey(handleEl, 'ArrowRight');
    expect(host.deltas).toEqual([10]);
    expect(host.events).toEqual(['start', 'end']);
  });

  it('ArrowLeft → emit dragMove(-keyboardStep)', () => {
    dispatchKey(handleEl, 'ArrowLeft');
    expect(host.deltas).toEqual([-10]);
  });

  it('orientation=vertical: ArrowDown/Up thay cho Right/Left', () => {
    host.orientation.set('vertical');
    fixture.detectChanges();
    dispatchKey(handleEl, 'ArrowDown');
    expect(host.deltas).toEqual([10]);
    dispatchKey(handleEl, 'ArrowUp');
    expect(host.deltas).toEqual([10, -10]);
  });

  it('Enter → emit toggleRequest', () => {
    const cmp = fixture.debugElement.query(By.directive(SdSplitterHandleComponent)).componentInstance as SdSplitterHandleComponent;
    let count = 0;
    cmp.toggleRequest.subscribe(() => count++);
    dispatchKey(handleEl, 'Enter');
    expect(count).toBe(1);
  });

  it('disabled=true → key không emit', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    dispatchKey(handleEl, 'ArrowRight');
    expect(host.deltas).toEqual([]);
  });
});

describe('SdSplitterHandleComponent — dblclick + aria', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let handleEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    handleEl = fixture.debugElement.query(By.css('sd-splitter-handle')).nativeElement;
  });

  it('dblclick → emit toggleRequest', () => {
    const cmp = fixture.debugElement.query(By.directive(SdSplitterHandleComponent)).componentInstance as SdSplitterHandleComponent;
    let count = 0;
    cmp.toggleRequest.subscribe(() => count++);
    handleEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(count).toBe(1);
  });

  it('dblclick khi disabled=true → không emit', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    const cmp = fixture.debugElement.query(By.directive(SdSplitterHandleComponent)).componentInstance as SdSplitterHandleComponent;
    let count = 0;
    cmp.toggleRequest.subscribe(() => count++);
    handleEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(count).toBe(0);
  });

  it('binds aria-valuemin/max/now attrs từ inputs', () => {
    expect(handleEl.getAttribute('aria-valuemin')).toBe('0');
    expect(handleEl.getAttribute('aria-valuemax')).toBe('100');
    expect(handleEl.getAttribute('aria-valuenow')).toBe('50');
  });
});

describe('SdSplitterHandleComponent — teardown giữa lúc drag', () => {
  let fixture: ComponentFixture<Host>;
  let handleEl: HTMLElement;
  let frames: Map<number, FrameRequestCallback>;
  let cancelled: number[];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    handleEl = fixture.debugElement.query(By.css('sd-splitter-handle')).nativeElement;
    spyOn(handleEl, 'setPointerCapture').and.stub();
    spyOn(handleEl, 'releasePointerCapture').and.stub();

    // rAF giả có hàng đợi thật: requestAnimationFrame xếp hàng, cancelAnimationFrame gỡ khỏi hàng.
    // Nhờ vậy "còn frame chờ hay không" là quan sát được, không phụ thuộc timing của trình duyệt.
    frames = new Map<number, FrameRequestCallback>();
    cancelled = [];
    let nextHandle = 0;
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      const handle = ++nextHandle;
      frames.set(handle, cb);
      return handle;
    });
    spyOn(window, 'cancelAnimationFrame').and.callFake((handle: number) => {
      cancelled.push(handle);
      frames.delete(handle);
    });
  });

  it('huỷ frame đang chờ khi destroy giữa lúc drag (không để dragMove thoát ra sau teardown)', () => {
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 0, button: 0 });
    dispatchPointer(handleEl, 'pointermove', { pointerId: 1, clientX: 150, clientY: 0 });

    // pointerup KHÔNG bao giờ tới: component bị tháo giữa chừng
    expect(frames.size).toBe(1);

    fixture.destroy();

    expect(cancelled.length).toBe(1);
    expect(frames.size).toBe(0);
  });

  it('destroy khi không có frame nào chờ → không gọi cancelAnimationFrame thừa', () => {
    dispatchPointer(handleEl, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 0, button: 0 });
    dispatchPointer(handleEl, 'pointermove', { pointerId: 1, clientX: 150, clientY: 0 });
    dispatchPointer(handleEl, 'pointerup', { pointerId: 1, clientX: 150, clientY: 0 });
    expect(cancelled.length).toBe(1);

    fixture.destroy();

    expect(cancelled.length).toBe(1);
  });
});
