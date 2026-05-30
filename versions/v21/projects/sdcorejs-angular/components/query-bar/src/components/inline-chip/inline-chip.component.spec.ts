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

  // ---- 3: clicking .c-token-value-edit enters edit mode
  it('clicking the value wrapper enters edit mode (.c-token-editing)', () => {
    const wrapper = fixture.nativeElement.querySelector('.c-token-value-edit') as HTMLElement;
    expect(wrapper).not.toBeNull();
    wrapper.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).not.toBeNull();
  });

  // ---- 4: edit mode auto-opens picker
  it('entering edit mode auto-opens the picker', async () => {
    const wrapper = fixture.nativeElement.querySelector('.c-token-value-edit') as HTMLElement;
    wrapper.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const pickerDe = fixture.debugElement.query(By.css('.c-token sd-date'));
    expect(pickerDe).not.toBeNull();
    const openSpy = spyOn(pickerDe.componentInstance as any, 'open');
    // why: re-trigger the edit to assert open() is called on second entry too.
    fixture.detectChanges();
    // Simulate exit then re-enter
    const outside = document.createElement('button');
    wrapper.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    host.child()!.onFocusOutForTest({ currentTarget: wrapper, relatedTarget: outside } as unknown as FocusEvent);
    fixture.detectChanges();
    wrapper.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(openSpy).toHaveBeenCalled();
  });

  // ---- 5: focusout - inside stays editing; outside exits
  it('focusout: inside subtree stays editing; outside exits edit', () => {
    const wrapper = fixture.nativeElement.querySelector('.c-token-value-edit') as HTMLElement;
    wrapper.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).not.toBeNull();

    const inside = document.createElement('input');
    wrapper.appendChild(inside);
    host.child()!.onFocusOutForTest({ currentTarget: wrapper, relatedTarget: inside } as unknown as FocusEvent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).not.toBeNull();

    const outside = document.createElement('button');
    host.child()!.onFocusOutForTest({ currentTarget: wrapper, relatedTarget: outside } as unknown as FocusEvent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).toBeNull();
  });

  // ---- 6: single-value commit (sd-date) emits commit + exits edit
  it('sd-date sdChange emits (commit) and exits edit', () => {
    const wrapper = fixture.nativeElement.querySelector('.c-token-value-edit') as HTMLElement;
    wrapper.click();
    fixture.detectChanges();

    const pickerDe = fixture.debugElement.query(By.css('.c-token sd-date'));
    pickerDe.triggerEventHandler('sdChange', '2024-02-20');
    fixture.detectChanges();
    expect(host.committed).toBe('2024-02-20');
    expect(host.commitCount).toBe(1);
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).toBeNull();
  });

  // ---- 7: multi-select commits emit (liveChange), do NOT exit edit
  it('multi sd-select sdChange emits (liveChange), no exit', () => {
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

    const wrapper = fixture.nativeElement.querySelector('.c-token-value-edit') as HTMLElement;
    wrapper.click();
    fixture.detectChanges();

    const selDe = fixture.debugElement.query(By.css('.c-token sd-select'));
    selDe.triggerEventHandler('sdChange', ['a', 'b']);
    fixture.detectChanges();

    expect(host.lived).toEqual(['a', 'b']);
    expect(host.liveCount).toBe(1);
    expect(host.commitCount).toBe(0);
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).not.toBeNull();
  });

  // ---- 8: BETWEEN date renders sd-date-range; sdChange emits commitRange
  it('BETWEEN date â†’ renders <sd-date-range>; sdChange emits (commitRange)', () => {
    const dateField = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.field = dateField;
    host.filter = { field: 'd', operator: 'BETWEEN', data: { from: '2024-01-01', to: '2024-01-31' } };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.c-token sd-date-range').length).toBe(1);
    const wrapper = fixture.nativeElement.querySelector('.c-token-value-edit') as HTMLElement;
    wrapper.click();
    fixture.detectChanges();
    const rngDe = fixture.debugElement.query(By.css('.c-token sd-date-range'));
    rngDe.triggerEventHandler('sdChange', { from: '2024-02-01', to: '2024-02-28' });
    fixture.detectChanges();
    expect(host.committedRange).toEqual({ from: '2024-02-01', to: '2024-02-28' });
    expect(host.rangeCount).toBe(1);
  });

  // ---- 9: BETWEEN datetime also renders sd-date-range (downgrade)
  it('BETWEEN datetime â†’ renders <sd-date-range> (downgrade)', () => {
    const dtField = { key: 'dt', label: 'DT', type: 'datetime' } as SdQueryField;
    host.field = dtField;
    host.filter = { field: 'dt', operator: 'BETWEEN', data: { from: null, to: null } };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.c-token sd-date-range').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.c-token sd-datetime').length).toBe(0);
  });

  // ---- 9a: BETWEEN range commit with full {from,to} exits edit immediately
  // why: bug "click ra láº§n Ä‘áº§u chÆ°a update, click vÃ o rá»“i ra má»›i Ä‘Ãºng" â€” viewed
  // text render trÆ°á»›c khi model vá» tá»›i sd-date-range. Fix: commitRange vá»›i cáº£ 2
  // Ä‘áº§u range â†’ exit edit sync, viewed re-render ngay táº¡i tick cÃ³ model má»›i.
  it('BETWEEN range commit with both from + to â†’ exits edit mode synchronously', () => {
    const dateField = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.field = dateField;
    host.filter = { field: 'd', operator: 'BETWEEN', data: { from: null, to: null } };
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.c-token-value-edit') as HTMLElement;
    wrapper.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).not.toBeNull();

    const rngDe = fixture.debugElement.query(By.css('.c-token sd-date-range'));
    rngDe.triggerEventHandler('sdChange', { from: '2024-02-01', to: '2024-02-28' });
    fixture.detectChanges();

    expect(host.rangeCount).toBe(1);
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).toBeNull();
  });

  // ---- 9b: BETWEEN partial commit (only one end) stays in edit
  // why: user má»›i chá»n `from` chÆ°a chá»n `to` â†’ giá»¯ edit Ä‘á»ƒ user tiáº¿p tá»¥c chá»n `to`.
  it('BETWEEN range commit with only one end â†’ stays in edit', () => {
    const dateField = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.field = dateField;
    host.filter = { field: 'd', operator: 'BETWEEN', data: { from: null, to: null } };
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.c-token-value-edit') as HTMLElement;
    wrapper.click();
    fixture.detectChanges();
    const rngDe = fixture.debugElement.query(By.css('.c-token sd-date-range'));

    rngDe.triggerEventHandler('sdChange', { from: '2024-02-01', to: null });
    fixture.detectChanges();
    expect(host.rangeCount).toBe(1);
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).not.toBeNull();
  });

  // ---- 9c: BETWEEN range commit null payload â†’ emits null + stays in edit
  it('BETWEEN range commit with null payload â†’ emits null and stays in edit', () => {
    const dateField = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.field = dateField;
    host.filter = { field: 'd', operator: 'BETWEEN', data: { from: '2024-02-01', to: '2024-02-28' } };
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.c-token-value-edit') as HTMLElement;
    wrapper.click();
    fixture.detectChanges();
    const rngDe = fixture.debugElement.query(By.css('.c-token sd-date-range'));

    rngDe.triggerEventHandler('sdChange', null);
    fixture.detectChanges();
    expect(host.committedRange).toBeNull();
    expect(fixture.nativeElement.querySelector('.c-token.c-token-editing')).not.toBeNull();
  });

  // ---- 10: boolean viewed â†’ button; click â†’ enter edit; toggle emits commit + exit
  it('boolean: viewed mode shows .c-token-value button; click â†’ enter edit; toggle commits', () => {
    const boolField = { key: 'on', label: 'On', type: 'boolean' } as SdQueryField;
    host.field = boolField;
    host.filter = { field: 'on', operator: 'EQUAL', data: true };
    host.valueText = 'CÃ³';
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.c-token > button.c-token-value, .c-token .c-token-value') as HTMLElement;
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('CÃ³');

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
  // why: badge padding lá»›n tá»«ng gÃ¢y trÃ n ra ngoÃ i chip â†’ Ä‘Ã£ Ä‘á»•i tá»« sd-button (mat MDC 36px
  // baseline) sang native .c-bool-btn (height 18/20px). Verify wrapper class + native button
  // selector + active class follow data value.
  it('boolean: edit mode renders 2 .c-bool-btn native toggles inside .c-bool-toggle wrapper', () => {
    const boolField = { key: 'on', label: 'On', type: 'boolean' } as SdQueryField;
    host.field = boolField;
    host.filter = { field: 'on', operator: 'EQUAL', data: true };
    host.valueText = 'CÃ³';
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.c-token > .c-token-value, .c-token .c-token-value') as HTMLElement).click();
    fixture.detectChanges();

    const wrap = fixture.nativeElement.querySelector('.c-token .c-bool-toggle') as HTMLElement;
    expect(wrap).not.toBeNull();
    const btns = wrap.querySelectorAll('button.c-bool-btn') as NodeListOf<HTMLButtonElement>;
    expect(btns.length).toBe(2);
    // why: data=true â†’ true btn carries .c-bool-active; false btn does not.
    expect(btns[0].classList.contains('c-bool-active')).toBe(true);
    expect(btns[1].classList.contains('c-bool-active')).toBe(false);
  });

  // ---- 11: Ã— emits (remove)
  it('Ã— button emits (remove)', () => {
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
    // Ã— still present
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

