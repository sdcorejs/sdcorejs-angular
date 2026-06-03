/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdOperator } from '@sdcorejs/angular/components/operator';

import { SdQueryInlineChip } from './inline-chip.component';
import { SdQueryField } from '../../query-bar.model';

@Component({
  standalone: true,
  imports: [SdQueryInlineChip],
  template: `
    <sd-query-inline-chip
      [field]="field"
      [filter]="filter"
      [density]="density"
      [multiple]="multiple"
      [showOperator]="showOperator"
      [autoId]="autoId"
      [valueText]="valueText"
      [isNoData]="isNoData"
      (commit)="committed = $event; commitCount = commitCount + 1"
      (commitRange)="committedRange = $event; rangeCount = rangeCount + 1"
      (liveChange)="lived = $event; liveCount = liveCount + 1"
      (remove)="removed = removed + 1" />
  `,
})
class Host {
  field: SdQueryField = { key: 'created', label: 'Created', type: 'date' } as SdQueryField;
  filter: any = { field: 'created', operator: 'EQUAL', data: '2024-01-15' };
  density: 'compact' | 'comfortable' = 'compact';
  multiple = false;
  showOperator = false;
  autoId = 'qb-inline0-value';
  valueText = '2024-01-15';
  isNoData = false;

  committed: any = undefined;
  commitCount = 0;
  committedRange: any = undefined;
  rangeCount = 0;
  lived: any = undefined;
  liveCount = 0;
  removed = 0;

  child = viewChild(SdQueryInlineChip);
}

describe('SdQueryInlineChip', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  async function build(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [Host, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await build();
  });

  // ---- 1: renders icon + label + value text (viewed mode)
  it('renders icon + label + value text in viewed mode', () => {
    const token = fixture.nativeElement.querySelector('.c-token') as HTMLElement;
    expect(token).not.toBeNull();
    expect(token.classList.contains('c-token-editing')).toBe(false);
    expect(token.querySelector('.c-token-icon')).not.toBeNull();
    expect(token.querySelector('.c-token-field')?.textContent).toContain('Created');
  });

  // ---- 2a: : separator when showOperator=false
  it("renders ':' separator when showOperator=false", () => {
    expect(fixture.nativeElement.querySelector('.c-token-sep')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('sd-operator.c-token-op')).toBeNull();
  });

  // ---- 2b: sd-operator when showOperator=true
  it('renders <sd-operator> when showOperator=true', () => {
    host.showOperator = true;
    fixture.detectChanges();
    const op = fixture.debugElement.query(By.directive(SdOperator));
    expect(op).not.toBeNull();
    expect((op.componentInstance as SdOperator).disabled()).toBe(true);
    expect(fixture.nativeElement.querySelector('.c-token-sep')).toBeNull();
  });

  // ---- 3: boolean chip — clicking the value enters edit mode (.c-token-editing)
  // why: boolean is the only branch still chip-managed (enterEdit/#editing); date/datetime/
  // values/BETWEEN delegate to their control's viewed='inline'.
  it('boolean chip: clicking the value enters edit mode (.c-token-editing)', () => {
    host.field = { key: 'on', label: 'On', type: 'boolean' } as SdQueryField;
    host.filter = { field: 'on', operator: 'EQUAL', data: true };
    host.valueText = 'Có';
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.c-token .c-token-value') as HTMLElement;
    expect(btn).not.toBeNull();
    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).not.toBeNull();
  });

  // ---- 4: date chip delegates its edit lifecycle to sd-date [viewed]="'inline'"
  it("date chip drives sd-date with [viewed]=\"'inline'\"", () => {
    // asserts: date branch no longer chip-managed — sd-date's own inline mode owns click-to-edit
    const picker = fixture.debugElement.query(By.css('sd-date')).componentInstance as { viewed: () => unknown };
    expect(picker.viewed()).toBe('inline');
  });

  // ---- 6: single-value commit (sd-date) emits (commit)
  it('sd-date sdChange emits (commit)', () => {
    // asserts: the chip forwards the picker's committed value via (commit)
    const pickerDe = fixture.debugElement.query(By.css('.c-token sd-date'));
    pickerDe.triggerEventHandler('sdChange', '2024-02-20');
    fixture.detectChanges();
    expect(host.committed).toBe('2024-02-20');
    expect(host.commitCount).toBe(1);
  });

  // ---- 7: multi-select commits emit (liveChange)
  // why: sd-select [viewed]="'inline'" giờ tự quản edit lifecycle; chip chỉ nhận sdChange.
  it('multi sd-select sdChange emits (liveChange)', () => {
    const valuesField = {
      key: 'status',
      label: 'Status',
      type: 'values',
      option: { items: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;
    host.field = valuesField;
    host.filter = { field: 'status', operator: 'IN', data: ['a'] };
    host.multiple = true;
    host.valueText = 'A';
    fixture.detectChanges();

    const selDe = fixture.debugElement.query(By.css('.c-token sd-select'));
    selDe.triggerEventHandler('sdChange', ['a', 'b']);
    fixture.detectChanges();

    expect(host.lived).toEqual(['a', 'b']);
    expect(host.liveCount).toBe(1);
    expect(host.commitCount).toBe(0);
  });

  // ---- 7a: values chip delegates its edit lifecycle to sd-select [viewed]="'inline'"
  it("values chip drives sd-select with [viewed]=\"'inline'\"", () => {
    const valuesField = {
      key: 'status',
      label: 'Status',
      type: 'values',
      option: { items: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;
    host.field = valuesField;
    host.filter = { field: 'status', operator: 'IN', data: ['a'] };
    host.multiple = true;
    host.valueText = 'A';
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sel = fixture.debugElement.query(By.css('sd-select')).componentInstance as any;
    expect(sel.viewed()).toBe('inline');
  });

  // ---- 7b: editing a values chip must NOT render the bare picker's inline clear-x
  // why: clear-x trùng với nút × xoá filter của chip (2 dấu ×) + nằm sát trigger → user
  // dễ bấm nhầm khi đóng panel → clear() xoá data về [] → chip mất hiển thị (regression).
  // viewed='inline' → editor bare → không render .sd-clear-btn.
  it('values chip in inline-edit does NOT render the inline .sd-clear-btn (only the chip × remains)', () => {
    const valuesField = {
      key: 'status',
      label: 'Status',
      type: 'values',
      option: { items: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;
    host.field = valuesField;
    host.filter = { field: 'status', operator: 'IN', data: ['a'] };
    host.multiple = true;
    host.valueText = 'A';
    fixture.detectChanges();

    // sd-select renders its inline view → click to reveal the (bare) editor
    const inlineView = fixture.nativeElement.querySelector('sd-select .sd-inline-view') as HTMLElement;
    expect(inlineView).not.toBeNull();
    inlineView.click();
    fixture.detectChanges();

    // No inline clear-x from the bare inline editor
    expect(fixture.nativeElement.querySelector('sd-select .sd-clear-btn')).toBeNull();
    // why: chip passes [clearable]="false" → the inline text-face clear-× is suppressed too,
    // so the chip shows exactly ONE × (its own .c-token-remove).
    expect(fixture.nativeElement.querySelector('sd-select .sd-inline-clear')).toBeNull();
    // The chip still owns its own removal ×
    expect(fixture.nativeElement.querySelector('.c-token-remove')).not.toBeNull();
  });

  // ---- 8: BETWEEN date renders sd-date-range; sdChange emits commitRange
  it('BETWEEN date → renders <sd-date-range>; sdChange emits (commitRange)', () => {
    const dateField = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.field = dateField;
    host.filter = { field: 'd', operator: 'BETWEEN', data: { from: '2024-01-01', to: '2024-01-31' } };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.c-token sd-date-range').length).toBe(1);
    const rngDe = fixture.debugElement.query(By.css('.c-token sd-date-range'));
    rngDe.triggerEventHandler('sdChange', { from: '2024-02-01', to: '2024-02-28' });
    fixture.detectChanges();
    expect(host.committedRange).toEqual({ from: '2024-02-01', to: '2024-02-28' });
    expect(host.rangeCount).toBe(1);
  });

  // ---- 9: BETWEEN datetime also renders sd-date-range (downgrade)
  it('BETWEEN datetime → renders <sd-date-range> (downgrade)', () => {
    const dtField = { key: 'dt', label: 'DT', type: 'datetime' } as SdQueryField;
    host.field = dtField;
    host.filter = { field: 'dt', operator: 'BETWEEN', data: { from: null, to: null } };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.c-token sd-date-range').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.c-token sd-datetime').length).toBe(0);
  });

  // ---- 9a: BETWEEN delegates its lifecycle to sd-date-range [viewed]="'inline'"
  it("BETWEEN chip drives sd-date-range with [viewed]=\"'inline'\"", () => {
    // asserts: BETWEEN lifecycle delegated to the range control's inline mode (no chip #editing)
    const dateField = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.field = dateField;
    host.filter = { field: 'd', operator: 'BETWEEN', data: { from: null, to: null } };
    fixture.detectChanges();
    const rng = fixture.debugElement.query(By.css('sd-date-range')).componentInstance as { viewed: () => unknown };
    expect(rng.viewed()).toBe('inline');
  });

  // ---- 9c: BETWEEN range commit null payload → emits null
  it('BETWEEN range commit with null payload → emits null', () => {
    // asserts: chip forwards a null range commit (clear) via (commitRange)
    const dateField = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.field = dateField;
    host.filter = { field: 'd', operator: 'BETWEEN', data: { from: '2024-02-01', to: '2024-02-28' } };
    fixture.detectChanges();

    const rngDe = fixture.debugElement.query(By.css('.c-token sd-date-range'));
    rngDe.triggerEventHandler('sdChange', null);
    fixture.detectChanges();
    expect(host.committedRange).toBeNull();
  });

  // ---- 10: boolean viewed → button; click → enter edit; toggle emits commit + exit
  it('boolean: viewed mode shows .c-token-value button; click → enter edit; toggle commits', () => {
    const boolField = { key: 'on', label: 'On', type: 'boolean' } as SdQueryField;
    host.field = boolField;
    host.filter = { field: 'on', operator: 'EQUAL', data: true };
    host.valueText = 'Có';
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.c-token > button.c-token-value, .c-token .c-token-value') as HTMLElement;
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('Có');

    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).not.toBeNull();

    const toggles = fixture.nativeElement.querySelectorAll('.c-token .c-bool-btn') as NodeListOf<HTMLButtonElement>;
    expect(toggles.length).toBe(2);
    expect(toggles[0].classList.contains('c-bool-true')).toBe(true);
    expect(toggles[1].classList.contains('c-bool-false')).toBe(true);

    toggles[0].click();
    fixture.detectChanges();
    expect(host.committed).toBe(true);
    expect(host.commitCount).toBe(1);
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).toBeNull();
  });

  // ---- 10a: boolean edit toggles render inside .c-bool-toggle pill wrapper as native buttons
  // why: badge padding lớn từng gây tràn ra ngoài chip → đã đổi từ sd-button (mat MDC 36px
  // baseline) sang native .c-bool-btn (height 18/20px). Verify wrapper class + native button
  // selector + active class follow data value.
  it('boolean: edit mode renders 2 .c-bool-btn native toggles inside .c-bool-toggle wrapper', () => {
    const boolField = { key: 'on', label: 'On', type: 'boolean' } as SdQueryField;
    host.field = boolField;
    host.filter = { field: 'on', operator: 'EQUAL', data: true };
    host.valueText = 'Có';
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.c-token > .c-token-value, .c-token .c-token-value') as HTMLElement).click();
    fixture.detectChanges();

    const wrap = fixture.nativeElement.querySelector('.c-token .c-bool-toggle') as HTMLElement;
    expect(wrap).not.toBeNull();
    const btns = wrap.querySelectorAll('button.c-bool-btn') as NodeListOf<HTMLButtonElement>;
    expect(btns.length).toBe(2);
    // why: data=true → true btn carries .c-bool-active; false btn does not.
    expect(btns[0].classList.contains('c-bool-active')).toBe(true);
    expect(btns[1].classList.contains('c-bool-active')).toBe(false);
  });

  // ---- 11: × emits (remove)
  it('× button emits (remove)', () => {
    const x = fixture.nativeElement.querySelector('.c-token-remove') as HTMLElement;
    expect(x).not.toBeNull();
    x.click();
    fixture.detectChanges();
    expect(host.removed).toBe(1);
  });

  // ---- 12: isNoData hides the value slot
  it('isNoData=true hides value slot + separator + operator', () => {
    host.field = { key: 'x', label: 'X', type: 'values', option: { items: [], valueField: 'id', displayField: 'n' } } as unknown as SdQueryField;
    host.filter = { field: 'x', operator: 'NULL', data: null };
    host.isNoData = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.c-token-value')).toBeNull();
    expect(fixture.nativeElement.querySelector('.c-token-value-edit')).toBeNull();
    expect(fixture.nativeElement.querySelector('.c-token-sep')).toBeNull();
    expect(fixture.nativeElement.querySelector('sd-operator.c-token-op')).toBeNull();
    // × still present
    expect(fixture.nativeElement.querySelector('.c-token-remove')).not.toBeNull();
    // icon + label still present
    expect(fixture.nativeElement.querySelector('.c-token-icon')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.c-token-field')?.textContent).toContain('X');
  });

  // ---- 13: isNoData with showOperator=true still hides operator
  it('isNoData=true with showOperator=true still hides operator', () => {
    host.field = { key: 'x', label: 'X', type: 'values', option: { items: [], valueField: 'id', displayField: 'n' } } as unknown as SdQueryField;
    host.filter = { field: 'x', operator: 'NULL', data: null };
    host.isNoData = true;
    host.showOperator = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-operator.c-token-op')).toBeNull();
    expect(fixture.nativeElement.querySelector('.c-token-remove')).not.toBeNull();
  });
});
