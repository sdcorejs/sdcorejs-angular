import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdCard } from './card.component';
import type { SdCardBehavior, SdCardContent, SdCardSize, SdCardStatData } from './card.model';

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

  describe('projected content', () => {
    it('ignores ng-content padding rules once content is set', () => {
      stat({ label: 'Tổng đơn', value: 1 });
      expect(cardElement().classList.contains('sd-card--content')).toBeTrue();
    });
  });
});
