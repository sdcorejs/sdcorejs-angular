import { Component, TemplateRef, ViewChild, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableAggregateTemplateContext } from './models/table-aggregate.model';
import { SdMaterialFooterDefDirective } from './directives/sd-table-footer-def.directive';
import { SdTableRowMobileDefDirective } from './directives/sd-table-row-mobile-def.directive';

interface Row {
  value?: number;
  name?: string;
  group?: string;
  hidden?: number;
  children?: Row[];
}

@Component({
  imports: [SdTable, SdMaterialFooterDefDirective, SdTableRowMobileDefDirective],
  template: `
    <ng-template #summary let-items let-value="value" let-kind="kind" let-isComplete="isComplete">
      <strong class="custom-summary">{{ kind }}:{{ value }}:{{ items.length }}:{{ isComplete }}</strong>
    </ng-template>
    <sd-table [option]="option()">
      @if (footer) {
        <ng-template sdTableFooterDef="value" let-items="items" let-column="column">
          <div class="original-footer" [style.height.px]="footerHeight">{{ column.field }}:{{ items[0]?.data?.value }}</div>
        </ng-template>
      }
      <ng-template [sdTableRowMobileDef]="option()" let-item="item"
        ><span>{{ item.value }}</span></ng-template
      >
    </sd-table>
  `,
})
class Host {
  @ViewChild('summary', { static: true }) summary!: TemplateRef<SdTableAggregateTemplateContext<Row>>;
  @ViewChild(SdTable) table!: SdTable<Row>;
  footer = false;
  footerHeight = 56;
  option = signal<SdTableOption<Row>>({ type: 'local', items: () => [], columns: [] });
}

describe('sd-table column aggregate integration', () => {
  let fixture: ComponentFixture<Host>;
  const mobile = signal(false);
  const rows: Row[] = [
    { value: 10, name: 'Alpha', group: 'A' },
    { value: 30, name: 'Beta', group: 'A' },
    { value: 80, name: 'Gamma', group: 'B' },
  ];
  const defaults = (): Extract<SdTableOption<Row>, { type: 'local' }> => ({
    type: 'local',
    items: () => rows.map(row => ({ ...row })),
    columns: [
      { field: 'name', title: 'Name', type: 'string', aggregate: 'COUNT' },
      { field: 'value', title: 'Value', type: 'number', aggregate: 'SUM' },
    ],
    filter: { hideInlineFilter: true },
  });
  function settle(option?: SdTableOption<Row>): void {
    if (option) fixture.componentInstance.option.set(option);
    fixture.detectChanges();
    tick(1000);
    flush();
    fixture.detectChanges();
    flush();
    fixture.detectChanges();
  }
  const value = (field = 'value') => fixture.componentInstance.table.aggregateSnapshot().total?.cells.get(field)?.context.value;

  beforeEach(() => {
    mobile.set(false);
    TestBed.configureTestingModule({ imports: [Host], providers: [{ provide: SdViewportService, useValue: { isMobile: mobile } }] });
    fixture = TestBed.createComponent(Host);
  });

  it('places the total above the unchanged wrapper-based footer and offsets sticky rows by actual height', fakeAsync(() => {
    fixture.componentInstance.footer = true;
    settle(defaults());
    const footers = fixture.nativeElement.querySelectorAll('tfoot tr');
    expect(footers.length).toBe(2);
    expect(footers[0].classList.contains('sd-aggregate-total')).toBeTrue();
    expect(footers[1].querySelector('.original-footer').textContent.trim()).toBe('value:10');
    expect(value()).toBe(120);
    fixture.componentInstance.table.table()!.updateStickyFooterRowStyles();
    tick(20);
    fixture.detectChanges();
    expect(parseFloat(footers[0].cells[0].style.bottom)).toBeCloseTo(footers[1].getBoundingClientRect().height, 0);
    expect(footers[1].cells[0].style.bottom).toBe('0px');
  }));

  it('passes raw items and renders calculate+template and template-only contexts', fakeAsync(() => {
    settle();
    const option = defaults();
    option.columns = [
      { field: 'value', title: '', type: 'number', aggregate: { calculate: 'SUM', templateRef: fixture.componentInstance.summary } },
      { field: 'name', title: '', type: 'string', aggregate: { templateRef: fixture.componentInstance.summary } },
    ];
    settle(option);
    const contexts = fixture.componentInstance.table.aggregateSnapshot().total!.cells;
    expect(contexts.get('value')!.context.items[0]).toBe(fixture.componentInstance.table.items()[0].data);
    expect(contexts.get('name')!.context.value).toBeUndefined();
    const rendered = fixture.nativeElement.querySelectorAll('.custom-summary');
    expect(rendered[0].textContent).toContain('total:120:3:true');
    expect(rendered[1].textContent).toContain('total::3:true');
  }));

  it('uses page/filtered scope and applies the same quick-search pipeline before pagination', fakeAsync(() => {
    const option = defaults();
    option.paginate = { pageSize: 2 };
    option.filter = { quickSearch: { containFields: ['name'] } };
    settle(option);
    expect(value()).toBe(40);
    const table = fixture.componentInstance.table;
    table.paginator()!.pageIndex = 1;
    table.reload(false);
    settle();
    expect(value()).toBe(80);
    option.aggregate = { scope: 'filtered' };
    settle({ ...option });
    expect(value()).toBe(120);
    table.setFilter({ quickSearch: { term: 'Alpha', filters: {} } });
    settle();
    expect(value()).toBe(10);
  }));

  it('never uses server total for COUNT or falls back from filtered to page', fakeAsync(() => {
    const diagnose = spyOn(console, 'error');
    const loader = jasmine.createSpy().and.resolveTo({ items: rows, total: 900 });
    const option: SdTableOption<Row> = { ...defaults(), type: 'server', items: loader };
    settle(option);
    expect(value('name')).toBe(3);
    expect(fixture.componentInstance.table.total()).toBe(900);
    settle({ ...option, aggregate: { scope: 'filtered' } });
    expect(value()).toBeUndefined();
    expect(fixture.componentInstance.table.aggregateSnapshot().total!.cells.get('value')!.context.isComplete).toBeFalse();
    expect(diagnose).toHaveBeenCalled();
    expect(loader).toHaveBeenCalledTimes(2);
  }));

  it('computes group averages from raw rows, keeps totals stable on collapse, and excludes subtotals from selection', fakeAsync(() => {
    const callback = jasmine
      .createSpy()
      .and.callFake((items: readonly Row[]) => items.reduce((sum, row) => sum + row.value!, 0) / items.length);
    const option = defaults();
    option.columns[1].aggregate = callback;
    option.group = { fields: ['group'], collapsible: true };
    option.aggregate = { group: true };
    option.selector = { visible: true };
    settle(option);
    const table = fixture.componentInstance.table;
    expect(value()).toBe(40);
    expect([...table.aggregateSnapshot().groups.values()].map(group => group.cells.get('value')!.context.value)).toEqual([20, 80]);
    expect(fixture.nativeElement.querySelectorAll('.sd-aggregate-row').length).toBe(2);
    expect(table.items().length).toBe(3);
    expect(table.total()).toBe(3);
    const calls = callback.calls.count();
    table.toggleGroupExpand(table.groupHost.headers[0]);
    settle();
    expect(fixture.nativeElement.querySelectorAll('.sd-aggregate-row').length).toBe(1);
    expect(callback.calls.count()).toBe(calls);
    table.isSelectAll.set(true);
    table.onSelectAll();
    settle();
    expect(table.selectedItems.length).toBe(3);
    expect(table.selectedItems.every(row => row.value !== undefined)).toBeTrue();
  }));

  it('honors grouped header leaves, hidden columns and visible order', fakeAsync(() => {
    const option = defaults();
    option.columns = [
      {
        field: 'metrics',
        title: 'Metrics',
        type: 'children',
        fixed: true,
        children: [
          { field: 'value', type: 'number', title: 'Value', aggregate: 'SUM' },
          { field: 'hidden', type: 'number', title: '', hidden: true, aggregate: 'SUM' },
        ],
      },
      { field: 'name', title: 'Name', type: 'string', aggregate: 'COUNT' },
    ];
    settle(option);
    expect([...fixture.componentInstance.table.aggregateSnapshot().total!.cells.keys()]).toEqual(['name', 'value']);
    const cells = fixture.nativeElement.querySelectorAll('.sd-aggregate-total td');
    expect(
      [...cells]
        .filter((cell: unknown) => !(cell as HTMLElement).classList.contains('d-none'))
        .map((cell: unknown) => (cell as HTMLElement).textContent?.trim())
    ).toEqual(['120', '3']);
    expect(fixture.componentInstance.table.configuration()!.fixedColumn['value']).toBeDefined();
    settle({ ...option, columns: [{ ...option.columns[1], hidden: true }] });
    expect(fixture.nativeElement.querySelector('.sd-aggregate-total')).toBeNull();
  }));

  it('uses raw static tree nodes regardless of collapse and excludes parents from branch subtotals', fakeAsync(() => {
    const root: Row = { value: 100, children: [{ value: 40 }, { value: 60 }] };
    const option = { ...defaults(), items: () => [root], tree: { loadType: 'static' as const }, aggregate: { tree: { subtotal: true } } };
    settle(option);
    const table = fixture.componentInstance.table;
    expect(value()).toBe(100);
    expect(table.aggregateSnapshot().branches.get(root)!.cells.get('value')!.context.value).toBe(100);
    table.onTreeToggle(table.items()[0]);
    settle();
    expect(value()).toBe(100);
    expect(fixture.nativeElement.querySelectorAll('.sd-aggregate-row').length).toBe(1);
    for (const [mode, expected] of [
      ['roots', 100],
      ['all', 200],
    ] as const) {
      settle({ ...option, aggregate: { tree: { items: mode, subtotal: true } } });
      expect(value()).toBe(expected);
    }
  }));

  it('marks lazy leaves incomplete without fetching, then updates after children load', fakeAsync(() => {
    const root: Row = { value: 100 };
    const children = jasmine.createSpy().and.resolveTo([{ value: 40 }, { value: 60 }]);
    const option = {
      ...defaults(),
      items: () => [root],
      tree: { loadType: 'lazy' as const, hasChildren: (row: Row) => row === root, onExpandChildren: children },
    };
    settle(option);
    expect(value()).toBeUndefined();
    expect(children).not.toHaveBeenCalled();
    const table = fixture.componentInstance.table;
    table.onTreeToggle(table.items()[0]);
    settle();
    expect(value()).toBe(100);
    expect(children).toHaveBeenCalledTimes(1);
    table.onTreeToggle(table.items()[0]);
    settle();
    expect(value()).toBe(100);
  }));

  it('invalidates in-place updates but not change detection, column resizing or selection', fakeAsync(() => {
    const callback = jasmine.createSpy().and.callFake((items: readonly Row[]) => items.reduce((sum, row) => sum + row.value!, 0));
    const option = defaults();
    option.columns[1].aggregate = callback;
    settle(option);
    const table = fixture.componentInstance.table;
    const calls = callback.calls.count();
    settle();
    settle();
    table.onColumnResize('value', '200px');
    settle();
    expect(callback.calls.count()).toBe(calls);
    table.items()[0].data.value = 100;
    table.detectChanges();
    settle();
    expect(value()).toBe(210);
    table.reload(false);
    settle();
    expect(value()).toBe(210);
  }));

  it('renders callback strings as text and diagnoses errors without returning zero', fakeAsync(() => {
    const diagnose = spyOn(console, 'error');
    const option = defaults();
    option.columns[0].aggregate = () => '<img src=x onerror=alert(1)>';
    option.columns[1].aggregate = () => {
      throw new Error('aggregate failed');
    };
    settle(option);
    const total: HTMLElement = fixture.nativeElement.querySelector('.sd-aggregate-total');
    expect(total.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(total.querySelector('img')).toBeNull();
    expect(total.textContent).toContain('--');
    expect(value()).toBeUndefined();
    expect(diagnose).toHaveBeenCalled();
  }));

  it('distinguishes successful empty data from loader failure', fakeAsync(() => {
    const option = defaults();
    settle({ ...option, items: () => [] });
    expect(value()).toBe(0);
    spyOn(console, 'error');
    settle({ ...option, items: () => Promise.reject(new Error('read failed')) });
    expect(value()).toBeUndefined();
  }));

  it('shares the same cached summary with mobile cards and keeps subtotal rows inert', fakeAsync(() => {
    mobile.set(true);
    const callback = jasmine.createSpy().and.returnValue(120);
    const option = defaults();
    option.columns[1].aggregate = callback;
    option.group = { fields: ['group'] };
    option.aggregate = { group: true };
    option.mobile = { rowLabel: row => `Row ${row.value}` };
    settle(option);
    expect(fixture.nativeElement.querySelectorAll('.sd-mobile-card').length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('.sd-mobile-aggregate').length).toBe(3);
    const calls = callback.calls.count();
    mobile.set(false);
    settle();
    expect(callback.calls.count()).toBe(calls);
    expect(value()).toBe(120);
  }));

  it('updates aggregate configuration through the existing explicit invalidation method', fakeAsync(() => {
    const option = defaults();
    settle(option);
    option.columns[1] = { field: 'value', type: 'number', title: 'Value', aggregate: 'AVERAGE' };
    fixture.componentInstance.table.detectChanges();
    settle();
    expect(value()).toBe(40);
    option.columns[1].aggregate = undefined;
    option.columns[0].aggregate = undefined;
    fixture.componentInstance.table.detectChanges();
    settle();
    expect(fixture.nativeElement.querySelector('.sd-aggregate-total')).toBeNull();
  }));

  it('hides totals while a new server page is pending and after failed refresh', fakeAsync(() => {
    const loader = jasmine.createSpy().and.resolveTo({ items: rows, total: 3 });
    settle({ ...defaults(), type: 'server', items: loader });
    expect(value()).toBe(120);
    let reject!: (error: Error) => void;
    loader.and.returnValue(
      new Promise((_resolve, onReject) => {
        reject = onReject;
      })
    );
    fixture.componentInstance.table.reload();
    settle();
    expect(fixture.componentInstance.table.loading()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.sd-aggregate-total')).toBeNull();
    reject(new Error('server failure'));
    settle();
    expect(fixture.componentInstance.table.items().length).toBe(3);
    expect(value()).toBeUndefined();
    expect(fixture.nativeElement.querySelector('.sd-aggregate-total')).toBeNull();
  }));

  it('formats date results and COUNT independently of date display', fakeAsync(() => {
    const option = defaults();
    option.items = () => [{ name: '2026-02-01' }, { name: '2026-01-01' }, { name: '' }];
    option.columns = [{ field: 'name', title: 'Date', type: 'date', aggregate: 'MIN' }];
    settle(option);
    expect(fixture.nativeElement.querySelector('.sd-aggregate-total').textContent).toContain('01/01/2026');
    option.columns[0].aggregate = 'COUNT';
    fixture.componentInstance.table.detectChanges();
    settle();
    expect(fixture.nativeElement.querySelector('.sd-aggregate-total').textContent.trim()).toBe('2');
  }));
});
