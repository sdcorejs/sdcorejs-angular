import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdOperator } from '@sdcorejs/angular/components/operator';

import { SdQueryBuildChip } from './build-chip.component';
import { SdQueryInlineValueChip } from '../inline-value-chip/inline-value-chip.component';
import { BuildingChip, SdQueryField } from '../../query-bar.model';

@Component({
  standalone: true,
  imports: [SdQueryBuildChip],
  template: `
    <sd-query-build-chip
      [building]="building"
      [allowedOperators]="allowedOperators"
      [multiple]="multiple"
      [showOperator]="showOperator"
      (pickOperator)="pickedOperator = $event"
      (commitValue)="committed = $event; commitCount = commitCount + 1"
      (cancel)="cancelled = cancelled + 1"
      (seamlessCommit)="seamless = $event; seamlessCount = seamlessCount + 1"
      (draftChange)="draft = $event"
      (draftCommit)="draftCommitted = draftCommitted + 1" />
  `,
})
class Host {
  building: BuildingChip = {
    field: { key: 'name', label: 'Name', type: 'string' } as SdQueryField,
    step: 'operator',
  };
  allowedOperators: any[] = ['CONTAIN', 'EQUAL'];
  multiple = false;
  showOperator = false;
  pickedOperator: any = null;
  committed: any = undefined;
  commitCount = 0;
  cancelled = 0;
  seamless: any = undefined;
  seamlessCount = 0;
  draft: any = undefined;
  draftCommitted = 0;

  child = viewChild(SdQueryBuildChip);
}

describe('SdQueryBuildChip', () => {
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

  // ---- 1: step='operator' renders sd-operator with allowedOperators
  it("step='operator' renders <sd-operator> seeded with allowedOperators", () => {
    const opDe = fixture.debugElement.query(By.directive(SdOperator));
    expect(opDe).not.toBeNull();
    const op = opDe.componentInstance as SdOperator;
    expect(op.operators()).toEqual(host.allowedOperators);
  });

  // ---- 2: step='operator' operator menu emit triggers pickOperator
  it("step='operator': modelChange routes to (pickOperator)", () => {
    const opDe = fixture.debugElement.query(By.directive(SdOperator));
    opDe.triggerEventHandler('modelChange', 'EQUAL');
    fixture.detectChanges();
    expect(host.pickedOperator).toBe('EQUAL');
  });

  // ---- 3: step='value', type='string' renders seamless inline-value-chip + forwards valueChange to seamlessCommit
  it("step='value' string → renders <sd-query-inline-value-chip>; valueChange forwards to (seamlessCommit)", () => {
    host.building = {
      field: { key: 'name', label: 'Name', type: 'string' } as SdQueryField,
      operator: 'CONTAIN',
      step: 'value',
    };
    fixture.detectChanges();

    const chipDe = fixture.debugElement.query(By.directive(SdQueryInlineValueChip));
    expect(chipDe).not.toBeNull();
    chipDe.triggerEventHandler('valueChange', 'abc');
    fixture.detectChanges();
    expect(host.seamless).toBe('abc');
    expect(host.seamlessCount).toBe(1);
  });

  // ---- 4: step='value', type='number' same as string
  it("step='value' number → renders <sd-query-inline-value-chip>", () => {
    host.building = {
      field: { key: 'age', label: 'Age', type: 'number' } as SdQueryField,
      operator: 'EQUAL',
      step: 'value',
    };
    fixture.detectChanges();

    const chipDe = fixture.debugElement.query(By.directive(SdQueryInlineValueChip));
    expect(chipDe).not.toBeNull();
  });

  // ---- 5: step='value', type='values' renders bare sd-select; sdChange emits (commitValue)
  it("step='value' values → renders bare sd-select; sdChange emits (commitValue)", () => {
    const field = {
      key: 'status',
      label: 'Status',
      type: 'values',
      option: { items: [{ id: 'a', name: 'A' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;
    host.building = { field, operator: 'IN', step: 'value' };
    host.multiple = true;
    fixture.detectChanges();

    const building = fixture.nativeElement.querySelector('.c-token-building');
    expect(building).not.toBeNull();
    const select = building.querySelector('sd-select') as HTMLElement;
    expect(select).not.toBeNull();
    expect(select.classList.contains('sd-bare')).toBe(true);

    const selDe = fixture.debugElement.query(By.css('.c-token-building sd-select'));
    selDe.triggerEventHandler('sdChange', ['a']);
    fixture.detectChanges();
    expect(host.committed).toEqual(['a']);
    expect(host.commitCount).toBe(1);
  });

  // ---- 6: step='value', type='date', op='EQUAL' renders bare sd-date
  it("step='value' date + EQUAL → renders bare <sd-date>", () => {
    const field = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.building = { field, operator: 'EQUAL', step: 'value' };
    fixture.detectChanges();
    const date = fixture.nativeElement.querySelector('.c-token-building sd-date');
    expect(date).not.toBeNull();
    expect(date.classList.contains('sd-bare')).toBe(true);
  });

  // ---- 7: step='value', type='date', op='BETWEEN' renders sd-date-range
  it("step='value' date + BETWEEN → renders <sd-date-range>", () => {
    const field = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.building = { field, operator: 'BETWEEN', step: 'value' };
    fixture.detectChanges();
    const rng = fixture.nativeElement.querySelectorAll('.c-token-building sd-date-range');
    expect(rng.length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.c-token-building sd-date').length).toBe(0);
  });

  // ---- 8: step='value', type='datetime', op='BETWEEN' renders sd-date-range (downgrade)
  it("step='value' datetime + BETWEEN → renders <sd-date-range> (downgrade)", () => {
    const field = { key: 'dt', label: 'DT', type: 'datetime' } as SdQueryField;
    host.building = { field, operator: 'BETWEEN', step: 'value' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.c-token-building sd-date-range').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.c-token-building sd-datetime').length).toBe(0);
  });

  // ---- 9: step='value' boolean renders two .c-bool-btn native toggles; click emits commitValue
  it("step='value' boolean → two .c-bool-btn toggles; click → (commitValue)(true|false)", () => {
    const field = { key: 'on', label: 'On', type: 'boolean' } as SdQueryField;
    host.building = { field, operator: 'EQUAL', step: 'value' };
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.c-token-building .c-bool-btn') as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(2);
    expect(buttons[0].classList.contains('c-bool-true')).toBe(true);
    expect(buttons[1].classList.contains('c-bool-false')).toBe(true);

    buttons[0].click();
    fixture.detectChanges();
    expect(host.committed).toBe(true);

    buttons[1].click();
    fixture.detectChanges();
    expect(host.committed).toBe(false);
    expect(host.commitCount).toBe(2);
  });

  // ---- 10: × button emits (cancel)
  it('× button (.c-token-remove) emits (cancel)', () => {
    host.building = {
      field: {
        key: 'status',
        label: 'Status',
        type: 'values',
        option: { items: [], valueField: 'id', displayField: 'name' },
      } as unknown as SdQueryField,
      operator: 'IN',
      step: 'value',
    };
    fixture.detectChanges();

    const x = fixture.nativeElement.querySelector('.c-token-building .c-token-remove') as HTMLElement;
    expect(x).not.toBeNull();
    x.click();
    fixture.detectChanges();
    expect(host.cancelled).toBe(1);
  });

  // ---- 11: openOperator() opens the operator menu
  it('openOperator() opens the internal sd-operator', () => {
    host.building = {
      field: { key: 'name', label: 'Name', type: 'string' } as SdQueryField,
      step: 'operator',
    };
    fixture.detectChanges();

    const opDe = fixture.debugElement.query(By.directive(SdOperator));
    const op = opDe.componentInstance as SdOperator;
    const openSpy = spyOn(op, 'open');
    host.child()!.openOperator();
    expect(openSpy).toHaveBeenCalled();
  });

  // ---- 12: openPicker() opens the rendered picker
  it('openPicker() opens the rendered picker', () => {
    const field = {
      key: 'status',
      label: 'Status',
      type: 'values',
      option: { items: [{ id: 'a', name: 'A' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;
    host.building = { field, operator: 'IN', step: 'value' };
    fixture.detectChanges();

    const selDe = fixture.debugElement.query(By.css('.c-token-building sd-select'));
    const sel = selDe.componentInstance as any;
    const openSpy = spyOn(sel, 'open');
    host.child()!.openPicker();
    expect(openSpy).toHaveBeenCalled();
  });

  // ---- 13: disabled operator badge in value step
  it("step='value' renders a disabled <sd-operator> displaying the chosen operator", () => {
    const field = {
      key: 'status',
      label: 'Status',
      type: 'values',
      option: { items: [], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;
    host.building = { field, operator: 'IN', step: 'value' };
    fixture.detectChanges();

    // Find disabled badge — there's only one sd-operator in the value step (the operator badge).
    const opDe = fixture.debugElement.query(By.directive(SdOperator));
    expect(opDe).not.toBeNull();
    const op = opDe.componentInstance as SdOperator;
    expect(op.disabled()).toBe(true);
    expect(op.model()).toBe('IN');
  });

  // ---- 14: seamless branch remove → (cancel)
  it('seamless string/number branch: (remove) from inline-value-chip propagates to (cancel)', () => {
    host.building = {
      field: { key: 'name', label: 'Name', type: 'string' } as SdQueryField,
      operator: 'CONTAIN',
      step: 'value',
    };
    fixture.detectChanges();

    const chipDe = fixture.debugElement.query(By.directive(SdQueryInlineValueChip));
    chipDe.triggerEventHandler('remove', undefined);
    fixture.detectChanges();
    expect(host.cancelled).toBe(1);
  });
});
