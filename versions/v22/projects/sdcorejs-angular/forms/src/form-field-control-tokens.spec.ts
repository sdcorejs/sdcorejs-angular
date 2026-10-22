import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutTestTheme } from '../../testing/layout-theme.spec';
import { SdAutocomplete } from '../autocomplete';
import { SdInput } from '../input';
import { SdSelect } from '../select';
import { SdFormsModule } from './forms.module';
import { findCssRule } from '../../testing/test-utils';

// Control tokens (design handoff wave 2 · D) on the shipped theme: radius, outline, focus ring, label
// background, disabled background and the select / autocomplete panels.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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

// Ô lọc + hàng "Tất cả" cùng nằm trong header dính (cùng lý do mở đồng bộ như FilterInputHost).
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdFormsModule, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 280px">
      <sd-select label="Nhiều" [items]="items" valueField="value" displayField="label" [model]="[0, 1, 2]" multiple showSelectAll />
    </div>
  `,
})
class SelectAllHeaderHost {
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
    // why: ghim host ở đỉnh để panel đo được luôn mở xuống, trong khung (xem spec “select all” bên dưới).
    Object.assign((fixture.nativeElement as HTMLElement).style, { position: 'fixed', top: '0', left: '0' });
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

  // A field on a non-surface background (the table filter row) or with the disabled background painted the
  // wrapper with Material's 4px corner under the 8px outline, so square-ish corners showed outside the outline.
  it('rounds the field background with the outline at rest, also when disabled', () => {
    expect(wrapper(fields[0]).borderTopLeftRadius).toBe('8px');
    expect(wrapper(fields[0]).borderBottomRightRadius).toBe('8px');
    expect(wrapper(fields[2]).borderTopLeftRadius).withContext('disabled').toBe('8px');
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

    // Forced colours paint even a transparent border in a system colour, which drew a line above and below every
    // option; the gap borders take the panel's Canvas colour there instead (height and gap unchanged).
    it('keeps the option gap invisible under forced colours', async () => {
      fixture.componentInstance.single().open();
      await settle();
      const forced = /forced-colors:\s*active/;
      for (const selector of [
        /\.sd-select-panel \.mat-mdc-option(,|$)/,
        /\.sd-autocomplete-panel \.mat-mdc-option(,|$)/,
        /\.sd-select-all-row$/,
      ]) {
        const rule = findCssRule(selector, forced);
        expect(rule).withContext(String(selector)).toBeDefined();
        expect(rule!.borderTopColor.toLowerCase()).withContext(String(selector)).toBe('canvas');
        expect(rule!.borderBottomColor.toLowerCase()).withContext(String(selector)).toBe('canvas');
      }
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
      // The row sits in the sticky header now, whose padding differs from the list: compare boxes, not margins.
      expect(row.getBoundingClientRect().left).toBeCloseTo(option.getBoundingClientRect().left, 0);
      expect(row.getBoundingClientRect().right).toBeCloseTo(option.getBoundingClientRect().right, 0);
      const rowBox = row.querySelector('.mat-pseudo-checkbox')!.getBoundingClientRect();
      const optionBox = option.querySelector('.mat-pseudo-checkbox')!.getBoundingClientRect();
      expect(rowBox.left).toBeCloseTo(optionBox.left, 0);
      expect(row.getBoundingClientRect().height).toBe(36);
      expect(getComputedStyle(row).borderTopLeftRadius).withContext('full radius like an option').toBe('6px');
      expect(getComputedStyle(row).borderBottomLeftRadius).toBe('6px');
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
    // why: ghim host ở đỉnh để panel đo được luôn mở xuống, trong khung (xem spec “select all” bên dưới).
    Object.assign((fixture.nativeElement as HTMLElement).style, { position: 'fixed', top: '0', left: '0' });
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

  it('keeps the sticky filter flush with the top of the panel while the options scroll under it', async () => {
    fixture.componentInstance.select().selectRef()?.open();
    fixture.detectChanges();
    // why: items arrive through an observable; whenStable() hangs with a filtered select (see the host),
    // so wait for the options with short macrotasks instead.
    for (let i = 0; i < 20 && document.querySelectorAll('.sd-select-panel mat-option').length < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 25));
      fixture.detectChanges();
    }
    const panel = document.querySelector('.mat-mdc-select-panel.sd-select-panel') as HTMLElement;
    const header = panel.querySelector('.c-filter-input-container') as HTMLElement;
    panel.scrollTop = panel.scrollHeight;
    expect(panel.scrollTop).withContext('the 12-item panel scrolls').toBeGreaterThan(0);

    // The panel's 4px top padding must not leave a strip where scrolled options show above the filter.
    const panelTop = panel.getBoundingClientRect().top + panel.clientTop;
    expect(header.getBoundingClientRect().top).toBeCloseTo(panelTop, 0);
    const probe = document.elementFromPoint(header.getBoundingClientRect().left + 20, panelTop + 1);
    expect(probe?.closest('mat-option')).withContext('element in the top strip of the scrolled panel').toBeNull();
  });
});

describe('Select "select all" row in the sticky header with the shipped theme', () => {
  let fixture: ComponentFixture<SelectAllHeaderHost>;

  const resolve = (property: string, value: string): string => {
    const probe = document.createElement('div');
    probe.style.setProperty(property, value);
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).getPropertyValue(property);
    probe.remove();
    return computed;
  };

  /** Opens the panel synchronously and waits for the 12 options (whenStable hangs here, see FilterInputHost). */
  const openPanel = async (): Promise<HTMLElement> => {
    fixture.componentInstance.select().selectRef()?.open();
    fixture.detectChanges();
    for (let i = 0; i < 20 && document.querySelectorAll('.sd-select-panel mat-option').length < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 25));
      fixture.detectChanges();
    }
    return document.querySelector('.mat-mdc-select-panel.sd-select-panel') as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectAllHeaderHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SelectAllHeaderHost);
    // why: DOM do spec khác để lại có thể đẩy select xuống đáy khung Karma; panel khi đó nằm sát hoặc ngoài khung nên
    // `elementFromPoint` trả null. Ghim host ở đỉnh để panel luôn mở xuống, trong khung.
    Object.assign((fixture.nativeElement as HTMLElement).style, { position: 'fixed', top: '0', left: '0' });
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.componentInstance.select().selectRef()?.close();
  });

  it('puts the row in the sticky header under the search box, with a single divider below the header', async () => {
    const panel = await openPanel();
    const header = panel.querySelector('.c-filter-input-container') as HTMLElement;
    const row = header.querySelector<HTMLElement>('.sd-select-all-row');
    expect(row).withContext('select-all row inside the sticky header').not.toBeNull();
    const search = header.querySelector('sd-search-field')!;
    expect(row!.getBoundingClientRect().top)
      .withContext('row below the search box')
      .toBeGreaterThanOrEqual(search.getBoundingClientRect().bottom);
    expect(getComputedStyle(row!).borderBottomColor).withContext('no second divider on the row').toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(header).boxShadow).withContext('the header keeps its divider').not.toBe('none');
  });

  it('lines the row up with the options and keeps it visible while the list scrolls', async () => {
    const panel = await openPanel();
    const row = panel.querySelector<HTMLElement>('.sd-select-all-row')!;
    const option = panel.querySelector<HTMLElement>('mat-option')!;
    expect(row.getBoundingClientRect().left).toBeCloseTo(option.getBoundingClientRect().left, 0);
    expect(row.getBoundingClientRect().right).toBeCloseTo(option.getBoundingClientRect().right, 0);
    const rowCheck = row.querySelector('.mat-pseudo-checkbox')!.getBoundingClientRect();
    expect(rowCheck.left).toBeCloseTo(option.querySelector('.mat-pseudo-checkbox')!.getBoundingClientRect().left, 0);
    expect(row.getBoundingClientRect().height).toBe(36);

    panel.scrollTop = panel.scrollHeight;
    expect(panel.scrollTop).withContext('the 12-item panel scrolls').toBeGreaterThan(0);
    const box = row.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + 40, box.top + box.height / 2);
    expect(hit?.closest('.sd-select-all-row')).withContext('row still on top after scrolling').toBe(row);
  });

  it('shows the selected / total counter at the end of the row in tabular figures', async () => {
    const panel = await openPanel();
    const row = panel.querySelector<HTMLElement>('.sd-select-all-row')!;
    const counter = row.querySelector<HTMLElement>('.sd-select-all-count')!;
    expect(counter).withContext('counter').not.toBeNull();
    expect(counter.textContent!.trim()).toBe('3/12');
    const style = getComputedStyle(counter);
    expect(style.fontVariantNumeric).toBe('tabular-nums');
    expect(style.fontSize).toBe('12px');
    expect(style.color).toBe(resolve('color', 'var(--sd-text-secondary)'));
    // Right-aligned: it ends where the row's 12px inner padding starts.
    expect(counter.getBoundingClientRect().right).toBeCloseTo(row.getBoundingClientRect().right - 12, 0);
  });
});

// lg uses Material's own field metrics, which give an sd-icon or icon button suffix no padding: it sat on the border.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdFormsModule, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 320px">
      @for (size of sizes; track size) {
        <sd-input [class]="'input-' + size" [size]="size" label="Tên" clearable [(model)]="text" />
        <sd-date [class]="'date-' + size" [size]="size" label="Ngày" />
      }
    </div>
  `,
})
class SuffixSizeHost {
  readonly sizes = ['md', 'lg'] as const;
  text = 'abc';
}

describe('Form field suffix spacing by size', () => {
  it('keeps the last suffix as far from the right border at lg as at md', async () => {
    await TestBed.configureTestingModule({ imports: [SuffixSizeHost, NoopAnimationsModule] }).compileComponents();
    const fixture = TestBed.createComponent(SuffixSizeHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const gap = (selector: string) => {
      const wrapper = fixture.nativeElement.querySelector(`${selector} .mat-mdc-text-field-wrapper`) as HTMLElement;
      const items = Array.from(wrapper.querySelectorAll<HTMLElement>('.mat-mdc-form-field-icon-suffix > *')).filter(
        item => item.getBoundingClientRect().width > 0
      );
      return wrapper.getBoundingClientRect().right - items[items.length - 1].getBoundingClientRect().right;
    };
    expect(gap('.input-lg')).withContext('sd-input').toBeCloseTo(gap('.input-md'), 0);
    expect(gap('.date-lg')).withContext('sd-date').toBeCloseTo(gap('.date-md'), 0);
  });
});
