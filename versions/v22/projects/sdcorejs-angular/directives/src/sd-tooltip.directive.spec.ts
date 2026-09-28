import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { SdTooltipDirective } from './sd-tooltip.directive';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTooltipDirective],
  template: `
    <button data-testid="trigger" [sdTooltip]="content" [sdTooltipPosition]="position" [sdTooltipDelay]="delay" [sdTooltipColor]="color">
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

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTooltipDirective],
  template: `<button data-testid="plain" [sdTooltip]="'Plain tooltip'">Plain</button>`,
})
class DefaultColorHostComponent {}

describe('SdTooltipDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let overlayContainerEl: HTMLElement;
  let trigger: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, DefaultColorHostComponent, NoopAnimationsModule],
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
  describe('keyboard and screen reader access (WCAG 1.4.13)', () => {
    const bubble = () => overlayContainerEl.querySelector('.c-sd-tooltip-container') as HTMLElement | null;
    const focusIn = () => trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    const focusOut = (relatedTarget: EventTarget | null = null) =>
      trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget }));
    const escape = (target: EventTarget = trigger) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

    it('shows on focus without waiting for the hover delay and hides on blur', fakeAsync(() => {
      focusIn();
      fixture.detectChanges();
      expect(bubble()).not.toBeNull();

      focusOut();
      fixture.detectChanges();
      expect(bubble()).toBeNull();
      flush();
    }));

    it('ignores focus moving between elements inside the host', fakeAsync(() => {
      const inner = document.createElement('span');
      trigger.appendChild(inner);
      focusIn();
      fixture.detectChanges();

      focusOut(inner);
      fixture.detectChanges();
      expect(bubble()).not.toBeNull();
      flush();
    }));

    it('stays open while the pointer is still over the host after focus leaves', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      focusIn();
      focusOut();
      tick(400);
      fixture.detectChanges();
      expect(bubble()).not.toBeNull();

      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(300);
      fixture.detectChanges();
      expect(bubble()).toBeNull();
      flush();
    }));

    it('stays open while focused even after the pointer leaves', fakeAsync(() => {
      focusIn();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      tick(400);
      fixture.detectChanges();
      expect(bubble()).not.toBeNull();
      flush();
    }));

    it('gives the bubble role="tooltip" and an id that the host references in aria-describedby', fakeAsync(() => {
      focusIn();
      fixture.detectChanges();
      const el = bubble()!;
      expect(el.getAttribute('role')).toBe('tooltip');
      expect(el.id).toMatch(/^sd-tooltip-\d+$/);
      expect(trigger.getAttribute('aria-describedby')).toBe(el.id);

      focusOut();
      fixture.detectChanges();
      expect(trigger.hasAttribute('aria-describedby')).toBeFalse();
      flush();
    }));

    it('only adds and removes its own id in aria-describedby', fakeAsync(() => {
      trigger.setAttribute('aria-describedby', 'hint-1 hint-2');
      focusIn();
      fixture.detectChanges();
      const id = bubble()!.id;
      expect(trigger.getAttribute('aria-describedby')).toBe(`hint-1 hint-2 ${id}`);

      focusOut();
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-describedby')).toBe('hint-1 hint-2');
      flush();
    }));

    it('hides on Escape and stops the key only when it actually hid a tooltip', fakeAsync(() => {
      const reached = jasmine.createSpy('reached');
      document.addEventListener('keydown', reached);
      try {
        focusIn();
        fixture.detectChanges();
        escape();
        fixture.detectChanges();
        expect(bubble()).toBeNull();
        expect(reached).not.toHaveBeenCalled();

        // Không còn tooltip nào hiện: Escape phải tới đích như bình thường (listener đã được gỡ).
        escape();
        expect(reached).toHaveBeenCalledTimes(1);
      } finally {
        document.removeEventListener('keydown', reached);
      }
      flush();
    }));

    it('leaves other keys alone', fakeAsync(() => {
      const reached = jasmine.createSpy('reached');
      document.addEventListener('keydown', reached);
      try {
        focusIn();
        fixture.detectChanges();
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        fixture.detectChanges();
        expect(bubble()).not.toBeNull();
        expect(reached).toHaveBeenCalledTimes(1);
      } finally {
        document.removeEventListener('keydown', reached);
      }
      flush();
    }));

    it('does not re-open after Escape until the pointer or focus comes back', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      escape();
      tick(500);
      fixture.detectChanges();
      expect(bubble()).toBeNull();

      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      expect(bubble()).not.toBeNull();
      flush();
    }));

    it('keeps the bubble open while the pointer is over it', fakeAsync(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      tick(100);
      fixture.detectChanges();
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      const container = overlayContainerEl.querySelector('sd-tooltip-container') as HTMLElement;
      container.dispatchEvent(new MouseEvent('mouseenter'));
      tick(1000);
      fixture.detectChanges();
      expect(bubble()).not.toBeNull();

      container.dispatchEvent(new MouseEvent('mouseleave'));
      tick(200);
      fixture.detectChanges();
      expect(bubble()).toBeNull();
      flush();
    }));

    it('removes the Escape listener and its describedby id when destroyed while visible', fakeAsync(() => {
      const reached = jasmine.createSpy('reached');
      document.addEventListener('keydown', reached);
      try {
        focusIn();
        fixture.detectChanges();
        fixture.destroy();
        escape(document.body);
        expect(reached).toHaveBeenCalledTimes(1);
        expect(trigger.hasAttribute('aria-describedby')).toBeFalse();
      } finally {
        document.removeEventListener('keydown', reached);
      }
      flush();
    }));
  });

  describe('default colour', () => {
    it('uses the --sd-tooltip-bg token with the previous colour as fallback', fakeAsync(() => {
      const plainFixture = TestBed.createComponent(DefaultColorHostComponent);
      plainFixture.detectChanges();
      const plain = plainFixture.nativeElement.querySelector('[data-testid="plain"]') as HTMLElement;
      plain.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      plainFixture.detectChanges();
      const el = overlayContainerEl.querySelector('.c-sd-tooltip-container') as HTMLElement;
      expect(el.style.backgroundColor).toContain('var(--sd-tooltip-bg');
      // Không có theme trong môi trường test nên fallback phải cho đúng màu cũ.
      expect(getComputedStyle(el).backgroundColor).toBe('rgb(97, 97, 97)');
      plainFixture.destroy();
      flush();
    }));
  });
});
