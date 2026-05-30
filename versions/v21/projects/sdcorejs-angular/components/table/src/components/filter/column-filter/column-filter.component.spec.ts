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
      component.filterChange.subscribe(spy);

      component.onFilterChange();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does NOT emit filterCommit', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: '' });
      const spy = jasmine.createSpy('filterCommit');
      component.filterCommit.subscribe(spy);

      component.onFilterChange();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onFilterCommit', () => {
    it('emits filterCommit', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: '' });
      const spy = jasmine.createSpy('filterCommit');
      component.filterCommit.subscribe(spy);

      component.onFilterCommit();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does NOT emit filterChange (blur khÃ´ng trigger reload)', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: '' });
      const spy = jasmine.createSpy('filterChange');
      component.filterChange.subscribe(spy);

      component.onFilterCommit();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('template binding', () => {
    it('binds (keyupEnter) sd-input â†’ onFilterChange', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: '' });
      const filterChangeSpy = jasmine.createSpy('filterChange');
      const filterCommitSpy = jasmine.createSpy('filterCommit');
      component.filterChange.subscribe(filterChangeSpy);
      component.filterCommit.subscribe(filterCommitSpy);

      const debugInput = fixture.debugElement.query(By.css('sd-input'));
      expect(debugInput).withContext('sd-input rendered for type=string').toBeTruthy();

      debugInput.triggerEventHandler('keyupEnter', null);

      expect(filterChangeSpy).toHaveBeenCalledTimes(1);
      expect(filterCommitSpy).not.toHaveBeenCalled();
    });

    it('binds (sdBlur) sd-input â†’ onFilterCommit (khÃ´ng trigger filterChange)', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn, { name: '' });
      const filterChangeSpy = jasmine.createSpy('filterChange');
      const filterCommitSpy = jasmine.createSpy('filterCommit');
      component.filterChange.subscribe(filterChangeSpy);
      component.filterCommit.subscribe(filterCommitSpy);

      const debugInput = fixture.debugElement.query(By.css('sd-input'));
      debugInput.triggerEventHandler('sdBlur', null);

      expect(filterCommitSpy).toHaveBeenCalledTimes(1);
      expect(filterChangeSpy).not.toHaveBeenCalled();
    });

    it('binds (keyupEnter) sd-input-number â†’ onFilterChange, (sdBlur) â†’ onFilterCommit', () => {
      bootstrap({ field: 'age', type: 'number' } as SdTableColumn, { age: null });
      const filterChangeSpy = jasmine.createSpy('filterChange');
      const filterCommitSpy = jasmine.createSpy('filterCommit');
      component.filterChange.subscribe(filterChangeSpy);
      component.filterCommit.subscribe(filterCommitSpy);

      const debugInputNumber = fixture.debugElement.query(By.css('sd-input-number'));
      expect(debugInputNumber).withContext('sd-input-number rendered for type=number').toBeTruthy();

      debugInputNumber.triggerEventHandler('keyupEnter', null);
      expect(filterChangeSpy).toHaveBeenCalledTimes(1);
      expect(filterCommitSpy).not.toHaveBeenCalled();

      debugInputNumber.triggerEventHandler('sdBlur', null);
      expect(filterCommitSpy).toHaveBeenCalledTimes(1);
      expect(filterChangeSpy).toHaveBeenCalledTimes(1);
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

    it('autoId rá»—ng khi base autoId khÃ´ng truyá»n', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn);
      expect(component.autoId()).toBe('');
    });
  });

  describe('computed templateRef', () => {
    it('undefined khi column khÃ´ng cÃ³ filter.filterDef', () => {
      bootstrap({ field: 'name', type: 'string' } as SdTableColumn);
      expect(component.templateRef()).toBeUndefined();
    });

    it('tráº£ filterDef khi column khai bÃ¡o (khÃ´ng render template Ä‘á»ƒ trÃ¡nh outlet crash)', () => {
      // Táº¡o fixture khÃ´ng detectChanges Ä‘á»ƒ computed Ä‘á»c input khÃ´ng kÃ©o theo ngTemplateOutlet
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
    it('rá»—ng khi filter.operator.enable = false', () => {
      bootstrap({ field: 'name', type: 'string', filter: { operator: { enable: false } } } as SdTableColumn);
      expect(component.operators().length).toBe(0);
    });

    it('lá»c theo column.filter.operator.list', () => {
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

  describe('effect khá»Ÿi táº¡o default cho split filter', () => {
    it('date + daterange (default) â†’ khá»Ÿi táº¡o { from: null, to: null }', () => {
      const filter: Record<string, any> = {};
      bootstrap({ field: 'createdAt', type: 'date' } as SdTableColumn, filter);
      expect(filter['createdAt']).toEqual({ from: null, to: null });
    });

    it('date + filter.type = "date" â†’ KHÃ”NG khá»Ÿi táº¡o { from, to }', () => {
      const filter: Record<string, any> = {};
      bootstrap({ field: 'createdAt', type: 'date', filter: { type: 'date' } } as SdTableColumn, filter);
      expect(filter['createdAt']).toBeUndefined();
    });

    it('number + split-number â†’ khá»Ÿi táº¡o { from: null, to: null }', () => {
      const filter: Record<string, any> = {};
      bootstrap({ field: 'price', type: 'number', filter: { type: 'split-number' } } as SdTableColumn, filter);
      expect(filter['price']).toEqual({ from: null, to: null });
    });

    it('number plain â†’ KHÃ”NG khá»Ÿi táº¡o { from, to }', () => {
      const filter: Record<string, any> = {};
      bootstrap({ field: 'price', type: 'number' } as SdTableColumn, filter);
      expect(filter['price']).toBeUndefined();
    });
  });
});

