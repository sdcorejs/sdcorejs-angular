import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { Color, Size } from '@sdcorejs/utils/models';
import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { SdBadge, SdBadgeType } from './badge.component';

// Types solid, dot and pair and the inputs `label` and `pulse` (design handoff wave 3 · 1b), on the shipped theme.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdBadge, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div [style.width.px]="width">
      <sd-badge
        [type]="type"
        [size]="size"
        [title]="title"
        [label]="label"
        [icon]="icon"
        [description]="description"
        [tooltip]="tooltip"
        [pulse]="pulse"
        [color]="color" />
    </div>
  `,
})
class TypesHost {
  type: SdBadgeType = 'solid';
  size: Size = 'sm';
  title: string | number | null = 'Quá hạn';
  label: string | null = null;
  icon: string | null = null;
  description: string | null = null;
  tooltip: string | null = null;
  pulse = false;
  color: Color = 'error';
  width = 400;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdBadge, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <sd-badge [type]="type" title="Đang hoạt động" label="SLA" color="primary" (click)="clicks = clicks + 1" />
  `,
})
class ClickableTypesHost {
  type: SdBadgeType = 'solid';
  clicks = 0;
}

type Rgb = [number, number, number];

/** The computed value of `property: value` on a probe that inherits the theme of <html>. */
const resolve = (property: string, value: string): string => {
  const probe = document.createElement('div');
  probe.style.setProperty(property, value);
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
};

/** rgb()/rgba() or `color(srgb r g b)` (what Chrome gives for color-mix) as 0–255 channels. */
const rgb = (value: string): Rgb => {
  const channels = (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number) as Rgb;
  return value.startsWith('color(srgb') ? (channels.map(c => c * 255) as Rgb) : channels;
};
const luminance = (color: Rgb) =>
  color
    .map(c => c / 255)
    .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const COLORS: Color[] = ['primary', 'secondary', 'info', 'success', 'warning', 'error'];

describe('SdBadge types solid, dot and pair with the shipped theme', () => {
  let fixture: ComponentFixture<TypesHost>;
  let host: TypesHost;

  const render = (patch: Partial<TypesHost>) => {
    Object.assign(host, patch);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  };
  const badge = () => fixture.nativeElement.querySelector('sd-badge') as HTMLElement;
  const root = () => badge().firstElementChild as HTMLElement;
  const box = (el: Element) => el.getBoundingClientRect();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TypesHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TypesHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('solid', () => {
    it('fills the pill with --sd-* and writes --sd-*-contrast on it, at least 4.5:1 for every colour', () => {
      for (const color of COLORS) {
        render({ color });
        const style = getComputedStyle(root());
        expect(style.backgroundColor)
          .withContext(color)
          .toBe(resolve('background-color', `var(--sd-${color})`));
        expect(style.color)
          .withContext(color)
          .toBe(resolve('color', `var(--sd-${color}-contrast)`));
        expect(contrast(rgb(style.color), rgb(style.backgroundColor)))
          .withContext(color)
          .toBeGreaterThanOrEqual(4.5);
      }
    });

    it('has the geometry of round: 20px, 999px corner, 0 8px (0 8px 0 6px with an icon), weight 500', () => {
      render({ color: 'warning' });
      expect(box(root()).height).toBe(20);
      expect(getComputedStyle(root()).borderTopLeftRadius).toBe('999px');
      expect(getComputedStyle(root()).padding).toBe('0px 8px');
      expect(getComputedStyle(root().querySelector('.c-badge-title')!).fontWeight).toBe('500');
      render({ icon: 'schedule' });
      expect(getComputedStyle(root()).padding).toBe('0px 8px 0px 6px');
      expect(box(root().querySelector('sd-icon')!).width).toBe(14);
      render({ icon: null, size: 'lg' });
      expect(box(root()).height).toBe(28);
    });

    it('is a counter when the title is a number', () => {
      render({ title: 4 });
      expect(root().classList).toContain('c-badge--count');
      expect(box(root()).width).toBe(20);
      render({ title: 120 });
      expect(root().querySelector('.c-badge-title')!.textContent!.trim()).toBe('99+');
    });

    it('ignores description', () => {
      render({ description: 'Bỏ qua' });
      expect(badge().querySelector('.c-badge-description')).toBeNull();
    });
  });

  describe('dot', () => {
    it('shows only a dot in the base colour, 8px at sm and md and 10px at lg', () => {
      for (const [size, px] of [
        ['sm', 8],
        ['md', 8],
        ['lg', 10],
      ] as const) {
        render({ type: 'dot', size, color: 'success', title: 'Đang hoạt động', icon: 'check_circle', description: 'x' });
        const dot = badge().querySelector('.c-badge-dot') as HTMLElement;
        expect(dot).withContext(size).not.toBeNull();
        expect(box(dot).width).withContext(size).toBe(px);
        expect(box(dot).height).withContext(size).toBe(px);
        expect(getComputedStyle(dot).backgroundColor).toBe(resolve('background-color', 'var(--sd-success)'));
        expect(badge().textContent!.trim()).withContext('title is not shown').toBe('');
        expect(badge().querySelector('sd-icon')).withContext('icon is ignored').toBeNull();
      }
    });

    it('names the dot from its title for screen readers', () => {
      render({ type: 'dot', title: 'Đang hoạt động' });
      expect(root().getAttribute('role')).toBe('img');
      expect(root().getAttribute('aria-label')).toBe('Đang hoạt động');
    });
  });

  describe('pulse', () => {
    const findRule = (test: (rule: CSSStyleRule) => boolean, media?: string) =>
      Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .flatMap(rule =>
          media === undefined ? [rule] : rule instanceof CSSMediaRule && rule.conditionText.includes(media) ? Array.from(rule.cssRules) : []
        )
        .some(rule => rule instanceof CSSStyleRule && test(rule));

    it('rings the dot of type dot with 28% of the colour and pulses every 1.6s', () => {
      render({ type: 'dot', color: 'success', pulse: true });
      const dot = badge().querySelector('.c-badge-dot') as HTMLElement;
      expect(dot.classList).toContain('c-badge-dot--pulse');
      const style = getComputedStyle(dot);
      expect(resolve('color', style.getPropertyValue('--badge-halo'))).toBe(
        resolve('color', 'color-mix(in srgb, var(--sd-success) 28%, transparent)')
      );
      // why: read the rule, not the computed animation — Chrome follows the OS animation setting, so on a machine
      // with reduced motion the computed animation is `none` (the reduced-motion rule below).
      expect(
        findRule(
          rule =>
            rule.selectorText.includes('c-badge-dot--pulse') &&
            rule.style.animationName.includes('sd-badge-pulse') &&
            rule.style.animationDuration === '1.6s' &&
            rule.style.animationIterationCount === 'infinite'
        )
      ).toBeTrue();
    });

    it('also pulses the dot of type icon without an icon, and nothing else', () => {
      render({ type: 'icon', pulse: true, icon: null });
      expect(badge().querySelector('.c-badge-dot--pulse')).withContext('icon without icon').not.toBeNull();
      render({ icon: 'check_circle' });
      expect(badge().querySelector('.c-badge-dot--pulse')).withContext('icon with icon').toBeNull();
      render({ type: 'round' });
      expect(badge().querySelector('.c-badge-dot--pulse')).withContext('round').toBeNull();
    });

    it('stops the animation and keeps a still ring under prefers-reduced-motion', () => {
      expect(
        findRule(
          rule =>
            rule.selectorText.includes('c-badge-dot--pulse') &&
            rule.style.animationName === 'none' &&
            rule.style.boxShadow.includes('--badge-halo'),
          'prefers-reduced-motion'
        )
      ).toBeTrue();
    });

    it('defaults to off and accepts a bare attribute', () => {
      render({ type: 'dot' });
      expect(badge().querySelector('.c-badge-dot--pulse')).toBeNull();
    });
  });

  describe('pair', () => {
    it('joins a secondary label (weight 400) and the coloured value (weight 500) in one 4px-corner box', () => {
      render({ type: 'pair', label: 'SLA', title: '4 giờ', color: 'warning' });
      const label = root().querySelector('.c-badge-pair-label') as HTMLElement;
      const value = root().querySelector('.c-badge-title') as HTMLElement;
      expect(label.textContent!.trim()).toBe('SLA');
      expect(value.textContent!.trim()).toBe('4 giờ');
      const labelStyle = getComputedStyle(label);
      expect(labelStyle.backgroundColor).toBe(resolve('background-color', 'var(--sd-secondary-light)'));
      expect(labelStyle.color).toBe(resolve('color', 'var(--sd-secondary-dark)'));
      expect(labelStyle.fontWeight).toBe('400');
      const valueStyle = getComputedStyle(value);
      expect(valueStyle.backgroundColor).toBe(resolve('background-color', 'var(--sd-warning-light)'));
      expect(valueStyle.color).toBe(resolve('color', 'var(--sd-warning-dark)'));
      expect(valueStyle.fontWeight).toBe('500');
      const rootStyle = getComputedStyle(root());
      expect(rootStyle.borderTopLeftRadius).toBe('4px');
      expect(rootStyle.overflow).toBe('hidden');
      expect(box(root()).height).toBe(20);
      expect(box(label).right).withContext('the two parts touch').toBeCloseTo(box(value).left, 0);
    });

    it('pads each part 0 6px / 0 8px / 0 10px with 12 / 13 / 14px text and a 6px corner from md', () => {
      for (const [size, height, padding, font, radius] of [
        ['sm', 20, '0px 6px', '12px', '4px'],
        ['md', 24, '0px 8px', '13px', '6px'],
        ['lg', 28, '0px 10px', '14px', '6px'],
      ] as const) {
        render({ type: 'pair', label: 'SLA', title: '4 giờ', size });
        for (const part of [root().querySelector('.c-badge-pair-label')!, root().querySelector('.c-badge-title')!]) {
          expect(getComputedStyle(part).padding).withContext(size).toBe(padding);
          expect(getComputedStyle(part).fontSize).withContext(size).toBe(font);
          expect(box(part).height).withContext(size).toBe(height);
        }
        expect(getComputedStyle(root()).borderTopLeftRadius).withContext(size).toBe(radius);
      }
    });

    it('cuts the value first and keeps the whole label', () => {
      render({ type: 'pair', label: 'Phiên bản', title: '2.3.1-beta.4 bản dựng thử nghiệm', width: 140 });
      const label = root().querySelector('.c-badge-pair-label') as HTMLElement;
      const value = root().querySelector('.c-badge-title') as HTMLElement;
      expect(label.scrollWidth).withContext('label kept').toBeLessThanOrEqual(label.clientWidth);
      expect(value.scrollWidth).withContext('value cut').toBeGreaterThan(value.clientWidth);
      expect(getComputedStyle(value).textOverflow).toBe('ellipsis');
      expect(box(root()).right).toBeLessThanOrEqual(box(badge().parentElement!).right + 0.5);
    });

    it('shows only the value when there is no label, and ignores description and icon', () => {
      render({ type: 'pair', label: null, title: '2.3.1', description: 'x', icon: 'label' });
      expect(root().querySelector('.c-badge-pair-label')).toBeNull();
      expect(root().querySelector('.c-badge-title')!.textContent!.trim()).toBe('2.3.1');
      expect(badge().querySelector('.c-badge-description')).toBeNull();
      expect(badge().querySelector('sd-icon')).toBeNull();
    });
  });
});

describe('SdBadge types solid, dot and pair when clickable', () => {
  let fixture: ComponentFixture<ClickableTypesHost>;

  const render = (type: SdBadgeType) => {
    fixture.componentInstance.type = type;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('sd-badge').firstElementChild as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ClickableTypesHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(ClickableTypesHost);
    fixture.detectChanges();
  });

  it('darkens solid by 6% of --sd-*-dark on hover and 10% while pressed', () => {
    const style = getComputedStyle(render('solid'));
    expect(resolve('background-color', style.getPropertyValue('--badge-bg-hover'))).toBe(
      resolve('background-color', 'color-mix(in srgb, var(--sd-primary-dark) 6%, var(--sd-primary))')
    );
    expect(resolve('background-color', style.getPropertyValue('--badge-bg-active'))).toBe(
      resolve('background-color', 'color-mix(in srgb, var(--sd-primary-dark) 10%, var(--sd-primary))')
    );
  });

  it('names an interactive pair from its label and value', () => {
    const el = render('pair');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('aria-label')).toBe('SLA Đang hoạt động');
  });

  it('gives a clickable dot a button role, its title as name and a 20px hit area', () => {
    const el = render('dot');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('aria-label')).toBe('Đang hoạt động');
    const hit = getComputedStyle(el, '::before');
    expect(hit.content).not.toBe('none');
    expect(hit.width).toBe('20px');
    expect(hit.height).toBe('20px');
    el.click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });
});

describe('SdBadge types — tooltip', () => {
  let overlay: HTMLElement;

  const bubble = () => overlay.querySelector('.c-sd-tooltip-container') as HTMLElement | null;
  const hover = (fixture: ComponentFixture<unknown>) => {
    const el = fixture.nativeElement.querySelector('sd-badge') as HTMLElement;
    el.dispatchEvent(new MouseEvent('mouseenter'));
    (el.firstElementChild as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    tick(150);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TypesHost, NoopAnimationsModule] }).compileComponents();
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(fakeAsync(() => {
    (SdTooltipDirective as unknown as { activeTooltip: unknown }).activeTooltip = null;
    flush();
    overlay.innerHTML = '';
  }));

  it('always shows the title of a dot as its tooltip', fakeAsync(() => {
    const fixture = TestBed.createComponent(TypesHost);
    Object.assign(fixture.componentInstance, { type: 'dot', title: 'Vắng mặt' });
    fixture.detectChanges();
    hover(fixture);
    expect(bubble()?.textContent?.trim()).toBe('Vắng mặt');
  }));

  it('shows the full value of a pair whose value is cut', fakeAsync(() => {
    const fixture = TestBed.createComponent(TypesHost);
    Object.assign(fixture.componentInstance, { type: 'pair', label: 'Phiên bản', title: '2.3.1-beta.4 bản dựng thử nghiệm', width: 140 });
    fixture.detectChanges();
    hover(fixture);
    expect(bubble()?.textContent?.trim()).toBe('2.3.1-beta.4 bản dựng thử nghiệm');
  }));
});
