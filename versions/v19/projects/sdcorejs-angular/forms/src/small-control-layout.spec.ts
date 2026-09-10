import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutTestTheme } from '../../testing/layout-theme.spec';
import { SdFormsModule } from './forms.module';

@Component({
  imports: [SdFormsModule, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 280px">
      <sd-select
        size="sm"
        label="Trạng thái"
        placeholder="Chọn trạng thái"
        [items]="statuses"
        [model]="status"
        valueField="value"
        displayField="label"
        hideInlineError />
      <sd-select size="sm" label="Nhiều trạng thái" [multiple]="true" [items]="[]" hideInlineError />
      <sd-input size="sm" label="Tên hồ sơ" placeholder="Nhập tên" hideInlineError />
      <sd-input-number size="sm" label="Giá trị" hideInlineError />
      <sd-autocomplete size="sm" label="Khu vực" [items]="[]" hideInlineError />
      <sd-date size="sm" label="Ngày" hideInlineError />
      <sd-datetime size="sm" label="Ngày giờ" hideInlineError />
      <sd-date-range size="sm" label="Khoảng ngày" hideInlineError />
      <sd-time size="sm" label="Giờ" hideInlineError />
      <sd-input-color size="sm" label="Màu" hideInlineError />
      <sd-textarea size="sm" label="Ghi chú" [rows]="3" hideInlineError />
      <sd-chip size="sm" label="Nhãn" hideInlineError />
      <sd-chip-calendar size="sm" label="Các ngày" hideInlineError />
      <sd-tree-select size="sm" label="Cây" hideInlineError />
    </div>
  `,
})
class SmallControlsHost {
  readonly statuses = [{ value: 'active', label: 'Đang xử lý' }];
  status: string | undefined;
}

function center(element: Element): number {
  const rect = element.getBoundingClientRect();
  return rect.top + rect.height / 2;
}

describe('Small controls with the shipped theme', () => {
  let fixture: ComponentFixture<SmallControlsHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SmallControlsHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SmallControlsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    await document.fonts.ready;
    fixture.detectChanges();
  });

  it('centers resting labels on the first 32px line across small controls', () => {
    const fields = fixture.nativeElement.querySelectorAll('mat-form-field.sd-sm') as NodeListOf<HTMLElement>;
    expect(fields.length).toBe(14);
    fields.forEach(field => {
      const label = field.querySelector('.mdc-floating-label:not(.mdc-floating-label--float-above) mat-label');
      expect(label).withContext(field.outerHTML.slice(0, 120)).not.toBeNull();
      if (!label) return;
      const wrapper = field.querySelector('.mat-mdc-text-field-wrapper')!;
      const expectedCenter = wrapper.getBoundingClientRect().top + 16;
      expect(Math.abs(center(label) - expectedCenter))
        .withContext(`${label.textContent?.trim()}: label offset ${center(label) - expectedCenter}px`)
        .toBeLessThanOrEqual(1);
    });
  });

  it('keeps the focused placeholder and selected value centered in a small select', async () => {
    const select = fixture.nativeElement.querySelector('sd-select mat-select') as HTMLElement;
    const wrapper = select.closest('mat-form-field')!.querySelector('.mat-mdc-text-field-wrapper')!;
    select.focus();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(wrapper.querySelector('.mdc-floating-label--float-above')).not.toBeNull();
    expect(Math.abs(center(select) - center(wrapper))).toBeLessThanOrEqual(1);

    fixture.componentInstance.status = 'active';
    fixture.detectChanges();
    await fixture.whenStable();
    select.blur();
    fixture.detectChanges();
    expect(select.textContent).toContain('Đang xử lý');
    expect(wrapper.querySelector('.mdc-floating-label--float-above')).not.toBeNull();
    expect(Math.abs(center(select) - center(wrapper))).toBeLessThanOrEqual(1);
  });
});
