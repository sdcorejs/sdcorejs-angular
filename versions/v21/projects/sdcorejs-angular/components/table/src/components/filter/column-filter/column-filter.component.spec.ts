import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import { ColumnFilterComponent } from './column-filter.component';
import { SdTableColumn } from '../../../models/table-column.model';

describe('ColumnFilterComponent', () => {
  let fixture: ComponentFixture<ColumnFilterComponent>;
  let component: ColumnFilterComponent;

  function bootstrap(column: SdTableColumn, columnFilter: Record<string, any> = {}) {
    fixture = TestBed.createComponent(ColumnFilterComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('column', column);
    fixture.componentRef.setInput('columnFilter', columnFilter);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ColumnFilterComponent] });
  });

  describe('onFilterChange', () => {
    it('emits filterChange', () => {
      bootstrap({ field: 'name', type: 'string', title: 'Name' } as SdTableColumn, { name: '' });
      const spy = jasmine.createSpy('filterChange');
      component.sdFilterChange.subscribe(spy);

      component.onFilterChange();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does NOT emit filterCommit', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: '' });
      const spy = jasmine.createSpy('filterCommit');
      component.sdFilterCommit.subscribe(spy);

      component.onFilterChange();

      expect(spy).not.toHaveBeenCalled();
    });

    it('calls column filter onChange once when committed value changed', () => {
      const onChange = jasmine.createSpy('onChange');
      const columnFilter = { name: '' };
      const column = { field: 'name', type: 'string', title: 'Name', filter: { onChange } } as SdTableColumn;
      bootstrap(column, columnFilter);

      columnFilter.name = 'abc';
      component.onFilterChange();

      expect(onChange).toHaveBeenCalledOnceWith('abc', column, columnFilter);
    });

    it('does not call column filter onChange when value did not change', () => {
      const onChange = jasmine.createSpy('onChange');
      bootstrap({ field: 'name', type: 'string', title: 'Name', filter: { onChange } } as SdTableColumn, { name: '' });

      component.onFilterChange();

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('onFilterCommit', () => {
    it('emits filterCommit', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: '' });
      const spy = jasmine.createSpy('filterCommit');
      component.sdFilterCommit.subscribe(spy);

      component.onFilterCommit();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does NOT emit filterChange (blur không trigger reload)', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: '' });
      const spy = jasmine.createSpy('filterChange');
      component.sdFilterChange.subscribe(spy);

      component.onFilterCommit();

      expect(spy).not.toHaveBeenCalled();
    });

    it('calls column filter onChange on blur commit when input value changed', () => {
      const onChange = jasmine.createSpy('onChange');
      const columnFilter = { name: '' };
      const column = { field: 'name', type: 'string', title: 'Name', filter: { onChange } } as SdTableColumn;
      bootstrap(column, columnFilter);

      columnFilter.name = 'blurred';
      component.onFilterCommit();
      component.onFilterCommit();

      expect(onChange).toHaveBeenCalledOnceWith('blurred', column, columnFilter);
    });
  });

  describe('template binding', () => {
    const expectClearable = (selector: string) => {
      const controls = fixture.debugElement.queryAll(By.css(selector));
      expect(controls.length).withContext(`${selector} rendered`).toBeGreaterThan(0);
      for (const control of controls) {
        expect(control.componentInstance.clearable()).withContext(`${selector} opts into clear`).toBeTrue();
      }
    };

    it('opts string, number and date controls into clearable behavior', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: 'A' });
      expectClearable('sd-input');

      bootstrap({ field: 'age', type: 'number' } as SdTableColumn, { age: 18 });
      expectClearable('sd-input-number');

      bootstrap({ field: 'createdAt', type: 'date', filter: { type: 'date' } } as SdTableColumn, {
        createdAt: new Date(2026, 0, 1),
      });
      expectClearable('sd-date');
    });

    it('opts every split number and split date control into clearable behavior', () => {
      bootstrap({ field: 'price', type: 'number', filter: { type: 'split-number' } } as SdTableColumn, {
        price: { from: 1, to: 2 },
      });
      expectClearable('sd-input-number');

      bootstrap({ field: 'createdAt', type: 'date', filter: { type: 'split-date' } } as SdTableColumn, {
        createdAt: { from: new Date(2026, 0, 1), to: new Date(2026, 0, 2) },
      });
      expectClearable('sd-date');
    });

    it('binds (keyupEnter) sd-input → onFilterChange', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: '' });
      const filterChangeSpy = jasmine.createSpy('filterChange');
      const filterCommitSpy = jasmine.createSpy('filterCommit');
      component.sdFilterChange.subscribe(filterChangeSpy);
      component.sdFilterCommit.subscribe(filterCommitSpy);

      const debugInput = fixture.debugElement.query(By.css('sd-input'));
      expect(debugInput).withContext('sd-input rendered for type=string').toBeTruthy();

      debugInput.triggerEventHandler('sdKeyupEnter', null);

      expect(filterChangeSpy).toHaveBeenCalledTimes(1);
      expect(filterCommitSpy).not.toHaveBeenCalled();
    });

    it('binds (sdBlur) sd-input → onFilterCommit (không trigger filterChange)', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: '' });
      const filterChangeSpy = jasmine.createSpy('filterChange');
      const filterCommitSpy = jasmine.createSpy('filterCommit');
      component.sdFilterChange.subscribe(filterChangeSpy);
      component.sdFilterCommit.subscribe(filterCommitSpy);

      const debugInput = fixture.debugElement.query(By.css('sd-input'));
      debugInput.triggerEventHandler('sdBlur', null);

      expect(filterCommitSpy).toHaveBeenCalledTimes(1);
      expect(filterChangeSpy).not.toHaveBeenCalled();
    });

    it('binds (keyupEnter) sd-input-number → onFilterChange, (sdBlur) → onFilterCommit', () => {
      bootstrap({ field: 'age', type: 'number' } as SdTableColumn, { age: null });
      const filterChangeSpy = jasmine.createSpy('filterChange');
      const filterCommitSpy = jasmine.createSpy('filterCommit');
      component.sdFilterChange.subscribe(filterChangeSpy);
      component.sdFilterCommit.subscribe(filterCommitSpy);

      const debugInputNumber = fixture.debugElement.query(By.css('sd-input-number'));
      expect(debugInputNumber).withContext('sd-input-number rendered for type=number').toBeTruthy();

      debugInputNumber.triggerEventHandler('sdKeyupEnter', null);
      expect(filterChangeSpy).toHaveBeenCalledTimes(1);
      expect(filterCommitSpy).not.toHaveBeenCalled();

      debugInputNumber.triggerEventHandler('sdBlur', null);
      expect(filterCommitSpy).toHaveBeenCalledTimes(1);
      expect(filterChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('calls column filter onChange for sd-input-number only on Enter or blur commit', () => {
      const onChange = jasmine.createSpy('onChange');
      const columnFilter: Record<string, any> = { age: null };
      const column = { field: 'age', type: 'number', title: 'Age', filter: { onChange } } as SdTableColumn;
      bootstrap(column, columnFilter);

      const debugInputNumber = fixture.debugElement.query(By.css('sd-input-number'));
      columnFilter['age'] = 18;
      debugInputNumber.triggerEventHandler('sdKeyupEnter', null);
      debugInputNumber.triggerEventHandler('sdBlur', null);

      expect(onChange).toHaveBeenCalledOnceWith(18, column, columnFilter);

      columnFilter['age'] = 19;
      debugInputNumber.triggerEventHandler('sdBlur', null);

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenCalledWith(19, column, columnFilter);
    });
  });

  describe('computed autoId', () => {
    it('autoId = `${base}-inline-${column.field}`', () => {
      fixture = TestBed.createComponent(ColumnFilterComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('column', { field: 'price', type: 'number' } as SdTableColumn);
      fixture.componentRef.setInput('columnFilter', { price: null });
      fixture.componentRef.setInput('autoId', 'tbl');
      fixture.detectChanges();

      expect(component.autoId()).toBe('tbl-inline-price');
    });

    it('autoId rỗng khi base autoId không truyền', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn);
      expect(component.autoId()).toBe('');
    });
  });

  describe('computed templateRef', () => {
    it('undefined khi column không có filter.filterDef', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn);
      expect(component.templateRef()).toBeUndefined();
    });

    it('trả filterDef khi column khai báo (không render template để tránh outlet crash)', () => {
      // Tạo fixture không detectChanges để computed đọc input không kéo theo ngTemplateOutlet
      fixture = TestBed.createComponent(ColumnFilterComponent);
      component = fixture.componentInstance;
      const fakeTpl = {} as any;
      fixture.componentRef.setInput('column', {
        field: 'name',
        type: 'string',
        filter: { filterDef: fakeTpl },
      } as SdTableColumn);
      expect(component.templateRef()).toBe(fakeTpl);
    });
  });

  describe('computed operators', () => {
    it('rỗng khi filter.operator.enable = false', () => {
      bootstrap({ field: 'name', type: 'string', filter: { operator: { enable: false } } } as SdTableColumn);
      expect(component.operators().length).toBe(0);
    });

    it('lọc theo column.filter.operator.list', () => {
      bootstrap({
        field: 'price',
        type: 'number',
        filter: { operator: { enable: true, list: ['EQUAL', 'GREATER_THAN'] } },
      } as SdTableColumn);

      const values = component.operators().map(e => e.value);
      expect(values).toContain('EQUAL');
      expect(values).toContain('GREATER_THAN');
      expect(values).not.toContain('LESS_THAN');
    });
  });

  describe('sd-operator integration', () => {
    it('renders <sd-operator> with the allowed operator values when operators exist', () => {
      bootstrap({
        field: 'name',
        type: 'string',
        filter: { operator: { enable: true, list: ['EQUAL', 'CONTAIN'] } },
      } as unknown as SdTableColumn);

      const opEl = fixture.nativeElement.querySelector('sd-operator');
      expect(opEl).not.toBeNull();
      expect(component.operatorValues()).toEqual(['EQUAL', 'CONTAIN']);
    });

    it('does NOT render <sd-operator> when no operators configured', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn);
      expect(fixture.nativeElement.querySelector('sd-operator')).toBeNull();
    });

    it('binds [operators] = operatorValues() to the rendered sd-operator', () => {
      bootstrap({
        field: 'name',
        type: 'string',
        filter: { operator: { enable: true, list: ['EQUAL', 'CONTAIN'] } },
      } as unknown as SdTableColumn);

      const op = fixture.debugElement.query(By.directive(SdOperator)).componentInstance as SdOperator;
      expect(op.operators()).toEqual(['EQUAL', 'CONTAIN']);
    });

    it('two-way model round-trip: sd-operator modelChange updates operator', () => {
      bootstrap({
        field: 'name',
        type: 'string',
        filter: { operator: { enable: true, list: ['EQUAL', 'CONTAIN'] } },
      } as unknown as SdTableColumn);

      const opDe = fixture.debugElement.query(By.directive(SdOperator));
      opDe.triggerEventHandler('modelChange', 'CONTAIN');
      fixture.detectChanges();

      expect(component.operator()).toBe('CONTAIN');
    });
  });

  describe('effect khởi tạo default cho split filter', () => {
    it('date + daterange (default) → khởi tạo { from: null, to: null }', () => {
      const filter: Record<string, any> = {};
      bootstrap({ field: 'createdAt', type: 'date' } as SdTableColumn, filter);
      expect(filter['createdAt']).toEqual({ from: null, to: null });
    });

    it('date + filter.type = "date" → KHÔNG khởi tạo { from, to }', () => {
      const filter: Record<string, any> = {};
      bootstrap({ field: 'createdAt', type: 'date', filter: { type: 'date' } } as SdTableColumn, filter);
      expect(filter['createdAt']).toBeUndefined();
    });

    it('number + split-number → khởi tạo { from: null, to: null }', () => {
      const filter: Record<string, any> = {};
      bootstrap({ field: 'price', type: 'number', filter: { type: 'split-number' } } as SdTableColumn, filter);
      expect(filter['price']).toEqual({ from: null, to: null });
    });

    it('number plain → KHÔNG khởi tạo { from, to }', () => {
      const filter: Record<string, any> = {};
      bootstrap({ field: 'price', type: 'number' } as SdTableColumn, filter);
      expect(filter['price']).toBeUndefined();
    });
  });
});
