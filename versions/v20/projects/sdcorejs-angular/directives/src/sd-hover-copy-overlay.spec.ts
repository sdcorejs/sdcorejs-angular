import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { LayoutTestTheme } from '../../testing/layout-theme.spec';
import { SdHoverCopyDirective } from './sd-hover-copy.directive';

@Component({
  imports: [SdHoverCopyDirective, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="overflow: hidden; width: 260px; margin: 80px 24px">
      <table style="width: 100%; border-collapse: separate">
        <tr style="position: relative; z-index: 20; background: white">
          <td style="height: 40px">Previous row</td>
        </tr>
        <tr>
          <td style="height: 40px; overflow: hidden" sdHoverCopy="cell-value" [sdHoverCopyDisabled]="disabled">Cell value</td>
        </tr>
      </table>
    </div>
  `,
})
class ClippedCopyHost {
  disabled = false;
}

describe('SdHoverCopy overlay in table cells', () => {
  let fixture: ComponentFixture<ClippedCopyHost>;
  let overlays: HTMLElement;
  let cell: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ClippedCopyHost] });
    spyOn(BrowserUtilities, 'copyToClipboard');
    fixture = TestBed.createComponent(ClippedCopyHost);
    fixture.detectChanges();
    cell = fixture.nativeElement.querySelector('[sdHoverCopy]');
    overlays = TestBed.inject(OverlayContainer).getContainerElement();
  });

  function copy() {
    cell.dispatchEvent(new MouseEvent('mouseenter'));
    (cell.querySelector('button:last-of-type') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick();
  }

  it('paints the copied tooltip above adjacent rows outside the clipped cell', fakeAsync(() => {
    copy();
    const tooltip = overlays.querySelector('[role="tooltip"]') as HTMLElement | null;
    expect(tooltip).not.toBeNull();
    if (!tooltip) return;
    const rect = tooltip.getBoundingClientRect();
    expect(rect.height).toBeGreaterThan(0);
    expect(getComputedStyle(tooltip.closest('.cdk-overlay-pane')!).pointerEvents).toBe('none');
    expect(rect.top).toBeLessThan(cell.getBoundingClientRect().top);
    // why: tooltip intentionally ignores pointer events; enable hit testing only for the paint-order probe.
    tooltip.style.pointerEvents = 'auto';
    expect(tooltip.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))).toBeTrue();
    tooltip.style.pointerEvents = 'none';
    tick(1000);
    expect(overlays.querySelector('[role="tooltip"]')).toBeNull();
  }));

  it('keeps one button and cleans up the overlay on scroll, disable and destroy', fakeAsync(() => {
    expect(cell.querySelectorAll('button').length).toBe(1);
    copy();
    cell.parentElement!.dispatchEvent(new Event('scroll'));
    expect(overlays.querySelector('[role="tooltip"]')).toBeNull();
    copy();
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    expect(cell.querySelector('button')).toBeNull();
    expect(overlays.querySelector('.cdk-overlay-pane')).toBeNull();
    fixture.componentInstance.disabled = false;
    fixture.detectChanges();
    copy();
    fixture.destroy();
    expect(overlays.querySelector('.cdk-overlay-pane')).toBeNull();
  }));

  it('flips below the button when the cell is at the top of the viewport', fakeAsync(() => {
    const table = cell.closest('table')!;
    Object.assign(table.parentElement!.style, { position: 'fixed', top: '0', margin: '0' });
    table.rows[0].style.display = 'none';
    copy();
    const tooltip = overlays.querySelector('[role="tooltip"]');
    expect(tooltip).not.toBeNull();
    if (!tooltip) return;
    const rect = tooltip.getBoundingClientRect();
    expect(rect.top).toBeGreaterThanOrEqual(cell.querySelector('button')!.getBoundingClientRect().bottom);
    expect(rect.left).toBeGreaterThanOrEqual(8);
    fixture.destroy();
  }));
});
