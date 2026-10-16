import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutTestTheme } from '../../testing/layout-theme.spec';
import { SdAutocomplete } from '../autocomplete';
import { SdInput } from '../input';
import { SdSelect } from '../select';
import { SdFormsModule } from './forms.module';

// A custom primary, so a colour taken from Material's own azure palette cannot pass by accident. It is set on
// <html>, where sd.theme() maps the Material tokens, so overlay panels (outside the host) see it too.
const PRIMARY = 'rgb(174, 113, 41)';
const ERROR = 'rgb(186, 26, 26)';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdFormsModule, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 280px">
      <sd-input #invalid label="Bắt buộc" [required]="true" />
      <sd-input label="Hợp lệ" />
      <sd-select label="Trạng thái" [items]="statuses" [model]="status" valueField="value" displayField="label" />
      <sd-autocomplete label="Khu vực" [items]="statuses" valueField="value" displayField="label" />
      <sd-input #fill appearance="fill" label="Nền" [required]="true" />
      <sd-input #compact label="Gọn" [required]="true" hideInlineError />
    </div>
  `,
})
class StateColorsHost {
  readonly statuses = [
    { value: 'active', label: 'Đang xử lý' },
    { value: 'done', label: 'Hoàn tất' },
  ];
  status = 'active';
  readonly invalid = viewChild.required<SdInput>('invalid');
  readonly fill = viewChild.required<SdInput>('fill');
  readonly compact = viewChild.required<SdInput>('compact');
  readonly select = viewChild.required(SdSelect);
  readonly autocomplete = viewChild.required(SdAutocomplete);
}

describe('Form field state colours with the shipped theme', () => {
  let fixture: ComponentFixture<StateColorsHost>;
  let fields: HTMLElement[];

  const labelColor = (field: Element) => getComputedStyle(field.querySelector('.mdc-floating-label')!).color;
  const outlineColor = (field: Element) => getComputedStyle(field.querySelector('.mdc-notched-outline__leading')!).borderTopColor;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    document.documentElement.style.setProperty('--sd-primary', '#ae7129');
    await TestBed.configureTestingModule({ imports: [StateColorsHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(StateColorsHost);
    await settle();
    fields = Array.from(fixture.nativeElement.querySelectorAll('mat-form-field'));
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--sd-primary');
    fixture.componentInstance.select().selectRef()?.close();
    fixture.componentInstance.autocomplete().autocompleteTrigger()?.closePanel();
  });

  it('draws the focused outline and floating label in --sd-primary', async () => {
    const valid = fields[1];
    valid.querySelector('input')!.focus();
    await settle();
    expect(valid.classList).toContain('mat-focused');
    expect(outlineColor(valid)).toBe(PRIMARY);
    expect(labelColor(valid)).toBe(PRIMARY);
  });

  it('turns only the outline red on an invalid field; the label keeps the valid colour', async () => {
    const [invalid, valid] = fields;
    fixture.componentInstance.invalid().formControl.markAsTouched();
    await settle();
    expect(invalid.classList).toContain('mat-form-field-invalid');
    expect(outlineColor(invalid)).toBe(ERROR);
    expect(labelColor(invalid)).toBe(labelColor(valid));
    expect(labelColor(invalid)).not.toBe(ERROR);

    invalid.querySelector('input')!.focus();
    await settle();
    expect(outlineColor(invalid)).toBe(ERROR);
    expect(labelColor(invalid)).toBe(PRIMARY);
  });

  it('uses the primary for the focused fill indicator and only reddens the indicator when invalid', async () => {
    const fill = fields[4];
    const indicator = (pseudo: '::before' | '::after') =>
      getComputedStyle(fill.querySelector('.mdc-line-ripple')!, pseudo).borderBottomColor;
    fill.querySelector('input')!.focus();
    await settle();
    expect(indicator('::after')).toBe(PRIMARY);

    fixture.componentInstance.fill().formControl.markAsTouched();
    (fill.querySelector('input') as HTMLInputElement).blur();
    await settle();
    expect(fill.classList).toContain('mat-form-field-invalid');
    expect(indicator('::before')).toBe(ERROR);
    expect(labelColor(fill)).toBe(labelColor(fields[1]));
  });

  it('reddens the outline of an invalid hideInlineError field without a message', async () => {
    const compact = fields[5];
    fixture.componentInstance.compact().formControl.markAsTouched();
    await settle();
    expect(compact.classList).toContain('mat-form-field-invalid');
    expect(outlineColor(compact)).toBe(ERROR);
    expect(labelColor(compact)).toBe(labelColor(fields[1]));
    expect(getComputedStyle(compact.querySelector('.mat-mdc-form-field-subscript-wrapper')!).display).toBe('none');
  });

  it('renders select options at 14px and the selected one in --sd-primary', async () => {
    fixture.componentInstance.select().open();
    await settle();
    const options = Array.from(document.querySelectorAll('.sd-select-panel mat-option')) as HTMLElement[];
    expect(options.length).toBe(2);
    options.forEach(option => expect(getComputedStyle(option.querySelector('.mdc-list-item__primary-text')!).fontSize).toBe('14px'));
    const selected = options.find(option => option.classList.contains('mdc-list-item--selected'))!;
    expect(getComputedStyle(selected.querySelector('.mdc-list-item__primary-text')!).color).toBe(PRIMARY);
    expect(getComputedStyle(fields[2].querySelector('.mat-mdc-select-value')!).fontSize).toBe('14px');
  });

  it('renders autocomplete options at the 14px of its input', async () => {
    fixture.componentInstance.autocomplete().autocompleteTrigger()?.openPanel();
    await settle();
    const options = Array.from(document.querySelectorAll('.sd-autocomplete-panel mat-option')) as HTMLElement[];
    expect(options.length).toBeGreaterThan(0);
    options.forEach(option => expect(getComputedStyle(option.querySelector('.mdc-list-item__primary-text')!).fontSize).toBe('14px'));
    expect(getComputedStyle(fields[3].querySelector('input')!).fontSize).toBe('14px');
  });
});
