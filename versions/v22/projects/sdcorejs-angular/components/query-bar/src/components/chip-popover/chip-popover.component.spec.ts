import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, reflectComponentType, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, throwError } from 'rxjs';

import { SdOperator } from '@sdcorejs/angular/components/operator';
import { SdQueryChipPopover } from './chip-popover.component';
import { Filter } from '@sdcorejs/utils/models';
import { SdQueryField } from '../../query-bar.model';
import { ɵSdQueryPanelTriggerDirective } from '../panel/query-panel';

/**
 * Host wrapper — a button trigger that opens the chip popover panel so its template is actually instantiated (the
 * body only renders while the panel is open).
 */
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdQueryChipPopover, ɵSdQueryPanelTriggerDirective],
  template: `
    <button #t type="button" [sdQueryPanelTrigger]="cp.panel()">open</button>
    <button id="outside" type="button">outside</button>
    <sd-query-chip-popover
      #cp
      [field]="field"
      [filter]="filter"
      [chipIndex]="chipIndex"
      [autoIdBase]="autoIdBase"
      (commit)="committed = $event; commitCount = commitCount + 1" />
  `,
})
class Host {
  field: SdQueryField | undefined = { key: 'name', label: 'Name', type: 'string' } as SdQueryField;
  filter: Filter = { field: 'name', operator: 'CONTAIN', data: 'abc' } as any;
  chipIndex: number | null = 0;
  autoIdBase = 'qb';

  committed: any = undefined;
  commitCount = 0;

  trigger = viewChild('t', { read: ɵSdQueryPanelTriggerDirective });
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

  const panel = (): HTMLElement | null =>
    TestBed.inject(OverlayContainer).getContainerElement().querySelector<HTMLElement>('.c-chip-popover');

  afterEach(() => fixture.destroy());

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

  // Plan decision 5: the operator in the popover header is the sm (24px) chip.
  it('uses the sm chip for the operator in the header', () => {
    host.child()!.seed(host.filter, host.field!);
    fixture.detectChanges();
    openPopover();
    const op = fixture.debugElement.query(By.directive(SdOperator));
    expect(op).withContext('header sd-operator').not.toBeNull();
    expect((op.componentInstance as SdOperator).size()).toBe('sm');
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

  // ---- 13: M7 — the nested field switcher is gone; the header names the field as plain text
  it('QB-FP-05 has no switchPickerMenu input or field switcher; the header label names the dialog', () => {
    const inputs = reflectComponentType(SdQueryChipPopover)!.inputs.map(entry => entry.propName);
    expect(inputs).not.toContain('switchPickerMenu');
    const outputs = reflectComponentType(SdQueryChipPopover)!.outputs.map(entry => entry.propName);
    expect(outputs).not.toContain('swapField');
    // @ts-expect-error switchPickerMenu was removed (handoff M7)
    expect(host.child()!.switchPickerMenu).toBeUndefined();

    host.child()!.seed(host.filter, host.field!);
    openPopover();
    const dialog = panel()!;
    const label = dialog.querySelector('.c-pop-header-field')!;
    expect(label.tagName).toBe('SPAN');
    expect(label.textContent!.trim()).toBe('Name');
    expect(dialog.querySelector('button.c-pop-header-field, [role="button"].c-pop-header-field')).toBeNull();
    expect(dialog.getAttribute('aria-labelledby')).toBe(label.id);
  });

  it('QB-P-07 renders a dialog panel (form kind) with the autoId of the chip panel', () => {
    host.child()!.seed(host.filter, host.field!);
    openPopover();
    const dialog = panel()!;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.classList).toContain('sd-query-panel');
    expect(dialog.classList).toContain('sd-query-panel--form');
    expect(dialog.getAttribute('data-autoid')).toBe('qb-panel-chip');
    expect(host.trigger()!.panel()!.role()).toBe('dialog');
  });

  it('QB-P-05 lands in the first value control, not the operator', () => {
    host.child()!.seed(host.filter, host.field!);
    openPopover();
    expect(panel()!.querySelector('sd-input')!.contains(document.activeElement)).toBeTrue();
  });

  // PD after R1 (G-9): on a short screen the frame keeps its rounded clip and the body scrolls instead of being cut off.
  it('QB-B-06 the body scrolls when the panel is shorter than its content; the header stays', () => {
    host.field = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    host.filter = { field: 'd', operator: 'BETWEEN', data: { from: '2026-01-01', to: '2026-01-31' } } as any;
    fixture.detectChanges();
    host.child()!.seed(host.filter, host.field);
    fixture.detectChanges();
    openPopover();

    const frame = panel()!;
    const header = frame.querySelector<HTMLElement>('.c-pop-header')!;
    const body = frame.querySelector<HTMLElement>('.c-pop-body')!;
    frame.style.maxHeight = `${header.offsetHeight + 24}px`;

    expect(getComputedStyle(frame).overflow).toBe('hidden');
    expect(getComputedStyle(body).overflowY).toBe('auto');
    expect(body.scrollHeight).withContext('body content taller than its box').toBeGreaterThan(body.clientHeight);
    expect(body.getBoundingClientRect().bottom).toBeLessThanOrEqual(frame.getBoundingClientRect().bottom + 0.5);
    expect(header.getBoundingClientRect().top).toBeGreaterThanOrEqual(frame.getBoundingClientRect().top);
  });

  describe('QB-P-04 commits the staged value on every way out', () => {
    const stage = (): void => {
      host.child()!.seed(host.filter, host.field!);
      openPopover();
      host.child()!.editingValue.set('xyz');
      fixture.detectChanges();
    };

    it('QB-P-04 Escape', () => {
      stage();
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(host.commitCount).toBe(1);
      expect(host.committed).toEqual(jasmine.objectContaining({ data: 'xyz' }));
    });

    it('QB-P-04 click outside', () => {
      stage();
      const outside = fixture.nativeElement.querySelector('#outside') as HTMLElement;
      outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      outside.click();
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(host.commitCount).toBe(1);
      expect(host.committed).toEqual(jasmine.objectContaining({ data: 'xyz' }));
    });

    it('QB-P-04 Tab out of the last control', () => {
      stage();
      // The value input (focused on open) is the last control of a string chip: the operator is disabled.
      const value = panel()!.querySelector<HTMLInputElement>('sd-input input')!;
      expect(document.activeElement).toBe(value);
      value.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(host.commitCount).toBe(1);
      expect(host.committed).toEqual(jasmine.objectContaining({ data: 'xyz' }));
    });
  });

  // ---- 14: panel close emits commit with current staging
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

  describe('staging edge paths', () => {
    const child = (): SdQueryChipPopover => host.child()!;
    const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve));

    it('reshapes the staged value between single, list and range operators', () => {
      child().seed({ field: 'name', operator: 'EQUAL', data: 5 } as any, host.field!);
      child().onEditingOperatorChange('BETWEEN');
      expect(child().editingValue()).toEqual({ from: null, to: null });
      child().onEditingValueInput({ from: 1, to: 2 });
      child().onEditingOperatorChange('BETWEEN');
      expect(child().editingValue()).withContext('a range stays').toEqual({ from: 1, to: 2 });

      child().seed({ field: 'name', operator: 'EQUAL', data: null } as any, host.field!);
      child().onEditingOperatorChange('IN');
      expect(child().editingValue()).toEqual([]);
      child().onEditingValueInput(['a', 'b']);
      child().onEditingOperatorChange('EQUAL');
      expect(child().editingValue()).withContext('a list keeps its first value').toBe('a');
      child().onEditingOperatorChange('IN');
      child().onEditingValueInput([]);
      child().onEditingOperatorChange('NOT_EQUAL');
      expect(child().editingValue()).withContext('an empty list').toBeNull();
      child().onEditingOperatorChange('CONTAIN');
      expect(child().editingValue()).toBeNull();
    });

    it('a required field keeps a staged value that is not a list when the selection empties', () => {
      const tenant = {
        key: 'tenant',
        label: 'Kho',
        type: 'values',
        required: true,
        option: { items: [], valueField: 'id', displayField: 'name' },
      } as unknown as SdQueryField;
      child().seed({ field: 'tenant', operator: 'IN', data: null } as any, tenant);
      child().onEditingValueInput([]);
      expect(child().editingValue()).toBeNull();
      expect(child().minOneHint()).toBeTrue();
    });

    it('range ends and list toggles start from an empty staged value', () => {
      child().seed(undefined, undefined);
      child().onEditingRangeFrom(1);
      expect(child().editingValue()).toEqual({ from: 1 });
      child().editingValue.set(null);
      child().onEditingRangeTo(2);
      expect(child().editingValue()).toEqual({ to: 2 });
      child().editingValue.set(null);
      child().toggleEditingMultiValue('a');
      expect(child().editingValue()).toEqual(['a']);
    });

    it('uses the [field], [filter] and [chipIndex] inputs before any seed', () => {
      expect(child().currentField()).toBe(host.field);
      expect(child().chipAutoId('value')).toBe('qb-chip0-value');
      host.chipIndex = null;
      fixture.detectChanges();
      expect(child().chipAutoId('value')).toBe('qb-chipx-value');
      child().editingOperator.set('EQUAL');
      child().editingValue.set('z');
      child().onMenuClosed('escape');
      expect(host.committed).toEqual({ field: 'name', operator: 'EQUAL', data: 'z' });
    });

    it('has no operators without a field and commits nothing without a filter', () => {
      host.field = undefined;
      host.filter = undefined as unknown as Filter;
      fixture.detectChanges();
      expect(child().allowedOperators()).toEqual([]);
      expect(child().showOperatorSelector()).toBeFalse();
      child().onMenuClosed('escape');
      expect(host.commitCount).toBe(0);
    });

    it('reads the options of a values field from a signal or from a function', async () => {
      const values = (items: unknown): SdQueryField =>
        ({ key: 's', label: 'S', type: 'values', option: { items, valueField: 'id', displayField: 'name' } }) as unknown as SdQueryField;
      const filter = { field: 's', operator: 'IN', data: [] } as any;

      child().seed(filter, values(signal([{ id: 1, name: 'A' }])));
      expect(child().editingOptions()).toEqual([{ id: 1, name: 'A' }]);
      expect(child().editingOptionsLoading()).toBeFalse();

      child().seed(
        filter,
        values(() => Promise.resolve([{ id: 2, name: 'B' }]))
      );
      expect(child().editingOptionsLoading()).toBeTrue();
      await flush();
      expect(child().editingOptions()).toEqual([{ id: 2, name: 'B' }]);
      expect(child().editingOptionsLoading()).toBeFalse();

      child().seed(
        filter,
        values(() => null)
      );
      await flush();
      expect(child().editingOptions()).toEqual([]);
    });

    it('loads lazy options from an observable or a promise and stops loading on error', async () => {
      const lazy = (search?: unknown): SdQueryField =>
        ({
          key: 'lz',
          label: 'LZ',
          type: 'lazy-values',
          option: { search, valueField: 'id', displayField: 'name' },
        }) as unknown as SdQueryField;
      const filter = { field: 'lz', operator: 'IN', data: [] } as any;

      child().seed(filter, lazy());
      expect(child().editingOptionsLoading()).withContext('no search').toBeFalse();

      const results = new Subject<unknown[] | null>();
      child().seed(
        filter,
        lazy(() => results)
      );
      expect(child().editingOptionsLoading()).toBeTrue();
      results.next([{ id: 'x' }]);
      expect(child().editingOptions()).toEqual([{ id: 'x' }]);
      results.next(null);
      expect(child().editingOptions()).toEqual([]);
      results.complete();
      expect(child().editingOptionsLoading()).toBeFalse();

      child().seed(
        filter,
        lazy(() => throwError(() => new Error('down')))
      );
      expect(child().editingOptionsLoading()).withContext('error').toBeFalse();

      child().seed(
        filter,
        lazy(() => Promise.resolve(null))
      );
      await flush();
      expect(child().editingOptions()).toEqual([]);
      expect(child().editingOptionsLoading()).toBeFalse();
    });
  });
});
