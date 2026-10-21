import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Color, Size } from '@sdcorejs/utils/models';
import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { SdBadge, SdBadgeType } from './badge.component';

// Badge geometry (design handoff wave 3 · 1a) on the shipped theme: fixed 20/24/28px heights, one line with
// ellipsis, counters, 12px descriptions, the tag border, the CSS dot, focus and the clickable hover.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdBadge, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div [style.width.px]="width" style="line-height: 40px">
      <sd-badge [type]="type" [size]="size" [title]="title" [icon]="icon" [description]="description" [color]="color" />
    </div>
  `,
})
class BadgeHost {
  type: SdBadgeType = 'round';
  size: Size = 'sm';
  title: string | number | null = 'Đã duyệt';
  icon: string | null = null;
  description: string | null = null;
  color: Color = 'success';
  width = 400;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdBadge, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <sd-badge [type]="type" title="Lọc: Mới" color="primary" (click)="clicks = clicks + 1" />
  `,
})
class ClickableBadgeHost {
  type: SdBadgeType = 'round';
  clicks = 0;
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

describe('SdBadge geometry with the shipped theme', () => {
  let fixture: ComponentFixture<BadgeHost>;
  let host: BadgeHost;

  const render = (patch: Partial<BadgeHost>) => {
    Object.assign(host, patch);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  };
  const root = () => fixture.nativeElement.querySelector('sd-badge').firstElementChild as HTMLElement;
  const title = () => fixture.nativeElement.querySelector('.c-badge-title') as HTMLElement;
  const icon = () => fixture.nativeElement.querySelector('sd-icon.c-material-icon') as HTMLElement;
  const box = (el: Element) => el.getBoundingClientRect();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BadgeHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(BadgeHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('size scale', () => {
    for (const [size, height, font, lineHeight, iconPx, tagRadius, gap] of [
      ['sm', 20, '12px', '16px', 14, '4px', '4px'],
      ['md', 24, '13px', '18px', 16, '6px', '4px'],
      ['lg', 28, '14px', '20px', 18, '6px', '6px'],
    ] as const) {
      it(`draws round and tag ${height}px high at ${size}, whatever the line-height around them`, () => {
        for (const type of ['round', 'tag'] as const) {
          render({ type, size, icon: 'check_circle' });
          expect(box(root()).height).withContext(`${type} height`).toBe(height);
          const text = getComputedStyle(title());
          expect(`${text.fontSize}/${text.lineHeight}`).withContext(`${type} text`).toBe(`${font}/${lineHeight}`);
          expect(text.fontWeight).withContext(`${type} weight`).toBe('500');
          expect(box(icon()).width).withContext(`${type} icon`).toBe(iconPx);
          expect(box(icon()).height).withContext(`${type} icon`).toBe(iconPx);
          expect(getComputedStyle(root()).columnGap).withContext(`${type} gap`).toBe(gap);
        }
        render({ type: 'round' });
        expect(getComputedStyle(root()).borderTopLeftRadius).toBe('999px');
        render({ type: 'tag' });
        expect(getComputedStyle(root()).borderTopLeftRadius).toBe(tagRadius);
      });
    }

    for (const [size, height, font, lineHeight, iconPx] of [
      ['sm', 20, '13px', '18px', 16],
      ['md', 24, '14px', '20px', 18],
      ['lg', 28, '14px', '20px', 18],
    ] as const) {
      // why: the HTML of the handoff draws type icon one step above round/tag (13px at sm) because it sits in
      // running text; the user chose the HTML over the badge.md table on 2026-10-21.
      it(`draws type icon at ${size} with ${font}/${lineHeight} --sd-text and a ${iconPx}px icon 6px from the text`, () => {
        render({ type: 'icon', size, icon: 'check_circle' });
        expect(box(root()).height).toBe(height);
        const text = getComputedStyle(title());
        expect(`${text.fontSize}/${text.lineHeight}`).toBe(`${font}/${lineHeight}`);
        expect(text.fontWeight).toBe('400');
        expect(text.color).toBe(resolve('color', 'var(--sd-text)'));
        expect(box(icon()).width).toBe(iconPx);
        expect(getComputedStyle(icon()).color).toBe(resolve('color', 'var(--sd-success-dark)'));
        expect(box(title()).left - box(icon()).right).toBeCloseTo(6, 0);
      });
    }

    it('pads round 0 8px at sm (0 8px 0 6px with an icon), 0 10px at md and 0 12px at lg', () => {
      render({ type: 'round', size: 'sm' });
      expect(getComputedStyle(root()).padding).toBe('0px 8px');
      render({ icon: 'check_circle' });
      expect(getComputedStyle(root()).padding).toBe('0px 8px 0px 6px');
      render({ icon: null, size: 'md' });
      expect(getComputedStyle(root()).padding).toBe('0px 10px');
      render({ size: 'lg' });
      expect(getComputedStyle(root()).padding).toBe('0px 12px');
    });

    it('pads tag 0 6px, 0 8px and 0 10px', () => {
      for (const [size, padding] of [
        ['sm', '0px 6px'],
        ['md', '0px 8px'],
        ['lg', '0px 10px'],
      ] as const) {
        render({ type: 'tag', size });
        expect(getComputedStyle(root()).padding).withContext(size).toBe(padding);
      }
    });
  });

  describe('colour', () => {
    it('borders the tag with --sd-*-dark mixed 22% into --sd-*-light, not the full dark colour', () => {
      render({ type: 'tag', color: 'success' });
      const style = getComputedStyle(root());
      expect(style.borderTopWidth).toBe('1px');
      expect(style.borderTopColor).toBe(resolve('color', 'color-mix(in srgb, var(--sd-success-dark) 22%, var(--sd-success-light))'));
      expect(style.backgroundColor).toBe(resolve('color', 'var(--sd-success-light)'));
      expect(style.color).toBe(resolve('color', 'var(--sd-success-dark)'));
    });

    it('draws the default mark of type icon as a CSS dot in the base colour: 8px at sm and md, 10px at lg', () => {
      for (const [size, px] of [
        ['sm', 8],
        ['md', 8],
        ['lg', 10],
      ] as const) {
        render({ type: 'icon', size, icon: null, color: 'warning' });
        expect(fixture.nativeElement.querySelector('sd-icon')).withContext('no glyph').toBeNull();
        const dot = fixture.nativeElement.querySelector('.c-badge-dot') as HTMLElement;
        expect(dot).withContext('css dot').not.toBeNull();
        expect(box(dot).width).withContext(size).toBe(px);
        expect(box(dot).height).withContext(size).toBe(px);
        expect(getComputedStyle(dot).borderTopLeftRadius).toBe('50%');
        expect(getComputedStyle(dot).backgroundColor).toBe(resolve('background-color', 'var(--sd-warning)'));
      }
    });
  });

  describe('one line', () => {
    for (const type of ['round', 'tag', 'icon'] as const) {
      it(`keeps a long ${type} title on one line with an ellipsis inside a 160px cell`, () => {
        render({ type, width: 160, icon: type === 'icon' ? null : 'schedule', title: 'Đã chuyển sang kế toán xử lý và chờ đối soát' });
        const text = title();
        expect(getComputedStyle(text).whiteSpace).toBe('nowrap');
        expect(getComputedStyle(text).textOverflow).toBe('ellipsis');
        expect(text.scrollWidth).withContext('text is cut').toBeGreaterThan(text.clientWidth);
        expect(box(root()).height).toBe(20);
        expect(box(root()).right)
          .withContext('stays inside the cell')
          .toBeLessThanOrEqual(box(fixture.nativeElement.querySelector('sd-badge').parentElement).right + 0.5);
      });
    }
  });

  describe('counter', () => {
    it('makes a one-digit round counter a 20px circle with tabular figures', () => {
      render({ type: 'round', title: 3 });
      expect(root().classList).toContain('c-badge--count');
      expect(box(root()).width).toBe(20);
      expect(box(root()).height).toBe(20);
      expect(getComputedStyle(root()).padding).toBe('0px 6px');
      expect(getComputedStyle(title()).fontVariantNumeric).toBe('tabular-nums');
      expect(getComputedStyle(root()).justifyContent).toBe('center');
    });

    it('uses min-width 24px and padding 0 7px at md, 28px and 0 8px at lg', () => {
      render({ type: 'round', title: 3, size: 'md' });
      expect(box(root()).width).toBe(24);
      expect(getComputedStyle(root()).padding).toBe('0px 7px');
      render({ size: 'lg' });
      expect(box(root()).width).toBe(28);
      expect(getComputedStyle(root()).padding).toBe('0px 8px');
    });

    it('shows "99+" above 99 and keeps the real number for screen readers', () => {
      render({ type: 'round', title: 150 });
      expect(title().textContent!.trim()).toBe('99+');
      expect(title().getAttribute('aria-hidden')).toBe('true');
      expect(root().querySelector('.sd-visually-hidden')?.textContent?.trim()).toBe('150');
    });

    it('treats 0 as a counter and a numeric string as text', () => {
      render({ type: 'round', title: 0 });
      expect(title().textContent!.trim()).toBe('0');
      expect(box(root()).width).toBe(20);
      render({ title: '12' });
      expect(root().classList).not.toContain('c-badge--count');
    });
  });

  describe('description', () => {
    it('sets the description of type icon in 12px/16px --sd-text-secondary and lines the icon up with the first line', () => {
      render({ type: 'icon', icon: 'check_circle', description: 'Bởi Nguyễn Văn A' });
      const desc = fixture.nativeElement.querySelector('.c-badge-description') as HTMLElement;
      const style = getComputedStyle(desc);
      expect(`${style.fontSize}/${style.lineHeight}`).toBe('12px/16px');
      expect(style.color).toBe(resolve('color', 'var(--sd-text-secondary)'));
      const iconCenter = box(icon()).top + box(icon()).height / 2;
      const titleCenter = box(title()).top + box(title()).height / 2;
      expect(Math.abs(iconCenter - titleCenter))
        .withContext('icon on the first line')
        .toBeLessThanOrEqual(1);
    });

    it('turns a tag with a description into a two-line block: 4px 8px padding, 6px corner, 13px/18px title', () => {
      render({ type: 'tag', icon: 'label', description: 'Gia hạn 12 tháng', title: 'Hợp đồng dài hạn' });
      const style = getComputedStyle(root());
      expect(style.padding).toBe('4px 8px');
      expect(style.borderTopLeftRadius).toBe('6px');
      expect(box(root()).height).toBe(4 + 18 + 16 + 4 + 2);
      const text = getComputedStyle(title());
      expect(`${text.fontSize}/${text.lineHeight}`).toBe('13px/18px');
      expect(text.fontWeight).toBe('500');
      const desc = getComputedStyle(fixture.nativeElement.querySelector('.c-badge-description'));
      expect(`${desc.fontSize}/${desc.lineHeight}`).toBe('12px/16px');
      const iconCenter = box(icon()).top + box(icon()).height / 2;
      expect(Math.abs(iconCenter - (box(title()).top + 9)))
        .withContext('icon on the first line')
        .toBeLessThanOrEqual(1);
    });
  });
});

describe('SdBadge clickable states with the shipped theme', () => {
  let fixture: ComponentFixture<ClickableBadgeHost>;

  const render = (type: SdBadgeType) => {
    fixture.componentInstance.type = type;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('sd-badge').firstElementChild as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ClickableBadgeHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(ClickableBadgeHost);
    fixture.detectChanges();
  });

  it('keeps the corner of the badge in the 2px focus ring', () => {
    for (const [type, radius] of [
      ['round', '999px'],
      ['tag', '4px'],
    ] as const) {
      const el = render(type);
      el.focus();
      const style = getComputedStyle(el);
      expect(style.outlineStyle).withContext(type).toBe('solid');
      expect(style.outlineWidth).withContext(type).toBe('2px');
      expect(style.outlineOffset).withContext(type).toBe('2px');
      expect(style.outlineColor).withContext(type).toBe(resolve('color', 'var(--sd-focus-ring-color)'));
      expect(style.borderTopLeftRadius).withContext(`${type} corner while focused`).toBe(radius);
      el.blur();
    }
  });

  it('mixes 6% --sd-*-dark into the background on hover and 10% while pressed', () => {
    for (const type of ['round', 'tag'] as const) {
      const style = getComputedStyle(render(type));
      expect(resolve('background-color', style.getPropertyValue('--badge-bg-hover')))
        .withContext(`${type} hover`)
        .toBe(resolve('background-color', 'color-mix(in srgb, var(--sd-primary-dark) 6%, var(--sd-primary-light))'));
      expect(resolve('background-color', style.getPropertyValue('--badge-bg-active')))
        .withContext(`${type} active`)
        .toBe(resolve('background-color', 'color-mix(in srgb, var(--sd-primary-dark) 10%, var(--sd-primary-light))'));
    }
    const rules = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules))
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText.includes('c-badge'));
    expect(rules.some(rule => rule.selectorText.includes(':hover') && rule.style.backgroundColor.includes('--badge-bg-hover')))
      .withContext(':hover rule')
      .toBeTrue();
    expect(rules.some(rule => rule.selectorText.includes(':active') && rule.style.backgroundColor.includes('--badge-bg-active')))
      .withContext(':active rule')
      .toBeTrue();
  });
});

describe('SdBadge without a click listener', () => {
  it('has no hover background', async () => {
    await TestBed.configureTestingModule({ imports: [BadgeHost, NoopAnimationsModule] }).compileComponents();
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('sd-badge').firstElementChild as HTMLElement;
    expect(getComputedStyle(el).getPropertyValue('--badge-bg-hover').trim()).toBe('');
  });
});
