import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutTestTheme } from '../../testing/layout-theme.spec';
import { SdFormsModule } from './forms.module';

@Component({
  imports: [SdFormsModule, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div [style.width.px]="width">
      <sd-select
        [helperText]="helperText"
        [size]="size"
        [required]="required"
        [appearance]="appearance"
        label="Trạng thái"
        placeholder="Chọn trạng thái"
        [items]="statuses"
        [model]="status"
        valueField="value"
        displayField="label"
        hideInlineError />
      <sd-select
        [helperText]="helperText"
        [size]="size"
        [required]="required"
        [appearance]="appearance"
        label="Nhiều trạng thái"
        [multiple]="true"
        [items]="[]"
        hideInlineError />
      <sd-input
        [helperText]="helperText"
        [size]="size"
        [required]="required"
        [appearance]="appearance"
        [label]="inputLabel"
        placeholder="Nhập tên"
        hideInlineError />
      <sd-input-number
        [helperText]="helperText"
        [size]="size"
        [required]="required"
        [appearance]="appearance"
        label="Giá trị"
        hideInlineError />
      <sd-autocomplete
        [helperText]="helperText"
        [size]="size"
        [required]="required"
        [appearance]="appearance"
        label="Khu vực"
        [items]="[]"
        hideInlineError />
      <sd-date [helperText]="helperText" [size]="size" [required]="required" [appearance]="appearance" label="Ngày" hideInlineError />
      <sd-datetime
        [helperText]="helperText"
        [size]="size"
        [required]="required"
        [appearance]="appearance"
        label="Ngày giờ"
        hideInlineError />
      <sd-date-range
        [helperText]="helperText"
        [size]="size"
        [required]="required"
        [appearance]="appearance"
        label="Khoảng ngày"
        hideInlineError />
      <sd-time [helperText]="helperText" [size]="size" [required]="required" [appearance]="appearance" label="Giờ" hideInlineError />
      <sd-input-color [helperText]="helperText" [size]="size" [required]="required" [appearance]="appearance" label="Màu" hideInlineError />
      <sd-textarea
        [helperText]="helperText"
        [size]="size"
        [required]="required"
        [appearance]="appearance"
        label="Ghi chú"
        [rows]="3"
        hideInlineError />
      <sd-chip [size]="size" [required]="required" [appearance]="appearance" label="Nhãn" hideInlineError />
      <sd-chip-calendar [size]="size" [required]="required" [appearance]="appearance" label="Các ngày" hideInlineError />
      <sd-tree-select [helperText]="helperText" [size]="size" [required]="required" [appearance]="appearance" label="Cây" hideInlineError />
    </div>
  `,
})
class SmallControlsHost {
  readonly statuses = [{ value: 'active', label: 'Đang xử lý' }];
  status: string | undefined;
  size: 'sm' | 'md' = 'sm';
  appearance: 'outline' | 'fill' = 'outline';
  required = false;
  helperText = '';
  width = 280;
  inputLabel = 'Tên hồ sơ';
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

  for (const size of ['sm', 'md'] as const) {
    for (const appearance of ['outline', 'fill'] as const) {
      for (const helperText of ['', 'Field guidance']) {
        it(`keeps required markers on the label line: ${size}/${appearance}/helper=${!!helperText}`, async () => {
          Object.assign(fixture.componentInstance, { size, appearance, helperText, required: true });
          fixture.detectChanges();
          await fixture.whenStable();
          const markers = fixture.nativeElement.querySelectorAll('.mat-mdc-form-field-required-marker') as NodeListOf<HTMLElement>;
          expect(markers.length).toBe(14);
          markers.forEach(marker => {
            const label = marker.parentElement!.querySelector('mat-label')!;
            const rect = label.getBoundingClientRect();
            expect(center(marker)).withContext(label.textContent!).toBeGreaterThanOrEqual(rect.top);
            expect(center(marker)).withContext(label.textContent!).toBeLessThanOrEqual(rect.bottom);
            expect(marker.getBoundingClientRect().left)
              .withContext(label.textContent!)
              .toBeGreaterThanOrEqual(rect.right - 1);
          });
        });
      }
    }
  }

  it('keeps a long required label and tooltip on one line in narrow and focused fields', async () => {
    Object.assign(fixture.componentInstance, {
      required: true,
      helperText: 'Field guidance',
      width: 144,
      inputLabel: 'A long required field label that needs truncation',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('sd-input mat-form-field') as HTMLElement;
    const input = field.querySelector('input')!;
    for (const focused of [false, true]) {
      if (focused) input.focus();
      fixture.detectChanges();
      await fixture.whenStable();
      const label = field.querySelector('mat-label')!;
      const marker = field.querySelector('.mat-mdc-form-field-required-marker')!;
      const icon = label.querySelector('sd-icon')!;
      const text = label.querySelector('span') as HTMLElement;
      expect(Math.abs(center(marker) - center(label))).toBeLessThanOrEqual(1);
      expect(Math.abs(center(icon) - center(label))).toBeLessThanOrEqual(1);
      expect(marker.getBoundingClientRect().right).toBeLessThanOrEqual(field.getBoundingClientRect().right);
      expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
      expect(field.querySelector('.mdc-floating-label--float-above') !== null).toBe(focused);
    }
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
