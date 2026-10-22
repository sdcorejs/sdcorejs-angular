import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { LayoutTestTheme } from '../../../../../testing/layout-theme.spec';
import { SdTabInfo, SdTabRouterTab } from '../../models/tab-router.model';
import { SdTabRouterItemComponent } from '../tab-router-item/tab-router-item.component';
import { SdTabRouterNavComponent } from './tab-router-nav.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-tab-bar-dummy',
  standalone: true,
  template: '',
})
class DummyTabComponent {}

const INFOS: SdTabInfo[] = [
  { name: 'Tổng quan', icon: 'dashboard' },
  { name: 'Đơn hàng #DH-10234', icon: 'receipt_long', color: 'success' },
  { name: 'Danh sách khách hàng', icon: 'group' },
  { name: 'Báo cáo doanh thu quý 3 năm 2026 theo từng chi nhánh', tooltip: 'Báo cáo doanh thu' },
];

// why: key mới cho mỗi lần dựng — @for của nav track theo key, key trùng thì item cũ được giữ lại cùng subscription
// tới Subject của tab cũ.
let batch = 0;
const makeTabs = (count: number, active = 1): SdTabRouterTab[] => {
  batch++;
  return Array.from({ length: count }, (_, i) => ({
    key: `tab-${batch}-${i}`,
    component: DummyTabComponent,
    isActive: i === active,
    url: `/tab/${i}`,
    queryParams: {},
    params: {},
    data: {},
    tabInfoChanges: new Subject<SdTabInfo>(),
  }));
};

// Thanh tab đợt 3 · 3a (design handoff `tab-router.md`, mục "Thanh tab").
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTabRouterNavComponent, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div [style.width.px]="width">
      <sd-tab-router-nav [tabs]="tabs" />
    </div>
  `,
})
class BarHost {
  width = 900;
  tabs: SdTabRouterTab[] = makeTabs(4);
}

const resolve = (property: string, value: string): string => {
  const probe = document.createElement('div');
  probe.style.setProperty(property, value);
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
};

/** The first style rule whose selector (without the emulated `[_ngcontent…]` attributes) matches, optionally inside a media rule. */
const cssRule = (selector: RegExp, media?: RegExp): CSSStyleDeclaration | undefined => {
  const strip = (text: string) => text.replace(/\[_ng(content|host)-[^\]]*\]/g, '');
  const walk = (rules: CSSRuleList, inMedia: boolean): CSSStyleDeclaration | undefined => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule) {
        if (media && media.test(rule.conditionText)) {
          const found = walk(rule.cssRules, true);
          if (found) return found;
        }
      } else if (rule instanceof CSSStyleRule && inMedia === !!media && selector.test(strip(rule.selectorText))) {
        return rule.style;
      }
    }
    return undefined;
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    const found = walk(rules, false);
    if (found) return found;
  }
  return undefined;
};

describe('SdTabRouterNav bar (wave 3 · 3a)', () => {
  let fixture: ComponentFixture<BarHost>;

  const render = (patch: Partial<BarHost>) => {
    Object.assign(fixture.componentInstance, patch);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    pushInfos();
  };
  const pushInfos = () => {
    fixture.componentInstance.tabs.forEach((tab, i) => tab.tabInfoChanges.next(INFOS[i % INFOS.length]));
    fixture.detectChanges();
  };
  const nav = () => fixture.nativeElement.querySelector('.tab-router__nav') as HTMLElement;
  const hosts = () => Array.from(fixture.nativeElement.querySelectorAll('sd-tab-router-item')) as HTMLElement[];
  const items = () => Array.from(fixture.nativeElement.querySelectorAll('.tab-router__item')) as HTMLElement[];
  const itemCmps = () =>
    fixture.debugElement.queryAll(By.directive(SdTabRouterItemComponent)).map(d => d.componentInstance as SdTabRouterItemComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarHost, NoopAnimationsModule],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BarHost);
    fixture.detectChanges();
    pushInfos();
  });

  describe('bar', () => {
    it('is 40px tall with 0 8px padding on --sd-tab-router-nav-bg, tabs aligned to the bottom', () => {
      const style = getComputedStyle(nav());
      expect(nav().getBoundingClientRect().height).toBe(40);
      expect(style.paddingLeft).toBe('8px');
      expect(style.paddingRight).toBe('8px');
      expect(style.backgroundColor).toBe(resolve('background-color', 'var(--sd-tab-router-nav-bg)'));
      expect(style.alignItems).toBe('flex-end');
      expect(items()[0].getBoundingClientRect().bottom).toBe(nav().getBoundingClientRect().bottom);
    });

    it('hides itself with one tab or none, and shows from the second tab', () => {
      // why: đo chiều cao cuối chứ không đo giữa chừng 150ms (Chrome CI không bật reduced-motion).
      nav().style.transition = 'none';
      for (const count of [0, 1]) {
        render({ tabs: makeTabs(count, 0) });
        const style = getComputedStyle(nav());
        expect(nav().getBoundingClientRect().height).withContext(`${count} tab`).toBe(0);
        expect(style.visibility).withContext(`${count} tab`).toBe('hidden');
      }
      render({ tabs: makeTabs(2, 0) });
      expect(nav().getBoundingClientRect().height).toBe(40);
      expect(getComputedStyle(nav()).visibility).toBe('visible');
    });

    it('grows from 0 to 40px over 150ms, without motion under prefers-reduced-motion', () => {
      expect(cssRule(/^\.tab-router__nav$/)?.transition).toMatch(/^height (150ms|0.15s)/);
      expect(cssRule(/^\.tab-router__nav,\s*\.tab-router__nav--hidden$/, /prefers-reduced-motion:\s*reduce/)?.transition).toMatch(/^none/);
    });
  });

  describe('tab', () => {
    it('prefers 200px, shrinks to 120px at least, is 34px tall with 0 6px 0 12px padding and 8px top corners', () => {
      const box = items()[0].getBoundingClientRect();
      expect(hosts()[0].getBoundingClientRect().width).toBe(200);
      expect(box.height).toBe(34);
      const style = getComputedStyle(items()[0]);
      expect([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]).toEqual(['0px', '6px', '0px', '12px']);
      expect(style.columnGap).toBe('8px');
      expect([style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius]).toEqual(['8px', '8px', '0px']);

      render({ tabs: makeTabs(4), width: 500 });
      expect(hosts()[0].getBoundingClientRect().width).toBeCloseTo((500 - 16) / 4, 0);
      render({ tabs: makeTabs(8), width: 500 });
      expect(hosts()[0].getBoundingClientRect().width).toBe(120);
    });

    it('draws a tab that is not open with no background and --sd-tab-router-item-text', () => {
      const style = getComputedStyle(items()[0]);
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.color).toBe(resolve('color', 'var(--sd-tab-router-item-text)'));
      expect(style.fontWeight).toBe('400');
    });

    it('draws the open tab on --sd-tab-router-item-active-bg with --sd-text at weight 500', () => {
      const style = getComputedStyle(items()[1]);
      expect(style.backgroundColor).toBe(resolve('background-color', 'var(--sd-tab-router-item-active-bg)'));
      expect(style.color).toBe(resolve('color', 'var(--sd-text)'));
      expect(style.fontWeight).toBe('500');
    });

    it('hovers with --sd-tab-router-item-hover-bg, and the open tab keeps its own background', () => {
      expect(cssRule(/^\.tab-router__item:hover$/)?.background).toBe('var(--sd-tab-router-item-hover-bg)');
      expect(cssRule(/^\.tab-router__item--active:hover$/)?.background).toBe('var(--sd-tab-router-item-active-bg)');
    });

    it('outlines the open tab in CanvasText under forced colours, where backgrounds are dropped', () => {
      const rule = cssRule(/^\.tab-router__item--active$/, /forced-colors:\s*active/);
      expect(rule?.outlineStyle).toBe('solid');
      expect(rule?.outlineColor.toLowerCase()).toBe('canvastext');
    });

    it('rings focus inside the tab with the 2px focus ring', () => {
      const rule = cssRule(/^\.tab-router__item:focus-visible$/);
      expect(rule?.outlineOffset).toBe('-2px');
      expect(rule?.outline).toContain('var(--sd-focus-ring-color');
    });
  });

  describe('content', () => {
    it('renders a 16px icon in the dark shade of SdTabInfo.color (primary by default) and the name, without sd-badge', () => {
      expect(fixture.nativeElement.querySelector('sd-badge')).toBeNull();
      const icons = items().map(item => item.querySelector('.tab-router__icon') as HTMLElement | null);
      expect(icons[0]!.getBoundingClientRect().width).toBe(16);
      expect(getComputedStyle(icons[0]!).fontSize).toBe('16px');
      expect(getComputedStyle(icons[0]!).color).toBe(resolve('color', 'var(--sd-primary-dark)'));
      expect(getComputedStyle(icons[1]!).color).toBe(resolve('color', 'var(--sd-success-dark)'));
      expect(icons[3]).withContext('no icon, nothing in its place').toBeNull();
      expect(items()[3].querySelector('.tab-router__name')!.textContent!.trim()).toBe(INFOS[3].name);
    });

    it('sets the name in 13px/18px on one line with an ellipsis', () => {
      const name = items()[3].querySelector('.tab-router__name') as HTMLElement;
      const style = getComputedStyle(name);
      expect(style.fontSize).toBe('13px');
      expect(style.lineHeight).toBe('18px');
      expect(style.whiteSpace).toBe('nowrap');
      expect(style.textOverflow).toBe('ellipsis');
      expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    });

    it('shows a tooltip only when the name is cut off or the builder sets one', () => {
      render({ tabs: makeTabs(3), width: 900 });
      fixture.componentInstance.tabs[2].tabInfoChanges.next({ name: 'Một tên rất dài không vừa trong hai trăm điểm ảnh của tab' });
      fixture.detectChanges();
      itemCmps().forEach(cmp => cmp.measureTruncation());
      fixture.detectChanges();
      const tooltips = fixture.debugElement
        .queryAll(By.directive(SdTooltipDirective))
        .map(d => d.injector.get(SdTooltipDirective).content());
      expect(tooltips[0]).withContext('short name').toBe('');
      expect(tooltips[2]).withContext('cut off').toBe('Một tên rất dài không vừa trong hai trăm điểm ảnh của tab');

      render({ tabs: makeTabs(4), width: 900 });
      itemCmps().forEach(cmp => cmp.measureTruncation());
      fixture.detectChanges();
      const withBuilder = fixture.debugElement.queryAll(By.directive(SdTooltipDirective))[3].injector.get(SdTooltipDirective).content();
      expect(withBuilder).toBe('Báo cáo doanh thu');
    });
  });

  describe('close button', () => {
    it('is 20×20 with 6px corners and a 14px icon', () => {
      const close = items()[1].querySelector('.tab-router__close') as HTMLElement;
      const box = close.getBoundingClientRect();
      expect([box.width, box.height]).toEqual([20, 20]);
      expect(getComputedStyle(close).borderTopLeftRadius).toBe('6px');
      expect(getComputedStyle(close.querySelector('sd-icon')!).fontSize).toBe('14px');
    });

    it('always shows on the open tab and only on hover or focus elsewhere', () => {
      const opacity = (i: number) => getComputedStyle(items()[i].querySelector('.tab-router__close')!).opacity;
      expect(opacity(1)).toBe('1');
      expect(opacity(0)).toBe('0');
      expect(cssRule(/\.tab-router__item:hover \.tab-router__close/)?.opacity).toBe('1');
      expect(cssRule(/\.tab-router__item:focus-visible \.tab-router__close/)?.opacity).toBe('1');
      expect(cssRule(/^\.tab-router__close:hover$/)?.background).toBe('color-mix(in srgb, var(--sd-text) 8%, transparent)');
    });

    it('always shows under pointer: coarse with a 32px hit area', () => {
      expect(cssRule(/^\.tab-router__close$/, /pointer:\s*coarse/)?.opacity).toBe('1');
      expect(cssRule(/^\.tab-router__close::before$/, /pointer:\s*coarse/)?.inset).toBe('-6px');
    });
  });

  describe('divider', () => {
    const after = (i: number) => getComputedStyle(hosts()[i], '::after');

    it('draws a 1×16px --sd-tab-router-item-divider line at the right of a tab', () => {
      render({ tabs: makeTabs(4, 3) });
      const style = after(0);
      expect(style.width).toBe('1px');
      expect(style.height).toBe('16px');
      expect(style.backgroundColor).toBe(resolve('background-color', 'var(--sd-tab-router-item-divider)'));
      expect(style.opacity).toBe('1');
    });

    it('hides on both sides of the open tab and after the last tab', () => {
      render({ tabs: makeTabs(4, 1) });
      expect(after(0).opacity).withContext('left of the open tab').toBe('0');
      expect(after(1).opacity).withContext('right of the open tab').toBe('0');
      expect(after(2).opacity).toBe('1');
      expect(after(3).content).withContext('last tab').toBe('none');
    });

    it('hides on both sides of the hovered tab', () => {
      expect(cssRule(/sd-tab-router-item:hover::after/)?.opacity).toBe('0');
      expect(cssRule(/sd-tab-router-item:has\(\+ sd-tab-router-item:hover\)::after/)?.opacity).toBe('0');
    });
  });
});
