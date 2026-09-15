import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LucideCircleAlert, LucideTriangleAlert } from '@lucide/angular';
import { provideSdIcon } from '@sdcorejs/angular/modules/icon';
import { SdInform } from './inform.component';
import { SdInformActionDirective } from './inform-action.directive';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdInform, SdInformActionDirective],
  template: `
    <sd-inform warning closable title="Fallback title" description="Fallback body" actionLabel="Fallback action" (sdClosed)="closed = true">
      <strong class="custom-title">Custom title</strong>
      <button class="custom-action" (click)="clicked = true">Custom action</button>
      <button sdInformAction class="legacy-action">Legacy action</button>
    </sd-inform>
  `,
})
class ContentHost {
  closed = false;
  clicked = false;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdInform, SdInformActionDirective],
  template: `<sd-inform title="Fallback title" description="Fallback body" actionLabel="Fallback action">
    <button sdInformAction class="legacy-action">Legacy action</button>
  </sd-inform>`,
})
class ActionOnlyHost {}

describe('SdInform content and alignment', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SdInform, ContentHost, ActionOnlyHost, NoopAnimationsModule] }));

  it('replaces title, body and actions with content while retaining icon and functional close', () => {
    const f = TestBed.createComponent(ContentHost);
    f.detectChanges();
    const root: HTMLElement = f.nativeElement;
    expect(root.querySelector('.c-inform-content .custom-title')?.textContent).toBe('Custom title');
    expect(root.textContent).not.toContain('Fallback');
    expect(root.querySelector('.legacy-action')).toBeNull();
    expect(root.querySelector('.c-inform-icon-tile')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('.custom-action')?.click();
    expect(f.componentInstance.clicked).toBeTrue();
    root.querySelector<HTMLButtonElement>('.c-inform-close')?.click();
    f.detectChanges();
    expect(f.componentInstance.closed).toBeTrue();
    expect(root.querySelector('.c-inform')).toBeNull();
  });

  it('keeps title and description when only sdInformAction is projected', () => {
    const f = TestBed.createComponent(ActionOnlyHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.c-inform-title')?.textContent).toBe('Fallback title');
    expect(f.nativeElement.querySelector('.c-inform-body')?.textContent).toContain('Fallback body');
    expect(f.nativeElement.querySelector('.c-inform-action .legacy-action')).not.toBeNull();
    expect(f.nativeElement.querySelector('.c-inform-action-link')).toBeNull();
  });

  for (const actionLabel of [undefined, 'Retry']) {
    it(`centers a title without description against the icon (action: ${actionLabel})`, () => {
      const f = TestBed.createComponent(SdInform);
      f.componentRef.setInput('title', 'Title only');
      f.componentRef.setInput('actionLabel', actionLabel);
      f.componentRef.setInput('closable', true);
      f.detectChanges();
      const title = f.nativeElement.querySelector('.c-inform-title').getBoundingClientRect();
      const icon = f.nativeElement.querySelector('.c-inform-icon-tile').getBoundingClientRect();
      expect(Math.abs(title.top + title.height / 2 - icon.top - icon.height / 2)).toBeLessThan(1);
    });
  }

  for (const [color, name] of [
    ['warning', 'warning_amber'],
    ['error', 'report_gmailerrorred'],
  ]) {
    it(`uses an outline glyph for ${color}`, () => {
      const f = TestBed.createComponent(SdInform);
      f.componentRef.setInput('color', color);
      f.detectChanges();
      expect(f.nativeElement.querySelector('.c-inform-icon mat-icon')?.textContent.trim()).toBe(name);
    });

    it(`renders the ${color} outline icon with the consumer's Lucide provider`, () => {
      TestBed.configureTestingModule({
        providers: [provideSdIcon({ defaultFontSet: 'lucide', lucideIcons: [LucideCircleAlert, LucideTriangleAlert] })],
      });
      const f = TestBed.createComponent(SdInform);
      f.componentRef.setInput('color', color);
      f.detectChanges();
      expect(f.nativeElement.querySelector('.c-inform-icon svg')).not.toBeNull();
      expect(f.nativeElement.querySelector('.c-inform-icon svg')?.childElementCount).toBeGreaterThan(0);
      expect(f.nativeElement.querySelector('.c-inform-icon mat-icon')).toBeNull();
    });
  }
});
