import { OverlayContainer } from '@angular/cdk/overlay';
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
import { SD_QUERY_OPERATORS_BY_TYPE, SdQueryField, sdQueryAllowedOperators } from './query-bar.model';

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
