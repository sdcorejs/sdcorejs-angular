import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { ɵSdSearchField, ɵSdSearchFieldInputDirective, ɵSdSearchFieldSize } from './search-field.component';

// Primitive tìm kiếm nội bộ (thiết kế đợt 1 · B, bo/viền/focus theo đợt 2 · D).
@Component({
  imports: [ɵSdSearchField, ɵSdSearchFieldInputDirective, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <sd-search-field [size]="size()" [clearable]="clearable()" [clearLabel]="clearLabel()" [autoId]="autoId()" (cleared)="onCleared()">
      <input sdSearchFieldInput aria-label="Tìm kiếm" placeholder="Tìm kiếm" [value]="value()" [disabled]="disabled()" />
      <span sdSearchFieldEnd class="end-hint">↵</span>
    </sd-search-field>
  `,
})
class SearchFieldHost {
  readonly size = signal<ɵSdSearchFieldSize>('md');
  readonly clearable = signal(false);
  readonly clearLabel = signal<string | undefined>(undefined);
  readonly autoId = signal<string | undefined>(undefined);
  readonly value = signal('');
  readonly disabled = signal(false);
  cleared = 0;
  onCleared(): void {
    this.cleared++;
  }
}

describe('ɵSdSearchField', () => {
  let fixture: ComponentFixture<SearchFieldHost>;
  let host: SearchFieldHost;

  const field = (): HTMLElement => fixture.nativeElement.querySelector('sd-search-field');
  const input = (): HTMLInputElement => field().querySelector('input') as HTMLInputElement;
  const clearButton = (): HTMLButtonElement | null => field().querySelector('button.sd-search-field__clear');
  const searchIcon = (): HTMLElement => field().querySelector('sd-icon.sd-search-field__icon') as HTMLElement;
  const resolve = (property: string, value: string): string => {
    const probe = document.createElement('div');
    probe.style.setProperty(property, value);
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).getPropertyValue(property);
    probe.remove();
    return computed;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchFieldHost] }).compileComponents();
    fixture = TestBed.createComponent(SearchFieldHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('structure and a11y', () => {
    it('projects the real input after a decorative search icon and before the end slot', () => {
      const children = Array.from(field().children);
      const order = [searchIcon(), input(), field().querySelector('.end-hint')].map(el => children.indexOf(el as Element));
      expect(order.every(index => index >= 0))
        .withContext('icon, input and end slot are direct children')
        .toBeTrue();
      expect(order).toEqual([...order].sort((a, b) => a - b));
      expect(searchIcon().getAttribute('aria-hidden')).toBe('true');
    });

    it('focuses the input when the frame or the icon is clicked, as the former <label> wrappers did', () => {
      searchIcon().click();
      expect(document.activeElement).toBe(input());

      input().blur();
      field().click();
      expect(document.activeElement).toBe(input());
    });

    it('leaves focus alone when the end slot or the clear button is clicked', () => {
      host.clearable.set(true);
      host.value.set('đơn hàng');
      fixture.detectChanges();
      (field().querySelector('.end-hint') as HTMLElement).click();
      expect(document.activeElement).not.toBe(input());
      clearButton()!.click();
      expect(document.activeElement).not.toBe(input());
    });

    it('never hides the input or the wrapper from assistive technology', () => {
      expect(field().hasAttribute('aria-hidden')).toBeFalse();
      expect(input().hasAttribute('aria-hidden')).toBeFalse();
      expect(input().getAttribute('aria-label')).toBe('Tìm kiếm');
    });
  });

  describe('size', () => {
    it('is 40px high by default (md) with a 20px icon', () => {
      expect(field().classList).toContain('sd-md');
      expect(field().getBoundingClientRect().height).toBe(40);
      expect(searchIcon().getBoundingClientRect().width).toBe(20);
      expect(getComputedStyle(field()).paddingLeft).toBe('12px');
      expect(getComputedStyle(field()).columnGap).toBe('8px');
    });

    it('is 32px high at sm with an 18px icon, 8px padding and a 6px gap', () => {
      host.size.set('sm');
      fixture.detectChanges();
      expect(field().classList).toContain('sd-sm');
      expect(field().getBoundingClientRect().height).toBe(32);
      expect(searchIcon().getBoundingClientRect().width).toBe(18);
      expect(getComputedStyle(field()).paddingLeft).toBe('8px');
      expect(getComputedStyle(field()).columnGap).toBe('6px');
    });

    it('uses 14px text and inherits it into the input', () => {
      expect(getComputedStyle(input()).fontSize).toBe('14px');
    });
  });

  describe('control box (wave 2 · D)', () => {
    it('draws the control radius and border on the surface background', () => {
      const style = getComputedStyle(field());
      expect(style.borderTopLeftRadius).toBe('8px');
      expect(style.borderTopWidth).toBe('1px');
      expect(style.borderTopColor).toBe(resolve('color', 'var(--sd-control-border)'));
      expect(style.backgroundColor).toBe(resolve('background-color', 'var(--sd-surface)'));
      expect(getComputedStyle(searchIcon()).color).toBe(resolve('color', 'var(--sd-text-secondary)'));
    });

    it('keeps the control radius at sm', () => {
      host.size.set('sm');
      fixture.detectChanges();
      expect(getComputedStyle(field()).borderTopLeftRadius).toBe('8px');
    });

    it('moves focus onto the wrapper: focus border plus ring, no outline on the input', () => {
      input().focus();
      const style = getComputedStyle(field());
      expect(style.borderTopColor).toBe(resolve('color', 'var(--sd-control-border-focus)'));
      expect(style.boxShadow).toBe(resolve('box-shadow', 'var(--sd-control-ring)'));
      expect(getComputedStyle(input()).outlineStyle).toBe('none');
    });
  });

  describe('disabled', () => {
    it('follows the projected input: muted background and disabled text', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      expect(field().classList).toContain('sd-disabled');
      expect(getComputedStyle(field()).backgroundColor).toBe(resolve('background-color', 'var(--sd-surface-muted)'));
      expect(getComputedStyle(input()).color).toBe(resolve('color', 'var(--sd-disabled-text)'));

      host.disabled.set(false);
      fixture.detectChanges();
      expect(field().classList).not.toContain('sd-disabled');
    });
  });

  describe('clear button', () => {
    it('is absent unless clearable', () => {
      host.value.set('đơn hàng');
      fixture.detectChanges();
      expect(clearButton()).toBeNull();
    });

    it('appears only while the input has a value — bound or typed', () => {
      host.clearable.set(true);
      fixture.detectChanges();
      expect(clearButton()).withContext('empty input').toBeNull();

      host.value.set('đơn hàng');
      fixture.detectChanges();
      expect(clearButton()).withContext('bound value').not.toBeNull();

      host.value.set('');
      fixture.detectChanges();
      expect(clearButton()).withContext('bound value cleared').toBeNull();

      input().value = 'a';
      input().dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(clearButton()).withContext('typed value').not.toBeNull();
    });

    it('sits after the input and before the end slot', () => {
      host.clearable.set(true);
      host.value.set('đơn hàng');
      fixture.detectChanges();
      const children = Array.from(field().children);
      const order = [input(), clearButton(), field().querySelector('.end-hint')].map(el => children.indexOf(el as Element));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });

    it('is a real button named by clearLabel, with the shared clear label as fallback', () => {
      host.clearable.set(true);
      host.value.set('đơn hàng');
      fixture.detectChanges();
      expect(clearButton()!.type).toBe('button');
      expect(clearButton()!.getAttribute('aria-label')).toBe(TestBed.inject(I18nService).t('core.form.search-field.clear'));

      host.clearLabel.set('Xoá từ khoá');
      fixture.detectChanges();
      expect(clearButton()!.getAttribute('aria-label')).toBe('Xoá từ khoá');
    });

    it('emits cleared on click and leaves the value to the consumer', () => {
      host.clearable.set(true);
      host.value.set('đơn hàng');
      fixture.detectChanges();
      clearButton()!.click();
      expect(host.cleared).toBe(1);
      expect(input().value).toBe('đơn hàng');
    });

    it('is disabled with the input', () => {
      host.clearable.set(true);
      host.value.set('đơn hàng');
      host.disabled.set(true);
      fixture.detectChanges();
      expect(clearButton()!.disabled).toBeTrue();
    });

    it('carries <autoId>-clear only when autoId is set', () => {
      host.clearable.set(true);
      host.value.set('đơn hàng');
      fixture.detectChanges();
      expect(clearButton()!.hasAttribute('data-autoid')).toBeFalse();

      host.autoId.set('orders-quick-search');
      fixture.detectChanges();
      expect(clearButton()!.getAttribute('data-autoid')).toBe('orders-quick-search-clear');
    });

    it('is 28px with an 18px icon at md and 24px with a 16px icon at sm', () => {
      host.clearable.set(true);
      host.value.set('đơn hàng');
      fixture.detectChanges();
      const icon = (): HTMLElement => clearButton()!.querySelector('sd-icon') as HTMLElement;
      expect(clearButton()!.getBoundingClientRect().width).toBe(28);
      expect(clearButton()!.getBoundingClientRect().height).toBe(28);
      expect(icon().getBoundingClientRect().width).toBe(18);

      host.size.set('sm');
      fixture.detectChanges();
      expect(clearButton()!.getBoundingClientRect().width).toBe(24);
      expect(clearButton()!.getBoundingClientRect().height).toBe(24);
      expect(icon().getBoundingClientRect().width).toBe(16);
    });

    it('takes its size from --sd-search-field-clear-size when a context sets it', () => {
      host.clearable.set(true);
      host.value.set('đơn hàng');
      host.size.set('sm');
      fixture.detectChanges();
      field().style.setProperty('--sd-search-field-clear-size', '40px');
      expect(clearButton()!.getBoundingClientRect().width).toBe(40);
    });
  });
});
