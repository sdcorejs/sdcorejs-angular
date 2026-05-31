import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { SdTooltipDirective } from './sd-tooltip.directive';

@Component({
  standalone: true,
  imports: [SdTooltipDirective],
  template: `
    <button
      data-testid="trigger"
      [sdTooltip]="content"
      [sdTooltipPosition]="position"
      [sdTooltipDelay]="delay"
      [sdTooltipColor]="color">
      Hover me
    </button>
    <ng-template #tplContent>
      <div class="my-tpl">Template content</div>
    </ng-template>
  `,
})
class HostComponent {
  @ViewChild('tplContent') tplRef!: TemplateRef<unknown>;
  content: string | TemplateRef<unknown> = 'Tooltip text';
  position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  delay = 100;
  color = '#616161';
}

describe('SdTooltipDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let overlayContainerEl: HTMLElement;
  let trigger: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    trigger = fixture.nativeElement.querySelector('[data-testid="trigger"]') as HTMLButtonElement;
    overlayContainerEl = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(fakeAsync(() => {
    // Reset static activeTooltip to prevent leakage between tests
    // (cast through any since the property is private static)
    (SdTooltipDirective as any).activeTooltip = null;
    // Drain pending timers (show/hide setTimeouts)
    flush();
    // Clear overlay DOM
    overlayContainerEl.innerHTML = '';
  }));

  describe('show / hide', () => {
    it('does not show immediately on mouseenter', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).toBeNull();
    });

    it('shows after sdTooltipDelay ms', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).not.toBeNull();
      // cleanup
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(300);
      flush();
    }));

    it('hides 300ms after mouseleave', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).not.toBeNull();

      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(299);
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).not.toBeNull();
      tick(2);
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).toBeNull();
      flush();
    }));

    it('cancels pending show if mouseleave fires before delay elapses', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(50);
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(100); // past original show delay
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).toBeNull();
      flush();
    }));
  });

  describe('content', () => {
    it('renders text content', fakeAsync(() => {
      host.content = 'Hello tooltip';
      fixture.detectChanges();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      const el = overlayContainerEl.querySelector('.c-sd-tooltip-text');
      expect(el?.textContent?.trim()).toBe('Hello tooltip');
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(300);
      flush();
    }));

    it('renders TemplateRef content', fakeAsync(() => {
      // Removed bare tick() — ViewChild resolved after first detectChanges in beforeEach
      fixture.detectChanges();
      host.content = host.tplRef;
      fixture.detectChanges();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      const el = overlayContainerEl.querySelector('.my-tpl');
      expect(el).not.toBeNull();
      expect(el?.textContent?.trim()).toBe('Template content');
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(300);
      flush();
    }));
  });

  describe('color', () => {
    it('applies sdTooltipColor as background', fakeAsync(() => {
      host.color = 'rgb(255, 0, 0)';
      fixture.detectChanges();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      const el = overlayContainerEl.querySelector('.c-sd-tooltip-container') as HTMLElement;
      expect(el.style.backgroundColor).toBe('rgb(255, 0, 0)');
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(300);
      flush();
    }));
  });

  describe('cleanup on destroy', () => {
    it('disposes overlay on directive destroy', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).not.toBeNull();

      fixture.destroy();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).toBeNull();
    }));
  });

  describe('static activeTooltip', () => {
    it('forceHide method is exposed on directive instance', () => {
      const directiveInstance = fixture.debugElement.children[0].injector.get(SdTooltipDirective);
      expect(typeof directiveInstance.forceHide).toBe('function');
    });

    it('forceHide hides overlay immediately (no 300ms wait)', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).not.toBeNull();

      const directiveInstance = fixture.debugElement.children[0].injector.get(SdTooltipDirective);
      directiveInstance.forceHide();
      fixture.detectChanges();
      expect(overlayContainerEl.querySelector('.c-sd-tooltip-container')).toBeNull();
      flush();
    }));
  });
});
