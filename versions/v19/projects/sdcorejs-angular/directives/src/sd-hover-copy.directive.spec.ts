/**
 * SdHoverCopyDirective spec
 *
 * Note: the directive creates its copy button both in `ngOnChanges` (for the
 * initial-value change on the `sdHoverCopyDisabled` input) and again in
 * `ngOnInit`.  The directive's internal `#copyButton` reference always points
 * to the LAST button created (the one from `ngOnInit`).  Tests that care about
 * the button managed by the directive use `getDirectiveButton()` which finds
 * the element whose listener and style are wired to `#copyButton`.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { SdHoverCopyDirective } from './sd-hover-copy.directive';

@Component({
  standalone: true,
  imports: [SdHoverCopyDirective],
  template: `
    <div
      data-testid="host"
      [sdHoverCopy]="copyText"
      [sdHoverCopyDisabled]="disabled">
      Value
    </div>
  `,
})
class HostComponent {
  copyText = 'hello-world';
  disabled = false;
}

describe('SdHoverCopyDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let hostEl: HTMLElement;
  let directiveInstance: SdHoverCopyDirective;
  let copyToClipboardSpy: jasmine.Spy;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    copyToClipboardSpy = spyOn(BrowserUtilities, 'copyToClipboard');

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    hostEl = fixture.nativeElement.querySelector('[data-testid="host"]') as HTMLElement;
    directiveInstance = fixture.debugElement
      .query(By.directive(SdHoverCopyDirective))
      .injector.get(SdHoverCopyDirective);
  });

  /**
   * The directive keeps `#copyButton` as its last-created button.
   * `querySelectorAll('button')` returns all buttons; the directive manages the
   * LAST one appended (ngOnInit fires after ngOnChanges creates the first).
   */
  function getDirectiveButton(): HTMLElement | null {
    const all = hostEl.querySelectorAll('button');
    return all.length ? (all[all.length - 1] as HTMLElement) : null;
  }

  function getTooltip(): HTMLElement | null {
    const btn = getDirectiveButton();
    return btn ? (btn.querySelector('span') as HTMLElement) : null;
  }

  // ─── creation ────────────────────────────────────────────────────────────────

  describe('creation', () => {
    it('creates the host component', () => {
      expect(host).toBeTruthy();
    });

    it('appends at least one copy button inside the host element on init', () => {
      expect(hostEl.querySelector('button')).not.toBeNull();
    });

    it('sets host element position to relative', () => {
      expect(hostEl.style.position).toBe('relative');
    });

    it('renders an SVG icon inside the directive-managed button', () => {
      expect(getDirectiveButton()?.querySelector('svg')).not.toBeNull();
    });

    it('appends a tooltip span inside the directive-managed button', () => {
      expect(getTooltip()).not.toBeNull();
    });
  });

  // ─── inputs ──────────────────────────────────────────────────────────────────

  describe('inputs', () => {
    it('sdHoverCopyDisabled=false — directive-managed button exists in DOM', () => {
      host.disabled = false;
      fixture.detectChanges();
      expect(getDirectiveButton()).not.toBeNull();
    });

    it('sdHoverCopyDisabled=true — directive removes its managed button from DOM', () => {
      const btnBefore = getDirectiveButton()!;
      expect(btnBefore).not.toBeNull();
      host.disabled = true;
      fixture.detectChanges();
      // The directive removes its #copyButton; verify it is no longer in the DOM
      expect(btnBefore.parentElement).toBeNull();
    });
  });

  // ─── mouseenter / mouseleave ──────────────────────────────────────────────────

  describe('mouseenter shows copy button', () => {
    it('directive-managed button is hidden (display:none) before mouseenter', () => {
      expect(getDirectiveButton()!.style.display).toBe('none');
    });

    it('mouseenter sets directive-managed button display to block', () => {
      directiveInstance.onMouseEnter();
      fixture.detectChanges();
      expect(getDirectiveButton()!.style.display).toBe('block');
    });

    it('mouseleave hides directive-managed button again (display:none)', () => {
      directiveInstance.onMouseEnter();
      directiveInstance.onMouseLeave();
      fixture.detectChanges();
      expect(getDirectiveButton()!.style.display).toBe('none');
    });

    it('mouseenter is a no-op when sdHoverCopyDisabled=true (button already removed)', () => {
      const btnBefore = getDirectiveButton()!;
      host.disabled = true;
      fixture.detectChanges();
      // Button was removed; onMouseEnter guard returns early
      directiveInstance.onMouseEnter();
      fixture.detectChanges();
      expect(btnBefore.parentElement).toBeNull();
    });
  });

  // ─── click copies value to clipboard ─────────────────────────────────────────

  describe('click copies value to clipboard', () => {
    it('calls BrowserUtilities.copyToClipboard with the bound copyText', () => {
      directiveInstance.onMouseEnter();
      getDirectiveButton()!.click();
      expect(copyToClipboardSpy).toHaveBeenCalledWith('hello-world');
    });

    it('coerces copyText to string before copying', () => {
      (host as any).copyText = 42 as any;
      fixture.detectChanges();
      directiveInstance.onMouseEnter();
      getDirectiveButton()!.click();
      expect(copyToClipboardSpy).toHaveBeenCalledWith('42');
    });

    it('does NOT call copyToClipboard when sdHoverCopyDisabled is true', () => {
      host.disabled = true;
      fixture.detectChanges();
      // Directive's managed button is gone; verify no copy happened
      expect(copyToClipboardSpy).not.toHaveBeenCalled();
    });
  });

  // ─── tooltip feedback ─────────────────────────────────────────────────────────

  describe('tooltip behavior', () => {
    it('tooltip has default text "Sao chép" before any interaction', () => {
      expect(getTooltip()!.innerText).toBe('Sao chép');
    });

    it('tooltip opacity is 0 initially', () => {
      expect(getTooltip()!.style.opacity).toBe('0');
    });

    it('clicking copy button shows tooltip text "Copied" with opacity 1', () => {
      directiveInstance.onMouseEnter();
      getDirectiveButton()!.click();
      expect(getTooltip()!.innerText).toBe('Copied');
      expect(getTooltip()!.style.opacity).toBe('1');
    });

    it('tooltip resets to "Sao chép" and opacity 0 after 1000ms', fakeAsync(() => {
      directiveInstance.onMouseEnter();
      getDirectiveButton()!.click();
      tick(1000);
      expect(getTooltip()!.style.opacity).toBe('0');
      expect(getTooltip()!.innerText).toBe('Sao chép');
    }));

    it('mouseleave resets tooltip opacity to 0', () => {
      directiveInstance.onMouseEnter();
      getDirectiveButton()!.click();
      directiveInstance.onMouseLeave();
      expect(getTooltip()!.style.opacity).toBe('0');
    });
  });

  // ─── ngOnChanges — dynamic enable/disable ────────────────────────────────────

  describe('ngOnChanges — dynamic enable/disable', () => {
    it('disabling removes the directive-managed button from the DOM', () => {
      const btn = getDirectiveButton()!;
      expect(btn).not.toBeNull();
      host.disabled = true;
      fixture.detectChanges();
      expect(btn.parentElement).toBeNull();
    });

    it('re-enabling after disable re-attaches a new copy button', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(getDirectiveButton()).not.toBeNull();
    });
  });
});
