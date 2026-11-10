import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';

import { SdQueryPopoverChip } from './popover-chip.component';
import { SdQueryField } from '../../query-bar.model';
import { ɵSdQueryPanelDirective } from '../panel/query-panel';

@Component({
  standalone: true,
  imports: [SdQueryPopoverChip, ɵSdQueryPanelDirective],
  template: `
    <ng-template sdQueryPanel="dialog" #m="sdQueryPanel">
      <div class="sd-query-panel sd-query-panel--form probe" role="dialog" aria-label="Edit"><input aria-label="Value" /></div>
    </ng-template>
    <!-- why: chip đo trong khung mật độ thật (28px) như khi nằm trên thanh. -->
    <div class="c-density-compact">
      <sd-query-popover-chip
        [field]="field"
        [filter]="filter"
        [active]="active"
        [showOperator]="showOperator"
        [valueText]="valueText"
        [panel]="menu()!"
        (open)="opened = true"
        (remove)="removed = true" />
    </div>
  `,
})
class Host {
  field: SdQueryField = { key: 'name', label: 'Name', type: 'string' } as SdQueryField;
  filter: any = { field: 'name', operator: 'CONTAIN', data: 'abc' };
  active = true;
  showOperator = false;
  valueText = 'abc';
  opened = false;
  removed = false;
  menu = viewChild<ɵSdQueryPanelDirective>('m');
}

describe('SdQueryPopoverChip', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders icon + label + value when active', () => {
    const chip = fixture.nativeElement.querySelector('.c-chip')!;
    expect(chip.querySelector('.c-chip-label')?.textContent).toContain('Name');
    expect(chip.querySelector('.c-chip-value')?.textContent).toContain('abc');
    expect(chip.classList.contains('c-chip-active')).toBe(true);
  });

  it('renders the : separator when active and operator is hidden', () => {
    expect(fixture.nativeElement.querySelector('.c-chip-sep')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('sd-operator')).toBeNull();
  });

  it('renders sd-operator when showOperator=true', () => {
    host.showOperator = true;
    fixture.detectChanges();
    const op = fixture.nativeElement.querySelector('sd-operator') as HTMLElement;
    expect(op).not.toBeNull();
    // Handoff sd-operator A2: a read-only xs glyph (14px) named after the operator, no button inside the chip.
    const glyph = op.querySelector('[role="img"]')!;
    expect(glyph.getAttribute('aria-label')).toBeTruthy();
    expect(glyph.querySelector('svg')!.getAttribute('width')).toBe('14');
    expect(op.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('.c-chip-sep')).toBeNull();
  });

  it('inactive chip hides value + remove + sep', () => {
    host.active = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-chip-value')).toBeNull();
    expect(fixture.nativeElement.querySelector('.c-chip-remove')).toBeNull();
    expect(fixture.nativeElement.querySelector('.c-chip-sep')).toBeNull();
  });

  it('remove × emits (remove) and stops propagation', () => {
    const removeEl = fixture.nativeElement.querySelector('.c-chip-remove') as HTMLElement;
    const ev = new MouseEvent('click', { bubbles: true });
    spyOn(ev, 'stopPropagation');
    removeEl.dispatchEvent(ev);
    expect(host.removed).toBe(true);
    expect(ev.stopPropagation).toHaveBeenCalled();
  });
  afterEach(() => fixture.destroy());

  it('opens its dialog panel from Enter and tells the host (open) first', () => {
    const chip = fixture.nativeElement.querySelector('.c-chip') as HTMLElement;
    expect(chip.getAttribute('aria-haspopup')).toBe('dialog');
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(host.opened).toBeTrue();
    expect(document.querySelector('.probe')).not.toBeNull();
    expect(chip.getAttribute('aria-expanded')).toBe('true');
  });

  // axe trên showcase (PR #143): nút × đọc "Remove filter" bằng tiếng Anh ở mọi ngôn ngữ và không nói bộ lọc nào.
  it('QB-B-09 names the remove button after the field, in the current language', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('vi', { reload: false });
    fixture.detectChanges();
    const remove = fixture.nativeElement.querySelector('.c-chip-remove') as HTMLElement;
    expect(remove.getAttribute('aria-label')).toBe('Xoá bộ lọc Name');

    i18n.setLanguage('en', { reload: false });
    fixture.detectChanges();
    expect(remove.getAttribute('aria-label')).toBe('Remove Name filter');
    i18n.setLanguage('vi', { reload: false });
  });

  it('QB-B-09 every language has the remove label, with the field name in it', () => {
    const i18n = TestBed.inject(I18nService);
    const key = 'core.component.query-bar.remove-filter';
    for (const language of ['vi', 'en', 'ja', 'ko', 'zh'] as const) {
      i18n.setLanguage(language, { reload: false });
      const text = i18n.t(key, { label: 'Trạng thái' });
      expect(text).withContext(language).not.toBe(key);
      expect(text).withContext(language).toContain('Trạng thái');
    }
    i18n.setLanguage('vi', { reload: false });
  });

  // R1 G-4: nút × nằm trong div[role=button] của chip — nút lồng nút, trình đọc màn hình gộp làm một.
  it('QB-B-11 the remove button sits beside the chip trigger, not inside it, and keeps its place in the pill', () => {
    const el = fixture.nativeElement as HTMLElement;
    const trigger = el.querySelector('.c-chip') as HTMLElement;
    const remove = el.querySelector('.c-chip-remove') as HTMLElement;
    expect(remove.tagName).toBe('BUTTON');
    expect(remove.getAttribute('type')).toBe('button');
    expect(trigger.contains(remove)).withContext('× inside the trigger').toBeFalse();
    expect(el.querySelectorAll('[role="button"] :is(button, [role="button"]), button :is(button, [role="button"])').length)
      .withContext('nested buttons')
      .toBe(0);

    // Hình dạng giữ nguyên: × 20px trong viền chip, cách chevron 4px (gap) và mép phải 5px (viền 1px + đệm 4px), giữa theo chiều dọc.
    const pill = trigger.getBoundingClientRect();
    const chevron = trigger.querySelector('.c-chip-chevron')!.getBoundingClientRect();
    const x = remove.getBoundingClientRect();
    // why: Karma không nạp style toàn cục (box-sizing) — đọc chiều cao đã khai, không phải hộp viền.
    expect(getComputedStyle(trigger).height).withContext('chip height (compact)').toBe('28px');
    expect([x.width, x.height]).withContext('× size').toEqual([20, 20]);
    expect(Math.round(x.left - chevron.right))
      .withContext('gap after the chevron')
      .toBe(4);
    expect(Math.round(pill.right - x.right))
      .withContext('× to the right edge')
      .toBe(5);
    expect(Math.abs(x.top + x.height / 2 - (pill.top + pill.height / 2)))
      .withContext('× centred')
      .toBeLessThan(1);

    // Bấm × chỉ xoá, không mở popover của chip.
    remove.click();
    fixture.detectChanges();
    expect(host.removed).toBeTrue();
    expect(host.opened).toBeFalse();
    expect(document.querySelector('.probe')).toBeNull();
  });
});
