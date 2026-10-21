import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutTestTheme } from '../../testing/layout-theme.spec';
import { SdAutocomplete } from '../autocomplete';
import { SdInput } from '../input';
import { SdSelect } from '../select';
import { SdFormsModule } from './forms.module';

// Control tokens (design handoff wave 2 · D) on the shipped theme: radius, outline, focus ring, label
// background, disabled background and the select / autocomplete panels.
@Component({
  imports: [SdFormsModule, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 280px">
      <sd-input label="Hợp lệ" />
      <sd-input #invalid label="Bắt buộc" [required]="true" />
      <sd-input label="Vô hiệu" [disabled]="true" />
      <sd-autocomplete label="Khu vực vô hiệu" [items]="statuses" valueField="value" displayField="label" [disabled]="true" />
      <sd-select #single label="Trạng thái" [items]="statuses" [model]="status" valueField="value" displayField="label" />
      <sd-autocomplete label="Khu vực" [items]="statuses" valueField="value" displayField="label" [model]="area" />
      <sd-select #all label="Nhiều" [items]="statuses" valueField="value" displayField="label" multiple showSelectAll />
    </div>
  `,
})
class ControlTokensHost {
  readonly statuses = [
    { value: 'active', label: 'Đang xử lý' },
    { value: 'done', label: 'Hoàn tất' },
  ];
  status = 'active';
  area = 'done';
  readonly invalid = viewChild.required<SdInput>('invalid');
  readonly single = viewChild.required<SdSelect>('single');
  readonly all = viewChild.required<SdSelect>('all');
}

// why: sd-select chỉ hiện ô lọc khi có hơn 10 item, và một select như vậy giữ zone không ổn định
// (whenStable treo cả lượt Karma) — nên nó có host riêng, mở panel đồng bộ như spec a11y của select.
@Component({
  imports: [SdFormsModule, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 280px">
      <sd-select label="Nhiều" [items]="items" valueField="value" displayField="label" />
    </div>
  `,
})
class FilterInputHost {
  readonly items = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `Mục ${i}` }));
  readonly select = viewChild.required(SdSelect);
}

describe('Form field control tokens with the shipped theme', () => {
  let fixture: ComponentFixture<ControlTokensHost>;
  let fields: HTMLElement[];

  /** The computed value of `property: value` on a probe that inherits the theme of <html>. */
  const resolve = (property: string, value: string): string => {
    const probe = document.createElement('div');
    probe.style.setProperty(property, value);
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).getPropertyValue(property);
    probe.remove();
    return computed;
  };
  const leading = (field: Element) => getComputedStyle(field.querySelector('.mdc-notched-outline__leading')!);
  const wrapper = (field: Element) => getComputedStyle(field.querySelector('.mat-mdc-text-field-wrapper')!);
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ControlTokensHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(ControlTokensHost);
    await settle();
    fields = Array.from(fixture.nativeElement.querySelectorAll('mat-form-field'));
  });

  afterEach(() => {
    fixture.componentInstance.single().selectRef()?.close();
  });

  it('draws the outline at rest in --sd-control-border, 1px wide, with the 8px control radius', () => {
    const outline = leading(fields[0]);
    expect(outline.borderTopColor).toBe(resolve('color', 'var(--sd-control-border)'));
    expect(outline.borderTopWidth).toBe('1px');
    expect(outline.borderTopLeftRadius).toBe('8px');
  });

  it('keeps a 1px outline on focus and adds the control ring around the field', async () => {
    const field = fields[0];
    field.querySelector('input')!.focus();
    await settle();
    expect(field.classList).toContain('mat-focused');
    expect(leading(field).borderTopWidth).toBe('1px');
    expect(wrapper(field).boxShadow).toBe(resolve('box-shadow', 'var(--sd-control-ring)'));
    expect(wrapper(field).borderTopLeftRadius).toBe('8px');
  });

  it('uses the error ring on a focused invalid field', async () => {
    const field = fields[1];
    fixture.componentInstance.invalid().formControl.markAsTouched();
    field.querySelector('input')!.focus();
    await settle();
    expect(field.classList).toContain('mat-form-field-invalid');
    expect(wrapper(field).boxShadow).toBe(resolve('box-shadow', 'var(--sd-control-ring-error)'));
  });

  it('gives the floating label the surface background only while focused, so it cuts the ring at the notch', async () => {
    const field = fields[0];
    const label = () => getComputedStyle(field.querySelector('.mdc-floating-label')!).backgroundColor;
    expect(label()).toBe('rgba(0, 0, 0, 0)');
    field.querySelector('input')!.focus();
    await settle();
    expect(label()).toBe(resolve('background-color', 'var(--sd-surface)'));
  });

  it('paints every disabled field, autocomplete included, with --sd-control-bg-disabled', () => {
    const expected = resolve('background-color', 'var(--sd-control-bg-disabled)');
    expect(fields[2].classList).toContain('mat-form-field-disabled');
    expect(wrapper(fields[2]).backgroundColor).toBe(expected);
    expect(fields[3].classList).toContain('mat-form-field-disabled');
    expect(wrapper(fields[3]).backgroundColor).toBe(expected);
    expect(leading(fields[2]).borderTopColor).toBe(resolve('color', 'var(--sd-control-border-disabled)'));
  });

  it('rounds the select panel on all four corners and insets its 36px options', async () => {
    fixture.componentInstance.single().open();
    await settle();
    const panel = getComputedStyle(document.querySelector('.mat-mdc-select-panel.sd-select-panel')!);
    for (const corner of ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'] as const) {
      expect(panel[`border${corner}Radius`]).withContext(corner).toBe('10px');
    }
    expect(panel.borderTopWidth).toBe('1px');
    expect(panel.boxShadow).toBe(resolve('box-shadow', 'var(--sd-shadow-md)'));
    const option = document.querySelector('.sd-select-panel mat-option') as HTMLElement;
    const style = getComputedStyle(option);
    expect(style.marginLeft).toBe('4px');
    expect(style.marginRight).toBe('4px');
    expect(style.marginTop).toBe('0px');
    expect(style.borderTopLeftRadius).toBe('6px');
    expect(option.getBoundingClientRect().height).toBe(36);
  });

  it('shows the selected option in --sd-primary-dark on --sd-primary-light, weight 500', async () => {
    fixture.componentInstance.single().open();
    await settle();
    const selected = document.querySelector('.sd-select-panel mat-option.mdc-list-item--selected') as HTMLElement;
    const style = getComputedStyle(selected);
    // Material 22 paints the selected colour only while the option is not the active one, and the selected
    // option is active when the panel opens, so read the tokens the option resolves rather than its colour.
    const root = getComputedStyle(document.documentElement);
    expect(style.getPropertyValue('--mat-option-selected-state-label-text-color').trim()).toBe(
      root.getPropertyValue('--sd-primary-dark').trim()
    );
    expect(style.getPropertyValue('--mat-option-selected-state-layer-color').trim()).toBe(
      root.getPropertyValue('--sd-primary-light').trim()
    );
    expect(getComputedStyle(selected.querySelector('.mdc-list-item__primary-text')!).fontWeight).toBe('500');
  });

  // Review of wave 2 · D panels (design: 6px from the field, 4px padding, 2px between options, white panel).
  describe('panel spacing and surface', () => {
    const selectPanel = () => document.querySelector<HTMLElement>('.mat-mdc-select-panel.sd-select-panel')!;
    const fieldBox = (host: HTMLElement) => host.querySelector<HTMLElement>('.mat-mdc-text-field-wrapper')!.getBoundingClientRect();
    // Panels flip above the field when the frame is short; the gap is measured on the side the panel opened.
    const gap = (panel: HTMLElement, field: DOMRect) => {
      const box = panel.getBoundingClientRect();
      return box.top >= field.bottom - 1 ? box.top - field.bottom : field.top - box.bottom;
    };
    const selectHost = (index: number) => fixture.nativeElement.querySelectorAll('sd-select')[index] as HTMLElement;

    it('keeps 4px of panel padding above the first option and opens 6px below the field', async () => {
      fixture.componentInstance.single().open();
      await settle();
      const panel = selectPanel();
      expect(getComputedStyle(panel).paddingTop).toBe('4px');
      expect(getComputedStyle(panel).paddingBottom).toBe('4px');
      expect(gap(panel, fieldBox(selectHost(0)))).toBeCloseTo(6, 0);
    });

    it('separates neighbouring options by a 2px gap without changing their 36px height', async () => {
      fixture.componentInstance.single().open();
      await settle();
      const option = selectPanel().querySelector<HTMLElement>('mat-option')!;
      const style = getComputedStyle(option);
      expect(style.borderTopWidth).toBe('1px');
      expect(style.borderBottomWidth).toBe('1px');
      expect(style.borderTopColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.backgroundClip).toBe('padding-box');
      expect(option.getBoundingClientRect().height).toBe(36);
    });

    it('paints the select and autocomplete panels with --sd-select-panel-bg', async () => {
      const expected = resolve('background-color', 'var(--sd-select-panel-bg)');
      fixture.componentInstance.single().open();
      await settle();
      expect(getComputedStyle(selectPanel()).backgroundColor).toBe(expected);
      fixture.componentInstance.single().selectRef()?.close();
      const autocomplete = fixture.debugElement.queryAll(By.directive(SdAutocomplete))[1].componentInstance as SdAutocomplete;
      autocomplete.autocompleteTrigger()?.openPanel();
      await settle();
      const panel = document.querySelector<HTMLElement>('.mat-mdc-autocomplete-panel.sd-autocomplete-panel')!;
      expect(getComputedStyle(panel).backgroundColor).toBe(expected);
      expect(getComputedStyle(panel).paddingTop).toBe('4px');
      const field = fixture.nativeElement.querySelectorAll('sd-autocomplete')[1] as HTMLElement;
      expect(gap(panel, fieldBox(field))).toBeCloseTo(6, 0);
      autocomplete.autocompleteTrigger()?.closePanel();
    });

    it('highlights the chosen autocomplete value when the panel opens again', async () => {
      const autocomplete = fixture.debugElement.queryAll(By.directive(SdAutocomplete))[1].componentInstance as SdAutocomplete;
      autocomplete.autocompleteTrigger()?.openPanel();
      await settle();
      const options = Array.from(document.querySelectorAll<HTMLElement>('.sd-autocomplete-panel mat-option'));
      const chosen = options.find(option => option.textContent?.includes('Hoàn tất'))!;
      const other = options.find(option => option.textContent?.includes('Đang xử lý'))!;
      expect(chosen.classList).toContain('sd-option--selected');
      expect(other.classList).not.toContain('sd-option--selected');
      const text = getComputedStyle(chosen.querySelector('.mdc-list-item__primary-text')!);
      expect(text.color).toBe(resolve('color', 'var(--sd-primary-dark)'));
      expect(text.fontWeight).toBe('500');
      autocomplete.autocompleteTrigger()?.closePanel();
    });

    it('lines the "select all" row up with the options: same 4px inset and checkbox column', async () => {
      fixture.componentInstance.all().open();
      await settle();
      const panel = document.querySelector<HTMLElement>('.sd-select-panel.sd-multiple')!;
      const row = panel.querySelector<HTMLElement>('.sd-select-all-row')!;
      const option = panel.querySelector<HTMLElement>('mat-option')!;
      expect(getComputedStyle(row).marginLeft).toBe('4px');
      expect(getComputedStyle(row).marginRight).toBe('4px');
      const rowBox = row.querySelector('.mat-pseudo-checkbox')!.getBoundingClientRect();
      const optionBox = option.querySelector('.mat-pseudo-checkbox')!.getBoundingClientRect();
      expect(rowBox.left).toBeCloseTo(optionBox.left, 0);
      expect(row.getBoundingClientRect().height).toBe(36);
      fixture.componentInstance.all().selectRef()?.close();
    });
  });

  it('rounds the autocomplete panel on all four corners', async () => {
    const autocomplete = fixture.debugElement.queryAll(By.directive(SdAutocomplete))[1].componentInstance as SdAutocomplete;
    autocomplete.autocompleteTrigger()?.openPanel();
    await settle();
    const panel = getComputedStyle(document.querySelector('.mat-mdc-autocomplete-panel.sd-autocomplete-panel')!);
    for (const corner of ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'] as const) {
      expect(panel[`border${corner}Radius`]).withContext(corner).toBe('10px');
    }
    expect(panel.borderTopWidth).toBe('1px');
    autocomplete.autocompleteTrigger()?.closePanel();
  });
});

describe('Select panel filter input with the shipped theme', () => {
  let fixture: ComponentFixture<FilterInputHost>;

  const resolve = (property: string, value: string): string => {
    const probe = document.createElement('div');
    probe.style.setProperty(property, value);
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).getPropertyValue(property);
    probe.remove();
    return computed;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FilterInputHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(FilterInputHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.componentInstance.select().selectRef()?.close();
  });

  it('draws the filter input as a control: control radius and border, focus border plus ring', () => {
    fixture.componentInstance.select().selectRef()?.open();
    fixture.detectChanges();
    const box = document.querySelector('.sd-select-panel .filter-input-wrapper') as HTMLElement;
    expect(box).withContext('filter input of a 12-item select').not.toBeNull();
    expect(box.tagName.toLowerCase()).withContext('shared search field (wave 1 · B)').toBe('sd-search-field');
    expect(box.getBoundingClientRect().height).withContext('size sm').toBe(32);
    expect(getComputedStyle(box).borderTopLeftRadius).toBe('8px');
    expect(getComputedStyle(box).borderTopColor).toBe(resolve('color', 'var(--sd-control-border)'));

    (box.querySelector('input') as HTMLInputElement).focus();
    expect(getComputedStyle(box).borderTopColor).toBe(resolve('color', 'var(--sd-control-border-focus)'));
    expect(getComputedStyle(box).boxShadow).toBe(resolve('box-shadow', 'var(--sd-control-ring)'));
  });
});
