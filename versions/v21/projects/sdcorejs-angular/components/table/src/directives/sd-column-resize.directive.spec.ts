import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdColumnResizeDirective } from './sd-column-resize.directive';

@Component({
  standalone: true,
  imports: [SdColumnResizeDirective],
  template: `
    <table>
      <thead>
        <tr>
          <th
            #th
            style="width: 100px;"
            [sdColumnResize]="enabled()"
            [minWidth]="minWidth()"
            [maxWidth]="maxWidth()"
            (sdResizeEnd)="onResizeEnd($event)">
            Header
          </th>
        </tr>
      </thead>
    </table>
  `,
})
class HostComponent {
  enabled = signal(true);
  minWidth = signal<string | undefined>(undefined);
  maxWidth = signal<string | undefined>(undefined);
  lastWidth: string | null = null;
  onResizeEnd(w: string) {
    this.lastWidth = w;
  }
}

function dispatchMouse(target: EventTarget, type: string, clientX: number) {
  const ev = new MouseEvent(type, { bubbles: true, cancelable: true, clientX });
  target.dispatchEvent(ev);
}

describe('SdColumnResizeDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let thEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    thEl = fixture.debugElement.query(By.css('th')).nativeElement;
    // bbox cố định cho test: stub getBoundingClientRect width = 100
    spyOn(thEl, 'getBoundingClientRect').and.returnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect);
  });

  it('injects handle khi enabled = true', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle');
    expect(handle).toBeTruthy();
    expect(thEl.classList.contains('sd-col-resize-host')).toBe(true);
  });

  it('remove handle khi enabled chuyển sang false', () => {
    host.enabled.set(false);
    fixture.detectChanges();
    expect(thEl.querySelector('.sd-col-resize-handle')).toBeNull();
    expect(thEl.classList.contains('sd-col-resize-host')).toBe(false);
  });

  it('mousedown + mousemove + mouseup → emit width mới', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 150); // delta +50
    dispatchMouse(document, 'mouseup', 150);

    expect(host.lastWidth).toBe('150px');
  });

  it('clamp width về minWidth (default 40px)', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 0); // delta -100 → 100-100=0 → clamp 40
    dispatchMouse(document, 'mouseup', 0);

    expect(host.lastWidth).toBe('40px');
  });

  it('clamp width về column.maxWidth nếu có', () => {
    host.maxWidth.set('120px');
    fixture.detectChanges();
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 300); // delta +200 → 300 → clamp 120
    dispatchMouse(document, 'mouseup', 300);

    expect(host.lastWidth).toBe('120px');
  });

  it('clamp width về column.minWidth nếu có (lớn hơn default 40)', () => {
    host.minWidth.set('60px');
    fixture.detectChanges();
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 30); // delta -70 → 30 → clamp 60
    dispatchMouse(document, 'mouseup', 30);

    expect(host.lastWidth).toBe('60px');
  });

  it('mousedown stopPropagation để không trigger sort', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    const thClickSpy = jasmine.createSpy('th-mousedown');
    thEl.addEventListener('mousedown', thClickSpy);

    const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100 });
    handle.dispatchEvent(ev);

    expect(thClickSpy).not.toHaveBeenCalled();
  });

  it('update inline width của TH trong khi kéo', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 180); // → 180px

    expect(thEl.style.width).toBe('180px');
    expect(thEl.style.minWidth).toBe('180px');
    expect(thEl.style.maxWidth).toBe('180px');

    dispatchMouse(document, 'mouseup', 180);
  });

  it('cleanup khi destroy giữa drag', () => {
    const handle = thEl.querySelector('.sd-col-resize-handle')!;
    dispatchMouse(handle, 'mousedown', 100);
    fixture.destroy();
    expect(document.body.style.cursor).toBe('');
  });
});
