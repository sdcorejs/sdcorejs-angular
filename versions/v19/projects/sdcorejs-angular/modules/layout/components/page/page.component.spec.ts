import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { SdBadge, type SdBadgeData } from '@sdcorejs/angular/components/badge';
import { SdSection } from '@sdcorejs/angular/components/section';
import { I18nService } from '@sdcorejs/angular/i18n';

import { SdPageComponent, type SdPageAside, type SdPageWidth } from './page.component';

const page = (fixture: ComponentFixture<unknown>): HTMLElement => fixture.nativeElement.querySelector('sd-page');

// why: màn cũ (generic-list, not-found, consumer) chỉ dùng title/description và slot headerLeft/headerRight.
// Chúng phải render y như trước khi chưa có P0.
@Component({
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
  imports: [SdPageComponent],
  template: `<sd-page [backLink]="backLink()" [title]="'Đơn ĐH-2400'" description="Tạo lúc 08:30"></sd-page>`,
})
class BackLinkHost {
  readonly backLink = signal<string | readonly unknown[] | null>('/orders');
}

@Component({
  imports: [SdPageComponent],
  template: `
    <sd-page backLink="/orders" title="Đơn ĐH-2400">
      <div headerLeft id="custom-left">Khác</div>
    </sd-page>
  `,
})
class BackLinkWithLeftHost {}

@Component({
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
  imports: [SdPageComponent],
  template: `<sd-page title="Đơn ĐH-2400" [badges]="badges()"></sd-page>`,
})
class BadgeHost {
  readonly badges = signal<readonly SdBadgeData[] | null>(null);
}

// why: khung Karma thấp; host 360px để max-height: 100vh (giữ từ bản cũ) của vùng cuộn không chặn chiều cao.
@Component({
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

@Component({
  imports: [SdPageComponent],
  template: `
    <div style="width: 1600px; height: 360px; display: flex; flex-direction: column">
      <sd-page-detail title="Chi tiết sản phẩm" [aside]="aside()">
        <div id="body" style="height: 40px">Nội dung</div>
        @if (withAside()) {
          <div sdAside id="aside">Tóm tắt</div>
        }
      </sd-page-detail>
    </div>
  `,
})
class DetailHost {
  readonly aside = signal<SdPageAside>('end');
  readonly withAside = signal(true);
}

/** A form group in its own component, as the blueprint splits a form: its section is still in the table of contents. */
@Component({
  selector: 'app-lines-form',
  imports: [SdSection],
  template: `<sd-section title="Dòng hàng" id="lines"><div style="height: 300px"></div></sd-section>`,
})
class LinesForm {}

@Component({
  imports: [SdPageComponent, SdSection, LinesForm],
  template: `
    <div style="width: 1600px; height: 360px; display: flex; flex-direction: column">
      <sd-page-form title="Tạo đơn hàng" toc>
        <sd-section title="Thông tin chung" id="general"><div style="height: 300px"></div></sd-section>
        <app-lines-form />
        <sd-section title="Ghi chú" id="note"><div style="height: 300px"></div></sd-section>
      </sd-page-form>
    </div>
  `,
})
class ChildSectionHost {}

@Component({
  imports: [SdPageComponent, SdSection],
  template: `
    <div style="width: 1600px; height: 360px; display: flex; flex-direction: column">
      <sd-page-form title="Cập nhật sản phẩm" [toc]="toc()" [width]="width()">
        <form>
          <sd-section title="Thông tin chung" id="general">
            <div style="height: 300px"></div>
            <sd-section title="Nhóm con"><div style="height: 20px"></div></sd-section>
          </sd-section>
          <sd-section title="Giá" id="price"><div style="height: 300px"></div></sd-section>
          <sd-section><div style="height: 50px">Không có title</div></sd-section>
          <sd-section title="Kho" id="stock"><div style="height: 300px"></div></sd-section>
        </form>
      </sd-page-form>
    </div>
  `,
})
class FormHost {
  readonly toc = signal(true);
  readonly width = signal<SdPageWidth | null>(null);
}

describe('SdPageComponent', () => {
  let warn: jasmine.Spy;

  beforeEach(async () => {
    warn = spyOn(console, 'warn');
    await TestBed.configureTestingModule({
      imports: [
        PlainHost,
        BackLinkHost,
        BackLinkWithLeftHost,
        HeaderSlotHost,
        BadgeHost,
        LayoutHost,
        AsideHost,
        DetailHost,
        FormHost,
        ChildSectionHost,
      ],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  describe('without the new inputs and slots', () => {
    let fixture: ComponentFixture<PlainHost>;

    beforeEach(() => {
      fixture = TestBed.createComponent(PlainHost);
      fixture.detectChanges();
    });

    it('keeps the old header DOM in a <header> element, with the title in an h1', () => {
      const header = page(fixture).querySelector(':scope > .c-page-header') as HTMLElement;
      expect(header.tagName).toBe('HEADER');
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

    it('does not warn about a backLink that is shown', async () => {
      await fixture.whenStable();
      expect(warn).not.toHaveBeenCalled();
    });

    it('cuts a long title to one line', () => {
      const h1 = page(fixture).querySelector('h1')!;
      expect(getComputedStyle(h1).whiteSpace).toBe('nowrap');
      expect(getComputedStyle(h1).textOverflow).toBe('ellipsis');
    });

    it('is dropped with a dev warning when headerLeft replaces the left area', async () => {
      const withLeft = TestBed.createComponent(BackLinkWithLeftHost);
      withLeft.detectChanges();
      await withLeft.whenStable();
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

  describe('sd-page-detail', () => {
    let fixture: ComponentFixture<DetailHost>;
    const detail = () => fixture.nativeElement.querySelector('sd-page-detail') as HTMLElement;
    const stacked = () => matchMedia('(max-width: 1199.98px)').matches;

    beforeEach(() => {
      fixture = TestBed.createComponent(DetailHost);
      fixture.detectChanges();
    });

    it('is wide by default, with the aside at the end', () => {
      expect(detail().classList).toContain('sd-page--wide');
      expect(detail().classList).not.toContain('sd-page--aside-start');
      expect(detail().querySelector('.c-page-content')!.getBoundingClientRect().width).toBe(stacked() ? 1152 : 1152 - 16 - 320);
    });

    it('puts the aside first with aside="start", and still under the content below 1200px', () => {
      fixture.componentInstance.aside.set('start');
      fixture.detectChanges();

      expect(detail().classList).toContain('sd-page--aside-start');
      const content = detail().querySelector('.c-page-content')!.getBoundingClientRect();
      const aside = detail().querySelector('#aside')!.getBoundingClientRect();
      if (stacked()) {
        expect(aside.top).toBeGreaterThanOrEqual(content.bottom);
      } else {
        expect(content.left - aside.right).toBe(16);
      }
    });

    it('keeps one column without [sdAside]', () => {
      fixture.componentInstance.withAside.set(false);
      fixture.detectChanges();

      expect(detail().querySelector('#aside')).toBeNull();
      expect(detail().querySelector('.c-page-content')!.getBoundingClientRect().width).toBe(1152);
    });
  });

  describe('table of contents with a section inside a child component', () => {
    it('lists it in document order', async () => {
      const fixture = TestBed.createComponent(ChildSectionHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const titles = [...fixture.nativeElement.querySelectorAll('.c-page-toc button')].map((button: HTMLElement) =>
        button.textContent?.trim()
      );
      expect(titles).toEqual(['Thông tin chung', 'Dòng hàng', 'Ghi chú']);
    });
  });

  describe('sd-page-form', () => {
    let fixture: ComponentFixture<FormHost>;
    const form = () => fixture.nativeElement.querySelector('sd-page-form') as HTMLElement;
    const items = () => [...form().querySelectorAll<HTMLButtonElement>('.c-page-toc button')];
    const wrapper = () => form().querySelector('.c-page-wrapper') as HTMLElement;

    beforeEach(async () => {
      fixture = TestBed.createComponent(FormHost);
      await settle();
    });

    // why: mục lục được thu thập sau khi render (section lồng chỉ vào DOM khi view của section cha render).
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };

    it('is medium by default and keeps an explicit width', () => {
      expect(form().classList).toContain('sd-page--medium');
      fixture.componentInstance.width.set('narrow');
      fixture.detectChanges();
      expect(form().classList).toContain('sd-page--narrow');
      expect(form().classList).not.toContain('sd-page--medium');
    });

    it('lists the titled top-level sections in a labelled table of contents', () => {
      const nav = form().querySelector('nav.c-page-toc') as HTMLElement;
      expect(nav.getAttribute('aria-label')).toBe(TestBed.inject(I18nService).t('core.module.layout.page.toc'));
      expect(items().map(item => item.textContent?.trim())).toEqual(['Thông tin chung', 'Giá', 'Kho']);
      expect(items()[0].getAttribute('aria-current')).toBe('true');
    });

    it('scrolls to a section when its entry is clicked', () => {
      const stock = form().querySelector('#stock') as HTMLElement;
      const scroll = spyOn(stock, 'scrollIntoView');
      items()[2].click();
      expect(scroll).toHaveBeenCalledWith(jasmine.objectContaining({ block: 'start' }));
    });

    it('marks the section at the top of the scroll area as current', () => {
      const price = form().querySelector('#price') as HTMLElement;
      wrapper().scrollTop += price.getBoundingClientRect().top - wrapper().getBoundingClientRect().top;
      wrapper().dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      expect(items().map(item => item.getAttribute('aria-current'))).toEqual([null, 'true', null]);
    });

    it('renders no table of contents without toc', async () => {
      fixture.componentInstance.toc.set(false);
      await settle();
      expect(form().querySelector('.c-page-toc')).toBeNull();
    });
  });
});
