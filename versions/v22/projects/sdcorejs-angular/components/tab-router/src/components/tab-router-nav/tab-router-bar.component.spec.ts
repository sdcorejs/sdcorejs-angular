import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';

import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { I18nService } from '@sdcorejs/angular/i18n';
import { LayoutTestTheme } from '../../../../../testing/layout-theme.spec';
import { SdTabInfo, SdTabRouterTab } from '../../models/tab-router.model';
import { SdTabRouterService } from '../../services/tab-router.service';
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
    // why: như outlet — ReplaySubject(1) để danh sách tab (mở sau) vẫn đọc được tên đã gửi trước đó.
    tabInfoChanges: new ReplaySubject<SdTabInfo>(1),
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
    // why: từ 3b phần đệm 0 8px nằm trên vùng cuộn (nút danh sách tab nằm ngoài vùng cuộn, sát mép phải thanh).
    it('is 40px tall on --sd-tab-router-nav-bg with 0 8px padding around the tabs, aligned to the bottom', () => {
      const style = getComputedStyle(nav());
      const scroller = getComputedStyle(fixture.nativeElement.querySelector('.tab-router__scroller'));
      expect(nav().getBoundingClientRect().height).toBe(40);
      expect(scroller.paddingLeft).toBe('8px');
      expect(scroller.paddingRight).toBe('8px');
      expect(style.backgroundColor).toBe(resolve('background-color', 'var(--sd-tab-router-nav-bg)'));
      expect(scroller.alignItems).toBe('flex-end');
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

  // Thanh tab đợt 3 · 3d (design handoff `tab-router.md`, mục "Chấm chưa lưu").
  describe('unsaved dot (wave 3 · 3d)', () => {
    const dot = (i: number) => items()[i].querySelector('.tab-router__dirty') as HTMLElement | null;
    const close = (i: number) => items()[i].querySelector('.tab-router__close') as HTMLElement;
    const closeIcon = (i: number) => close(i).querySelector('sd-icon') as HTMLElement;
    const markDirty = (i: number, dirty = true) => {
      fixture.componentInstance.tabs[i].tabInfoChanges.next({ ...INFOS[i % INFOS.length], dirty });
      fixture.detectChanges();
    };

    it('shows an 8px --sd-text-secondary dot where the close button is, and no dot on a saved tab', () => {
      markDirty(2);
      expect(dot(0)).toBeNull();
      const box = dot(2)!.getBoundingClientRect();
      expect([box.width, box.height]).toEqual([8, 8]);
      expect(getComputedStyle(dot(2)!).backgroundColor).toBe(resolve('background-color', 'var(--sd-text-secondary)'));
      expect(close(2).contains(dot(2))).toBe(true);
      expect(getComputedStyle(close(2)).opacity)
        .withContext('the slot shows on a tab that is not open')
        .toBe('1');
      expect(getComputedStyle(closeIcon(2)).opacity).toBe('0');
    });

    it('turns the dot into the close button on hover or keyboard focus', () => {
      expect(cssRule(/\.tab-router__item--dirty:hover \.tab-router__dirty/)?.opacity).toBe('0');
      expect(cssRule(/\.tab-router__item--dirty:focus-visible \.tab-router__dirty/)?.opacity).toBe('0');
      expect(cssRule(/\.tab-router__item--dirty:hover \.tab-router__close sd-icon/)?.opacity).toBe('1');
      expect(cssRule(/\.tab-router__item--dirty \.tab-router__close:focus-visible sd-icon/)?.opacity).toBe('1');
    });

    it('keeps the dot on the open tab until hover, instead of its close button', () => {
      markDirty(1);
      expect(items()[1].classList).toContain('tab-router__item--active');
      expect(getComputedStyle(dot(1)!).opacity).toBe('1');
      expect(getComputedStyle(closeIcon(1)).opacity).toBe('0');
    });

    it('tells assistive technology that the tab has unsaved changes, and drops the dot once saved', () => {
      const i18n = TestBed.inject(I18nService);
      markDirty(2);
      expect(dot(2)!.getAttribute('aria-hidden')).toBe('true');
      const hidden = items()[2].querySelector('.sd-visually-hidden') as HTMLElement;
      expect(hidden.textContent!.trim()).toBe(i18n.t('core.component.tab-router.unsaved'));

      markDirty(2, false);
      expect(dot(2)).toBeNull();
      expect(items()[2].querySelector('.sd-visually-hidden')).toBeNull();
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

  // Thanh tab đợt 3 · 3b (design handoff `tab-router.md`, mục "Khi có nhiều tab"): cuộn ngang, lớp mờ ở cạnh còn tab
  // khuất, nút và menu danh sách tab.
  describe('many tabs (wave 3 · 3b)', () => {
    let i18n: I18nService;
    const scroller = () => fixture.nativeElement.querySelector('.tab-router__scroller') as HTMLElement;
    const listButton = () => fixture.nativeElement.querySelector('.tab-router__list-button') as HTMLButtonElement | null;
    const fade = (side: 'start' | 'end') => fixture.nativeElement.querySelector(`.tab-router__fade--${side}`) as HTMLElement | null;
    const overlay = () => TestBed.inject(OverlayContainer).getContainerElement();
    const menu = () => overlay().querySelector('.tab-router__menu') as HTMLElement | null;
    const rows = () => Array.from(overlay().querySelectorAll('.tab-router__menu-row')) as HTMLElement[];
    // why: đo sau render (afterNextRender) và sau ResizeObserver / sự kiện scroll — cả hai chạy ở frame sau.
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      fixture.detectChanges();
    };
    const scrollTo = async (left: number) => {
      scroller().scrollLeft = left;
      scroller().dispatchEvent(new Event('scroll'));
      await settle();
    };
    const openList = async () => {
      listButton()!.click();
      await settle();
    };

    beforeEach(() => {
      i18n = TestBed.inject(I18nService);
    });

    afterEach(() => (overlay().innerHTML = ''));

    it('needs no scrolling, list button or fade while the tabs fit at 120px', async () => {
      await settle();
      expect(scroller().scrollWidth).toBe(scroller().clientWidth);
      expect(listButton()).toBeNull();
      expect(fade('start')).toBeNull();
      expect(fade('end')).toBeNull();
    });

    it('scrolls horizontally with a hidden scrollbar once the tabs no longer fit', async () => {
      render({ tabs: makeTabs(16, 0) });
      await settle();
      const style = getComputedStyle(scroller());
      expect(style.overflowX).toBe('auto');
      expect(style.scrollbarWidth).toBe('none');
      expect(scroller().offsetHeight - scroller().clientHeight)
        .withContext('no scrollbar track')
        .toBe(0);
      expect(scroller().scrollWidth).toBeGreaterThan(scroller().clientWidth);
      expect(hosts()[0].getBoundingClientRect().width).toBe(120);
    });

    it('fades only the edges that still hide tabs, 32px from the bar colour', async () => {
      render({ tabs: makeTabs(16, 0) });
      await settle();
      expect(fade('start')).withContext('at the start').toBeNull();
      expect(fade('end')).withContext('at the start').not.toBeNull();
      const style = getComputedStyle(fade('end')!);
      expect(style.width).toBe('32px');
      expect(style.pointerEvents).toBe('none');
      expect(style.backgroundImage).toContain('linear-gradient');
      expect(fade('end')!.getAttribute('aria-hidden')).toBe('true');

      await scrollTo(200);
      expect(fade('start')).withContext('in the middle').not.toBeNull();
      expect(fade('end')).withContext('in the middle').not.toBeNull();

      await scrollTo(scroller().scrollWidth);
      expect(fade('start')).withContext('at the end').not.toBeNull();
      expect(fade('end')).withContext('at the end').toBeNull();
    });

    it('turns a vertical wheel over the bar into a horizontal scroll, only while it overflows', async () => {
      render({ tabs: makeTabs(16, 0) });
      await settle();
      const wheel = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
      scroller().dispatchEvent(wheel);
      expect(scroller().scrollLeft).toBe(100);
      expect(wheel.defaultPrevented).toBe(true);

      render({ tabs: makeTabs(4, 0) });
      await settle();
      const idle = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
      scroller().dispatchEvent(idle);
      expect(scroller().scrollLeft).toBe(0);
      expect(idle.defaultPrevented).withContext('the page keeps the wheel').toBe(false);
    });

    it('scrolls the open tab fully into view, clear of the fades, whenever the open tab changes', async () => {
      render({ tabs: makeTabs(16, 15) });
      await settle();
      const visible = (index: number) => {
        const box = scroller().getBoundingClientRect();
        const tab = hosts()[index].getBoundingClientRect();
        return tab.left >= box.left + (scroller().scrollLeft > 0 ? 32 : 0) - 0.5 && tab.right <= box.right + 0.5;
      };
      expect(scroller().scrollLeft).toBeGreaterThan(0);
      expect(visible(15)).withContext('last tab').toBe(true);

      render({ tabs: fixture.componentInstance.tabs.map((tab, i) => ({ ...tab, isActive: i === 6 })) });
      await settle();
      expect(visible(6)).withContext('a middle tab').toBe(true);

      render({ tabs: fixture.componentInstance.tabs.map((tab, i) => ({ ...tab, isActive: i === 0 })) });
      await settle();
      expect(scroller().scrollLeft).withContext('first tab').toBe(0);
    });

    it('shows a 30px list button with the tab count after a 1px divider, fixed at the end of the bar', async () => {
      render({ tabs: makeTabs(16, 0) });
      await settle();
      const button = listButton()!;
      expect(button).not.toBeNull();
      const wrap = button.parentElement as HTMLElement;
      expect(button.getBoundingClientRect().height).toBe(30);
      expect(getComputedStyle(button).borderTopLeftRadius).toBe('8px');
      const count = button.querySelector('.tab-router__list-count') as HTMLElement;
      expect(count.textContent!.trim()).toBe('16');
      expect(getComputedStyle(count).fontVariantNumeric).toBe('tabular-nums');
      expect(button.querySelector('sd-icon')!.textContent).toContain('expand_more');
      expect(getComputedStyle(wrap).borderLeftWidth).toBe('1px');
      expect(getComputedStyle(wrap).borderLeftColor).toBe(resolve('border-left-color', 'var(--sd-tab-router-item-divider)'));
      expect(wrap.getBoundingClientRect().right).toBe(nav().getBoundingClientRect().right);
      expect(scroller().getBoundingClientRect().right).toBeLessThanOrEqual(wrap.getBoundingClientRect().left);
      expect(button.getAttribute('aria-label')).toBe(i18n.t('core.component.tab-router.tab-list'));
      expect(button.getAttribute('aria-haspopup')).toBe('dialog');
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens a 320px list of every tab under the bar, the open tab tinted, and picks a tab from it', async () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      // why: ghim host ở góc trên trái và để thanh hẹp hơn khung Karma (~730px) — DOM của spec khác có thể đẩy thanh xuống
      // đáy khung, và thanh rộng hơn khung thì menu bị đẩy vào trong; cả hai làm số đo vị trí sai.
      Object.assign((fixture.nativeElement as HTMLElement).style, { position: 'fixed', top: '0', left: '0' });
      render({ tabs: makeTabs(16, 3), width: 640 });
      await settle();
      await openList();

      const panel = menu()!;
      expect(panel).not.toBeNull();
      expect(listButton()!.getAttribute('aria-expanded')).toBe('true');
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(panel.getBoundingClientRect().width).toBe(320);
      expect(getComputedStyle(panel).paddingTop).toBe('6px');
      expect(getComputedStyle(panel).borderTopLeftRadius).toBe(resolve('border-top-left-radius', 'var(--sd-panel-radius)'));
      const wrap = listButton()!.parentElement!.getBoundingClientRect();
      expect(panel.getBoundingClientRect().top - wrap.bottom)
        .withContext('4px under the bar')
        .toBeCloseTo(4, 0);
      expect(panel.getBoundingClientRect().right)
        .withContext('lined up with the button')
        .toBeCloseTo(listButton()!.getBoundingClientRect().right, 0);

      const title = panel.querySelector('.tab-router__menu-title') as HTMLElement;
      expect(title.textContent!.trim()).toBe(i18n.t('core.component.tab-router.open-tabs', { count: 16 }));
      expect(panel.getAttribute('aria-label')).toBe(title.textContent!.trim());
      const list = panel.querySelector('.tab-router__menu-list') as HTMLElement;
      expect(getComputedStyle(list).maxHeight).toBe('300px');
      expect(getComputedStyle(list).overflowY).toBe('auto');

      expect(rows().length).toBe(16);
      expect(rows()[0].getBoundingClientRect().height).toBe(36);
      expect(rows()[1].textContent).toContain(INFOS[1].name);
      const active = rows()[3];
      expect(getComputedStyle(active).backgroundColor).toBe(
        resolve('background-color', 'color-mix(in srgb, var(--sd-primary) 8%, transparent)')
      );
      expect(getComputedStyle(active).fontWeight).toBe('500');
      expect(active.querySelector('.tab-router__menu-tab')!.getAttribute('aria-current')).toBe('page');
      expect(rows()[0].querySelector('.tab-router__menu-tab')!.hasAttribute('aria-current')).toBe(false);

      (rows()[7].querySelector('.tab-router__menu-tab') as HTMLButtonElement).click();
      await settle();
      expect(navigate).toHaveBeenCalledOnceWith(['/tab/7'], { queryParams: {}, state: { switchTab: true } });
      expect(menu()).withContext('closes').toBeNull();
      expect(document.activeElement).withContext('focus back on the button').toBe(listButton());
    });

    it('closes a tab from the list with a close button named after the tab, shown on hover', async () => {
      const service = TestBed.inject(SdTabRouterService);
      const close = spyOn(service, 'close');
      render({ tabs: makeTabs(16, 0) });
      await settle();
      await openList();

      const button = rows()[2].querySelector('.tab-router__menu-close') as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBe(i18n.t('core.component.tab-router.close-tab'));
      expect(document.getElementById(button.getAttribute('aria-describedby')!)!.textContent!.trim()).toBe(INFOS[2].name);
      expect(getComputedStyle(button).opacity).toBe('0');
      expect(cssRule(/\.tab-router__menu-row:hover \.tab-router__menu-close/)?.opacity).toBe('1');
      button.click();
      expect(close).toHaveBeenCalledOnceWith(fixture.componentInstance.tabs[2]);
    });

    it('closes the list on Escape and returns focus to the button', async () => {
      render({ tabs: makeTabs(16, 0) });
      await settle();
      await openList();
      expect(menu()!.contains(document.activeElement)).withContext('focus moves into the list').toBe(true);

      menu()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      await settle();
      expect(menu()).toBeNull();
      expect(document.activeElement).toBe(listButton());
    });

    it('shows the latest tab info in the list, also info sent before the list opened', async () => {
      render({ tabs: makeTabs(16, 0) });
      await settle();
      fixture.componentInstance.tabs[5].tabInfoChanges.next({ name: 'Công nợ phải thu', icon: 'account_balance_wallet' });
      await openList();
      expect(rows()[5].textContent).toContain('Công nợ phải thu');
    });
  });

  // Thanh tab đợt 3 · 3c (design handoff `tab-router.md`, mục "Bàn phím, kéo thả, menu chuột phải").
  describe('keyboard, drag and context menu (wave 3 · 3c)', () => {
    let i18n: I18nService;
    const tabEls = () => Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const overlay = () => TestBed.inject(OverlayContainer).getContainerElement();
    const menu = () => overlay().querySelector('.tab-router__context-menu') as HTMLElement | null;
    const menuItems = () => Array.from(overlay().querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      fixture.detectChanges();
    };
    const key = (target: Element, init: KeyboardEventInit) => {
      const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
      target.dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };
    const tabStops = () => tabEls().map(tab => tab.getAttribute('tabindex'));

    beforeEach(() => {
      i18n = TestBed.inject(I18nService);
      // why: ghim host ở góc trên trái để số đo vị trí menu không phụ thuộc DOM của spec khác.
      Object.assign((fixture.nativeElement as HTMLElement).style, { position: 'fixed', top: '0', left: '0' });
    });

    afterEach(() => (overlay().innerHTML = ''));

    it('is a tablist with one tab stop, on the open tab', () => {
      const tablist = fixture.nativeElement.querySelector('[role="tablist"]') as HTMLElement;
      expect(tablist).not.toBeNull();
      expect(tablist.contains(tabEls()[0])).toBe(true);
      expect(tabStops()).toEqual(['-1', '0', '-1', '-1']);
    });

    it('moves focus with ←/→ (wrapping), Home and End, and takes the tab stop along without opening the tab', () => {
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      tabEls()[1].focus();

      key(tabEls()[1], { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tabEls()[2]);
      expect(tabStops()).toEqual(['-1', '-1', '0', '-1']);

      key(tabEls()[2], { key: 'End' });
      expect(document.activeElement).toBe(tabEls()[3]);
      key(tabEls()[3], { key: 'ArrowRight' });
      expect(document.activeElement).withContext('wraps to the first tab').toBe(tabEls()[0]);
      key(tabEls()[0], { key: 'ArrowLeft' });
      expect(document.activeElement).withContext('wraps to the last tab').toBe(tabEls()[3]);
      const home = key(tabEls()[3], { key: 'Home' });
      expect(document.activeElement).toBe(tabEls()[0]);
      expect(home.defaultPrevented).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('gives the tab stop back to the open tab once focus leaves the bar', () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      tabEls()[1].focus();
      key(tabEls()[1], { key: 'ArrowRight' });
      expect(tabStops()).toEqual(['-1', '-1', '0', '-1']);

      outside.focus();
      fixture.detectChanges();
      expect(tabStops()).toEqual(['-1', '0', '-1', '-1']);
      outside.remove();
    });

    it('closes the focused tab with Delete and moves focus to the tab on its right, or on its left at the end', async () => {
      const close = spyOn(TestBed.inject(SdTabRouterService), 'close');
      const tabs = fixture.componentInstance.tabs;
      tabEls()[1].focus();
      key(tabEls()[1], { key: 'ArrowRight' });

      key(tabEls()[2], { key: 'Delete' });
      expect(close).toHaveBeenCalledOnceWith(tabs[2]);
      render({ tabs: tabs.filter((_, i) => i !== 2) });
      await settle();
      expect(document.activeElement).withContext('the tab that was on its right').toBe(tabEls()[2]);
      expect(tabEls()[2].textContent).toContain(INFOS[2].name);

      key(tabEls()[2], { key: 'Delete' });
      render({ tabs: fixture.componentInstance.tabs.slice(0, 2) });
      await settle();
      expect(document.activeElement).withContext('the last tab: its left neighbour').toBe(tabEls()[1]);
    });

    it('floats the dragged tab with a shadow and four 8px corners, and marks the drop spot primary 12% with a thin ring', () => {
      const [first, second] = hosts();
      first.classList.add('cdk-drag-preview');
      second.classList.add('cdk-drag-placeholder');
      fixture.detectChanges();

      const preview = getComputedStyle(first.querySelector('.tab-router__item')!);
      expect([
        preview.borderTopLeftRadius,
        preview.borderTopRightRadius,
        preview.borderBottomLeftRadius,
        preview.borderBottomRightRadius,
      ]).toEqual(['8px', '8px', '8px', '8px']);
      expect(preview.boxShadow).not.toBe('none');
      expect(preview.backgroundColor).toBe(resolve('background-color', 'var(--sd-surface)'));
      expect(getComputedStyle(first, '::after').content).withContext('no divider on the floating tab').toBe('none');

      const spot = getComputedStyle(second.querySelector('.tab-router__item')!);
      expect(spot.backgroundColor).toBe(resolve('background-color', 'color-mix(in srgb, var(--sd-primary) 12%, transparent)'));
      expect(spot.boxShadow).toContain('inset');
      expect(getComputedStyle(second.querySelector('.tab-router__name')!).visibility).toBe('hidden');
    });

    // why: CDK mở bản kéo bằng popover (`popover="manual"`), mà style mặc định của popover có `overflow: auto`: bóng của
    // tab bị cắt theo khung vuông của host, chỉ còn vệt xám ở bốn góc ngoài phần bo tròn.
    it('lets the shadow of the dragged tab show around its corners when CDK opens it as a popover', () => {
      const [first] = hosts();
      first.classList.add('cdk-drag-preview');
      first.setAttribute('popover', 'manual');
      fixture.detectChanges();

      expect(getComputedStyle(first).overflow).toBe('visible');
    });

    it('locks dragging to the x axis', () => {
      const list = fixture.nativeElement.querySelector('.tab-router__scroller') as HTMLElement;
      expect(list.classList).toContain('cdk-drop-list');
      expect(cssRule(/cdk-drop-list-dragging sd-tab-router-item:not\(\.cdk-drag-placeholder\)/)?.transition).toContain('transform');
    });

    describe('context menu', () => {
      const rightClick = (index: number) => {
        const rect = tabEls()[index].getBoundingClientRect();
        const event = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          button: 2,
          clientX: rect.left + 20,
          clientY: rect.top + 10,
        });
        tabEls()[index].dispatchEvent(event);
        return { event, x: rect.left + 20, y: rect.top + 10 };
      };

      it('opens on right click at the pointer with "Close tab" (close icon) and "Close other tabs", 34px each', async () => {
        const { event, x, y } = rightClick(2);
        await settle();

        expect(event.defaultPrevented).withContext('no browser menu').toBe(true);
        const panel = menu()!;
        expect(panel).not.toBeNull();
        expect(panel.getAttribute('role')).toBe('menu');
        expect(panel.getBoundingClientRect().width).toBe(224);
        expect(panel.getBoundingClientRect().left).toBeCloseTo(x, 0);
        expect(panel.getBoundingClientRect().top).toBeCloseTo(y, 0);
        expect(getComputedStyle(panel).paddingTop).toBe('6px');
        expect(getComputedStyle(panel).borderTopLeftRadius).toBe(resolve('border-top-left-radius', 'var(--sd-panel-radius)'));

        const [closeItem, othersItem] = menuItems();
        expect(menuItems().length).toBe(2);
        expect(closeItem.getBoundingClientRect().height).toBe(34);
        expect(closeItem.textContent).toContain(i18n.t('core.component.tab-router.close-tab'));
        expect(closeItem.querySelector('sd-icon')!.textContent).toContain('close');
        expect(othersItem.textContent!.trim()).toBe(i18n.t('core.component.tab-router.close-others'));
        expect(othersItem.querySelector('sd-icon')).toBeNull();
        expect(document.activeElement).withContext('focus on the first item').toBe(closeItem);
      });

      it('closes the tab from "Close tab", then gives focus back to the tab', async () => {
        const close = spyOn(TestBed.inject(SdTabRouterService), 'close');
        rightClick(2);
        await settle();

        menuItems()[0].click();
        await settle();

        expect(close).toHaveBeenCalledOnceWith(fixture.componentInstance.tabs[2]);
        expect(menu()).toBeNull();
        expect(document.activeElement).toBe(tabEls()[2]);
      });

      it('closes the other tabs from "Close other tabs"', async () => {
        const closeOthers = spyOn(TestBed.inject(SdTabRouterService), 'closeOthers');
        rightClick(0);
        await settle();

        menuItems()[1].click();
        await settle();

        expect(closeOthers).toHaveBeenCalledOnceWith(fixture.componentInstance.tabs[0]);
        expect(menu()).toBeNull();
      });

      it('opens on the focused tab with Shift+F10 or the Menu key, under the tab, only once', async () => {
        tabEls()[1].focus();
        key(tabEls()[1], { key: 'ArrowRight' });
        const shiftF10 = key(tabEls()[2], { key: 'F10', shiftKey: true });
        await settle();
        expect(shiftF10.defaultPrevented).toBe(true);
        expect(menu()).not.toBeNull();
        const tab = tabEls()[2].getBoundingClientRect();
        expect(menu()!.getBoundingClientRect().left).toBeCloseTo(tab.left, 0);
        expect(menu()!.getBoundingClientRect().top).toBeGreaterThanOrEqual(tab.bottom);

        // why: trình duyệt phát thêm `contextmenu` sau phím Menu / Shift+F10 — không mở menu thứ hai.
        tabEls()[2].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
        await settle();
        expect(overlay().querySelectorAll('.tab-router__context-menu').length).toBe(1);

        menu()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        await settle();
        key(tabEls()[2], { key: 'ContextMenu' });
        await settle();
        expect(menu()).not.toBeNull();
      });

      it('moves between items with ↑/↓ and closes on Escape with focus back on the tab', async () => {
        rightClick(3);
        await settle();

        menuItems()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        expect(document.activeElement).toBe(menuItems()[1]);
        menuItems()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        expect(document.activeElement).withContext('wraps').toBe(menuItems()[0]);
        menuItems()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
        expect(document.activeElement).toBe(menuItems()[1]);

        menu()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        await settle();
        expect(menu()).toBeNull();
        expect(document.activeElement).toBe(tabEls()[3]);
      });
    });
  });
});
