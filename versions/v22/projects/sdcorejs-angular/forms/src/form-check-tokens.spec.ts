import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckbox } from '@angular/material/checkbox';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutTestTheme } from '../../testing/layout-theme.spec';
import { SdCheckbox } from '../checkbox';
import { SdRadio } from '../radio';
import { SdSelect } from '../select';

// Checkbox and radio (design handoff wave 2 · E) on the shipped theme: the unselected border is
// --sd-border-strong and turns --sd-text-secondary on focus, the radius of a raw mat-checkbox and of the
// multi-select pseudo-checkbox is --sd-radius-4.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdCheckbox, SdRadio, SdSelect, MatCheckbox, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 280px">
      <sd-checkbox label="Ghi nhớ" />
      <mat-checkbox class="raw">Cột chọn</mat-checkbox>
      <sd-radio [items]="items" valueField="value" displayField="label" />
      <sd-select label="Nhiều" [items]="items" valueField="value" displayField="label" [multiple]="true" [showSelectAll]="true" />
    </div>
  `,
})
class CheckTokensHost {
  readonly items = [
    { value: 'a', label: 'Một' },
    { value: 'b', label: 'Hai' },
  ];
  readonly select = viewChild.required(SdSelect);
}

describe('Checkbox and radio tokens with the shipped theme', () => {
  let fixture: ComponentFixture<CheckTokensHost>;
  let host: HTMLElement;

  /** The computed value of `property: value` on a probe that inherits the theme of <html>. */
  const resolve = (property: string, value: string): string => {
    const probe = document.createElement('div');
    probe.style.setProperty(property, value);
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).getPropertyValue(property);
    probe.remove();
    return computed;
  };
  const borderOf = (element: Element) => getComputedStyle(element).borderTopColor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CheckTokensHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(CheckTokensHost);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  afterEach(() => fixture.componentInstance.select().selectRef()?.close());

  it('draws an unchecked sd-checkbox with --sd-border-strong, --sd-text-secondary on focus', () => {
    const box = host.querySelector('sd-checkbox .mdc-checkbox__background')!;
    expect(borderOf(box)).toBe(resolve('color', 'var(--sd-border-strong)'));
    (host.querySelector('sd-checkbox input') as HTMLInputElement).focus();
    expect(borderOf(box)).toBe(resolve('color', 'var(--sd-text-secondary)'));
  });

  it('rounds and colours a mat-checkbox used directly (the sd-table selection column)', () => {
    const box = host.querySelector('mat-checkbox.raw .mdc-checkbox__background')!;
    expect(getComputedStyle(box).borderTopLeftRadius).toBe('4px');
    expect(borderOf(box)).toBe(resolve('color', 'var(--sd-border-strong)'));
  });

  it('draws an unselected radio with --sd-border-strong, --sd-text-secondary on focus', () => {
    const circle = host.querySelector('sd-radio .mdc-radio__outer-circle')!;
    expect(borderOf(circle)).toBe(resolve('color', 'var(--sd-border-strong)'));
    (host.querySelector('sd-radio input') as HTMLInputElement).focus();
    expect(borderOf(circle)).toBe(resolve('color', 'var(--sd-text-secondary)'));
  });

  it('rounds the pseudo-checkbox of a multiple select and draws it unselected in --sd-border-strong', async () => {
    // sd-select nạp items qua một observable, nên chờ ổn định trước khi mở panel.
    await fixture.whenStable();
    fixture.componentInstance.select().selectRef()?.open();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // The panel can hold helper options (loading / empty, disabled); read the pseudo-checkbox of a real item.
    const option = Array.from(document.querySelectorAll('.sd-select-panel mat-option')).find(o => o.textContent?.includes('Một'));
    const pseudo = option?.querySelector('.mat-pseudo-checkbox') ?? null;
    expect(pseudo).withContext('pseudo-checkbox of a multiple select').not.toBeNull();
    expect(getComputedStyle(pseudo!).borderTopLeftRadius).toBe('4px');
    expect(borderOf(pseudo!)).toBe(resolve('color', 'var(--sd-border-strong)'));
    // The "Tất cả" row is not a mat-option but uses the same pseudo-checkbox, so it must match.
    const selectAll = document.querySelector('.sd-select-panel .sd-select-all-row .mat-pseudo-checkbox');
    expect(selectAll).withContext('select-all row').not.toBeNull();
    expect(getComputedStyle(selectAll!).borderTopLeftRadius).toBe('4px');
    expect(borderOf(selectAll!)).toBe(resolve('color', 'var(--sd-border-strong)'));
  });
});
