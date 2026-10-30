import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Operator } from '@sdcorejs/utils/models';

import { SdQueryBar } from './query-bar.component';
import { SdQueryBuildChip } from './components/build-chip/build-chip.component';
import { SdQueryInlineChip } from './components/inline-chip/inline-chip.component';
import { SdQueryInlineValueChip } from './components/inline-value-chip/inline-value-chip.component';
import { SD_QUERY_OPERATORS_BY_TYPE, SdQueryBarOption, SdQueryField, sdQueryAllowedOperators } from './query-bar.model';

describe('SdQueryBar', () => {
  let fixture: ComponentFixture<SdQueryBar>;
  let component: SdQueryBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdQueryBar, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdQueryBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Smoke test — fuller suite arrives once design lands.
  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the .c-query-bar wrapper', () => {
    const el = fixture.nativeElement.querySelector('.c-query-bar');
    expect(el).not.toBeNull();
  });

  describe('sd-operator integration (inline mode)', () => {
    // why: string/number completed chips render the seamless value chip (operator implicit).
    // For popover-kind chips the locked <sd-operator> shows only when showOperatorOnChip is
    // on — keeping operator display consistent across every chip kind.
    it('renders <sd-operator> for a completed popover-kind chip when showOperatorOnChip is on', () => {
      const field = { key: 'joinDate', label: 'Join', type: 'date', operators: true } as SdQueryField;
      fixture.componentRef.setInput('fields', [field]);
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('showOperatorOnChip', true);
      component.filters.set([{ field: 'joinDate', operator: 'EQUAL', data: null } as any]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('sd-operator')).not.toBeNull();
    });

    it('renders the seamless value chip (no <sd-operator>) for a completed string chip', () => {
      const field = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;
      fixture.componentRef.setInput('fields', [field]);
      fixture.componentRef.setInput('mode', 'inline');
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: '' } as any]);
      fixture.detectChanges();

      const chipDe = fixture.debugElement.query(By.directive(SdQueryInlineValueChip));
      expect(chipDe).not.toBeNull();
      expect((chipDe.nativeElement as HTMLElement).querySelector('sd-operator')).toBeNull();
    });

    it('exposes the allowed operators for a field as Operator[]', () => {
      const field = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;
      expect(component.allowedOperatorsFor(field).length).toBeGreaterThan(0);
    });

    // why: in the token-builder design completed chips lock the operator (rendered
    // [disabled]); operator selection happens only during the build flow's operator
    // step, where modelChange routes to pickBuildOperator.
    it('build-step sd-operator modelChange routes to pickBuildOperator (advances to value)', () => {
      const field = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;
      fixture.componentRef.setInput('fields', [field]);
      fixture.componentRef.setInput('mode', 'inline');
      component.beginBuild(field);
      fixture.detectChanges();

      const opDe = fixture.debugElement.query(By.directive(SdOperator));
      opDe.triggerEventHandler('modelChange', 'EQUAL');
      fixture.detectChanges();

      expect(component.building()?.step).toBe('value');
      expect(component.building()?.operator).toBe('EQUAL');
    });
  });

  describe('inline build/edit state', () => {
    it('starts with no building chip', () => {
      expect(component.building()).toBeNull();
    });

    it('beginBuild on a multi-operator field starts at the operator step', () => {
      const field = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;
      component.beginBuild(field);
      expect(component.building()?.step).toBe('operator');
      expect(component.building()?.operator).toBeUndefined();
    });

    it('beginBuild on a single-operator field skips to the value step with the default operator', () => {
      const field = { key: 'name', label: 'Name', type: 'string', operators: ['CONTAIN'] } as SdQueryField;
      component.beginBuild(field);
      expect(component.building()?.step).toBe('value');
      expect(component.building()?.operator).toBe('CONTAIN');
    });

    it('beginBuild with a single no-data operator finishes the chip immediately', () => {
      const field = { key: 'deleted', label: 'Deleted', type: 'string', operators: ['NULL'] } as SdQueryField;
      component.beginBuild(field);
      expect(component.building()).toBeNull();
      expect(component.filters().length).toBe(1);
      expect(component.filters()[0].operator).toBe('NULL');
    });
  });

  describe('inline build steps', () => {
    const stringField = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;

    it('pickBuildOperator advances a data operator to the value step', () => {
      component.beginBuild(stringField);
      component.pickBuildOperator('CONTAIN');
      expect(component.building()?.step).toBe('value');
      expect(component.building()?.operator).toBe('CONTAIN');
      expect(component.filters().length).toBe(0);
    });

    it('pickBuildOperator with a no-data operator finishes the chip immediately', () => {
      component.beginBuild(stringField);
      component.pickBuildOperator('NULL');
      expect(component.building()).toBeNull();
      expect(component.filters()[0].operator).toBe('NULL');
    });

    it('commitBuildValue pushes the completed chip and clears building', () => {
      component.beginBuild(stringField);
      component.pickBuildOperator('CONTAIN');
      component.commitBuildValue('abc');
      expect(component.building()).toBeNull();
      expect(component.filters()).toEqual([jasmine.objectContaining({ field: 'name', operator: 'CONTAIN', data: 'abc' })]);
    });

    it('cancelBuild discards the in-progress chip', () => {
      component.beginBuild(stringField);
      component.cancelBuild();
      expect(component.building()).toBeNull();
      expect(component.filters().length).toBe(0);
    });

    it('commitBuildValue wraps a scalar into an array for a multi operator (IN)', () => {
      const valuesField = {
        key: 'status',
        label: 'Status',
        type: 'values',
        operators: ['IN'],
        option: { items: [], valueField: 'id', displayField: 'name' },
      } as unknown as SdQueryField;
      component.beginBuild(valuesField);
      // single allowed operator IN → build skips operator step
      expect(component.building()?.operator).toBe('IN');
      component.commitBuildValue('a');
      expect(component.filters()[0]).toEqual(jasmine.objectContaining({ field: 'status', operator: 'IN', data: ['a'] }));
    });
  });

  describe('inline value editing + emit gating', () => {
    const stringField = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;

    function seedOneChip(): void {
      component.beginBuild(stringField);
      component.pickBuildOperator('CONTAIN');
      component.commitBuildValue('abc');
    }

    it('updateFilter changes only data, keeps operator/field', () => {
      seedOneChip();
      component.updateFilter(0, { data: 'xyz' } as any);
      expect(component.filters()[0]).toEqual(jasmine.objectContaining({ field: 'name', operator: 'CONTAIN', data: 'xyz' }));
    });

    it('build / edit / remove do NOT emit queryChange; Search emits apply once', () => {
      const queryChange = jasmine.createSpy('queryChange');
      const apply = jasmine.createSpy('apply');
      component.queryChange.subscribe(queryChange);
      component.apply.subscribe(apply);
      fixture.componentRef.setInput('mode', 'inline');

      seedOneChip();
      component.updateFilter(0, { data: 'xyz' } as any);
      expect(queryChange).not.toHaveBeenCalled();

      component.removeFilter(0);
      expect(queryChange).not.toHaveBeenCalled();

      component.triggerApply();
      expect(apply).toHaveBeenCalledTimes(1);
    });
  });

  describe('inline DOM', () => {
    const stringField = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [stringField]);
    });

    it('renders a completed string chip as a seamless value chip (label + input + remove)', () => {
      component.beginBuild(stringField);
      component.pickBuildOperator('CONTAIN');
      component.commitBuildValue('abc');
      fixture.detectChanges();

      const chipDe = fixture.debugElement.query(By.directive(SdQueryInlineValueChip));
      expect(chipDe).not.toBeNull();
      const chip = chipDe.nativeElement as HTMLElement;
      expect(chip.querySelector('.c-seamless__field')?.textContent).toContain('Name');
      expect(chip.querySelector('sd-inline-text input')).not.toBeNull();
      expect(chip.querySelector('.c-seamless__x')).not.toBeNull();
      // the bound value flows into the chip's draft for display
      expect((chipDe.componentInstance as SdQueryInlineValueChip).value()).toBe('abc');
    });

    it('renders the seamless value chip for a string build at the value step (no rectangle input)', () => {
      component.beginBuild(stringField);
      component.pickBuildOperator('CONTAIN');
      fixture.detectChanges();

      // string/number build steps use the seamless chip — no .c-token-building, no sd-input
      expect(fixture.nativeElement.querySelector('.c-token-building')).toBeNull();
      const chipDe = fixture.debugElement.query(By.directive(SdQueryInlineValueChip));
      expect(chipDe).not.toBeNull();
      expect((chipDe.nativeElement as HTMLElement).querySelector('sd-inline-text input')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('sd-input')).toBeNull();
    });
  });

  describe('popover mode add-filter (regression — shared field picker)', () => {
    const stringField = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;

    it('picking a field from the field picker adds a chip without emitting (deferred — Search triggers the query; popover path uses addFilter, not beginBuild)', () => {
      fixture.componentRef.setInput('mode', 'popover');
      fixture.componentRef.setInput('fields', [stringField]);
      fixture.detectChanges();
      const queryChange = jasmine.createSpy('queryChange');
      component.queryChange.subscribe(queryChange);

      // open the add-filter field picker
      const addBtn = fixture.nativeElement.querySelector('.c-add-filter') as HTMLButtonElement;
      addBtn.click();
      fixture.detectChanges();

      const overlay = TestBed.inject(OverlayContainer).getContainerElement();
      const item = overlay.querySelector('button[mat-menu-item]') as HTMLButtonElement;
      item.click();
      fixture.detectChanges();

      expect(component.filters().length).toBe(1);
      expect((component.filters()[0] as any).field).toBe('name');
      expect(component.building()).toBeNull(); // popover must NOT start an inline build
      expect(queryChange).not.toHaveBeenCalled(); // deferred — adding a chip no longer emits live
      overlay.remove();
    });
  });

  describe('chipValueText display (multi / range)', () => {
    it('shows "head +N" for a multi (IN) value', () => {
      const field = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;
      fixture.componentRef.setInput('fields', [field]);
      const filter = { field: 'name', operator: 'IN', data: ['a', 'b', 'c'] } as any;
      expect(component.chipValueText(filter)).toBe('a +2');
    });

    it('shows both ends for a BETWEEN range value', () => {
      const field = { key: 'age', label: 'Age', type: 'number', operators: true } as SdQueryField;
      fixture.componentRef.setInput('fields', [field]);
      const filter = { field: 'age', operator: 'BETWEEN', data: { from: 1, to: 9 } } as any;
      const text = component.chipValueText(filter);
      expect(text).toContain('1');
      expect(text).toContain('9');
    });
  });

  describe('deferred apply (single trigger)', () => {
    const field = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;

    it('canSearch is false when no filters and blank search; true otherwise', () => {
      expect(component.canSearch()).toBe(false);
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: 'a' } as any]);
      expect(component.canSearch()).toBe(true);
      component.filters.set([]);
      component.search.set('  ');
      expect(component.canSearch()).toBe(false);
      component.search.set('hi');
      expect(component.canSearch()).toBe(true);
    });

    it('mutations do NOT emit queryChange or apply', () => {
      const queryChange = jasmine.createSpy('queryChange');
      const apply = jasmine.createSpy('apply');
      component.queryChange.subscribe(queryChange);
      component.apply.subscribe(apply);
      fixture.componentRef.setInput('fields', [field]);

      component.addFilter(field);
      component.setLogic('OR');
      component.removeFilter(0);
      component.clearAll();
      component.setSearch('x');

      expect(queryChange).not.toHaveBeenCalled();
      expect(apply).not.toHaveBeenCalled();
    });

    it('triggerApply emits queryChange AND apply exactly once', () => {
      const queryChange = jasmine.createSpy('queryChange');
      const apply = jasmine.createSpy('apply');
      component.queryChange.subscribe(queryChange);
      component.apply.subscribe(apply);

      component.triggerApply();

      expect(queryChange).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledTimes(1);
    });
  });

  describe('search trigger button', () => {
    const field = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;

    it('renders the Search button disabled when no filters and blank search', () => {
      fixture.componentRef.setInput('fields', [field]);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.c-search-trigger') as HTMLButtonElement;
      expect(btn).not.toBeNull();
      expect(btn.disabled).toBe(true);
    });

    it('enables the Search button once a filter exists and fires apply on click', () => {
      fixture.componentRef.setInput('fields', [field]);
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: 'a' } as any]);
      fixture.detectChanges();
      const apply = jasmine.createSpy('apply');
      component.apply.subscribe(apply);

      const btn = fixture.nativeElement.querySelector('.c-search-trigger') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
      btn.click();

      expect(apply).toHaveBeenCalledTimes(1);
    });

    it('does not render the old inline search button', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [field]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.c-inline-search')).toBeNull();
    });

    it('pressing Enter in the free-text search input triggers apply', () => {
      fixture.componentRef.setInput('showSearch', true);
      fixture.detectChanges();
      const apply = jasmine.createSpy('apply');
      component.apply.subscribe(apply);

      const input = fixture.nativeElement.querySelector('.c-search-input') as HTMLInputElement;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(apply).toHaveBeenCalledTimes(1);
    });
  });

  describe('compact inline value editing', () => {
    const textField = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;
    const valuesField = {
      key: 'status',
      label: 'Status',
      type: 'values',
      operators: ['IN'],
      option: { items: [{ id: 'a', name: 'A' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [textField, valuesField]);
    });

    it('text field uses the seamless value chip at the build value step (no value popover, no rectangle)', () => {
      component.beginBuild(textField);
      component.pickBuildOperator('CONTAIN');
      fixture.detectChanges();

      const chipDe = fixture.debugElement.query(By.directive(SdQueryInlineValueChip));
      expect(chipDe).not.toBeNull();
      const chip = chipDe.nativeElement as HTMLElement;
      expect(chip.querySelector('sd-inline-text input')).not.toBeNull();
      expect(chip.querySelector('[matMenuTriggerFor]')).toBeNull();
      expect(fixture.nativeElement.querySelector('sd-input')).toBeNull();
    });

    it('renders a bare sd-select at the values build value step', () => {
      component.beginBuild(valuesField); // single op IN → straight to value step
      fixture.detectChanges();

      const building = fixture.nativeElement.querySelector('.c-token-building');
      const select = building.querySelector('sd-select');
      expect(select).not.toBeNull();
      expect(select.classList.contains('sd-bare')).toBe(true);
      expect(building.querySelector('[matMenuTriggerFor]')).toBeNull();
    });

    it('renders an inline-mode sd-select for a completed values chip', () => {
      // why: completed values chip dùng sd-select [viewed]="'inline'" — idle hiển thị
      // view-text (.sd-inline-view), bare editor chỉ xuất hiện khi click (không .sd-bare lúc idle).
      const field = {
        key: 'status',
        label: 'Status',
        type: 'values',
        operators: ['IN'],
        option: { items: [{ id: 'a', name: 'A' }], valueField: 'id', displayField: 'name' },
      } as unknown as SdQueryField;
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [field]);
      component.filters.set([{ field: 'status', operator: 'IN', data: ['a'] } as any]);
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('.c-token sd-select');
      expect(select).not.toBeNull();
      expect(select.querySelector('.sd-inline-view')).not.toBeNull();
    });

    it('renders a bare sd-date at the date build value step', () => {
      const dateField = { key: 'd', label: 'D', type: 'date', operators: ['EQUAL'] } as SdQueryField;
      fixture.componentRef.setInput('fields', [dateField]);
      component.beginBuild(dateField); // single op -> straight to value step
      fixture.detectChanges();

      const date = fixture.nativeElement.querySelector('.c-token-building sd-date');
      expect(date).not.toBeNull();
      expect(date.classList.contains('sd-bare')).toBe(true);
    });

    it('renders a bare sd-datetime at the datetime build value step', () => {
      const dtField = { key: 'dt', label: 'DT', type: 'datetime', operators: ['EQUAL'] } as SdQueryField;
      fixture.componentRef.setInput('fields', [dtField]);
      component.beginBuild(dtField);
      fixture.detectChanges();

      const dt = fixture.nativeElement.querySelector('.c-token-building sd-datetime');
      expect(dt).not.toBeNull();
      expect(dt.classList.contains('sd-bare')).toBe(true);
    });
  });

  // why: "popover auto-apply on close" removed — covered by chip-popover spec #14
  // (menu close emits (commit) with { field, operator, data } from staging).

  describe('compact popover layout', () => {
    const field = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;

    function openPopoverDom() {
      fixture.componentRef.setInput('mode', 'popover');
      fixture.componentRef.setInput('fields', [field]);
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: '' } as any]);
      fixture.detectChanges();
      const chip = fixture.nativeElement.querySelector('.c-chip') as HTMLButtonElement;
      chip.click();
      fixture.detectChanges();
      return TestBed.inject(OverlayContainer).getContainerElement();
    }

    it('renders the operator inside the header and drops section labels + footer', () => {
      const panel = openPopoverDom();
      expect(panel.querySelector('.c-pop-header sd-operator')).not.toBeNull();
      expect(panel.querySelector('.c-pop-section-label')).toBeNull();
      expect(panel.querySelector('.c-pop-footer')).toBeNull();
      panel.remove();
    });
  });

  describe('search button placement', () => {
    const field = { key: 'name', label: 'Name', type: 'string', operators: true } as SdQueryField;

    it('is the last child of the action toolbar (after clear-all)', () => {
      fixture.componentRef.setInput('fields', [field]);
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: 'a' } as any]);
      fixture.detectChanges();

      const actions = fixture.nativeElement.querySelector('.c-query-bar__actions');
      const buttons = actions.querySelectorAll(':scope > button');
      const last = buttons[buttons.length - 1] as HTMLElement;
      expect(last.classList).toContain('c-search-trigger');
    });
  });

  describe('BETWEEN uses sd-date-range', () => {
    const dateField = { key: 'created', label: 'Created', type: 'date', operators: ['BETWEEN'] } as unknown as SdQueryField;
    const dtField = { key: 'updatedAt', label: 'Updated', type: 'datetime', operators: ['BETWEEN'] } as unknown as SdQueryField;

    it('build BETWEEN date renders one sd-date-range (not two sd-date)', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [dateField]);
      component.beginBuild(dateField);
      fixture.detectChanges();
      const tokens = fixture.nativeElement.querySelectorAll('.c-token-building sd-date-range');
      expect(tokens.length).toBe(1);
      expect(fixture.nativeElement.querySelectorAll('.c-token-building sd-date').length).toBe(0);
    });

    it('build BETWEEN datetime renders one sd-date-range', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [dtField]);
      component.beginBuild(dtField);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.c-token-building sd-date-range').length).toBe(1);
      expect(fixture.nativeElement.querySelectorAll('.c-token-building sd-datetime').length).toBe(0);
    });

    it('completed-chip BETWEEN date renders one sd-date-range bound to filter data', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [dateField]);
      component.filters.set([{ field: 'created', operator: 'BETWEEN', data: { from: '2024-01-01', to: '2024-01-31' } } as any]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.c-token sd-date-range').length).toBe(1);
    });

    it('setFilterRange(i, ev) writes the full {from,to} payload via updateFilter', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [dateField]);
      component.filters.set([{ field: 'created', operator: 'BETWEEN', data: { from: null, to: null } } as any]);
      component.setFilterRange(0, { from: '2024-02-01', to: '2024-02-28' });
      expect((component.filters()[0] as any).data).toEqual({ from: '2024-02-01', to: '2024-02-28' });
    });
  });
});

describe('SdQueryBar (extras)', () => {
  let fixture: ComponentFixture<SdQueryBar>;
  let component: SdQueryBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdQueryBar, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdQueryBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('inline chip alignment + bare select selected display', () => {
    const valuesField = {
      key: 'status',
      label: 'Status',
      type: 'values',
      operators: ['EQUAL'],
      option: {
        items: [
          { id: 'a', name: 'Alpha' },
          { id: 'b', name: 'Beta' },
        ],
        valueField: 'id',
        displayField: 'name',
      },
    } as unknown as SdQueryField;

    it('a completed values chip renders an inline-mode sd-select inside the token', () => {
      // why: chip values dùng sd-select [viewed]="'inline'" → idle render <sd-view> qua
      // .sd-inline-view (click để sửa). Anchor về sự tồn tại của sd-select inline-view trong .c-token.
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [valuesField]);
      component.filters.set([{ field: 'status', operator: 'EQUAL', data: 'a' } as any]);
      fixture.detectChanges();

      const sel = fixture.nativeElement.querySelector('.c-token sd-select .sd-inline-view');
      expect(sel).not.toBeNull();
    });
  });

  describe('inline chip edit lifecycle (now owned by <sd-query-inline-chip>)', () => {
    const valuesField = {
      key: 'status',
      label: 'Status',
      type: 'values',
      operators: ['EQUAL'],
      option: {
        items: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
        ],
        valueField: 'id',
        displayField: 'name',
      },
    } as unknown as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [valuesField]);
      component.filters.set([{ field: 'status', operator: 'EQUAL', data: 'a' } as any]);
      fixture.detectChanges();
    });

    it('child (commit) output → parent updates filter data', () => {
      // why: edit lifecycle now lives in <sd-query-inline-chip>; parent only writes
      // data via updateFilter on the child's (commit) output.
      const chipDe = fixture.debugElement.query(By.css('sd-query-inline-chip'));
      expect(chipDe).not.toBeNull();
      chipDe.triggerEventHandler('commit', 'b');
      fixture.detectChanges();
      expect((component.filters()[0] as any).data).toBe('b');
    });

    it('clicking the inline values view reveals the sd-select editor (viewed=inline)', () => {
      // why: lifecycle giờ thuộc sd-select [viewed]="'inline'" — click .sd-inline-view để mở editor.
      const selDe = fixture.debugElement.query(By.css('sd-query-inline-chip sd-select'));
      expect(selDe.componentInstance.viewed()).toBe('inline');
      const inlineView = fixture.nativeElement.querySelector('sd-query-inline-chip .sd-inline-view') as HTMLElement;
      expect(inlineView).not.toBeNull();
      inlineView.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('sd-query-inline-chip mat-select')).not.toBeNull();
    });
  });

  describe('inline chip viewed mode + clear-icon hidden', () => {
    const valuesField = {
      key: 'status',
      label: 'Status',
      type: 'values',
      operators: ['EQUAL'],
      option: {
        items: [
          { id: 'a', name: 'Alpha' },
          { id: 'b', name: 'Beta' },
        ],
        valueField: 'id',
        displayField: 'name',
      },
    } as unknown as SdQueryField;
    const dateField = { key: 'created', label: 'Created', type: 'date', operators: ['EQUAL'] } as unknown as SdQueryField;
    const dtField = { key: 'updatedAt', label: 'Updated', type: 'datetime', operators: ['EQUAL'] } as unknown as SdQueryField;

    function seed(field: SdQueryField, data: unknown): void {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [field]);
      component.filters.set([{ field: field.key, operator: 'EQUAL', data } as any]);
      fixture.detectChanges();
    }

    it('values chip renders sd-select with viewed="inline" by default', () => {
      seed(valuesField, 'a');
      const selDe = fixture.debugElement.query(By.css('.c-token sd-select'));
      expect(selDe).not.toBeNull();
      expect(selDe.componentInstance.viewed()).toBe('inline');
    });

    it('date chip renders sd-date with viewed="inline" by default', () => {
      seed(dateField, '2024-01-15');
      const dDe = fixture.debugElement.query(By.css('.c-token sd-date'));
      expect(dDe).not.toBeNull();
      expect(dDe.componentInstance.viewed()).toBe('inline');
    });

    it('datetime chip renders sd-datetime with viewed="inline" by default', () => {
      seed(dtField, '2024-01-15T08:00:00Z');
      const dDe = fixture.debugElement.query(By.css('.c-token sd-datetime'));
      expect(dDe).not.toBeNull();
      expect(dDe.componentInstance.viewed()).toBe('inline');
    });

    it('clicking the inline values view reveals the sd-select editor', () => {
      seed(valuesField, 'a');
      const inlineView = fixture.nativeElement.querySelector('.c-token sd-select .sd-inline-view') as HTMLElement;
      expect(inlineView).not.toBeNull();
      inlineView.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.c-token mat-select')).not.toBeNull();
    });

    it('inline-active values editor is bare (.sd-bare flattens the picker chrome)', () => {
      seed(valuesField, 'a');
      const inlineView = fixture.nativeElement.querySelector('.c-token sd-select .sd-inline-view') as HTMLElement;
      inlineView.click();
      fixture.detectChanges();
      const sel = fixture.nativeElement.querySelector('.c-token sd-select') as HTMLElement;
      expect(sel.classList.contains('sd-bare')).toBe(true);
    });
  });

  describe('chip multi sd-select "head +N" view', () => {
    const valuesField = {
      key: 'depts',
      label: 'Departments',
      type: 'values',
      operators: ['IN'],
      option: {
        items: [
          { id: 'a', name: 'Alpha' },
          { id: 'b', name: 'Beta' },
          { id: 'c', name: 'Gamma' },
        ],
        valueField: 'id',
        displayField: 'name',
      },
    } as unknown as SdQueryField;

    it('renders "head +N" when multi has 2+ selected', async () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [valuesField]);
      component.filters.set([{ field: 'depts', operator: 'IN', data: ['a', 'b', 'c'] } as any]);
      fixture.detectChanges();
      // why: sd-select fills selectedItems via RxJS combineLatest (async). whenStable
      // flushes the microtask queue so the projected #sdValue template binding resolves.
      await fixture.whenStable();
      fixture.detectChanges();
      const txt = (fixture.nativeElement.querySelector('.c-token sd-select') as HTMLElement)?.textContent ?? '';
      expect(txt).toMatch(/Alpha\s*\+2/);
    });

    it('renders the single label when multi has exactly 1', async () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [valuesField]);
      component.filters.set([{ field: 'depts', operator: 'IN', data: ['b'] } as any]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const txt = (fixture.nativeElement.querySelector('.c-token sd-select') as HTMLElement)?.textContent ?? '';
      expect(txt).toContain('Beta');
      expect(txt).not.toContain('+');
    });
  });

  // ---------------------------------------------------------------------------
  // Regression: per-CD allocation + row identity + editingIndex reindexing
  // ---------------------------------------------------------------------------

  describe('allowedOperators referential stability (per-CD allocation bug class)', () => {
    // why: simple mode (không khai `operators`) là case phổ biến nhất và trước đây trả về
    // `[defaultOperator]` MỚI mỗi lần gọi — template gọi mỗi CD → child OnPush dirty vô hạn.
    const simpleField = { key: 'name', label: 'Name', type: 'string' } as SdQueryField;

    it('sdQueryAllowedOperators returns the same array instance for the same field', () => {
      const first = sdQueryAllowedOperators(simpleField);

      expect(sdQueryAllowedOperators(simpleField)).toBe(first);
      expect(first).toEqual(['CONTAIN']);
    });

    it('allowedOperatorsFor is stable per field and still isolates different fields', () => {
      const otherField = { key: 'age', label: 'Age', type: 'number' } as SdQueryField;

      expect(component.allowedOperatorsFor(simpleField)).toBe(component.allowedOperatorsFor(simpleField));
      expect(component.allowedOperatorsFor(otherField)).not.toBe(component.allowedOperatorsFor(simpleField));
      expect(component.allowedOperatorsFor(otherField)).toEqual(['EQUAL']);
    });

    it('hands the build chip the same allowedOperators array across change detection passes', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [simpleField]);
      component.beginBuild(simpleField);
      fixture.detectChanges();

      const chip = fixture.debugElement.query(By.directive(SdQueryBuildChip)).componentInstance as SdQueryBuildChip;
      const first = chip.allowedOperators();
      expect(first).toEqual(['CONTAIN']);

      // why: sd-query-bar là OnPush — `fixture.detectChanges()` một mình KHÔNG chạy lại template
      // khi view đã sạch, nên phải markForCheck để thực sự đo lại binding qua từng chu kỳ CD.
      for (let pass = 0; pass < 3; pass += 1) {
        fixture.changeDetectorRef.markForCheck();
        fixture.detectChanges();
      }

      expect(chip.allowedOperators()).toBe(first);
    });

    it('still returns the declared array / full type set without cloning them', () => {
      const declared: Operator[] = ['EQUAL', 'NOT_EQUAL'];
      const declaredField = { key: 'code', label: 'Code', type: 'string', operators: declared } as SdQueryField;
      const fullField = { key: 'note', label: 'Note', type: 'string', operators: true } as SdQueryField;

      expect(component.allowedOperatorsFor(declaredField)).toBe(declared);
      expect(component.allowedOperatorsFor(fullField)).toBe(SD_QUERY_OPERATORS_BY_TYPE['string']);
    });
  });

  describe('filter row identity (track key)', () => {
    const nameField = { key: 'name', label: 'Name', type: 'string' } as SdQueryField;
    const codeField = { key: 'code', label: 'Code', type: 'string' } as SdQueryField;
    const activeField = { key: 'active', label: 'Active', type: 'boolean' } as SdQueryField;
    const lockedField = { key: 'locked', label: 'Locked', type: 'boolean' } as SdQueryField;

    it('assigns a stable id per filter object and keeps it through updateFilter', () => {
      const first = { field: 'name', operator: 'CONTAIN', data: 'a' } as any;
      component.filters.set([first]);
      const id = component.rowId(first);

      expect(component.rowId(first)).toBe(id);

      component.updateFilterData(0, 'b');

      expect(component.filters()[0]).not.toBe(first);
      expect(component.rowId(component.filters()[0])).toBe(id);
    });

    it('gives different filters different ids', () => {
      const a = { field: 'name', operator: 'CONTAIN', data: 'a' } as any;
      const b = { field: 'code', operator: 'CONTAIN', data: 'b' } as any;

      expect(component.rowId(a)).not.toBe(component.rowId(b));
    });

    // why: đây là bug class chính — track $index gắn chip với VỊ TRÍ, nên xoá index 0 làm
    // instance chip cũ được bind lại sang filter kế tiếp, mang theo state nội bộ.
    it('destroys the removed seamless chip instead of migrating its state to the next filter', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [nameField, codeField]);
      component.filters.set([
        { field: 'name', operator: 'CONTAIN', data: 'a' } as any,
        { field: 'code', operator: 'CONTAIN', data: 'b' } as any,
      ]);
      fixture.detectChanges();

      const before = fixture.debugElement
        .queryAll(By.directive(SdQueryInlineValueChip))
        .map(de => de.componentInstance as SdQueryInlineValueChip);
      expect(before.length).toBe(2);

      // dirty, uncommitted state on the chip that is about to be removed
      before[0].draft.set('rác chưa commit');
      before[0].hasError.set(true);
      before[0].focused.set(true);

      component.removeFilter(0);
      fixture.detectChanges();

      const after = fixture.debugElement
        .queryAll(By.directive(SdQueryInlineValueChip))
        .map(de => de.componentInstance as SdQueryInlineValueChip);

      expect(after.length).toBe(1);
      expect(after[0]).toBe(before[1]);
      expect(after[0].hasError()).toBeFalse();
      expect(after[0].focused()).toBeFalse();
      expect(after[0].draft()).toBe('b');
    });

    it('does not migrate the inline chip edit toggle to the next filter after removing index 0', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [activeField, lockedField]);
      component.filters.set([
        { field: 'active', operator: 'EQUAL', data: true } as any,
        { field: 'locked', operator: 'EQUAL', data: false } as any,
      ]);
      fixture.detectChanges();

      const before = fixture.debugElement.queryAll(By.directive(SdQueryInlineChip)).map(de => de.componentInstance as SdQueryInlineChip);
      expect(before.length).toBe(2);

      before[0].enterEdit();
      fixture.detectChanges();

      component.removeFilter(0);
      fixture.detectChanges();

      const after = fixture.debugElement.queryAll(By.directive(SdQueryInlineChip)).map(de => de.componentInstance as SdQueryInlineChip);

      expect(after.length).toBe(1);
      expect(after[0]).toBe(before[1]);
      expect(after[0].editing()).toBeFalse();
    });

    it('keeps the same chip instance when only the value changes', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [nameField]);
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: 'a' } as any]);
      fixture.detectChanges();

      const before = fixture.debugElement.query(By.directive(SdQueryInlineValueChip)).componentInstance as SdQueryInlineValueChip;

      component.updateFilterData(0, 'z');
      fixture.detectChanges();

      const after = fixture.debugElement.query(By.directive(SdQueryInlineValueChip)).componentInstance as SdQueryInlineValueChip;
      expect(after).toBe(before);
    });
  });

  describe('removeFilter keeps editingIndex aligned', () => {
    const fields = [
      { key: 'name', label: 'Name', type: 'string' },
      { key: 'code', label: 'Code', type: 'string' },
      { key: 'note', label: 'Note', type: 'string' },
    ] as SdQueryField[];

    function seedThree(): void {
      fixture.componentRef.setInput('fields', fields);
      component.filters.set([
        { field: 'name', operator: 'CONTAIN', data: 'a' } as any,
        { field: 'code', operator: 'CONTAIN', data: 'b' } as any,
        { field: 'note', operator: 'CONTAIN', data: 'c' } as any,
      ]);
      fixture.detectChanges();
    }

    // why: editingIndex là chỉ số vào mảng filters; xoá một chip ĐỨNG TRƯỚC làm nó trỏ lố 1 ô
    // và commit sau đó ghi giá trị staged vào SAI filter.
    it('shifts editingIndex down when a lower-indexed chip is removed', () => {
      seedThree();
      component.openChipPopover(2);
      expect(component.editingIndex()).toBe(2);

      component.removeFilter(0);
      fixture.detectChanges();

      expect(component.editingIndex()).toBe(1);
    });

    it('commits the staged value into the edited filter, not its neighbour', () => {
      seedThree();
      component.openChipPopover(2);
      component.removeFilter(0);
      fixture.detectChanges();

      component.onChipPopoverCommit({ field: 'note', operator: 'CONTAIN', data: 'committed' } as any);

      expect(component.filters()).toEqual([
        jasmine.objectContaining({ field: 'code', data: 'b' }),
        jasmine.objectContaining({ field: 'note', data: 'committed' }),
      ]);
    });

    it('clears editingIndex when the edited chip itself is removed', () => {
      seedThree();
      component.openChipPopover(1);

      component.removeFilter(1);
      fixture.detectChanges();

      expect(component.editingIndex()).toBeNull();
    });

    it('leaves editingIndex untouched when a higher-indexed chip is removed', () => {
      seedThree();
      component.openChipPopover(0);

      component.removeFilter(2);
      fixture.detectChanges();

      expect(component.editingIndex()).toBe(0);
    });
  });

  // `#i18n` được inject từ lâu nhưng KHÔNG hề được gọi — mọi chuỗi vẫn hardcode tiếng Việt.
  // Nhóm spec này chốt rằng nó thực sự tham gia vào việc dựng chuỗi hiển thị.
  describe('i18n — the injected I18nService actually drives the labels', () => {
    let i18n: I18nService;

    beforeEach(() => {
      i18n = TestBed.inject(I18nService);
      i18n.setLanguage('vi', { reload: false });
    });

    afterEach(() => {
      i18n.setLanguage('vi', { reload: false });
    });

    it('resolves the search placeholder + add-filter tooltips from the catalogue', () => {
      expect(component.searchPlaceholder()).toBe(i18n.t('core.component.query-bar.search-placeholder'));
      expect(component.noFieldsLabel()).toBe(i18n.t('core.component.query-bar.no-fields'));
      expect(component.addFilterLabel()).toBe(i18n.t('core.component.query-bar.add-filter'));
    });

    it('re-renders the search placeholder into the DOM after a language switch', () => {
      fixture.componentRef.setInput('showSearch', true);
      fixture.detectChanges();

      const input = (): HTMLInputElement => fixture.nativeElement.querySelector('.c-search-input');
      expect(input().placeholder).toBe('Tìm kiếm...');

      i18n.setLanguage('en', { reload: false });
      fixture.detectChanges();
      expect(input().placeholder).toBe('Search...');
    });

    it('translates both branches of the add-filter tooltip', () => {
      expect(component.noFieldsLabel()).toBe('Chưa cấu hình fields');

      i18n.setLanguage('en', { reload: false });
      expect(component.noFieldsLabel()).toBe('No fields configured');
      expect(component.addFilterLabel()).toBe('Add filter');
    });

    it('renders a boolean chip value through the catalogue, and lets the field override it', () => {
      const field = { key: 'active', label: 'Active', type: 'boolean' } as SdQueryField;
      fixture.componentRef.setInput('fields', [field]);
      fixture.detectChanges();

      const filter = { field: 'active', operator: 'EQUAL', data: true } as any;
      expect(component.chipValueText(filter)).toBe('Có');

      i18n.setLanguage('en', { reload: false });
      expect(component.chipValueText(filter)).toBe('Yes');
      expect(component.chipValueText({ field: 'active', operator: 'EQUAL', data: false } as any)).toBe('No');

      // consumer override vẫn thắng nhãn i18n mặc định
      fixture.componentRef.setInput('fields', [{ ...field, trueLabel: 'ON', falseLabel: 'OFF' } as SdQueryField]);
      fixture.detectChanges();
      expect(component.chipValueText(filter)).toBe('ON');
    });
  });
});

// Q1–Q12 của handoff table-query-bar: option cộng thêm cho host như sd-table. Không đặt option thì
// hành vi giữ nguyên (các describe ở trên).
describe('SdQueryBar (host options)', () => {
  let fixture: ComponentFixture<SdQueryBar>;
  let component: SdQueryBar;
  let i18n: I18nService;

  const overlay = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
  const chips = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.c-chip'));
  const setOption = (option: Partial<SdQueryBarOption>): void => {
    fixture.componentRef.setInput('option', { fields: component.resolvedFields(), ...option });
    fixture.detectChanges();
  };

  const name = { key: 'name', label: 'Name', type: 'string' } as SdQueryField;
  const status = {
    key: 'status',
    label: 'Trạng thái',
    type: 'values',
    pinned: true,
    option: { items: [{ id: 'a', name: 'Alpha' }], valueField: 'id', displayField: 'name' },
  } as unknown as SdQueryField;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdQueryBar, NoopAnimationsModule],
    }).compileComponents();
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('vi', { reload: false });
    fixture = TestBed.createComponent(SdQueryBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => overlay().replaceChildren());

  describe('Q1 pinned fields', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('fields', [status, name]);
      component.filters.set([{ field: 'status', operator: 'IN', data: [] } as any]);
      fixture.detectChanges();
    });

    it('renders a pinned chip without the remove button, even with a value', () => {
      component.filters.set([{ field: 'status', operator: 'IN', data: ['a'] } as any]);
      fixture.detectChanges();
      expect(chips()[0].querySelector('.c-chip-remove')).toBeNull();
    });

    it('ignores removeFilter for a pinned chip', () => {
      component.removeFilter(0);
      expect(component.filters().length).toBe(1);
    });

    it('ignores Delete and Backspace on a pinned chip', () => {
      chips()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
      chips()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
      expect(component.filters().length).toBe(1);
    });

    it('shows the "all" label on an empty pinned chip', () => {
      expect(chips()[0].querySelector('.c-chip-value')?.textContent?.trim()).toBe(i18n.t('core.component.query-bar.all'));
    });

    it('leaves pinned fields out of the field picker', () => {
      (fixture.nativeElement.querySelector('.c-add-filter') as HTMLButtonElement).click();
      fixture.detectChanges();
      const labels = Array.from(overlay().querySelectorAll('button[mat-menu-item] .c-field-item-label')).map(el => el.textContent?.trim());
      expect(labels).toEqual(['Name']);
    });

    it('clearAll keeps pinned chips and empties their value', () => {
      component.filters.set([
        { field: 'status', operator: 'IN', data: ['a'] } as any,
        { field: 'name', operator: 'CONTAIN', data: 'x' } as any,
      ]);
      const pinnedRow = component.rowId(component.filters()[0]);
      component.clearAll();
      expect(component.filters()).toEqual([{ field: 'status', operator: 'IN', data: [] } as any]);
      expect(component.rowId(component.filters()[0])).toBe(pinnedRow);
    });

    it('renders inline pinned chips without a remove button', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [status, { ...name, pinned: true }]);
      component.filters.set([
        { field: 'status', operator: 'IN', data: ['a'] } as any,
        { field: 'name', operator: 'CONTAIN', data: 'x' } as any,
      ]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.c-token-remove')).toBeNull();
      expect(fixture.nativeElement.querySelector('.c-seamless__x')).toBeNull();
    });

    it('keeps a disabled field read-only in inline mode', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [
        { ...status, disabled: true },
        { ...name, disabled: true },
      ]);
      component.filters.set([
        { field: 'status', operator: 'IN', data: ['a'] } as any,
        { field: 'name', operator: 'CONTAIN', data: 'x' } as any,
      ]);
      fixture.detectChanges();
      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('sd-query-inline-chip')).withContext('values field').toBeNull();
      expect(host.querySelector('sd-query-inline-value-chip')).withContext('string field').toBeNull();
      expect(chips().map(chip => chip.getAttribute('aria-disabled'))).toEqual(['true', 'true']);
      chips()[1].click();
      fixture.detectChanges();
      expect(component.editingIndex()).toBeNull();
    });

    it('does not open the popover of a disabled field', () => {
      fixture.componentRef.setInput('fields', [{ ...status, disabled: true }, name]);
      fixture.detectChanges();
      expect(chips()[0].getAttribute('aria-disabled')).toBe('true');
      chips()[0].click();
      fixture.detectChanges();
      expect(component.editingIndex()).toBeNull();
      expect(overlay().querySelector('.c-pop-header')).toBeNull();
    });
  });

  describe('Q2 required fields', () => {
    const tenant = { ...status, key: 'tenant', label: 'Kho', required: true } as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('fields', [tenant, name]);
      component.filters.set([{ field: 'tenant', operator: 'IN', data: [] } as any]);
      fixture.detectChanges();
    });

    it('lists required fields without a value in invalidFields()', () => {
      expect(component.invalidFields().map(f => f.key)).toEqual(['tenant']);
      component.filters.set([{ field: 'tenant', operator: 'IN', data: ['a'] } as any]);
      expect(component.invalidFields()).toEqual([]);
    });

    it('marks the empty required chip invalid and points it at the host hint', () => {
      setOption({ invalidHintId: 'tenant-hint' });
      const chip = chips()[0];
      expect(chip.classList).toContain('c-chip-invalid');
      expect(chip.getAttribute('aria-invalid')).toBe('true');
      expect(chip.getAttribute('aria-describedby')).toBe('tenant-hint');
      expect(chip.querySelector('.c-chip-value')?.textContent?.trim()).toBe(i18n.t('core.component.query-bar.placeholder.select-value'));
    });

    it('does not apply on Enter while a required field is empty', () => {
      setOption({ showSearch: true });
      const apply = jasmine.createSpy('apply');
      component.apply.subscribe(apply);
      const enter = () =>
        (fixture.nativeElement.querySelector('.c-search-input') as HTMLInputElement).dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
        );
      component.setSearch('abc');
      enter();
      expect(apply).not.toHaveBeenCalled();
      component.filters.set([{ field: 'tenant', operator: 'IN', data: ['a'] } as any]);
      enter();
      expect(apply).toHaveBeenCalledTimes(1);
    });

    it('disables search while a required field is empty', () => {
      component.search.set('abc');
      expect(component.canSearch()).toBe(false);
      component.filters.set([{ field: 'tenant', operator: 'IN', data: ['a'] } as any]);
      expect(component.canSearch()).toBe(true);
    });
  });

  describe('Q3 applyOn', () => {
    let apply: jasmine.Spy;

    beforeEach(() => {
      fixture.componentRef.setInput('fields', [status, name]);
      component.filters.set([
        { field: 'status', operator: 'IN', data: [] } as any,
        { field: 'name', operator: 'CONTAIN', data: 'x' } as any,
      ]);
      apply = jasmine.createSpy('apply');
      component.apply.subscribe(apply);
    });

    it("keeps 'search' as the default: a popover commit does not apply", () => {
      fixture.detectChanges();
      component.openChipPopover(1);
      component.onChipPopoverCommit({ field: 'name', operator: 'CONTAIN', data: 'y' } as any);
      expect(apply).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.c-search-trigger')).not.toBeNull();
    });

    describe("with applyOn: 'commit'", () => {
      beforeEach(() => setOption({ applyOn: 'commit', showSearch: true }));

      it('hides the Search button', () => {
        expect(fixture.nativeElement.querySelector('.c-search-trigger')).toBeNull();
      });

      it('applies once when a popover commit changes the value', () => {
        component.openChipPopover(1);
        component.onChipPopoverCommit({ field: 'name', operator: 'CONTAIN', data: 'y' } as any);
        expect(apply).toHaveBeenCalledTimes(1);
        expect(apply.calls.mostRecent().args[0].filters[1].data).toBe('y');
      });

      it('applies once when a popover commit changes only the operator', () => {
        component.openChipPopover(1);
        component.onChipPopoverCommit({ field: 'name', operator: 'EQUAL', data: 'x' } as any);
        expect(apply).toHaveBeenCalledTimes(1);
      });

      it('does not apply when a popover closes unchanged', () => {
        component.openChipPopover(1);
        component.onChipPopoverCommit({ field: 'name', operator: 'CONTAIN', data: 'x' } as any);
        expect(apply).not.toHaveBeenCalled();
      });

      it('applies once when an active chip is removed, never for an empty one', () => {
        component.filters.set([...component.filters(), { field: 'other', operator: 'CONTAIN', data: null } as any]);
        component.removeFilter(2);
        expect(apply).not.toHaveBeenCalled();
        component.removeFilter(1);
        expect(apply).toHaveBeenCalledTimes(1);
      });

      it('drops an added chip that closes empty, without applying', () => {
        component.addFilter({ key: 'code', label: 'Code', type: 'string' } as SdQueryField);
        const index = component.filters().length - 1;
        component.openChipPopover(index);
        component.onChipPopoverCommit({ field: 'code', operator: 'CONTAIN', data: '' } as any);
        expect(component.filters().some(f => (f as any).field === 'code')).toBe(false);
        expect(apply).not.toHaveBeenCalled();
      });

      it('keeps a pinned chip that closes empty', () => {
        component.filters.set([{ field: 'status', operator: 'IN', data: ['a'] } as any]);
        component.openChipPopover(0);
        component.onChipPopoverCommit({ field: 'status', operator: 'IN', data: [] } as any);
        expect(component.filters().length).toBe(1);
        expect(apply).toHaveBeenCalledTimes(1);
      });

      it('keeps the applied search text when a chip change applies; Enter applies the typed text', () => {
        const enter = () =>
          (fixture.nativeElement.querySelector('.c-search-input') as HTMLInputElement).dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
          );
        component.setSearch('abc');
        component.openChipPopover(1);
        component.onChipPopoverCommit({ field: 'name', operator: 'CONTAIN', data: 'y' } as any);
        expect(apply.calls.mostRecent().args[0].search).toBe('');
        expect(component.search()).withContext('the typed text stays in the box').toBe('abc');

        enter();
        expect(apply.calls.mostRecent().args[0].search).toBe('abc');

        component.setSearch('abcd');
        component.onInlineCommit(1, 'z');
        expect(apply.calls.mostRecent().args[0].search).toBe('abc');
        component.removeFilter(1);
        expect(apply.calls.mostRecent().args[0].search).toBe('abc');
        expect(apply).toHaveBeenCalledTimes(4);
      });

      it('applies on Enter in the search box', () => {
        const input = fixture.nativeElement.querySelector('.c-search-input') as HTMLInputElement;
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(apply).toHaveBeenCalledTimes(1);
      });

      it('applies once when an inline chip commits a new value', () => {
        setOption({ applyOn: 'commit', mode: 'inline' });
        component.onInlineCommit(1, 'z');
        expect(apply).toHaveBeenCalledTimes(1);
        component.onInlineCommit(1, 'z');
        expect(apply).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Q4 field picker groups', () => {
    const openPicker = (): HTMLElement => {
      (fixture.nativeElement.querySelector('.c-add-filter') as HTMLButtonElement).click();
      fixture.detectChanges();
      return overlay();
    };

    it('shows group headings only when the fields span more than one group', () => {
      fixture.componentRef.setInput('fields', [
        { ...name, group: 'Bộ lọc' },
        { key: 'code', label: 'Code', type: 'string', group: 'Cột' },
      ]);
      fixture.detectChanges();
      const headings = Array.from(openPicker().querySelectorAll('.c-field-group')).map(el => el.textContent?.trim());
      expect(headings).toEqual(['Bộ lọc', 'Cột']);
    });

    it('omits the heading of a single group', () => {
      fixture.componentRef.setInput('fields', [{ ...name, group: 'Cột' }]);
      fixture.detectChanges();
      expect(openPicker().querySelector('.c-field-group')).toBeNull();
    });

    it('adds a find box above more than eight fields and filters labels ignoring accents', () => {
      const fields = ['Mã đơn', 'Khách hàng', 'Ngày tạo', 'Trạng thái', 'Thanh toán', 'Tổng tiền', 'Kênh bán', 'Nhân viên', 'Đơn vị'].map(
        (label, i) => ({ key: `f${i}`, label, type: 'string' }) as SdQueryField
      );
      fixture.componentRef.setInput('fields', fields);
      fixture.detectChanges();
      const panel = openPicker();
      const find = panel.querySelector('.c-field-find-input') as HTMLInputElement;
      expect(find).not.toBeNull();
      expect(find.placeholder).toBe(i18n.t('core.component.query-bar.find-field'));

      find.value = 'don';
      find.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      const labels = Array.from(panel.querySelectorAll('button[mat-menu-item] .c-field-item-label')).map(el => el.textContent?.trim());
      expect(labels).toEqual(['Mã đơn', 'Đơn vị']);
    });

    it('has no find box for eight fields or fewer', () => {
      fixture.componentRef.setInput('fields', [name]);
      fixture.detectChanges();
      expect(openPicker().querySelector('.c-field-find-input')).toBeNull();
    });
  });

  describe('Q5 openField', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('fields', [status, name]);
      component.filters.set([{ field: 'status', operator: 'IN', data: [] } as any]);
      fixture.detectChanges();
    });

    it('opens the popover of an existing chip', async () => {
      component.openField('status');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.editingIndex()).toBe(0);
      expect(overlay().querySelector('.c-pop-header')).not.toBeNull();
    });

    it('adds a chip and opens its popover for a field without one', async () => {
      component.openField('name');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.filters().map(f => (f as any).field)).toEqual(['status', 'name']);
      expect(component.editingIndex()).toBe(1);
    });

    it('returns focus to the given element when the popover closes', async () => {
      const origin = document.createElement('button');
      document.body.appendChild(origin);
      try {
        component.openField('status', origin);
        fixture.detectChanges();
        await fixture.whenStable();
        component.popoverChips()[0].closeMenu();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(document.activeElement).toBe(origin);
      } finally {
        origin.remove();
      }
    });

    it('starts building a chip in inline mode', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.detectChanges();
      component.openField('name');
      expect(component.building()?.field.key).toBe('name');
    });

    it('ignores an unknown key', () => {
      component.openField('missing');
      expect(component.filters().length).toBe(1);
    });
  });

  it('Q6 flush appearance drops the bar frame through a class', () => {
    fixture.componentRef.setInput('fields', [name]);
    setOption({ appearance: 'flush' });
    expect(fixture.nativeElement.querySelector('.c-query-bar').classList).toContain('c-appearance-flush');
  });

  describe('Q7 clear all', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('fields', [status, name]);
      component.filters.set([
        { field: 'status', operator: 'IN', data: [] } as any,
        { field: 'name', operator: 'CONTAIN', data: 'x' } as any,
      ]);
      fixture.detectChanges();
    });

    it('counts only chips with a value in the clear label', () => {
      const button = fixture.nativeElement.querySelector('.c-clear-all') as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBe(i18n.t('core.component.query-bar.clear-all', { count: 1 }));
    });

    it('calls onClearAll instead of clearing the chips', () => {
      const onClearAll = jasmine.createSpy('onClearAll');
      setOption({ onClearAll });
      (fixture.nativeElement.querySelector('.c-clear-all') as HTMLButtonElement).click();
      expect(onClearAll).toHaveBeenCalledTimes(1);
      expect(component.filters().length).toBe(2);
    });

    it('disables the button and drops the count with clearDisabled', () => {
      setOption({ clearDisabled: true });
      const button = fixture.nativeElement.querySelector('.c-clear-all') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-label')).toBe(i18n.t('core.component.query-bar.clear'));
    });
  });

  describe('Q8 search placeholder and end slot', () => {
    it('overrides the i18n placeholder', () => {
      setOption({ showSearch: true, searchPlaceholder: 'Mã đơn, khách hàng…' });
      expect((fixture.nativeElement.querySelector('.c-search-input') as HTMLInputElement).placeholder).toBe('Mã đơn, khách hàng…');
    });

    it('projects [sdQueryBarEnd] after the action toolbar', () => {
      const host = TestBed.createComponent(QueryBarEndHost);
      host.detectChanges();
      const bar = host.nativeElement.querySelector('.c-query-bar') as HTMLElement;
      const end = bar.querySelector('.qb-end') as HTMLElement;
      expect(end).not.toBeNull();
      expect(end.previousElementSibling?.tagName.toLowerCase()).toBe('sd-query-actions-bar');
    });
  });

  describe('Q9 operators outside the type defaults', () => {
    it('edits values with EQUAL through a single select', () => {
      fixture.componentRef.setInput('fields', [{ ...status, pinned: false, operators: ['EQUAL', 'NOT_EQUAL'] }]);
      component.filters.set([{ field: 'status', operator: 'EQUAL', data: 'a' } as any]);
      fixture.detectChanges();
      chips()[0].click();
      fixture.detectChanges();
      expect(component.chipPopover()!.multiple()).toBe(false);
      expect(overlay().querySelectorAll('.c-pop-body sd-select').length).toBe(1);
    });

    it('edits date with GREATER_OR_EQUAL through one date control', () => {
      fixture.componentRef.setInput('fields', [{ key: 'createdAt', label: 'Ngày tạo', type: 'date', operators: ['GREATER_OR_EQUAL'] }]);
      component.filters.set([{ field: 'createdAt', operator: 'GREATER_OR_EQUAL', data: '2026/10/01' } as any]);
      fixture.detectChanges();
      chips()[0].click();
      fixture.detectChanges();
      expect(overlay().querySelectorAll('.c-pop-body sd-date').length).toBe(1);
    });

    it('treats a BETWEEN with one end as active and one with none as empty', () => {
      expect(component.isFilterActive({ field: 'd', operator: 'BETWEEN', data: { from: null, to: '2026/10/31' } } as any)).toBe(true);
      expect(component.isFilterActive({ field: 'd', operator: 'BETWEEN', data: { from: 0, to: null } } as any)).toBe(true);
      expect(component.isFilterActive({ field: 'd', operator: 'BETWEEN', data: { from: null, to: null } } as any)).toBe(false);
      expect(component.isFilterActive({ field: 'd', operator: 'BETWEEN', data: { from: '', to: undefined } } as any)).toBe(false);
    });
  });

  describe("Q10 showOperatorOnChip: 'auto'", () => {
    const amount = { key: 'amount', label: 'Tổng tiền', type: 'number', operators: ['EQUAL', 'GREATER_OR_EQUAL'] } as SdQueryField;
    const code = { key: 'code', label: 'Code', type: 'string' } as SdQueryField;
    const created = { key: 'createdAt', label: 'Ngày tạo', type: 'date', defaultOperator: 'GREATER_OR_EQUAL' } as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('fields', [amount, code, created]);
      fixture.componentRef.setInput('showOperatorOnChip', 'auto');
      component.filters.set([
        { field: 'amount', operator: 'EQUAL', data: 5 } as any,
        { field: 'code', operator: 'CONTAIN', data: 'x' } as any,
        { field: 'createdAt', operator: 'GREATER_OR_EQUAL', data: '2026/10/01' } as any,
      ]);
      fixture.detectChanges();
    });

    it('shows the operator for a field with a choice or a non-default operator only', () => {
      const shown = chips().map(chip => !!chip.querySelector('.c-chip-operator'));
      expect(shown).toEqual([true, false, true]);
    });

    it('keeps boolean values working', () => {
      fixture.componentRef.setInput('showOperatorOnChip', true);
      fixture.detectChanges();
      expect(chips().every(chip => !!chip.querySelector('.c-chip-operator'))).toBe(true);
      fixture.componentRef.setInput('showOperatorOnChip', false);
      fixture.detectChanges();
      expect(chips().some(chip => !!chip.querySelector('.c-chip-operator'))).toBe(false);
    });
  });

  describe('Q11 chip text', () => {
    const date = { key: 'd', label: 'D', type: 'date' } as SdQueryField;
    const datetime = { key: 'dt', label: 'DT', type: 'datetime' } as SdQueryField;
    const amount = { key: 'n', label: 'N', type: 'number' } as SdQueryField;

    beforeEach(() => fixture.componentRef.setInput('fields', [date, datetime, amount]));

    it('formats a date with the app date format, not ISO', () => {
      expect(component.chipValueText({ field: 'd', operator: 'EQUAL', data: '2026/10/05' } as any)).toBe('05/10/2026');
      expect(component.chipValueText({ field: 'dt', operator: 'GREATER_OR_EQUAL', data: '2026/10/05 08:30:00' } as any)).toBe(
        '05/10/2026 08:30'
      );
    });

    it('shortens a range inside one year', () => {
      const text = component.chipValueText({ field: 'd', operator: 'BETWEEN', data: { from: '2026/10/01', to: '2026/10/31' } } as any);
      expect(text).toBe('01/10 – 31/10/2026');
      const across = component.chipValueText({ field: 'd', operator: 'BETWEEN', data: { from: '2025/12/20', to: '2026/01/05' } } as any);
      expect(across).toBe('20/12/2025 – 05/01/2026');
    });

    it('names the open end of a range', () => {
      expect(component.chipValueText({ field: 'd', operator: 'BETWEEN', data: { from: '2026/10/01', to: null } } as any)).toBe(
        i18n.t('core.component.query-bar.range.from', { value: '01/10/2026' })
      );
      expect(component.chipValueText({ field: 'n', operator: 'BETWEEN', data: { from: null, to: 9 } } as any)).toBe(
        i18n.t('core.component.query-bar.range.to', { value: '9' })
      );
    });
  });

  describe('Q12 labels of restored values', () => {
    const resolve = async (): Promise<void> => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };

    it('looks a lazy value up once with a VALUE search', async () => {
      const search = jasmine.createSpy('search').and.returnValue(Promise.resolve([{ id: 7, name: 'Kho Hà Nội' }]));
      fixture.componentRef.setInput('fields', [
        { key: 'warehouse', label: 'Kho', type: 'lazy-values', option: { search, valueField: 'id', displayField: 'name' } },
      ]);
      component.filters.set([{ field: 'warehouse', operator: 'EQUAL', data: 7 } as any]);
      expect(component.chipValueText(component.filters()[0])).toBe('7');
      await resolve();
      expect(component.chipValueText(component.filters()[0])).toBe('Kho Hà Nội');
      await resolve();
      expect(search).toHaveBeenCalledTimes(1);
      // why: cùng hình dạng sd-select gửi — giá trị của model, vô hướng hoặc mảng.
      expect(search.calls.mostRecent().args[0]).toEqual({ type: 'VALUE', value: 7 });
    });

    it('prefers option.views when the field has it', async () => {
      const search = jasmine.createSpy('search').and.returnValue(Promise.resolve([]));
      const views = jasmine.createSpy('views').and.returnValue(Promise.resolve([{ id: 'u1', name: 'Lan' }]));
      fixture.componentRef.setInput('fields', [
        { key: 'owner', label: 'Owner', type: 'lazy-values', option: { search, views, valueField: 'id', displayField: 'name' } },
      ]);
      component.filters.set([{ field: 'owner', operator: 'IN', data: ['u1'] } as any]);
      await resolve();
      expect(component.chipValueText(component.filters()[0])).toBe('Lan');
      expect(views).toHaveBeenCalledOnceWith(['u1']);
      expect(search).not.toHaveBeenCalled();
    });

    it('loads values from an items function once', async () => {
      const items = jasmine.createSpy('items').and.returnValue(Promise.resolve([{ id: 'a', name: 'Alpha' }]));
      fixture.componentRef.setInput('fields', [
        { key: 's', label: 'S', type: 'values', option: { items, valueField: 'id', displayField: 'name' } },
      ]);
      component.filters.set([{ field: 's', operator: 'IN', data: ['a'] } as any]);
      await resolve();
      expect(component.chipValueText(component.filters()[0])).toBe('Alpha');
      await resolve();
      expect(items).toHaveBeenCalledTimes(1);
    });

    it('keeps the raw value when the lookup fails', async () => {
      const search = jasmine.createSpy('search').and.returnValue(Promise.reject(new Error('offline')));
      fixture.componentRef.setInput('fields', [
        { key: 'warehouse', label: 'Kho', type: 'lazy-values', option: { search, valueField: 'id', displayField: 'name' } },
      ]);
      component.filters.set([{ field: 'warehouse', operator: 'EQUAL', data: 7 } as any]);
      await resolve();
      expect(component.chipValueText(component.filters()[0])).toBe('7');
    });
  });
});

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdQueryBar],
  template: `<sd-query-bar [fields]="fields"><span sdQueryBarEnd class="qb-end">end</span></sd-query-bar>`,
})
class QueryBarEndHost {
  readonly fields = [{ key: 'name', label: 'Name', type: 'string' } as SdQueryField];
}
