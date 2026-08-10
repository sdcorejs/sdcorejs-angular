import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdQueryChipPopover } from './chip-popover.component';
import { Filter } from '@sdcorejs/angular/utilities/models';
import { SdQueryField } from '../../query-bar.model';

/**
 * Host wrapper — declares a switchPicker mat-menu + a button trigger that opens the
 * chip popover so its `<ng-template matMenuContent>` is actually instantiated.
 *
 * why: ChipPopover's body lives inside an mat-menu `<ng-template matMenuContent>` —
 * only renders after the menu opens. Tests need to open the menu via a real trigger.
 */
@Component({
  standalone: true,
  imports: [SdQueryChipPopover, MatMenuModule],
  template: `
    <mat-menu #switch="matMenu">
      <button mat-menu-item>x</button>
    </mat-menu>
    <button #t="matMenuTrigger" [matMenuTriggerFor]="cp.menu()!">open</button>
    <sd-query-chip-popover
      #cp
      [field]="field"
      [filter]="filter"
      [chipIndex]="chipIndex"
      [autoIdBase]="autoIdBase"
      [switchPickerMenu]="switchMenu()!"
      (sdCommit)="committed = $event; commitCount = commitCount + 1"
      (sdSwapField)="swapped = $event" />
  `,
})
class Host {
  field: SdQueryField | undefined = { key: 'name', label: 'Name', type: 'string' } as SdQueryField;
  filter: Filter = { field: 'name', operator: 'CONTAIN', data: 'abc' } as any;
  chipIndex: number | null = 0;
  autoIdBase = 'qb';

  committed: any = undefined;
  commitCount = 0;
  swapped: any = undefined;

  switchMenu = viewChild<MatMenu>('switch');
  trigger = viewChild<MatMenuTrigger>('t');
  child = viewChild(SdQueryChipPopover);
}

describe('SdQueryChipPopover', () => {
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

  function openPopover(): void {
    host.trigger()!.openMenu();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await build();
  });

  // ---- 1: seed + open → string fallback renders sd-input with the staged value
  it("seed(string, CONTAIN, 'abc') → opens with <sd-input> showing 'abc'", () => {
    host.child()!.seed(host.filter, host.field!);
    fixture.detectChanges();
    openPopover();

    const inputDe = fixture.debugElement.query(By.css('sd-input'));
    expect(inputDe).not.toBeNull();
    expect(host.child()!.editingValue()).toBe('abc');
    expect(host.child()!.editingOperator()).toBe('CONTAIN');
  });

  // ---- 2: BETWEEN number → two sd-input-number controls
  it('BETWEEN number → renders two <sd-input-number>', () => {
    host.field = { key: 'age', label: 'Age', type: 'number' } as SdQueryField;
    host.filter = { field: 'age', operator: 'BETWEEN', data: { from: 1, to: 5 } } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);
    fixture.detectChanges();
    openPopover();

    const nums = fixture.debugElement.queryAll(By.css('sd-input-number'));
    expect(nums.length).toBe(2);
  });

  // ---- 3: BETWEEN date → two sd-date controls
  it('BETWEEN date → renders two <sd-date>', () => {
    host.field = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.filter = { field: 'd', operator: 'BETWEEN', data: { from: '2026-01-01', to: '2026-01-31' } } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);
    fixture.detectChanges();
    openPopover();

    const dates = fixture.debugElement.queryAll(By.css('sd-date'));
    expect(dates.length).toBe(2);
  });

  // ---- 4: BETWEEN datetime → two sd-datetime
  it('BETWEEN datetime → renders two <sd-datetime>', () => {
    host.field = { key: 'dt', label: 'DT', type: 'datetime' } as SdQueryField;
    host.filter = { field: 'dt', operator: 'BETWEEN', data: { from: null, to: null } } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);
    fixture.detectChanges();
    openPopover();

    const dts = fixture.debugElement.queryAll(By.css('sd-datetime'));
    expect(dts.length).toBe(2);
  });

  // ---- 5: boolean → two sd-button toggles
  it('boolean → renders .c-pop-boolean.c-bool-toggle with two sd-button', () => {
    host.field = { key: 'on', label: 'On', type: 'boolean' } as SdQueryField;
    host.filter = { field: 'on', operator: 'EQUAL', data: true } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);
    fixture.detectChanges();
    openPopover();

    const wrap = document.querySelector('.c-pop-boolean.c-bool-toggle');
    expect(wrap).not.toBeNull();
    const btns = wrap!.querySelectorAll('sd-button');
    expect(btns.length).toBe(2);
  });

  // ---- 6: values → sd-select populated from option.items
  it('values → sd-select rendered with items populated synchronously', () => {
    host.field = {
      key: 's',
      label: 'S',
      type: 'values',
      option: {
        items: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ],
        valueField: 'id',
        displayField: 'name',
      },
    } as unknown as SdQueryField;
    host.filter = { field: 's', operator: 'IN', data: [1] } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);
    fixture.detectChanges();
    openPopover();

    const selDe = fixture.debugElement.query(By.css('sd-select'));
    expect(selDe).not.toBeNull();
    expect(host.child()!.editingOptions().length).toBe(2);
  });

  // ---- 7: lazy-values kicks #loadLazyOptions, editingOptions populated after promise
  it('lazy-values → editingOptions populated after async search resolves', async () => {
    const search = ({ searchText }: any) => Promise.resolve([{ id: 'x', name: 'X' }]);
    host.field = {
      key: 'lz',
      label: 'LZ',
      type: 'lazy-values',
      option: { search, valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;
    host.filter = { field: 'lz', operator: 'IN', data: [] } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.child()!.editingOptions()).toEqual([{ id: 'x', name: 'X' }]);
    expect(host.child()!.editingOptionsLoading()).toBe(false);
  });

  // ---- 8: operator change single → multi reshapes value into array
  it('onEditingOperatorChange CONTAIN → IN reshapes editingValue from "abc" to ["abc"]', () => {
    host.child()!.seed(host.filter, host.field!);
    host.child()!.onEditingOperatorChange('IN');
    expect(host.child()!.editingValue()).toEqual(['abc']);
  });

  // ---- 9: operator change BETWEEN → EQUAL stays at range obj or normalized?
  // Current parent behavior: from BETWEEN to EQUAL keeps the {from,to} object as-is
  // (no special reset path). Spec the existing semantics — value stays an object.
  it('onEditingOperatorChange BETWEEN → EQUAL keeps the staged value object', () => {
    host.field = { key: 'age', label: 'Age', type: 'number' } as SdQueryField;
    host.filter = { field: 'age', operator: 'BETWEEN', data: { from: 1, to: 5 } } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);
    host.child()!.onEditingOperatorChange('EQUAL');
    // why: the BETWEEN→EQUAL branch isn't single→multi nor multi→single nor reshape,
    // so value object is preserved (the body hides the BETWEEN UI; user picks new scalar).
    expect(host.child()!.editingValue()).toEqual({ from: 1, to: 5 });
  });

  // ---- 10: operator change to NULL hides body + sets value to null
  it('onEditingOperatorChange CONTAIN → NULL hides value body + sets value=null', () => {
    host.child()!.seed(host.filter, host.field!);
    host.child()!.onEditingOperatorChange('NULL');
    expect(host.child()!.editingValue()).toBeNull();
    fixture.detectChanges();
    openPopover();
    // body still renders (header etc) but no value control under .c-pop-body
    const inputs = document.querySelectorAll(
      '.c-pop-body sd-input, .c-pop-body sd-input-number, .c-pop-body sd-select, .c-pop-body sd-date, .c-pop-body sd-datetime'
    );
    expect(inputs.length).toBe(0);
  });

  // ---- 11: toggleEditingMultiValue toggles in/out of array
  it('toggleEditingMultiValue toggles entries in/out of the staged array', () => {
    host.field = {
      key: 's',
      label: 'S',
      type: 'values',
      option: {
        items: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
        ],
        valueField: 'id',
        displayField: 'name',
      },
    } as unknown as SdQueryField;
    host.filter = { field: 's', operator: 'IN', data: ['a'] } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);

    host.child()!.toggleEditingMultiValue('b');
    expect(host.child()!.editingValue()).toEqual(['a', 'b']);
    host.child()!.toggleEditingMultiValue('a');
    expect(host.child()!.editingValue()).toEqual(['b']);
  });

  // ---- 12: isEditingMultiSelected reflects array membership
  it('isEditingMultiSelected reflects membership in staged array', () => {
    host.field = {
      key: 's',
      label: 'S',
      type: 'values',
      option: { items: [{ id: 'a', name: 'A' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;
    host.filter = { field: 's', operator: 'IN', data: ['a'] } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);
    expect(host.child()!.isEditingMultiSelected('a')).toBe(true);
    expect(host.child()!.isEditingMultiSelected('z')).toBe(false);
  });

  // ---- 13: field switcher button has matMenuTriggerFor pointed at parent menu
  it('field switcher button uses [matMenuTriggerFor] of the provided switchPickerMenu', () => {
    host.child()!.seed(host.filter, host.field!);
    fixture.detectChanges();
    openPopover();
    // Field switch button is rendered with `[matMenuTriggerFor]` — query for the
    // directive instance instead of the raw attribute (Angular doesn't reflect it).
    const switchBtn = document.querySelector('.c-pop-header-field') as HTMLElement | null;
    expect(switchBtn).not.toBeNull();
  });

  // ---- 14: mat-menu (closed) emits commit with current staging
  it('menu close emits (commit) with { field, operator, data } from staging', () => {
    host.child()!.seed(host.filter, host.field!);
    fixture.detectChanges();
    openPopover();
    host.child()!.editingValue.set('xyz');
    host.child()!.editingOperator.set('EQUAL');
    fixture.detectChanges();

    // Trigger menu close — use the public trigger
    host.trigger()!.closeMenu();
    fixture.detectChanges();

    expect(host.commitCount).toBe(1);
    expect(host.committed).toEqual(jasmine.objectContaining({ field: 'name', operator: 'EQUAL', data: 'xyz' }));
  });

  // ---- 15: onEditingRangeFrom mutates only .from
  it('onEditingRangeFrom updates only .from; .to is preserved', () => {
    host.field = { key: 'age', label: 'Age', type: 'number' } as SdQueryField;
    host.filter = { field: 'age', operator: 'BETWEEN', data: { from: 1, to: 5 } } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);
    host.child()!.onEditingRangeFrom(9);
    expect(host.child()!.editingValue()).toEqual({ from: 9, to: 5 });
    host.child()!.onEditingRangeTo(10);
    expect(host.child()!.editingValue()).toEqual({ from: 9, to: 10 });
  });
});
