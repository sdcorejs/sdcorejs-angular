import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { SdBadge, SdBadgeType } from './badge.component';

// Conditional tooltip (design handoff wave 3 · 1a, decision 5): a badge has a tooltip only when `tooltip` is set
// or when its text is cut, and it uses [sdTooltip] (overlay made on demand) instead of a matTooltip on every badge.
@Component({
  imports: [SdBadge],
  template: `
    <div [style.width.px]="width">
      <sd-badge [type]="type" [title]="title" [tooltip]="tooltip" color="warning" />
    </div>
  `,
})
class TooltipHost {
  type: SdBadgeType = 'round';
  title = 'Đã duyệt';
  tooltip: string | null = null;
  width = 400;
}

@Component({
  imports: [SdBadge],
  template: `
    <div style="width: 120px">
      <sd-badge type="round" title="Đã chuyển sang kế toán xử lý" (click)="clicks = clicks + 1" />
    </div>
  `,
})
class ClickableTooltipHost {
  clicks = 0;
}

@Component({
  imports: [SdBadge],
  template: `<sd-badge type="round" title="Đã duyệt" color="success" />`,
})
class StaticTitleHost {}

describe('SdBadge tooltip', () => {
  let overlay: HTMLElement;

  const bubble = () => overlay.querySelector('.c-sd-tooltip-container') as HTMLElement | null;
  /** The browser fires mouseenter on the host first, then on the inner root that carries [sdTooltip]. */
  const hover = (fixture: ComponentFixture<unknown>) => {
    const badge = fixture.nativeElement.querySelector('sd-badge') as HTMLElement;
    badge.dispatchEvent(new MouseEvent('mouseenter'));
    (badge.firstElementChild as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    tick(150);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipHost, ClickableTooltipHost, StaticTitleHost, NoopAnimationsModule],
    }).compileComponents();
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(fakeAsync(() => {
    (SdTooltipDirective as unknown as { activeTooltip: unknown }).activeTooltip = null;
    flush();
    overlay.innerHTML = '';
  }));

  it('does not attach matTooltip to the badge any more', () => {
    const fixture = TestBed.createComponent(TooltipHost);
    fixture.componentInstance.tooltip = 'Chi tiết';
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(MatTooltip))).toBeNull();
    expect(fixture.debugElement.query(By.directive(SdTooltipDirective))).not.toBeNull();
  });

  it('shows no tooltip when the title fits and no tooltip is set', fakeAsync(() => {
    const fixture = TestBed.createComponent(TooltipHost);
    fixture.detectChanges();
    hover(fixture);
    expect(bubble()).toBeNull();
  }));

  it('shows the tooltip input on hover, keeping its line breaks', fakeAsync(() => {
    const fixture = TestBed.createComponent(TooltipHost);
    fixture.componentInstance.tooltip = 'Phê duyệt lúc 14:30\nBởi Nguyễn Văn A';
    fixture.detectChanges();
    hover(fixture);
    expect(bubble()?.textContent?.trim()).toBe('Phê duyệt lúc 14:30\nBởi Nguyễn Văn A');
    expect(getComputedStyle(bubble()!.querySelector('.c-badge-tooltip')!).whiteSpace).toBe('pre-line');
  }));

  for (const type of ['round', 'tag', 'icon'] as const) {
    it(`shows the full ${type} title when the text is cut`, fakeAsync(() => {
      const fixture = TestBed.createComponent(TooltipHost);
      Object.assign(fixture.componentInstance, { type, width: 120, title: 'Đã chuyển sang kế toán xử lý' });
      fixture.detectChanges();
      hover(fixture);
      expect(bubble()?.textContent?.trim()).toBe('Đã chuyển sang kế toán xử lý');
    }));
  }

  it('shows the full title of a cut clickable badge when it gets keyboard focus', fakeAsync(() => {
    const fixture = TestBed.createComponent(ClickableTooltipHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('sd-badge').firstElementChild as HTMLElement;
    root.focus();
    root.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(bubble()?.textContent?.trim()).toBe('Đã chuyển sang kế toán xử lý');
  }));

  it('drops the native title attribute of the host so the browser adds no tooltip of its own', () => {
    const fixture = TestBed.createComponent(StaticTitleHost);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('sd-badge') as HTMLElement;
    expect(badge.hasAttribute('title')).toBeFalse();
    expect(badge.textContent?.trim()).toBe('Đã duyệt');
  });
});
