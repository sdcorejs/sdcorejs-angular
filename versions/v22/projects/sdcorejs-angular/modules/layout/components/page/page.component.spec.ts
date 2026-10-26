import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { SdBadge, type SdBadgeData } from '@sdcorejs/angular/components/badge';
import { I18nService } from '@sdcorejs/angular/i18n';

import { SdPageComponent, type SdPageWidth } from './page.component';

const page = (fixture: ComponentFixture<unknown>): HTMLElement => fixture.nativeElement.querySelector('sd-page');

// why: màn cũ (generic-list, not-found, consumer) chỉ dùng title/description và slot headerLeft/headerRight.
// Chúng phải render y như trước khi chưa có P0.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdPageComponent],
  template: `
    <sd-page [title]="title()" [description]="description()">
      <div id="body">Nội dung</div>
    </sd-page>
  `,
})
class PlainHost {
  readonly title = signal('Đơn hàng');
  readonly description = signal('Đơn bán lẻ từ mọi kênh.');
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdPageComponent],
  template: `<sd-page [backLink]="backLink()" [title]="'Đơn ĐH-2400'" description="Tạo lúc 08:30"></sd-page>`,
})
class BackLinkHost {
  readonly backLink = signal<string | readonly unknown[] | null>('/orders');
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdPageComponent],
  template: `
    <sd-page backLink="/orders" title="Đơn ĐH-2400">
      <div headerLeft id="custom-left">Khác</div>
    </sd-page>
  `,
})
class BackLinkWithLeftHost {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdPageComponent],
  template: `
    <sd-page>
      <div headerLeft class="d-flex flex-column" id="legacy-left"><h1 class="T20M m-0">Danh sách</h1></div>
      <div headerRight id="legacy-right">Tạo mới</div>
    </sd-page>
    <sd-page>
      <div sdHeaderLeft id="alias-left">Trái</div>
      <div sdHeaderRight id="alias-right">Phải</div>
    </sd-page>
  `,
})
class HeaderSlotHost {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdPageComponent],
  template: `<sd-page title="Đơn ĐH-2400" [badges]="badges()"></sd-page>`,
})
class BadgeHost {
  readonly badges = signal<readonly SdBadgeData[] | null>(null);
}

// why: khung Karma thấp; host 360px để max-height: 100vh (giữ từ bản cũ) của vùng cuộn không chặn chiều cao.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdPageComponent],
  template: `
    <div style="width: 1600px; height: 360px; display: flex; flex-direction: column">
      <sd-page title="Sản phẩm" [width]="width()">
        <div sdSubheader id="subheader">Tab</div>
        <div id="body" style="height: 40px">Nội dung</div>
        @if (withFooter()) {
          <div sdFooterRight id="footer-right"><button type="button">Tiếp</button></div>
        }
      </sd-page>
    </div>
  `,
})
class LayoutHost {
  readonly width = signal<SdPageWidth | null>(null);
  readonly withFooter = signal(false);
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdPageComponent],
  template: `
    <div style="width: 1600px; height: 360px; display: flex; flex-direction: column">
      <sd-page title="Sản phẩm">
        <div id="body" style="height: 40px">Nội dung</div>
        <div sdAside id="aside">Tóm tắt</div>
      </sd-page>
    </div>
  `,
})
class AsideHost {}

describe('SdPageComponent', () => {
  let warn: jasmine.Spy;

  beforeEach(async () => {
    warn = spyOn(console, 'warn');
    await TestBed.configureTestingModule({
      imports: [PlainHost, BackLinkHost, BackLinkWithLeftHost, HeaderSlotHost, BadgeHost, LayoutHost, AsideHost],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  describe('without the new inputs and slots', () => {
    let fixture: ComponentFixture<PlainHost>;

    beforeEach(() => {
      fixture = TestBed.createComponent(PlainHost);
      fixture.detectChanges();
    });

    it('keeps the old header DOM, with the title in an h1', () => {
      const header = page(fixture).querySelector(':scope > .c-page-header') as HTMLElement;
      expect(header.className).toBe('c-page-header bg-white');
      expect(header.children.length).toBe(1);

      const row = header.children[0] as HTMLElement;
      expect(row.className).toBe('p-16 d-flex align-items-center w-full justify-content-between');
      const left = row.children[0] as HTMLElement;
      expect(left.className).toBe('d-flex');
      expect(left.children.length).toBe(1);

      const block = left.children[0] as HTMLElement;
      expect(block.className).toBe('d-flex flex-column');
      expect(block.children[0].tagName).toBe('H1');
      expect(block.children[0].className).toBe('T20M');
      expect(block.children[0].textContent?.trim()).toBe('Đơn hàng');
      expect(block.children[1].className).toBe('T14R text-secondary mt-4');
      expect(getComputedStyle(block.children[0]).marginTop).toBe('0px');
    });

    it('keeps the old body DOM and adds no host class', () => {
      const host = page(fixture);
      expect(host.classList.length).toBe(0);

      const wrapper = host.querySelector(':scope > .c-page-wrapper') as HTMLElement;
      expect(wrapper.className).toBe('c-page-wrapper px-0');
      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].className).toBe('c-page-content');
      expect(wrapper.children[0].querySelector('#body')).not.toBeNull();
    });

    it('renders no back link, no badge and a hidden empty footer', () => {
      const host = page(fixture);
      expect(host.querySelector('a')).toBeNull();
      expect(host.querySelector('sd-badge')).toBeNull();

      const footer = host.querySelector(':scope > footer') as HTMLElement;
      expect(footer.childElementCount).toBe(0);
      expect(getComputedStyle(footer).display).toBe('none');
    });

    it('lets a long title wrap as before', () => {
      fixture.componentInstance.title.set('Một tiêu đề rất dài '.repeat(20));
      fixture.detectChanges();
      expect(getComputedStyle(page(fixture).querySelector('h1')!).whiteSpace).toBe('normal');
    });
  });

  describe('headerLeft / headerRight and their sd aliases', () => {
    let fixture: ComponentFixture<HeaderSlotHost>;

    beforeEach(() => {
      fixture = TestBed.createComponent(HeaderSlotHost);
      fixture.detectChanges();
    });

    it('replaces the whole left area with headerLeft, as generic-list does', () => {
      const [legacy] = fixture.nativeElement.querySelectorAll('sd-page');
      const row = legacy.querySelector('.c-page-header > div') as HTMLElement;
      expect(row.children[0].className).toBe('d-flex');
      expect(row.children[0].children[0].id).toBe('legacy-left');
      expect(row.children[1].id).toBe('legacy-right');
      expect(legacy.querySelectorAll('h1').length).toBe(1);
    });

    it('treats sdHeaderLeft and sdHeaderRight like headerLeft and headerRight', () => {
      const [, alias] = fixture.nativeElement.querySelectorAll('sd-page');
      const row = alias.querySelector('.c-page-header > div') as HTMLElement;
      expect(row.children[0].children[0].id).toBe('alias-left');
      expect(row.children[1].id).toBe('alias-right');
      expect(alias.querySelector('h1')).toBeNull();
    });
  });

  describe('backLink', () => {
    let fixture: ComponentFixture<BackLinkHost>;
    const link = () => page(fixture).querySelector('a.c-page-back') as HTMLAnchorElement | null;

    beforeEach(() => {
      fixture = TestBed.createComponent(BackLinkHost);
      fixture.detectChanges();
    });

    it('renders a real link before the title, which stays an input', () => {
      expect(link()!.getAttribute('href')).toBe('/orders');
      expect(link()!.getAttribute('aria-label')).toBe(TestBed.inject(I18nService).t('core.common.back'));
      expect(link()!.querySelector('sd-icon')).not.toBeNull();
      expect(page(fixture).querySelector('h1')!.textContent?.trim()).toBe('Đơn ĐH-2400');
      expect(page(fixture).querySelector('.T14R')!.textContent?.trim()).toBe('Tạo lúc 08:30');
      expect(link()!.compareDocumentPosition(page(fixture).querySelector('h1')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('accepts router commands', () => {
      fixture.componentInstance.backLink.set(['/orders', 5]);
      fixture.detectChanges();
      expect(link()!.getAttribute('href')).toBe('/orders/5');
    });

    it('cuts a long title to one line', () => {
      const h1 = page(fixture).querySelector('h1')!;
      expect(getComputedStyle(h1).whiteSpace).toBe('nowrap');
      expect(getComputedStyle(h1).textOverflow).toBe('ellipsis');
    });

    it('is dropped with a dev warning when headerLeft replaces the left area', () => {
      const withLeft = TestBed.createComponent(BackLinkWithLeftHost);
      withLeft.detectChanges();
      expect(page(withLeft).querySelector('a')).toBeNull();
      expect(page(withLeft).querySelector('#custom-left')).not.toBeNull();
      expect(warn).toHaveBeenCalledWith(jasmine.stringMatching(/backLink/));
    });
  });

  describe('badges', () => {
    let fixture: ComponentFixture<BadgeHost>;
    const badges = () => fixture.debugElement.queryAll(By.directive(SdBadge)).map(el => el.componentInstance as SdBadge);

    beforeEach(() => {
      fixture = TestBed.createComponent(BadgeHost);
      fixture.detectChanges();
    });

    it('renders up to two md badges next to the title, round by default', () => {
      fixture.componentInstance.badges.set([
        { title: 'Chờ duyệt', color: 'warning' },
        { title: 'Online', type: 'pair', label: 'Kênh', color: 'info', tooltip: 'Đặt trên web' },
      ]);
      fixture.detectChanges();

      const [status, channel] = badges();
      expect(status.type()).toBe('round');
      expect(status.size()).toBe('md');
      expect(status.title()).toBe('Chờ duyệt');
      expect(channel.type()).toBe('pair');
      expect(channel.label()).toBe('Kênh');
      expect(channel.tooltip()).toBe('Đặt trên web');

      const row = page(fixture).querySelector('h1')!.parentElement!;
      expect(row.querySelectorAll('sd-badge').length).toBe(2);
      expect(warn).not.toHaveBeenCalled();
    });

    it('skips a badge without a title but keeps the number 0', () => {
      fixture.componentInstance.badges.set([{ color: 'success' }, { title: 0, type: 'tag' }]);
      fixture.detectChanges();
      expect(badges().map(b => b.title())).toEqual([0]);
    });

    it('warns in dev mode for more than two badges and still renders them', () => {
      fixture.componentInstance.badges.set([{ title: 'A' }, { title: 'B', type: 'tag' }, { title: 'C', type: 'pair' }]);
      fixture.detectChanges();
      expect(badges().length).toBe(3);
      expect(warn).toHaveBeenCalledWith(jasmine.stringMatching(/badges/));
    });

    it('warns in dev mode when two badges share a type, counting the default round', () => {
      fixture.componentInstance.badges.set([{ title: 'A' }, { title: 'B', type: 'round' }]);
      fixture.detectChanges();
      expect(warn).toHaveBeenCalledWith(jasmine.stringMatching(/badges/));
    });
  });

  describe('width, subheader and footer', () => {
    let fixture: ComponentFixture<LayoutHost>;
    const rect = (selector: string) => page(fixture).querySelector(selector)!.getBoundingClientRect();

    beforeEach(() => {
      fixture = TestBed.createComponent(LayoutHost);
      fixture.detectChanges();
    });

    it('keeps the full width by default', () => {
      expect(rect('.c-page-content').width).toBe(1600);
    });

    for (const [width, max] of [
      ['wide', 1200],
      ['medium', 960],
      ['narrow', 720],
    ] as const) {
      it(`limits the column to ${max}px with 24px side padding for width="${width}"`, () => {
        fixture.componentInstance.width.set(width);
        fixture.detectChanges();
        expect(page(fixture).classList).toContain(`sd-page--${width}`);
        expect(rect('.c-page-content').width).toBe(max - 48);
        expect(rect('.c-page-content').left - rect('.c-page-wrapper').left).toBe((1600 - max) / 2 + 24);
      });
    }

    it('renders the subheader inside the header block, outside the scroll area', () => {
      const subheader = page(fixture).querySelector('#subheader') as HTMLElement;
      expect(subheader.parentElement!.classList).toContain('c-page-header');
      expect(page(fixture).querySelector('.c-page-wrapper #subheader')).toBeNull();
      expect(getComputedStyle(subheader).borderTopWidth).toBe('1px');
    });

    it('aligns the subheader and footer with the content column', () => {
      fixture.componentInstance.width.set('medium');
      fixture.componentInstance.withFooter.set(true);
      fixture.detectChanges();

      const subheader = page(fixture).querySelector('#subheader') as HTMLElement;
      const contentLeft = rect('.c-page-content').left;
      expect(subheader.getBoundingClientRect().left + parseFloat(getComputedStyle(subheader).paddingLeft)).toBe(contentLeft);
      expect(rect('#footer-right').right).toBe(rect('.c-page-content').right);
    });

    it('shows the footer as a labelled group when one footer slot is used', () => {
      fixture.componentInstance.withFooter.set(true);
      fixture.detectChanges();

      const footer = page(fixture).querySelector(':scope > footer') as HTMLElement;
      expect(getComputedStyle(footer).display).not.toBe('none');
      expect(footer.getAttribute('role')).toBe('group');
      expect(footer.getAttribute('aria-label')).toBeTruthy();
      expect(footer.getBoundingClientRect().bottom).toBe(page(fixture).getBoundingClientRect().bottom);
    });
  });

  describe('aside', () => {
    it('puts the aside in a 320px column, or under the content below 1200px of viewport', () => {
      const fixture = TestBed.createComponent(AsideHost);
      fixture.detectChanges();

      const content = page(fixture).querySelector('.c-page-content')!.getBoundingClientRect();
      const aside = page(fixture).querySelector('#aside')!.getBoundingClientRect();
      if (matchMedia('(max-width: 1199.98px)').matches) {
        expect(aside.top).toBeGreaterThanOrEqual(content.bottom);
        expect(aside.width).toBe(content.width);
      } else {
        expect(aside.width).toBe(320);
        expect(aside.left - content.right).toBe(16);
      }
    });
  });
});
