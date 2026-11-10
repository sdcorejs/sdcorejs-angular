import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';

import { SdQueryField } from '../../query-bar.model';
import { ɵSdQueryPanelTriggerDirective } from '../panel/query-panel';
import { SdQueryFieldPicker } from './field-picker.component';

const FEW: SdQueryField[] = [
  { key: 'a', label: 'A', type: 'string' } as SdQueryField,
  { key: 'b', label: 'B', type: 'number' } as SdQueryField,
  { key: 'c', label: 'C', type: 'date', disabled: true } as SdQueryField,
  { key: 'd', label: 'D', type: 'boolean' } as SdQueryField,
];

// Ten fields: the picker shows its find box (PD, R1 G-2).
const MANY: SdQueryField[] = [
  { key: 'code', label: 'Mã đơn', type: 'string', group: 'Bộ lọc' },
  { key: 'customer', label: 'Khách hàng', type: 'string', group: 'Bộ lọc' },
  { key: 'status', label: 'Trạng thái', type: 'string', group: 'Bộ lọc' },
  { key: 'total', label: 'Tổng tiền', type: 'number', group: 'Cột' },
  { key: 'created', label: 'Ngày tạo', type: 'date', group: 'Cột' },
  { key: 'owner', label: 'Người phụ trách', type: 'string', group: 'Cột' },
  { key: 'region', label: 'Khu vực', type: 'string', group: 'Cột' },
  { key: 'note', label: 'Ghi chú', type: 'string', group: 'Cột' },
  { key: 'paid', label: 'Đã thanh toán', type: 'boolean', group: 'Cột' },
  { key: 'seller', label: 'Nhân viên bán', type: 'string', group: 'Cột' },
] as SdQueryField[];

@Component({
  standalone: true,
  imports: [SdQueryFieldPicker, ɵSdQueryPanelTriggerDirective],
  template: `
    <button id="add" type="button" [sdQueryPanelTrigger]="picker.panel()">+</button>
    <sd-query-field-picker
      #picker
      [fields]="fields()"
      [usedKeys]="used()"
      [autoId]="autoId()"
      [findBox]="findBox()"
      (pick)="picked.push($any($event).key)" />
  `,
})
class Host {
  readonly fields = signal<SdQueryField[]>(FEW);
  readonly used = signal(new Set<string>());
  readonly autoId = signal<string | undefined>(undefined);
  readonly findBox = signal(true);
  readonly picked: string[] = [];
  readonly picker = viewChild.required(SdQueryFieldPicker);
}

describe('SdQueryFieldPicker', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let i18n: I18nService;

  const overlay = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
  const menu = (): HTMLElement | null => overlay().querySelector<HTMLElement>('.c-field-picker-menu');
  const listbox = (): HTMLElement => menu()!.querySelector<HTMLElement>('[role="listbox"]')!;
  const options = (): HTMLElement[] => Array.from(menu()!.querySelectorAll<HTMLElement>('[role="option"]'));
  const option = (label: string): HTMLElement =>
    options().find(el => el.querySelector('.c-field-item-label')!.textContent!.trim() === label)!;
  const find = (): HTMLInputElement | null => menu()!.querySelector<HTMLInputElement>('sd-search-field input');
  const trigger = (): HTMLButtonElement => fixture.nativeElement.querySelector('#add');
  const key = (target: Element, value: string): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  const type = (text: string): void => {
    const input = find()!;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };
  const open = (): void => {
    trigger().click();
    fixture.detectChanges();
  };
  // Tương phản WCAG 2.x của màu chữ đã tính so với nền đặc gần nhất (không có nền thì coi là trắng).
  const channels = (value: string): number[] => (value.match(/[\d.]+/g) ?? []).map(Number);
  const luminance = ([r, g, b]: number[]): number => {
    const [R, G, B] = [r, g, b].map(c => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const backgroundOf = (el: Element): number[] => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const [r, g, b, a = 1] = channels(getComputedStyle(node).backgroundColor);
      if (a > 0) return [r, g, b];
    }
    return [255, 255, 255];
  };
  const contrast = (el: Element): number => {
    const [high, low] = [luminance(channels(getComputedStyle(el).color)), luminance(backgroundOf(el))].sort((a, b) => b - a);
    return (high + 0.05) / (low + 0.05);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host, NoopAnimationsModule] }).compileComponents();
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('vi', { reload: false });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('disables every key in usedKeys (add-filter flow) and fields with their own disabled flag', () => {
    host.used.set(new Set(['a', 'b']));
    fixture.detectChanges();
    const picker = host.picker();
    expect(picker.isDisabled(FEW[0])).toBeTrue();
    expect(picker.isDisabled(FEW[1])).toBeTrue();
    expect(picker.isUsed(FEW[0])).toBeTrue();
    expect(picker.isDisabled(FEW[2])).toBeTrue();
    expect(picker.isDisabled(FEW[3])).toBeFalse();
  });

  it('QB-P-07 is a listbox panel: the trigger announces it, options carry aria-disabled', () => {
    host.used.set(new Set(['a']));
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
    open();
    expect(menu()!.classList).toContain('sd-query-panel');
    expect(menu()!.classList).toContain('sd-query-panel--list');
    expect(listbox()).not.toBeNull();
    expect(options().length).toBe(4);
    expect(option('A').getAttribute('aria-disabled')).toBe('true');
    expect(option('C').getAttribute('aria-disabled')).toBe('true');
    expect(option('B').hasAttribute('aria-disabled')).toBeFalse();
    expect(option('A').querySelector('.c-field-item-check')).not.toBeNull();
  });

  // R1 · N-2: the trigger controls the listbox itself, not the panel frame around it.
  // axe trên showcase (PR #143): nhãn kiểu 11px dùng token muted, 4.29:1 trên nền panel sáng — dưới mức AA 4.5:1.
  it('QB-B-12 the type label of a field reaches 4.5:1 on the panel, light and dark', () => {
    open();
    const label = option('B').querySelector('.c-field-item-type')!;
    expect(label.textContent!.trim()).toBe('number');
    expect(contrast(label)).withContext('light').toBeGreaterThanOrEqual(4.5);

    // Giá trị token của theme tối (themes/default.scss, _component-tokens.scss).
    const dark: Record<string, string> = {
      '--sd-surface': '#121316',
      '--sd-query-bar-text-secondary': '#c4c6d0',
      '--sd-query-bar-text-muted': '#a4a6b0',
    };
    Object.entries(dark).forEach(([name, value]) => overlay().style.setProperty(name, value));
    try {
      expect(contrast(label)).withContext('dark').toBeGreaterThanOrEqual(4.5);
    } finally {
      Object.keys(dark).forEach(name => overlay().style.removeProperty(name));
    }
  });

  it('QB-B-02 the trigger aria-controls points at the listbox, with and without the find box', () => {
    open();
    expect(document.getElementById(trigger().getAttribute('aria-controls')!)!.getAttribute('role')).toBe('listbox');
    key(document.activeElement!, 'Escape');
    host.fields.set(MANY);
    fixture.detectChanges();
    open();
    const controlled = document.getElementById(trigger().getAttribute('aria-controls')!)!;
    expect(controlled.getAttribute('role')).toBe('listbox');
    expect(find()!.getAttribute('aria-controls')).toBe(controlled.id);
  });

  // PD after R1 (G-2): the find box comes at ten fields, not above eight.
  it('QB-B-04 nine fields have no find box, ten have one', () => {
    host.fields.set(MANY.slice(0, 9));
    fixture.detectChanges();
    open();
    expect(find()).withContext('9 fields').toBeNull();
    key(document.activeElement!, 'Escape');
    host.fields.set(MANY);
    fixture.detectChanges();
    open();
    expect(find()).withContext('10 fields').not.toBeNull();
  });

  // PD after R1 (G-8): the find box reads "Tìm kiếm"; the listbox is named after what opens it, not after the find box.
  it('QB-B-05 the find box reads "Tìm kiếm" and the listbox takes the name of its trigger', () => {
    host.fields.set(MANY);
    fixture.detectChanges();
    open();
    expect(find()!.placeholder).toBe('Tìm kiếm');
    expect(find()!.getAttribute('aria-label')).toBe('Tìm kiếm');
    expect(listbox().getAttribute('aria-label')).toBe(i18n.t('core.component.query-bar.add-filter'));
    key(document.activeElement!, 'Escape');

    // Inline mode: the Add condition box outside the panel opens the list.
    host.findBox.set(false);
    fixture.detectChanges();
    open();
    expect(find()).toBeNull();
    expect(listbox().getAttribute('aria-label')).toBe(i18n.t('core.component.query-bar.add-condition'));
  });

  it('picking an option emits the field and closes the panel; a used option does nothing', () => {
    host.used.set(new Set(['a']));
    fixture.detectChanges();
    open();
    option('A').click();
    fixture.detectChanges();
    expect(host.picked).toEqual([]);
    expect(menu()).not.toBeNull();
    option('B').click();
    fixture.detectChanges();
    expect(host.picked).toEqual(['b']);
    expect(menu()).toBeNull();
  });

  describe('QB-FP-01 rows', () => {
    it('QB-FP-01 rows are 40px with 14px text, a 16px field icon and an 11px monospace type tag', () => {
      open();
      const row = option('B');
      expect(getComputedStyle(row).minHeight).toBe('40px');
      expect(getComputedStyle(row).fontSize).toBe('14px');
      expect(row.querySelector<HTMLElement>('.c-field-item-icon')!.getBoundingClientRect().width).toBe(16);
      const tag = getComputedStyle(row.querySelector('.c-field-item-type')!);
      expect(tag.fontSize).toBe('11px');
      expect(tag.fontFamily).toContain('Roboto Mono');
    });

    it('QB-FP-01 group headings follow the panel heading: 12px, no uppercase', () => {
      host.fields.set(MANY);
      fixture.detectChanges();
      open();
      const heading = menu()!.querySelector<HTMLElement>('.c-field-group')!;
      expect(heading.textContent!.trim()).toBe('Bộ lọc');
      expect(getComputedStyle(heading).fontSize).toBe('12px');
      expect(getComputedStyle(heading).textTransform).toBe('none');
      expect(getComputedStyle(heading).paddingLeft).toBe('12px');
    });

    it('QB-FP-01 rows grow to 44px on a coarse pointer', () => {
      open();
      // why: không giả được media query của CSS — tìm rule (pointer: coarse) áp lên hàng của picker.
      const coarse = Array.from(document.styleSheets)
        .flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules);
          } catch {
            return [];
          }
        })
        .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.conditionText.includes('pointer: coarse'))
        .flatMap(rule => Array.from(rule.cssRules) as CSSStyleRule[])
        .filter(rule => rule.selectorText?.includes('.c-field-item') && rule.style.minHeight === '44px');
      expect(coarse.length).toBeGreaterThan(0);
    });
  });

  describe('QB-FP-02 filter', () => {
    beforeEach(() => {
      host.fields.set(MANY);
      fixture.detectChanges();
      open();
    });

    it('QB-FP-02 filters by label without diacritics', () => {
      type('khach');
      expect(options().map(el => el.querySelector('.c-field-item-label')!.textContent!.trim())).toEqual(['Khách hàng']);
      type('KHU vuc');
      expect(options().map(el => el.querySelector('.c-field-item-label')!.textContent!.trim())).toEqual(['Khu vực']);
    });

    it('QB-FP-02 shows the empty line when nothing matches', () => {
      type('zzz');
      expect(options().length).toBe(0);
      const empty = menu()!.querySelector<HTMLElement>('.c-field-empty')!;
      expect(empty.textContent!.trim()).toBe(i18n.t('core.component.query-bar.field-empty'));
      expect(getComputedStyle(empty).paddingLeft).toBe('12px');
      expect(getComputedStyle(empty).fontSize).toBe('13px');
    });

    it('QB-FP-02 clears the find box when the panel closes', () => {
      type('khach');
      key(find()!, 'Escape');
      open();
      expect(find()!.value).toBe('');
      expect(options().length).toBe(MANY.length);
    });
  });

  describe('QB-FP-03 keyboard without a find box (roving focus)', () => {
    beforeEach(() => {
      host.fields.set([FEW[2], FEW[0], FEW[1], FEW[3]]);
      fixture.detectChanges();
      open();
    });

    it('QB-FP-03 starts on the first enabled option; arrows, Home and End skip disabled options and wrap', () => {
      expect(document.activeElement).toBe(option('A'));
      key(document.activeElement!, 'ArrowDown');
      expect(document.activeElement).toBe(option('B'));
      key(document.activeElement!, 'ArrowDown');
      expect(document.activeElement).toBe(option('D'));
      key(document.activeElement!, 'ArrowDown');
      expect(document.activeElement).toBe(option('A'));
      key(document.activeElement!, 'ArrowUp');
      expect(document.activeElement).toBe(option('D'));
      key(document.activeElement!, 'Home');
      expect(document.activeElement).toBe(option('A'));
      key(document.activeElement!, 'End');
      expect(document.activeElement).toBe(option('D'));
    });

    it('QB-FP-03 Enter picks the focused option; letters do not jump (no typeahead)', () => {
      key(document.activeElement!, 'ArrowDown');
      key(document.activeElement!, 'd');
      expect(document.activeElement).toBe(option('B'));
      const enter = key(document.activeElement!, 'Enter');
      expect(enter.defaultPrevented).toBeTrue();
      expect(host.picked).toEqual(['b']);
      expect(menu()).toBeNull();
    });
  });

  describe('QB-FP-04 find box (popover mode)', () => {
    beforeEach(() => {
      host.fields.set(MANY);
      host.used.set(new Set(['customer']));
      fixture.detectChanges();
      open();
    });

    it('QB-FP-04 is an sd-search-field sm whose input is a combobox controlling the listbox', () => {
      const field = menu()!.querySelector<HTMLElement>('sd-search-field')!;
      expect(field.classList).toContain('sd-sm');
      const input = find()!;
      expect(document.activeElement).toBe(input);
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(input.getAttribute('aria-autocomplete')).toBe('list');
      expect(input.getAttribute('aria-controls')).toBe(listbox().id);
      expect(input.getAttribute('aria-label')).toBe(i18n.t('core.component.query-bar.find-field'));
      const css = getComputedStyle(field);
      expect([css.marginTop, css.marginRight, css.marginBottom]).toEqual(['4px', '4px', '6px']);
    });

    it('QB-FP-03 arrows move aria-activedescendant while focus stays in the find box; Enter picks', () => {
      const input = find()!;
      expect(input.hasAttribute('aria-activedescendant')).toBeFalse();
      key(input, 'ArrowDown');
      expect(document.activeElement).toBe(input);
      expect(input.getAttribute('aria-activedescendant')).toBe(option('Mã đơn').id);
      key(input, 'ArrowDown');
      expect(input.getAttribute('aria-activedescendant')).toBe(option('Trạng thái').id);
      expect(option('Trạng thái').getAttribute('aria-selected')).toBe('true');
      key(input, 'ArrowUp');
      expect(input.getAttribute('aria-activedescendant')).toBe(option('Mã đơn').id);
      key(input, 'Enter');
      expect(host.picked).toEqual(['code']);
      expect(menu()).toBeNull();
    });

    it('QB-FP-03 typing points at the first enabled match', () => {
      type('k');
      const input = find()!;
      // "Khách hàng" is used, so the first enabled match is "Khu vực".
      expect(input.getAttribute('aria-activedescendant')).toBe(option('Khu vực').id);
      key(input, 'Enter');
      expect(host.picked).toEqual(['region']);
    });

    it('sets the panel autoId', () => {
      key(find()!, 'Escape');
      host.autoId.set('qb');
      fixture.detectChanges();
      open();
      expect(menu()!.getAttribute('data-autoid')).toBe('qb-panel-field-picker');
    });
  });
});
