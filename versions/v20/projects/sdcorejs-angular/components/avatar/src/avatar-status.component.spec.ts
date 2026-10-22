import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { Color } from '@sdcorejs/utils/models';
import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { SdAvatar } from './avatar.component';

// Status dot, name and accessible name of sd-avatar (design handoff wave 3 · 2a).
@Component({
  imports: [SdAvatar, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="padding: 32px">
      <sd-avatar [src]="src" [size]="size" [name]="name" [status]="status" [statusLabel]="statusLabel" [statusPulse]="statusPulse" />
    </div>
  `,
})
class AvatarHost {
  src: string | null = 'Lê Lan Anh';
  size = 40;
  name: string | undefined;
  status: Color | null = null;
  statusLabel: string | undefined;
  statusPulse = false;
}

/** The computed value of `property: value` on a probe that inherits the theme of <html>. */
const resolve = (property: string, value: string): string => {
  const probe = document.createElement('div');
  probe.style.setProperty(property, value);
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
};

describe('SdAvatar status, name and accessible name', () => {
  let fixture: ComponentFixture<AvatarHost>;

  const render = (patch: Partial<AvatarHost>) => {
    Object.assign(fixture.componentInstance, patch);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  };
  const host = () => fixture.nativeElement.querySelector('sd-avatar') as HTMLElement;
  const circle = () => host().querySelector('.sd-avatar') as HTMLElement;
  const status = () => host().querySelector('.sd-avatar__status') as HTMLElement | null;
  const badge = () => fixture.debugElement.query(By.directive(SdBadge))?.componentInstance as SdBadge | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(AvatarHost);
    fixture.detectChanges();
  });

  it('shows no dot without status', () => {
    expect(status()).toBeNull();
    expect(badge()).toBeUndefined();
  });

  it('renders the dot as an sd-badge type="dot" next to the circle, not inside it', () => {
    render({ status: 'success', statusLabel: 'Đang hoạt động' });
    expect(status()).not.toBeNull();
    expect(circle().querySelector('sd-badge')).withContext('the circle clips its content').toBeNull();
    expect(badge()!.type()).toBe('dot');
    expect(badge()!.effectiveColor()).toBe('success');
    expect(badge()!.title()).toBe('Đang hoạt động');
    expect(badge()!.pulse()).toBeFalse();
    render({ statusPulse: true });
    expect(badge()!.pulse()).toBeTrue();
  });

  it('makes the host an inline-flex box positioned for the dot', () => {
    const style = getComputedStyle(host());
    expect(style.display).toBe('inline-flex');
    expect(style.position).toBe('relative');
  });

  for (const [size, dot, ring] of [
    [24, 8, 2],
    [32, 8, 2],
    [40, 10, 2],
    [64, 16, 3],
    [96, 20, 3],
  ] as const) {
    it(`sizes the dot ${dot}px with a ${ring}px ring at size ${size}, centred on the edge at 45°`, () => {
      render({ size, status: 'success', statusLabel: 'Đang hoạt động' });
      const dotBox = host().querySelector('.c-badge-dot')!.getBoundingClientRect();
      expect(dotBox.width).withContext('dot').toBeCloseTo(dot, 1);
      expect(dotBox.height).withContext('dot').toBeCloseTo(dot, 1);
      const ringBox = status()!.getBoundingClientRect();
      expect(ringBox.width)
        .withContext('dot + ring')
        .toBeCloseTo(dot + 2 * ring, 1);
      const circleBox = circle().getBoundingClientRect();
      const r = circleBox.width / 2;
      const edgeX = circleBox.left + r + r * Math.SQRT1_2;
      const edgeY = circleBox.top + r + r * Math.SQRT1_2;
      expect(Math.abs(dotBox.left + dotBox.width / 2 - edgeX))
        .withContext('x on the edge')
        .toBeLessThanOrEqual(1);
      expect(Math.abs(dotBox.top + dotBox.height / 2 - edgeY))
        .withContext('y on the edge')
        .toBeLessThanOrEqual(1);
    });
  }

  it('rings the dot with --sd-avatar-status-ring, the page surface by default', () => {
    render({ status: 'warning', statusLabel: 'Vắng mặt' });
    expect(getComputedStyle(status()!).backgroundColor).toBe(resolve('background-color', 'var(--sd-surface)'));
    host().style.setProperty('--sd-avatar-status-ring', 'rgb(1, 2, 3)');
    expect(getComputedStyle(status()!).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('names the host from the name and the status label, and keeps the dot out of the tab order', () => {
    render({ status: 'success', statusLabel: 'Đang hoạt động' });
    expect(host().getAttribute('role')).toBe('img');
    expect(host().getAttribute('aria-label')).toBe('Lê Lan Anh, Đang hoạt động');
    expect(host().querySelector('[tabindex]')).toBeNull();
    render({ status: null, statusLabel: undefined });
    expect(host().getAttribute('aria-label')).toBe('Lê Lan Anh');
  });

  it('uses name for an image avatar, whose img gets an empty alt', () => {
    render({ src: 'https://example.com/a.png', name: 'Lê Lan Anh' });
    expect(host().getAttribute('aria-label')).toBe('Lê Lan Anh');
    expect(host().querySelector('img')!.getAttribute('alt')).toBe('');
  });

  it('is decorative when it has neither a name nor a status', () => {
    render({ src: 'https://example.com/a.png' });
    expect(host().hasAttribute('role')).toBeFalse();
    expect(host().hasAttribute('aria-label')).toBeFalse();
  });

  it('takes the initials and colour of a failed image from name', () => {
    render({ src: 'https://example.com/missing.png', name: 'Lê Lan Anh' });
    fixture.debugElement.query(By.directive(SdAvatar)).componentInstance.handleError();
    fixture.detectChanges();
    expect(circle().textContent!.trim()).toBe('LA');
    const fromImage = getComputedStyle(circle()).backgroundColor;
    render({ src: 'Lê Lan Anh', name: undefined });
    expect(fromImage).withContext('same colour as the avatar of the name').toBe(getComputedStyle(circle()).backgroundColor);
  });

  it('warns in dev mode when status has no statusLabel', () => {
    const warn = spyOn(console, 'warn');
    render({ status: 'success' });
    TestBed.flushEffects();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.calls.mostRecent().args[0])).toContain('statusLabel');
  });

  describe('tooltips', () => {
    let overlay: HTMLElement;

    beforeEach(() => {
      overlay = TestBed.inject(OverlayContainer).getContainerElement();
    });

    afterEach(fakeAsync(() => {
      (SdTooltipDirective as unknown as { activeTooltip: unknown }).activeTooltip = null;
      flush();
      overlay.innerHTML = '';
    }));

    it('shows the name over an image avatar', fakeAsync(() => {
      render({ src: 'https://example.com/a.png', name: 'Lê Lan Anh' });
      circle().dispatchEvent(new MouseEvent('mouseenter'));
      tick(150);
      fixture.detectChanges();
      expect(overlay.querySelector('.c-sd-tooltip-container')?.textContent?.trim()).toBe('Lê Lan Anh');
    }));

    it('shows the status label over the dot', fakeAsync(() => {
      render({ status: 'success', statusLabel: 'Đang hoạt động' });
      const dot = host().querySelector('sd-badge') as HTMLElement;
      dot.dispatchEvent(new MouseEvent('mouseenter'));
      (dot.firstElementChild as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      tick(150);
      fixture.detectChanges();
      expect(overlay.querySelector('.c-sd-tooltip-container')?.textContent?.trim()).toBe('Đang hoạt động');
    }));
  });
});
