import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { I18nService } from '@sdcorejs/angular/i18n';
import type { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdCardActionsDirective } from './card-actions.directive';
import { SdCardGroup } from './card-group.component';
import { SdCard } from './card.component';
import { SD_CARD_LAYOUT, type SdCardLayout } from './card.configuration';
import type { SdCardBehavior, SdCardContent, SdCardEntityData, SdCardOptionData, SdCardSize, SdCardStatData } from './card.model';

const PLANS: readonly SdCardOptionData[] = [
  { title: 'Cơ bản', description: '5 người dùng', icon: 'person' },
  { title: 'Nhóm', description: '20 người dùng', icon: 'group', badge: { title: 'Phổ biến', color: 'info' } },
  { title: 'Doanh nghiệp', description: 'Không giới hạn', icon: 'domain' },
];

@Component({
  standalone: true,
  imports: [SdCard, SdCardGroup],
  template: `
    <sd-card-group data-testid="plans" aria-label="Gói" [(model)]="plan">
      @for (option of plans; track option.title; let index = $index) {
        <sd-card
          [attr.data-testid]="'plan-' + index"
          [value]="option.title"
          [disabled]="index === disabledIndex()"
          [content]="{ layout: 'option', data: option }" />
      }
    </sd-card-group>
    <sd-card-group data-testid="features" multiple [(model)]="features">
      @for (option of plans; track option.title; let index = $index) {
        <sd-card [attr.data-testid]="'feature-' + index" [value]="option.title" [content]="{ layout: 'option', data: option }" />
      }
    </sd-card-group>
    <sd-card-group data-testid="mixed" [(model)]="plan">
      <sd-card data-testid="mixed-option" value="a" [content]="{ layout: 'option', data: plans[0] }" />
      <sd-card data-testid="mixed-plain" value="b">Plain</sd-card>
    </sd-card-group>
  `,
})
class CardOptionHost {
  readonly plans = PLANS;
  readonly plan = signal<string | string[] | null>(null);
  readonly features = signal<string | string[] | null>(null);
  readonly disabledIndex = signal(-1);
}

@Component({
  standalone: true,
  imports: [SdCard],
  template: `<sd-card data-testid="card" [behavior]="behavior()" [content]="content()" [size]="size()" [link]="link()" />`,
})
class CardLayoutHost {
  readonly behavior = signal<SdCardBehavior | undefined>(undefined);
  readonly content = signal<SdCardContent | undefined>(undefined);
  readonly size = signal<SdCardSize | undefined>(undefined);
  readonly link = signal<string | undefined>(undefined);
}

/** Intl inserts narrow/no-break spaces in some locales; tests compare with plain spaces. */
const text = (value: string | null | undefined): string => (value ?? '').replace(/[\u00a0\u202f]/g, ' ').trim();

describe('SdCard layouts', () => {
  let fixture: ComponentFixture<CardLayoutHost>;
  let host: CardLayoutHost;
  let i18n: I18nService;
  let warnSpy: jasmine.Spy;

  const cardElement = (): HTMLElement => fixture.nativeElement.querySelector('[data-testid="card"]') as HTMLElement;
  const query = (selector: string): HTMLElement | null => cardElement().querySelector(selector) as HTMLElement | null;
  const stat = (data: SdCardStatData): void => {
    host.content.set({ layout: 'stat', data });
    fixture.detectChanges();
  };

  beforeEach(async () => {
    warnSpy = spyOn(console, 'warn');
    await TestBed.configureTestingModule({ imports: [CardLayoutHost], providers: [provideRouter([])] }).compileComponents();
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('vi', { reload: false });
    fixture = TestBed.createComponent(CardLayoutHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => i18n.setLanguage('vi', { reload: false }));

  describe('stat', () => {
    it('formats number with precision', () => {
      stat({ label: 'Tổng đơn', value: 1234.5, precision: 2 });
      expect(text(query('.sd-card__stat-value')?.textContent)).toBe('1.234,50');
    });

    it('formats compact as long words for vi and short for en', () => {
      stat({ label: 'Doanh thu', value: 86_400_000, format: 'compact' });
      expect(text(query('.sd-card__stat-value')?.textContent)).toBe('86,4 triệu');
      i18n.setLanguage('en', { reload: false });
      fixture.detectChanges();
      expect(text(query('.sd-card__stat-value')?.textContent)).toBe('86.4M');
    });

    it('formats percent from a ratio with one fraction digit', () => {
      stat({ label: 'Tỉ lệ', value: 0.427, format: 'percent' });
      expect(text(query('.sd-card__stat-value')?.textContent).replace(' ', '')).toBe('42,7%');
    });

    it('renders text as is', () => {
      stat({ label: 'Hạng', value: 'Vàng', format: 'text' });
      expect(text(query('.sd-card__stat-value')?.textContent)).toBe('Vàng');
    });

    it('renders a string value with a numeric format as is and warns', () => {
      stat({ label: 'Hạng', value: 'N/A' });
      expect(text(query('.sd-card__stat-value')?.textContent)).toBe('N/A');
      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/\[sd-card\].*format/));
    });

    it('renders an em dash for null', () => {
      stat({ label: 'Tổng đơn', value: null });
      expect(text(query('.sd-card__stat-value')?.textContent)).toBe('—');
    });

    it('puts the full number in title and the accessible name', () => {
      stat({ label: 'Doanh thu', value: 86_400_000, format: 'compact', context: 'Tháng này' });
      expect(text(query('.sd-card__stat-value')?.getAttribute('title'))).toBe('86.400.000');
      expect(cardElement().getAttribute('role')).toBe('group');
      expect(text(cardElement().getAttribute('aria-label'))).toBe('Doanh thu, 86.400.000, Tháng này');
    });

    it('colors the value with the accent only when interactive', () => {
      stat({ label: 'Tổng đơn', value: 12 });
      expect(cardElement().classList.contains('sd-card--static')).toBeTrue();
      host.behavior.set('select');
      fixture.detectChanges();
      expect(cardElement().classList.contains('sd-card--select')).toBeTrue();
      expect(text(cardElement().getAttribute('aria-label'))).toBe('Tổng đơn, 12');
    });

    it('drops icon, delta and context at size sm', () => {
      host.size.set('sm');
      stat({ label: 'Tổng đơn', value: 12, icon: 'receipt', context: 'Hôm nay', delta: { value: 3 } });
      expect(query('.sd-card__stat--sm')).not.toBeNull();
      expect(query('.sd-card__stat-icon')).toBeNull();
      expect(query('.sd-card__delta')).toBeNull();
      expect(query('.sd-card__stat-context')).toBeNull();
    });

    it('uses the dark shade of contextColor for the context line', () => {
      stat({ label: 'Quá hạn', value: 3, context: 'Cần xử lý', contextColor: 'error' });
      expect(query('.sd-card__stat-context')?.classList.contains('sd-card__stat-context--error')).toBeTrue();
    });
  });

  describe('stat delta', () => {
    it('marks an increase as good by default', () => {
      stat({ label: 'Đơn mới', value: 120, delta: { value: 6 } });
      const delta = query('.sd-card__delta');
      expect(delta?.classList.contains('sd-card__delta--good')).toBeTrue();
      expect(text(delta?.textContent)).toContain('6');
      expect(delta?.querySelector('sd-icon')).not.toBeNull();
      expect(text(cardElement().getAttribute('aria-label'))).toBe('Đơn mới, 120, tăng 6 so với kỳ trước');
    });

    it('marks an increase as bad when positive is down', () => {
      stat({ label: 'Đơn huỷ', value: 12, delta: { value: 4, positive: 'down' } });
      expect(query('.sd-card__delta')?.classList.contains('sd-card__delta--bad')).toBeTrue();
    });

    it('marks a decrease as good when positive is down and announces the absolute value', () => {
      stat({ label: 'Đơn huỷ', value: 12, delta: { value: -4, positive: 'down' } });
      expect(query('.sd-card__delta')?.classList.contains('sd-card__delta--good')).toBeTrue();
      expect(text(cardElement().getAttribute('aria-label'))).toBe('Đơn huỷ, 12, giảm 4 so với kỳ trước');
    });

    it('renders an unchanged neutral chip without icon for zero', () => {
      stat({ label: 'Đơn mới', value: 120, delta: { value: 0 } });
      const delta = query('.sd-card__delta');
      expect(delta?.classList.contains('sd-card__delta--flat')).toBeTrue();
      expect(text(delta?.textContent)).toBe('Không đổi');
      expect(delta?.querySelector('sd-icon')).toBeNull();
    });
  });

  describe('stat link', () => {
    it('renders the value inside an anchor', () => {
      host.behavior.set('link');
      host.link.set('/orders');
      stat({ label: 'Chờ duyệt', value: 4 });
      expect(query('a.sd-card__link .sd-card__stat-value')).not.toBeNull();
      expect(text(query('a.sd-card__link')?.getAttribute('aria-label'))).toBe('Chờ duyệt, 4');
    });

    it('renders zero as static so it does not open an empty list', () => {
      host.behavior.set('link');
      host.link.set('/orders');
      stat({ label: 'Chờ duyệt', value: 0 });
      expect(query('a')).toBeNull();
      expect(cardElement().classList.contains('sd-card--static')).toBeTrue();
    });
  });

  describe('content types', () => {
    it('rejects data that does not match the layout at compile time', () => {
      // @ts-expect-error stat data has a label, not a title
      const stat: SdCardContent = { layout: 'stat', data: { title: 'x' } };
      // @ts-expect-error option data has a title, not a label and a value
      const option: SdCardContent = { layout: 'option', data: { label: 'x', value: 1 } };
      expect([stat, option].length).toBe(2);
    });
  });

  describe('projected content', () => {
    it('ignores ng-content padding rules once content is set', () => {
      stat({ label: 'Tổng đơn', value: 1 });
      expect(cardElement().classList.contains('sd-card--content')).toBeTrue();
    });
  });
  describe('entity', () => {
    const customer: SdCardEntityData = {
      title: 'Nguyễn Văn An',
      subtitle: 'an.nguyen@example.com',
      avatar: { text: 'Nguyễn Văn An' },
      badge: { title: 'VIP', color: 'warning' },
      meta: [
        { label: 'Đơn', value: '12' },
        { label: 'Chi tiêu', value: '18,4 triệu' },
        { label: 'Hạng', value: 'Vàng' },
        { label: 'Thừa', value: 'x' },
      ],
    };

    it('renders avatar, title, subtitle, badge and at most three meta fields at md', () => {
      host.content.set({ layout: 'entity', data: customer });
      fixture.detectChanges();
      expect(query('.sd-card__entity sd-avatar')).not.toBeNull();
      expect(text(query('.sd-card__entity-title')?.textContent)).toBe('Nguyễn Văn An');
      expect(query('.sd-card__entity-title')?.getAttribute('title')).toBe('Nguyễn Văn An');
      expect(text(query('.sd-card__entity-subtitle')?.textContent)).toBe('an.nguyen@example.com');
      expect(query('.sd-card__entity sd-badge')).not.toBeNull();
      expect(cardElement().querySelectorAll('.sd-card__entity-meta > div').length).toBe(3);
      expect(text(cardElement().getAttribute('aria-label'))).toBe('Nguyễn Văn An, an.nguyen@example.com, VIP');
    });

    it('draws an icon avatar without sd-avatar', () => {
      host.content.set({ layout: 'entity', data: { title: 'Kho Hà Nội', avatar: { icon: 'warehouse' } } });
      fixture.detectChanges();
      expect(query('.sd-card__avatar-icon sd-icon')).not.toBeNull();
      expect(query('sd-avatar')).toBeNull();
    });

    it('drops meta and badge at size sm', () => {
      host.size.set('sm');
      host.content.set({ layout: 'entity', data: customer });
      fixture.detectChanges();
      expect(query('.sd-card__entity--sm')).not.toBeNull();
      expect(query('.sd-card__entity-meta')).toBeNull();
      expect(query('sd-badge')).toBeNull();
    });
  });
});

describe('SdCard option', () => {
  let fixture: ComponentFixture<CardOptionHost>;
  let host: CardOptionHost;

  const element = (testId: string): HTMLElement => fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
  const checkIcon = (testId: string): string =>
    (fixture.debugElement.query(By.css(`[data-testid="${testId}"] .sd-card__check`)).componentInstance as SdIcon).name() ?? '';
  const key = (testId: string, keyName: string): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true });
    element(testId).dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardOptionHost] }).compileComponents();
    fixture = TestBed.createComponent(CardOptionHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('turns a single group of option cards into a radiogroup of radios', () => {
    expect(element('plans').getAttribute('role')).toBe('radiogroup');
    expect(element('plan-0').getAttribute('role')).toBe('radio');
    expect(element('plan-0').getAttribute('aria-checked')).toBe('false');
    expect(element('plan-0').hasAttribute('aria-pressed')).toBeFalse();
    element('plan-1').click();
    fixture.detectChanges();
    expect(element('plan-1').getAttribute('aria-checked')).toBe('true');
  });

  it('keeps one tab stop: the selected radio, or the first enabled one', () => {
    expect(['plan-0', 'plan-1', 'plan-2'].map(id => element(id).getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    host.plan.set('Doanh nghiệp');
    fixture.detectChanges();
    expect(['plan-0', 'plan-1', 'plan-2'].map(id => element(id).getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
  });

  it('moves focus and selection with the arrow keys, wrapping and skipping disabled cards', () => {
    host.disabledIndex.set(1);
    fixture.detectChanges();
    element('plan-0').focus();
    const event = key('plan-0', 'ArrowRight');
    expect(event.defaultPrevented).toBeTrue();
    expect(host.plan()).toBe('Doanh nghiệp');
    expect(document.activeElement).toBe(element('plan-2'));
    key('plan-2', 'ArrowDown');
    expect(host.plan()).toBe('Cơ bản');
    expect(document.activeElement).toBe(element('plan-0'));
    key('plan-0', 'ArrowUp');
    expect(host.plan()).toBe('Doanh nghiệp');
    key('plan-2', 'ArrowLeft');
    expect(host.plan()).toBe('Cơ bản');
  });

  it('shows the radio check mark and its selected state', () => {
    expect(checkIcon('plan-0')).toBe('radio_button_unchecked');
    element('plan-0').click();
    fixture.detectChanges();
    expect(checkIcon('plan-0')).toBe('check_circle');
  });

  it('uses checkboxes without roving focus in a multiple group', () => {
    expect(element('features').getAttribute('role')).toBe('group');
    expect(element('feature-0').getAttribute('role')).toBe('checkbox');
    expect(['feature-0', 'feature-1'].map(id => element(id).getAttribute('tabindex'))).toEqual(['0', '0']);
    key('feature-0', 'ArrowRight');
    expect(host.features()).toBeNull();
    expect(checkIcon('feature-0')).toBe('check_box_outline_blank');
  });

  it('keeps group semantics when one child is not an option', () => {
    expect(element('mixed').getAttribute('role')).toBe('group');
    expect(element('mixed-plain').getAttribute('role')).toBe('button');
  });

  it('renders icon, title, description and badge', () => {
    const plan = element('plan-1');
    expect(plan.querySelector('.sd-card__option-icon sd-icon')).not.toBeNull();
    expect(text(plan.querySelector('.sd-card__option-title')?.textContent)).toBe('Nhóm');
    expect(text(plan.querySelector('.sd-card__option-description')?.textContent)).toBe('20 người dùng');
    expect(plan.querySelector('sd-badge')).not.toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [SdCard, SdCardGroup, SdCardActionsDirective],
  template: `
    <sd-card-group data-testid="files" [(model)]="selectedFile">
      <sd-card data-testid="file-card" value="report" [content]="fileContent">
        <ng-template sdCardActions>
          <button type="button" data-testid="file-menu" aria-label="Tác vụ">⋯</button>
        </ng-template>
      </sd-card>
    </sd-card-group>
    <sd-card
      data-testid="entity-link"
      behavior="link"
      link="/customers/1"
      [size]="entitySize()"
      [content]="entityContent"
      (click)="linkClicks = linkClicks + 1">
      <ng-template sdCardActions>
        <button type="button" data-testid="entity-menu" aria-label="Tác vụ">⋯</button>
      </ng-template>
    </sd-card>
    <sd-card data-testid="stat-actions" [content]="{ layout: 'stat', data: { label: 'Đơn', value: 1 } }">
      <ng-template sdCardActions><button type="button">⋯</button></ng-template>
    </sd-card>
  `,
})
class CardActionsHost {
  readonly selectedFile = signal<string | string[] | null>(null);
  readonly entitySize = signal<SdCardSize | undefined>(undefined);
  readonly fileContent: SdCardContent = { layout: 'file', data: { name: 'Bao-cao-Q3.xlsx', size: 2_516_582 } };
  readonly entityContent: SdCardContent = { layout: 'entity', data: { title: 'Nguyễn Văn An', subtitle: 'Khách VIP' } };
  linkClicks = 0;
}

describe('SdCard file, shortcut and actions', () => {
  describe('file and shortcut', () => {
    let fixture: ComponentFixture<CardLayoutHost>;
    let host: CardLayoutHost;
    const query = (selector: string): HTMLElement | null =>
      fixture.nativeElement.querySelector(`[data-testid="card"] ${selector}`) as HTMLElement | null;
    const show = (content: SdCardContent): void => {
      host.content.set(content);
      fixture.detectChanges();
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [CardLayoutHost], providers: [provideRouter([])] }).compileComponents();
      TestBed.inject(I18nService).setLanguage('vi', { reload: false });
      fixture = TestBed.createComponent(CardLayoutHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('infers the file type from the extension of the name', () => {
      show({ layout: 'file', data: { name: 'Bao-cao-Q3.xlsx', size: 2_516_582 } });
      expect(query('.sd-card__file-media')?.classList.contains('sd-card__file-media--sheet')).toBeTrue();
      const icon = fixture.debugElement.query(By.css('.sd-card__file-media sd-icon')).componentInstance as SdIcon;
      expect(icon.name()).toBe('table_view');
      expect(text(query('.sd-card__file-meta')?.textContent)).toBe('XLSX · 2,4 MB');
      const card = fixture.nativeElement.querySelector('[data-testid="card"]') as HTMLElement;
      expect(text(card.getAttribute('aria-label'))).toBe('Bao-cao-Q3.xlsx, XLSX, 2,4 MB');
    });

    it('uses a MIME type when given', () => {
      show({ layout: 'file', data: { name: 'scan', type: 'application/pdf' } });
      expect(query('.sd-card__file-media')?.classList.contains('sd-card__file-media--pdf')).toBeTrue();
    });

    it('renders a lazy thumbnail with an empty alt', () => {
      show({ layout: 'file', data: { name: 'anh.png', thumbnail: 'data:image/png;base64,iVBORw0KGgo=' } });
      const image = query('img.sd-card__file-thumb') as HTMLImageElement | null;
      expect(image?.getAttribute('loading')).toBe('lazy');
      expect(image?.getAttribute('alt')).toBe('');
    });

    it('keeps file at md even when size is sm', () => {
      host.size.set('sm');
      show({ layout: 'file', data: { name: 'a.pdf' } });
      expect(fixture.nativeElement.querySelector('[data-testid="card"]').classList.contains('sd-card--sm')).toBeFalse();
    });

    it('renders shortcut icon, label and description, and drops the description at sm', () => {
      host.behavior.set('link');
      host.link.set('/orders/new');
      show({ layout: 'shortcut', data: { label: 'Tạo đơn', icon: 'add_shopping_cart', description: 'Đơn bán lẻ' } });
      expect(query('a.sd-card__link .sd-card__shortcut sd-icon')).not.toBeNull();
      expect(text(query('.sd-card__shortcut-label')?.textContent)).toBe('Tạo đơn');
      expect(text(query('.sd-card__shortcut-description')?.textContent)).toBe('Đơn bán lẻ');
      host.size.set('sm');
      fixture.detectChanges();
      expect(query('.sd-card__shortcut--sm')).not.toBeNull();
      expect(query('.sd-card__shortcut-description')).toBeNull();
    });
  });

  describe('sdCardActions', () => {
    let fixture: ComponentFixture<CardActionsHost>;
    let host: CardActionsHost;
    let warnSpy: jasmine.Spy;
    let navigateSpy: jasmine.Spy;
    const element = (testId: string): HTMLElement => fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement;

    beforeEach(async () => {
      warnSpy = spyOn(console, 'warn');
      await TestBed.configureTestingModule({ imports: [CardActionsHost], providers: [provideRouter([])] }).compileComponents();
      navigateSpy = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
      fixture = TestBed.createComponent(CardActionsHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('renders the template outside the anchor and keeps clicks from selecting the card', () => {
      element('file-menu').click();
      expect(host.selectedFile()).toBeNull();
      element('file-card').click();
      expect(host.selectedFile()).toBe('report');
    });

    it('draws the selected ring of a layout card above the content so the thumbnail cannot cover it', () => {
      element('file-card').click();
      fixture.detectChanges();
      const card = element('file-card');
      // why: the test page loads no theme, so give the accent a concrete colour for the computed shadow.
      card.style.setProperty('--sd-card-accent', 'rgb(0, 92, 187)');
      expect(getComputedStyle(card).boxShadow).toBe('none');
      expect(getComputedStyle(card, '::after').boxShadow).toContain('inset');
      expect(getComputedStyle(card, '::after').pointerEvents).toBe('none');
    });

    it('keeps clicks from navigating a link card', () => {
      expect(element('entity-link').querySelector('a.sd-card__link [data-testid="entity-menu"]')).toBeNull();
      element('entity-menu').click();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(host.linkClicks).toBe(0);
    });

    it('drops the actions of an entity at size sm', () => {
      host.entitySize.set('sm');
      fixture.detectChanges();
      expect(element('entity-link').querySelector('[data-testid="entity-menu"]')).toBeNull();
    });

    it('warns and renders nothing for a layout without actions', () => {
      expect(element('stat-actions').querySelector('button')).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/\[sd-card\].*sdCardActions/));
    });
  });
});

@Component({
  standalone: true,
  imports: [SdCard, SdCardGroup],
  template: `
    <sd-card-group [(model)]="model">
      <sd-card
        data-testid="stat"
        value="stat"
        [loading]="loading()"
        [error]="error()"
        [content]="{ layout: 'stat', data: { label: 'Tổng đơn', value: value() } }"
        (click)="clicks = clicks + 1"
        (sdRetry)="retries = retries + 1" />
      <sd-card
        data-testid="entity"
        value="entity"
        [loading]="loading()"
        [error]="error()"
        [content]="{ layout: 'entity', data: { title: 'Nguyễn Văn An', subtitle: 'Khách VIP' } }"
        (sdRetry)="retries = retries + 1" />
      <sd-card data-testid="option" value="option" [content]="{ layout: 'option', data: { title: 'Gói' } }" />
      <sd-card data-testid="file" value="file" [content]="{ layout: 'file', data: { name: 'a.pdf' } }" />
      <sd-card data-testid="projected" value="projected" [loading]="loading()">Projected</sd-card>
    </sd-card-group>
  `,
})
class CardStateHost {
  readonly model = signal<string | string[] | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly value = signal<number | null>(1234);
  clicks = 0;
  retries = 0;
}

describe('SdCard states and size', () => {
  let fixture: ComponentFixture<CardStateHost>;
  let host: CardStateHost;
  const compact = signal(false);
  const element = (testId: string): HTMLElement => fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement;

  beforeEach(async () => {
    compact.set(false);
    await TestBed.configureTestingModule({
      imports: [CardStateHost],
      providers: [{ provide: SD_CARD_LAYOUT, useValue: { compact } satisfies SdCardLayout }],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('vi', { reload: false });
    fixture = TestBed.createComponent(CardStateHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('switches to sm when the surrounding layout is compact, except option and file', () => {
    expect(element('stat').classList.contains('sd-card--sm')).toBeFalse();
    compact.set(true);
    fixture.detectChanges();
    expect(element('stat').classList.contains('sd-card--sm')).toBeTrue();
    expect(element('entity').classList.contains('sd-card--sm')).toBeTrue();
    expect(element('option').classList.contains('sd-card--sm')).toBeFalse();
    expect(element('file').classList.contains('sd-card--sm')).toBeFalse();
  });

  it('marks a loading card busy, blocks activation and keeps its height', () => {
    const loadedHeight = element('stat').offsetHeight;
    const loadedEntityHeight = element('entity').offsetHeight;
    host.loading.set(true);
    fixture.detectChanges();
    expect(element('stat').getAttribute('aria-busy')).toBe('true');
    expect(element('stat').offsetHeight).toBe(loadedHeight);
    expect(element('entity').offsetHeight).toBe(loadedEntityHeight);
    expect(element('stat').querySelector('.sd-card__stat-label')?.textContent).toContain('Tổng đơn');
    element('stat').click();
    element('stat').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(host.model()).toBeNull();
    expect(host.clicks).toBe(0);
    expect(element('stat').getAttribute('aria-label')).toContain('Đang tải');
  });

  it('ignores loading without content', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(element('projected').hasAttribute('aria-busy')).toBeFalse();
  });

  it('shows an em dash and a retry button for a failed stat without selecting the card', () => {
    host.error.set(true);
    fixture.detectChanges();
    const stat = element('stat');
    expect(stat.querySelector('.sd-card__stat-value')?.textContent?.trim()).toBe('—');
    expect(stat.querySelector('.sd-card__stat-context')?.textContent).toContain('Không tải được');
    (stat.querySelector('button.sd-card__retry') as HTMLButtonElement).click();
    expect(host.retries).toBe(1);
    expect(host.model()).toBeNull();
    expect(host.clicks).toBe(0);
  });

  it('never shows zero for a failed stat', () => {
    host.value.set(0);
    host.error.set(true);
    fixture.detectChanges();
    expect(element('stat').querySelector('.sd-card__stat-value')?.textContent?.trim()).toBe('—');
  });

  it('replaces other layouts with an error row and a retry button', () => {
    host.error.set(true);
    fixture.detectChanges();
    const entity = element('entity');
    expect(entity.querySelector('.sd-card__entity')).toBeNull();
    expect(entity.querySelector('.sd-card__error')?.textContent).toContain('Không tải được');
    (entity.querySelector('button.sd-card__retry') as HTMLButtonElement).click();
    expect(host.retries).toBe(1);
    expect(host.model()).toBeNull();
  });
});
