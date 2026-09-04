import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SdTranslatePipe } from './i18n.pipe';
import { I18N_STORAGE_KEY } from './i18n.token';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTranslatePipe],
  template: `{{ key() | sdTranslate: params() }}`,
})
class Host {
  readonly key = signal('core.common.cancel');
  readonly params = signal<Record<string, string> | undefined>(undefined);
}

describe('SdTranslatePipe', () => {
  beforeEach(() => localStorage.removeItem(I18N_STORAGE_KEY));

  it('renders translation', () => {
    const fix = TestBed.createComponent(Host);
    fix.detectChanges();
    expect(fix.nativeElement.textContent.trim()).toBe('Hủy');
  });

  it('renders new value when key changes', () => {
    const fix = TestBed.createComponent(Host);
    fix.detectChanges();
    expect(fix.nativeElement.textContent.trim()).toBe('Hủy');
    fix.componentInstance.key.set('core.common.close');
    fix.detectChanges();
    expect(fix.nativeElement.textContent.trim()).toBe('Đóng');
  });

  it('passes params to interpolation', () => {
    const fix = TestBed.createComponent(Host);
    fix.componentInstance.key.set('core.test.greet');
    fix.componentInstance.params.set({ name: 'Ada' });
    fix.detectChanges();
    expect(fix.nativeElement.textContent.trim()).toBe('Xin chào Ada');
  });
});
