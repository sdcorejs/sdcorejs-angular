import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Color } from '@sdcorejs/utils/models';
import { SdInform } from './inform.component';
import { SdInformActionDirective } from './inform-action.directive';

@Component({
  imports: [SdInform, SdInformActionDirective],
  template: `
    <sd-inform type="tip" [color]="color" closable (sdClosed)="closed = true">
      Bấm <strong>{{ action }}</strong> để chọn trường. Bật <code>showSavedFilters</code>.
      <a href="#filters" (click)="$event.preventDefault(); clicked = true">Hướng dẫn</a>
    </sd-inform>
    <sd-inform type="tip" title="Lưu ý" description="Nội dung nhiều dòng để kiểm tra icon căn đầu." actionLabel="Default">
      <button sdInformAction>Custom action</button>
    </sd-inform>
  `,
})
class TipHost {
  color: Color = 'info';
  action = 'Thêm bộ lọc';
  closed = false;
  clicked = false;
}

describe('SdInform tip', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TipHost, SdInform, NoopAnimationsModule] }));

  it('uses note semantics even for warning and error', () => {
    const f = TestBed.createComponent(TipHost);
    for (const color of ['primary', 'secondary', 'info', 'success', 'warning', 'error'] as Color[]) {
      f.componentInstance.color = color;
      f.detectChanges();
      const banner = f.nativeElement.querySelector('.c-inform');
      expect(banner.getAttribute('role')).toBe('note');
      expect(banner.classList.contains(`c-${color}`)).toBeTrue();
    }
  });

  it('preserves inline rich content, bindings and link handlers', () => {
    const f = TestBed.createComponent(TipHost);
    f.detectChanges();
    const content: HTMLElement = f.nativeElement.querySelector('.c-inform-content');
    expect(getComputedStyle(content).display).toBe('block');
    expect(content.querySelector('strong')?.textContent).toBe('Thêm bộ lọc');
    expect(content.querySelector('code')?.textContent).toBe('showSavedFilters');
    f.componentInstance.action = 'Chọn bộ lọc';
    f.detectChanges();
    expect(content.querySelector('strong')?.textContent).toBe('Chọn bộ lọc');
    content.querySelector('a')?.click();
    expect(f.componentInstance.clicked).toBeTrue();
  });

  it('uses compact spacing and a small top-aligned icon without the circular tile', () => {
    const f = TestBed.createComponent(TipHost);
    f.detectChanges();
    const banner: HTMLElement = f.nativeElement.querySelector('.c-inform');
    // why: the isolated test runner does not load the app-level Core theme stylesheet.
    f.nativeElement.style.setProperty('--sd-info', '#0088cc');
    const style = getComputedStyle(banner);
    expect(style.paddingTop).toBe('8px');
    expect(style.paddingLeft).toBe('12px');
    expect(style.borderLeftWidth).toBe('3px');
    expect(style.borderLeftColor).toBe('rgb(0, 136, 204)');
    f.nativeElement.style.setProperty('--sd-info', '#66ccff');
    expect(getComputedStyle(banner).borderLeftColor).toBe('rgb(102, 204, 255)');
    const icon: HTMLElement = banner.querySelector('.c-inform-icon-tile')!;
    expect(getComputedStyle(icon).width).toBe('16px');
    expect(getComputedStyle(icon).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(banner.querySelector('.c-inform-content')!).fontSize).toBe('13px');
  });

  it('supports optional title, description, action slot and closing', () => {
    const f = TestBed.createComponent(TipHost);
    f.detectChanges();
    const banners: NodeListOf<HTMLElement> = f.nativeElement.querySelectorAll('.c-inform');
    expect(banners[0].querySelector('.c-inform-title')).toBeNull();
    expect(banners[1].querySelector('.c-inform-title')?.textContent).toBe('Lưu ý');
    expect(getComputedStyle(banners[1].querySelector('.c-inform-title')!).fontWeight).toBe('600');
    expect(banners[1].querySelector('.c-inform-body')).not.toBeNull();
    expect(banners[1].querySelector('.c-inform-action')?.textContent).toContain('Custom action');
    expect(banners[1].querySelector('.c-inform-action-link')).toBeNull();
    banners[0].querySelector<HTMLButtonElement>('.c-inform-close')!.click();
    f.detectChanges();
    expect(f.componentInstance.closed).toBeTrue();
    expect(f.nativeElement.querySelectorAll('.c-inform').length).toBe(1);
  });

  it('leaves default presentation and alert semantics unchanged', () => {
    const f = TestBed.createComponent(SdInform);
    f.componentRef.setInput('error', true);
    f.componentRef.setInput('title', 'Default');
    f.detectChanges();
    const banner = f.nativeElement.querySelector('.c-inform');
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.classList.contains('c-inform-tip')).toBeFalse();
    expect(getComputedStyle(banner.querySelector('.c-inform-icon-tile')).width).toBe('32px');
  });

  it('switches variants reactively and restores default for nullish type', () => {
    const f = TestBed.createComponent(SdInform);
    f.componentRef.setInput('type', 'tip');
    f.componentRef.setInput('warning', true);
    f.componentRef.setInput('title', 'Title only');
    f.componentRef.setInput('icon', 'settings');
    f.detectChanges();
    const banner: HTMLElement = f.nativeElement.querySelector('.c-inform');
    expect(banner.getAttribute('role')).toBe('note');
    expect(banner.querySelector('sd-icon mat-icon')?.textContent?.trim()).toBe('settings');
    expect(getComputedStyle(banner.querySelector('.c-inform-title')!).minHeight).toBe('0px');
    f.componentRef.setInput('hideIcon', true);
    f.detectChanges();
    expect(banner.querySelector('.c-inform-icon-tile')).toBeNull();
    for (const type of [null, undefined]) {
      f.componentRef.setInput('type', type);
      f.detectChanges();
      expect(f.componentInstance.type()).toBe('default');
      expect(banner.getAttribute('role')).toBe('alert');
      expect(banner.classList.contains('c-inform-tip')).toBeFalse();
    }
  });
});
