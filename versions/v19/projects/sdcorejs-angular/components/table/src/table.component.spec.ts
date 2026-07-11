import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableItem } from './models/table-item.model';
import { SdGroupPipe } from './pipes/sd-group.pipe';
import { buildColumnWidthMap } from './services/column-width.util';

describe('buildColumnWidthMap', () => {
  it('trả map field → width cho mọi field có width', () => {
    const result = buildColumnWidthMap({
      name: { width: '120px' },
      age: { width: '80px' },
    });
    expect(result).toEqual({ name: '120px', age: '80px' });
  });

  it('loại bỏ field có width undefined', () => {
    const result = buildColumnWidthMap({
      col1: { width: '100px' },
      col2: {},
      col3: { width: '200px' },
    });
    expect(result).toEqual({ col1: '100px', col3: '200px' });
  });

  it('trả object rỗng khi tất cả field đều không có width', () => {
    const result = buildColumnWidthMap({
      col1: {},
      col2: {},
    });
    expect(result).toEqual({});
  });

  it('trả object rỗng khi input là undefined', () => {
    expect(buildColumnWidthMap(undefined)).toEqual({});
  });

  it('trả object rỗng khi input là null', () => {
    expect(buildColumnWidthMap(null)).toEqual({});
  });

  it('trả object rỗng khi input là object rỗng', () => {
    expect(buildColumnWidthMap({})).toEqual({});
  });

  it('coi width chuỗi rỗng là missing và bỏ qua', () => {
    const result = buildColumnWidthMap({
      col1: { width: '' },
      col2: { width: '100px' },
    });
    expect(result).toEqual({ col2: '100px' });
  });
});

describe('E2E attributes', () => {
  interface EmployeeRow {
    id: number;
    name: string;
  }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: ` <sd-table [autoId]="autoId()" [option]="tableOption()"> </sd-table> `,
  })
  class HostComponent {
    autoId = signal<string | undefined>('employees');
    tableOption = signal<SdTableOption<EmployeeRow>>({
      type: 'local',
      items: () => [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
    });
  }

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let sdTableEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(SdTable));
    sdTableEl = debugEl?.nativeElement;
  });

  it('renders data-autoid on host element', () => {
    expect(sdTableEl).toBeTruthy();
    const autoIdAttr = sdTableEl.getAttribute('data-autoid');
    expect(autoIdAttr).toBe('components-table-employees');
  });

  it('renders data-loading reflecting the loading signal', () => {
    expect(sdTableEl).toBeTruthy();
    const tableComponent = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<EmployeeRow>;

    // Initially loading() is false
    fixture.detectChanges();
    let dataLoadingAttr = sdTableEl.getAttribute('data-loading');
    expect(dataLoadingAttr).toBe('false');

    // Set loading to true
    tableComponent.loading.set(true);
    fixture.detectChanges();
    dataLoadingAttr = sdTableEl.getAttribute('data-loading');
    expect(dataLoadingAttr).toBe('true');

    // Set loading back to false
    tableComponent.loading.set(false);
    fixture.detectChanges();
    dataLoadingAttr = sdTableEl.getAttribute('data-loading');
    expect(dataLoadingAttr).toBe('false');
  });
});

describe('Filter commit (blur) vs filter change (enter / reload)', () => {
  interface Row {
    id: number;
    name: string;
  }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="tableOption()"></sd-table>`,
  })
  class HostComponent {
    itemsSpy = jasmine.createSpy('items').and.callFake(() => Promise.resolve({ items: [], total: 0 }));
    tableOption = signal<SdTableOption<Row>>({
      type: 'server',
      items: this.itemsSpy,
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
      filter: {},
    });
  }

  let defaultFilterKey = '';

  @Component({
    selector: 'sd-spec-default-filter-host',
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="tableOption()"></sd-table>`,
  })
  class DefaultFilterHostComponent {
    itemsSpy = jasmine.createSpy('items').and.callFake(() => Promise.resolve({ items: [], total: 0 }));
    tableOption = signal<SdTableOption<Row>>({
      type: 'server',
      items: this.itemsSpy,
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name', filter: { default: 'Alice' } },
      ],
      filter: { key: defaultFilterKey, cacheable: true },
    });
  }

  @Component({
    selector: 'sd-spec-late-default-filter-host',
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="tableOption()"></sd-table>`,
  })
  class LateDefaultFilterHostComponent {
    itemsSpy = jasmine.createSpy('items').and.callFake(() => Promise.resolve({ items: [], total: 0 }));
    tableOption = signal<SdTableOption<Row>>({
      type: 'server',
      items: this.itemsSpy,
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
      filter: {},
    });

    applyNameDefault() {
      this.tableOption.update(option => ({
        ...option,
        columns: [
          { field: 'id', type: 'number', title: 'ID' },
          { field: 'name', type: 'string', title: 'Name', filter: { default: 'Alice' } },
        ],
      }));
    }
  }

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let table: SdTable<Row>;

  function setupTable() {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;

    // Angular 20+ may schedule another effect/change-detection turn before the
    // configuration promise can enqueue the initial 200ms debounced reload.
    tick();
    flush();
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent, DefaultFilterHostComponent, LateDefaultFilterHostComponent] });
  });

  it('onFilterCommit ghi columnFilter vào filterRegister với notReload:true — không trigger reload', fakeAsync(() => {
    setupTable();
    expect(table.filterRegister).withContext('filterRegister đã init sau detectChanges + flush').toBeTruthy();

    const callsAfterInit = host.itemsSpy.calls.count();

    table.columnFilter = { name: 'abc', id: null } as Record<string, unknown>;
    table.onFilterCommit();

    // Giá trị đã commit vào storage
    expect(table.filterRegister.value.get().columnFilter?.['name']).toBe('abc');

    // Vượt qua debounceTime(500ms) của observer
    tick(600);
    flush();

    // Không có lần gọi items() mới (notReload:true chặn reload)
    expect(host.itemsSpy.calls.count()).toBe(callsAfterInit);
  }));

  it('onFilterChange ghi columnFilter và trigger reload sau debounce 500ms', fakeAsync(() => {
    setupTable();
    const callsAfterInit = host.itemsSpy.calls.count();

    table.columnFilter = { name: 'xyz', id: null } as Record<string, unknown>;
    table.onFilterChange();

    expect(table.filterRegister.value.get().columnFilter?.['name']).toBe('xyz');

    // Hai tầng debounce: filterRegister.observer (500ms) → #reload (200ms) → switchMap async load
    tick(800);
    flush();
    expect(host.itemsSpy.calls.count()).toBeGreaterThan(callsAfterInit);
  }));

  it('reload() commit columnFilter pending trước khi build filter request — typed value reach API', fakeAsync(() => {
    setupTable();
    host.itemsSpy.calls.reset();

    // Mô phỏng user gõ "pending" vào sd-input nhưng chưa enter, chưa blur:
    // columnFilter mutated in-place, filterRegister chưa được set.
    table.columnFilter = { name: 'pending', id: null } as Record<string, unknown>;

    // User bấm nút tải lại
    table.reload(true, false);
    tick();
    flush();

    expect(host.itemsSpy).toHaveBeenCalled();
    const filterReq = host.itemsSpy.calls.mostRecent().args[0] as { rawColumnFilter: Record<string, unknown> };
    expect(filterReq.rawColumnFilter['name'])
      .withContext('reload phải commit giá trị typed-but-not-entered vào filter request')
      .toBe('pending');
  }));

  // Regression: clear field rồi enter, giá trị cũ KHÔNG được persist.
  // Bug cũ: observer gán clone mới vào this.columnFilter → column-filter giữ ref cũ
  // (OnPush + reload async lag) → clear ghi vào object orphan → giá trị stale gửi lên.
  // Fix: #syncColumnFilterInPlace giữ reference ổn định.
  it('observer sync GIỮ reference this.columnFilter ổn định qua nhiều filter cycle', fakeAsync(() => {
    setupTable();
    const stableRef = table.columnFilter;

    // type field1 = 'a' → enter
    table.columnFilter!['name'] = 'a';
    table.onFilterChange();
    tick(800);
    flush();
    expect(table.columnFilter).withContext('ref ổn định sau cycle 1').toBe(stableRef);
    expect(table.filterRegister.value.get().columnFilter?.['name']).toBe('a');

    // clear field1 → enter
    table.columnFilter!['name'] = '';
    table.onFilterChange();
    tick(800);
    flush();
    expect(table.columnFilter).withContext('ref vẫn ổn định sau clear').toBe(stableRef);
    // storage phản ánh giá trị đã clear — KHÔNG còn 'a'
    expect(table.filterRegister.value.get().columnFilter?.['name']).toBe('');
  }));

  it('clear field XÓA hẳn key khỏi columnFilter khi observer sync (không stale)', fakeAsync(() => {
    setupTable();
    const stableRef = table.columnFilter!;

    // Set 2 field rồi commit
    table.columnFilter!['name'] = 'a';
    table.columnFilter!['id'] = 5;
    table.onFilterChange();
    tick(800);
    flush();
    expect(table.filterRegister.value.get().columnFilter).toEqual(jasmine.objectContaining({ name: 'a', id: 5 }));

    // Storage value KHÔNG còn 'name' (giả lập filterRegister set lại object không có name)
    // → observer sync phải delete key 'name' khỏi stableRef in place.
    table.filterRegister.value.set({ columnFilter: { id: 5 } });
    tick(800);
    flush();
    expect(table.columnFilter).withContext('ref ổn định').toBe(stableRef);
    expect('name' in table.columnFilter!)
      .withContext('key đã clear bị xóa in place')
      .toBe(false);
    expect(table.columnFilter!['id']).toBe(5);
  }));

  it('keeps a cached null clear instead of reapplying column filter default on re-create', fakeAsync(() => {
    defaultFilterKey = `inline-default-clear-${Math.random()}`;

    const firstFixture = TestBed.createComponent(DefaultFilterHostComponent);
    const firstHost = firstFixture.componentInstance;
    firstFixture.detectChanges();
    const firstTable = firstFixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
    tick(800);
    flush();
    firstFixture.detectChanges();

    let firstCall = firstHost.itemsSpy.calls.first().args as [
      { rawColumnFilter: Record<string, unknown> },
      { filters: { field: string; operator: string; data: unknown }[] },
    ];
    let filterReq = firstCall[0];
    let pagingReq = firstCall[1];
    expect(filterReq.rawColumnFilter['name']).toBe('Alice');
    expect(pagingReq.filters).toContain(jasmine.objectContaining({ field: 'name', operator: 'CONTAIN', data: 'Alice' }));

    firstTable.columnFilter!['name'] = null;
    firstTable.onFilterChange();
    tick(800);
    flush();
    firstFixture.detectChanges();
    expect(firstTable.filterRegister.value.get().columnFilter?.['name']).toBeNull();
    firstFixture.destroy();

    const secondFixture = TestBed.createComponent(DefaultFilterHostComponent);
    const secondHost = secondFixture.componentInstance;
    secondFixture.detectChanges();
    tick(800);
    flush();
    secondFixture.detectChanges();

    firstCall = secondHost.itemsSpy.calls.first().args as [
      { rawColumnFilter: Record<string, unknown> },
      { filters: { field: string; operator: string; data: unknown }[] },
    ];
    filterReq = firstCall[0];
    pagingReq = firstCall[1];
    expect(filterReq.rawColumnFilter['name']).toBeNull();
    expect(pagingReq.filters).toEqual([]);
    secondFixture.destroy();
  }));

  it('applies a column filter default added after the filter register was created on the next first load', fakeAsync(() => {
    const lateFixture = TestBed.createComponent(LateDefaultFilterHostComponent);
    const lateHost = lateFixture.componentInstance;
    lateFixture.detectChanges();
    tick(800);
    flush();
    lateFixture.detectChanges();
    const lateTable = lateFixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
    const firstRegister = lateTable.filterRegister;
    lateHost.itemsSpy.calls.reset();

    lateHost.applyNameDefault();
    lateFixture.detectChanges();
    tick(800);
    flush();
    lateFixture.detectChanges();

    const firstCall = lateHost.itemsSpy.calls.first().args as [
      { rawColumnFilter: Record<string, unknown> },
      { filters: { field: string; operator: string; data: unknown }[] },
    ];
    expect(lateTable.filterRegister).not.toBe(firstRegister);
    expect(firstCall[0].rawColumnFilter['name']).toBe('Alice');
    expect(firstCall[1].filters).toContain(jasmine.objectContaining({ field: 'name', operator: 'CONTAIN', data: 'Alice' }));
    lateFixture.destroy();
  }));
});

describe('STT (index) column — renderIndex fix (multiTemplateDataRows)', () => {
  interface Row {
    id: number;
    name: string;
  }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    itemsSpy = jasmine.createSpy('items').and.callFake(() =>
      Promise.resolve({
        items: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 3, name: 'C' },
        ],
        total: 3,
      })
    );
    opt: SdTableOption<Row> = {
      type: 'server',
      items: this.itemsSpy,
      index: { enabled: true },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('render STT cells với số 1,2,3 (KHÔNG phải NaN) — multiTemplateDataRows=true vẫn lấy index đúng qua renderIndex', fakeAsync(() => {
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();

    // Lấy cell của cột sdIndex (CDK matColumnDef → class .cdk-column-sdIndex trên td)
    const cells = fixture.nativeElement.querySelectorAll('td.cdk-column-sdIndex') as NodeListOf<HTMLTableCellElement>;
    expect(cells.length).toBeGreaterThan(0);
    const values = Array.from(cells)
      .map(c => c.textContent?.trim())
      .filter(v => v && v.length > 0);
    expect(values).toContain('1');
    expect(values).toContain('2');
    expect(values).toContain('3');
    // why: bug cũ trước fix sẽ render 'NaN' khi index context không có (multiTemplateDataRows).
    values.forEach(v => expect(v).not.toBe('NaN'));
  }));
});

describe('group helpers — isGroupAllSelected / isGroupIndeterminate / onSelectGroup / sdGroupColspan / groupContext', () => {
  interface Row {
    id: number;
    group: string;
  }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    itemsSpy = jasmine.createSpy('items').and.callFake(() =>
      Promise.resolve({
        items: [
          { id: 1, group: 'A' },
          { id: 2, group: 'A' },
          { id: 3, group: 'B' },
        ],
        total: 3,
      })
    );
    opt: SdTableOption<Row> = {
      type: 'server',
      items: this.itemsSpy,
      group: { fields: ['group'] },
      selector: { visible: true },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'group', type: 'string', title: 'Group' },
      ],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;
  let table: SdTable<Row>;
  let pipe: SdGroupPipe;

  function waitForLoad() {
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
    tick(800);
    flush();
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();
  }

  /** Build group headers từ pipe trên items hiện tại (sau load). */
  function buildHeaders(): { groupA: SdTableItem<Row>; groupB: SdTableItem<Row> } {
    const out = pipe.transform(table.items() as SdTableItem<Row>[], table.tableOption()!);
    const groupA = out.find(i => i.meta.group?.isGroupHeader && i.meta.group?.values?.['group'] === 'A')!;
    const groupB = out.find(i => i.meta.group?.isGroupHeader && i.meta.group?.values?.['group'] === 'B')!;
    return { groupA, groupB };
  }

  beforeEach(() => {
    pipe = new SdGroupPipe();
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('isGroupAllSelected = false khi không có child selected', fakeAsync(() => {
    waitForLoad();
    const { groupA } = buildHeaders();
    expect(table.isGroupAllSelected(groupA)).toBe(false);
    expect(table.isGroupIndeterminate(groupA)).toBe(false);
  }));

  it('isGroupIndeterminate = true khi MỘT VÀI child selected (không phải tất cả)', fakeAsync(() => {
    waitForLoad();
    const { groupA } = buildHeaders();
    groupA.meta.group!.items![0].meta.selector!.isSelected = true;
    expect(table.isGroupAllSelected(groupA)).toBe(false);
    expect(table.isGroupIndeterminate(groupA)).toBe(true);
  }));

  it('isGroupAllSelected = true khi MỌI child selected', fakeAsync(() => {
    waitForLoad();
    const { groupA } = buildHeaders();
    groupA.meta.group!.items!.forEach(c => (c.meta.selector!.isSelected = true));
    expect(table.isGroupAllSelected(groupA)).toBe(true);
    expect(table.isGroupIndeterminate(groupA)).toBe(false);
  }));

  it('onSelectGroup(header, true) → set isSelected=true cho mọi child', fakeAsync(() => {
    waitForLoad();
    const { groupA } = buildHeaders();
    table.onSelectGroup(groupA, true);
    expect(groupA.meta.group!.items!.every(c => c.meta.selector!.isSelected)).toBe(true);
  }));

  it('onSelectGroup(header, false) → set isSelected=false cho mọi child', fakeAsync(() => {
    waitForLoad();
    const { groupA } = buildHeaders();
    groupA.meta.group!.items!.forEach(c => (c.meta.selector!.isSelected = true));
    table.onSelectGroup(groupA, false);
    expect(groupA.meta.group!.items!.every(c => !c.meta.selector!.isSelected)).toBe(true);
  }));

  it('sdGroupColspan() = displayedColumns.length (span toàn width data row)', fakeAsync(() => {
    waitForLoad();
    const cols = table.configuration()!.displayedColumns;
    // sdGroup KHÔNG có trong displayedColumns nữa (group row dùng matRowDef riêng với column ['sdGroupHeader']).
    expect(cols).not.toContain('sdGroup');
    expect(table.sdGroupColspan()).toBe(cols.length);
  }));

  it('isGroupHeaderRow predicate phân biệt đúng group header vs data row', fakeAsync(() => {
    waitForLoad();
    const { groupA } = buildHeaders();
    const dataRow = table.items().find(i => !i.meta.group?.isGroupHeader)!;
    expect(table.isGroupHeaderRow(0, groupA)).toBe(true);
    expect(table.isGroupHeaderRow(0, dataRow)).toBe(false);
    expect(table.isDataRow(0, groupA)).toBe(false);
    expect(table.isDataRow(0, dataRow)).toBe(true);
  }));

  it('groupContext() trả về shape đúng (items / data / values / key / isExpanded / isSelected / indeterminate + toggle funcs)', fakeAsync(() => {
    waitForLoad();
    const { groupA } = buildHeaders();
    const ctx = table.groupContext(groupA);
    expect(ctx.values).toEqual({ group: 'A' });
    expect(ctx.items.length).toBe(2);
    expect(ctx.data.length).toBe(2);
    expect(ctx.key).toBeTruthy();
    expect(typeof ctx.toggleExpand).toBe('function');
    expect(typeof ctx.toggleSelect).toBe('function');
  }));
});

describe('tree STT — hierarchical numbering 1 / 1.2 / 1.2.1 + root bold', () => {
  interface OrgNode {
    id: number;
    name: string;
    children?: OrgNode[];
  }

  const ORG: OrgNode[] = [
    {
      id: 1,
      name: 'Khối A',
      children: [
        { id: 11, name: 'P1', children: [{ id: 111, name: 'T1' }] },
        { id: 12, name: 'P2' },
      ],
    },
  ];

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    itemsSpy = jasmine.createSpy('items').and.callFake(() => Promise.resolve({ items: ORG, total: 1 }));
    opt: SdTableOption<OrgNode> = {
      type: 'server',
      items: this.itemsSpy,
      tree: { loadType: 'static', childrenKey: 'children', defaultExpanded: 5 },
      index: { enabled: true },
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
    } as SdTableOption<OrgNode>;
  }

  let fixture: ComponentFixture<HostComponent>;
  let table: SdTable<OrgNode>;

  function waitForLoad() {
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<OrgNode>;
    tick(800);
    flush();
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('STT cell render label hierarchical "1", "1.1", "1.1.1", "1.2"', fakeAsync(() => {
    waitForLoad();
    // why: chevron mat-icon nằm cùng cell → query riêng span.sd-tree-stt (chỉ phần số).
    const sttSpans = fixture.nativeElement.querySelectorAll('td.cdk-column-sdIndex span.sd-tree-stt') as NodeListOf<HTMLElement>;
    const labels = Array.from(sttSpans)
      .map(s => s.textContent?.trim())
      .filter(s => s && s.length > 0);
    // ORG flatten với defaultExpanded > depth → 4 rows: root, P1, T1, P2
    expect(labels).toContain('1');
    expect(labels).toContain('1.1');
    expect(labels).toContain('1.1.1');
    expect(labels).toContain('1.2');
  }));

  it('icon expand đã nhúng vào cột Index — KHÔNG còn cột sdTreeToggle riêng', fakeAsync(() => {
    waitForLoad();
    expect(fixture.nativeElement.querySelector('td.cdk-column-sdTreeToggle')).toBeNull();
    // chevron button nằm trong cell Index, dùng icon chevron_right/expand_more.
    const toggle = fixture.nativeElement.querySelector('td.cdk-column-sdIndex button.sd-tree-toggle-btn') as HTMLElement;
    expect(toggle).not.toBeNull();
    const icon = toggle.querySelector('mat-icon')?.textContent?.trim();
    expect(['chevron_right', 'expand_more']).toContain(icon!);
  }));

  it('Root level (level 0) STT có class .sd-stt-root (bold via SCSS)', fakeAsync(() => {
    waitForLoad();
    const rootSttSpans = fixture.nativeElement.querySelectorAll('td.cdk-column-sdIndex span.sd-stt-root') as NodeListOf<HTMLElement>;
    expect(rootSttSpans.length).toBeGreaterThanOrEqual(1);
    expect(rootSttSpans[0].textContent?.trim()).toBe('1');
  }));

  it('Child level (level > 0) STT KHÔNG có class .sd-stt-root', fakeAsync(() => {
    waitForLoad();
    const sttSpans = fixture.nativeElement.querySelectorAll('td.cdk-column-sdIndex span.sd-tree-stt') as NodeListOf<HTMLElement>;
    const childSpans = Array.from(sttSpans).filter(s => (s.textContent?.trim() ?? '').includes('.'));
    expect(childSpans.length).toBeGreaterThan(0);
    childSpans.forEach(span => expect(span.classList.contains('sd-stt-root')).toBe(false));
  }));

  it('Row TR có class .sd-tree-level-<N> đúng theo meta.tree.level', fakeAsync(() => {
    waitForLoad();
    const lvl0 = fixture.nativeElement.querySelector('tr.c-row.sd-tree-level-0');
    const lvl1 = fixture.nativeElement.querySelector('tr.c-row.sd-tree-level-1');
    const lvl2 = fixture.nativeElement.querySelector('tr.c-row.sd-tree-level-2');
    expect(lvl0).not.toBeNull();
    expect(lvl1).not.toBeNull();
    expect(lvl2).not.toBeNull();
  }));
});

describe('tree toggle nhúng cột data đầu (không có cột Index) + lazy hasChildren', () => {
  interface Node {
    id: number;
    name: string;
    children?: Node[];
  }

  const ORG: Node[] = [
    {
      id: 1,
      name: 'Root',
      children: [{ id: 11, name: 'Child' }],
    },
  ];

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    opt: SdTableOption<Node> = {
      type: 'local',
      items: () => ORG,
      tree: { loadType: 'static', childrenKey: 'children', defaultExpanded: 5 },
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
    } as SdTableOption<Node>;
  }

  let fixture: ComponentFixture<HostComponent>;

  function waitForLoad() {
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('không có cột Index → chevron nhúng vào cell cột data đầu (Name)', fakeAsync(() => {
    waitForLoad();
    expect(fixture.nativeElement.querySelector('td.cdk-column-sdTreeToggle')).toBeNull();
    const toggle = fixture.nativeElement.querySelector('td.cdk-column-name button.sd-tree-toggle-btn') as HTMLElement;
    expect(toggle).not.toBeNull();
    expect(['chevron_right', 'expand_more']).toContain(toggle.querySelector('mat-icon')?.textContent?.trim() ?? '');
  }));
});

describe('lazy tree hasChildren — chỉ hiện chevron khi callback trả true', () => {
  interface Node {
    id: number;
    name: string;
  }

  const DATA: Node[] = [
    { id: 1, name: 'HasKids' },
    { id: 2, name: 'Leaf' },
  ];

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    opt: SdTableOption<Node> = {
      type: 'local',
      items: () => DATA,
      tree: {
        loadType: 'lazy',
        hasChildren: (row: Node) => row.id === 1,
        onExpandChildren: () => Promise.resolve([{ id: 11, name: 'Lazy child' }]),
      },
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
    } as SdTableOption<Node>;
  }

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('row hasChildren=true có chevron, row trả false thì không', fakeAsync(() => {
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();
    const toggles = fixture.nativeElement.querySelectorAll('button.sd-tree-toggle-btn') as NodeListOf<HTMLElement>;
    // Chỉ 1 chevron (cho 'HasKids'); 'Leaf' không có.
    expect(toggles.length).toBe(1);
  }));
});

describe('group DOM render — separate row def + colspan + checkbox slot', () => {
  interface Row {
    id: number;
    group: string;
  }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    itemsSpy = jasmine.createSpy('items').and.callFake(() =>
      Promise.resolve({
        items: [
          { id: 1, group: 'A' },
          { id: 2, group: 'A' },
          { id: 3, group: 'B' },
        ],
        total: 3,
      })
    );
    opt: SdTableOption<Row> = {
      type: 'server',
      items: this.itemsSpy,
      group: { fields: ['group'], collapsible: true },
      selector: { visible: true },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'group', type: 'string', title: 'Group' },
      ],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;
  let table: SdTable<Row>;

  function waitForLoad() {
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
    tick(800);
    flush();
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('render đúng số group header row trong DOM (= số group khác biệt)', fakeAsync(() => {
    waitForLoad();
    const groupCells = fixture.nativeElement.querySelectorAll('td.sd-group-header-cell') as NodeListOf<HTMLTableCellElement>;
    expect(groupCells.length).toBe(2);
  }));

  it('group cell có colspan = displayedColumns.length (span toàn width)', fakeAsync(() => {
    waitForLoad();
    const cell = fixture.nativeElement.querySelector('td.sd-group-header-cell') as HTMLTableCellElement;
    expect(cell).not.toBeNull();
    const colspan = cell.getAttribute('colspan');
    expect(Number(colspan)).toBe(table.configuration()!.displayedColumns.length);
  }));

  it('group row chỉ có 1 TD (matRowDef riêng với column list 1 phần tử) — KHÔNG render data column cells', fakeAsync(() => {
    waitForLoad();
    // Group row class theo template: tr.c-group-row-tr
    const groupRows = fixture.nativeElement.querySelectorAll('tr.c-group-row-tr');
    expect(groupRows.length).toBe(2);
    groupRows.forEach((tr: HTMLTableRowElement) => {
      const tds = tr.querySelectorAll('td');
      expect(tds.length).toBe(1);
    });
  }));

  it('selector visible + multi → group row render checkbox trong slot 42px (.sd-group-selection-slot)', fakeAsync(() => {
    waitForLoad();
    const slot = fixture.nativeElement.querySelector('.sd-group-selection-slot') as HTMLElement;
    expect(slot).not.toBeNull();
    const checkbox = slot.querySelector('mat-checkbox');
    expect(checkbox).not.toBeNull();
  }));

  it('collapsible=true → group cell có expand button (sd-button)', fakeAsync(() => {
    waitForLoad();
    const groupCell = fixture.nativeElement.querySelector('td.sd-group-header-cell') as HTMLElement;
    const btn = groupCell.querySelector('sd-button');
    expect(btn).not.toBeNull();
  }));

  /** Helper: lấy group header A qua pipe (table.items() chứa raw items, pipe sinh headers). */
  function getHeaderA(): SdTableItem<Row> {
    const out = new SdGroupPipe().transform(table.items() as SdTableItem<Row>[], table.tableOption()!, table.groupExpandState);
    return out.find(i => i.meta.group?.isGroupHeader && i.meta.group?.values?.['group'] === 'A')!;
  }

  it('toggleGroupExpand(header) đảo isExpanded + sync vào groupExpandState map', fakeAsync(() => {
    waitForLoad();
    const headerA = getHeaderA();
    expect(headerA.meta.group!.isExpanded).toBe(true);

    table.toggleGroupExpand(headerA);
    fixture.detectChanges();

    expect(headerA.meta.group!.isExpanded).toBe(false);
    expect(table.groupExpandState.get(headerA.meta.group!.key!)).toBe(false);
  }));

  it('collapse group → children TR bị loại khỏi DOM (pipe filter)', fakeAsync(() => {
    waitForLoad();
    // Initial: 3 data rows render trong DOM
    let dataRows = fixture.nativeElement.querySelectorAll('tr.c-row');
    expect(dataRows.length).toBe(3);

    const headerA = getHeaderA();
    table.toggleGroupExpand(headerA);
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();

    // Sau collapse group A — chỉ còn 1 data row (group B vẫn expand: 1 child)
    dataRows = fixture.nativeElement.querySelectorAll('tr.c-row');
    expect(dataRows.length).toBe(1);
  }));

  it('click checkbox trên group cell → fire onSelectGroup → mọi child selected', fakeAsync(() => {
    waitForLoad();
    const slot = fixture.nativeElement.querySelector('.sd-group-selection-slot') as HTMLElement;
    const input = slot.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    input.click();
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();

    const headerA = getHeaderA();
    expect(headerA.meta.group!.items!.every(c => c.meta.selector!.isSelected)).toBe(true);
  }));
});

describe('selector.preserveSelection — giữ selection xuyên trang/filter/reload', () => {
  interface Row {
    id: number;
    name: string;
  }

  const PAGE = (start: number, size: number): Row[] => Array.from({ length: size }, (_, i) => ({ id: start + i, name: `R${start + i}` }));

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    itemsSpy = jasmine
      .createSpy('items')
      .and.callFake((_filterReq: any, pagingReq: any) =>
        Promise.resolve({ items: PAGE((pagingReq?.pageNumber ?? 0) * 2 + 1, 2), total: 10 })
      );
    opt: SdTableOption<Row> = {
      type: 'server',
      items: this.itemsSpy,
      selector: { visible: true, preserveSelection: true },
      paginate: { pageSize: 2 },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let table: SdTable<Row>;

  function setupAndWaitForLoad() {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
    // Pipeline: filterRegister observer (500ms debounce) → #reload (200ms debounce) → switchMap load.
    tick(800);
    flush();
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('selection trên page 1 vẫn có mặt trong selectedTableItems() sau khi reload (preserveSelection=true)', fakeAsync(() => {
    setupAndWaitForLoad();

    const firstItem = table.items()[0];
    expect(firstItem).withContext('table có items sau initial load').toBeDefined();
    firstItem.meta.selector!.isSelected = true;
    table.onSelect(firstItem);
    fixture.detectChanges();

    const beforeId = firstItem.data.id;
    expect(table.selectedTableItems().map(i => i.data.id)).toContain(beforeId);

    // Trigger reload (force=true → server gọi lại items())
    table.reload(true, false);
    tick(800);
    flush();
    fixture.detectChanges();

    expect(table.selectedTableItems().map(i => i.data.id))
      .withContext('preserveSelection=true → giữ selection xuyên reload')
      .toContain(beforeId);
  }));

  it('onClearSelection (nút X) clear toàn bộ preserved map — selectedTableItems về rỗng và không restore sau reload', fakeAsync(() => {
    setupAndWaitForLoad();

    const firstItem = table.items()[0];
    expect(firstItem).toBeDefined();
    firstItem.meta.selector!.isSelected = true;
    table.onSelect(firstItem);
    fixture.detectChanges();
    expect(table.selectedTableItems().length).toBeGreaterThan(0);

    table.onClearSelection();
    fixture.detectChanges();
    expect(table.selectedTableItems().length).toBe(0);

    // Reload sau onClearSelection — không restore
    table.reload(true, false);
    tick(800);
    flush();
    fixture.detectChanges();
    expect(table.selectedTableItems().length).toBe(0);
  }));
});

describe('Tree search ở cấp con (static tree + type local)', () => {
  interface Node {
    id: number;
    name: string;
    children?: Node[];
  }

  const DATA: Node[] = [
    {
      id: 1,
      name: 'Fruits',
      children: [
        { id: 11, name: 'Apple' },
        { id: 12, name: 'Banana', children: [{ id: 121, name: 'Banana Bread' }] },
      ],
    },
    {
      id: 2,
      name: 'Vegetables',
      children: [{ id: 21, name: 'Carrot' }],
    },
  ];

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    opt: SdTableOption<Node> = {
      type: 'local',
      items: () => DATA,
      tree: { loadType: 'static', childrenKey: 'children' },
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
    } as SdTableOption<Node>;
  }

  let fixture: ComponentFixture<HostComponent>;
  let table: SdTable<Node>;

  function load() {
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Node>;
    tick(800);
    flush();
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();
  }

  function search(term: string) {
    table.columnFilter = { name: term } as Record<string, unknown>;
    table.onFilterChange();
    tick(800);
    flush();
    fixture.detectChanges();
    tick();
    flush();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('match ở cấp con → giữ root chứa nó, loại root không liên quan', fakeAsync(() => {
    load();
    search('apple');
    // Chỉ root 'Fruits' (chứa Apple) được giữ; 'Vegetables' bị loại.
    expect(table.items().map(i => i.data.id)).toEqual([1]);
  }));

  it('prune sibling không khớp khỏi nhánh được giữ', fakeAsync(() => {
    load();
    search('apple');
    const root = table.items()[0];
    // Banana (+ Banana Bread) bị prune; chỉ còn Apple.
    expect(root.meta.tree!.childItems!.map(c => c.data.id)).toEqual([11]);
  }));

  it('auto-expand nhánh có node con khớp', fakeAsync(() => {
    load();
    search('apple');
    const root = table.items()[0];
    expect(root.meta.tree!.isExpanded).toBe(true);
    expect(root.meta.tree!.hasChildren).toBe(true);
  }));

  it('match ở cháu (sâu) → giữ + auto-expand toàn nhánh tổ tiên', fakeAsync(() => {
    load();
    search('bread');
    expect(table.items().map(i => i.data.id)).toEqual([1]);
    const root = table.items()[0];
    // Chỉ nhánh Banana → Banana Bread được giữ; Apple bị prune.
    expect(root.meta.tree!.childItems!.map(c => c.data.id)).toEqual([12]);
    expect(root.meta.tree!.isExpanded).toBe(true);
    const banana = root.meta.tree!.childItems![0];
    expect(banana.meta.tree!.isExpanded).toBe(true);
    expect(banana.meta.tree!.childItems!.map(c => c.data.id)).toEqual([121]);
  }));

  it('clear filter → khôi phục đầy đủ root; bung lại thấy children đầy đủ (không còn prune)', fakeAsync(() => {
    load();
    search('apple');
    expect(table.items().map(i => i.data.id)).toEqual([1]);

    search('');
    // Cả 2 root trở lại; cây về trạng thái mặc định (collapsed).
    expect(table.items().map(i => i.data.id)).toEqual([1, 2]);
    const fruits = table.items().find(i => i.data.id === 1)!;
    expect(fruits.meta.tree!.hasChildren).toBe(true);

    // Bung lại → children đầy đủ (Apple + Banana), tập prune cũ đã bị xoá.
    table.onTreeToggle(fruits);
    tick();
    flush();
    fixture.detectChanges();
    expect(fruits.meta.tree!.childItems!.map(c => c.data.id)).toEqual([11, 12]);
  }));
});

describe('hidden paginator footer height', () => {
  interface Row {
    id: number;
    name: string;
  }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `
      <div class="table-shell action-table">
        <sd-table [option]="actionOption"></sd-table>
      </div>
      <div class="table-shell summary-table">
        <sd-table [option]="summaryOption"></sd-table>
      </div>
      <div class="table-shell visible-paginator-table">
        <sd-table [option]="visiblePaginatorOption"></sd-table>
      </div>
    `,
    styles: [`
      .table-shell {
        width: 600px;
        height: 240px;
      }

      :host ::ng-deep .d-none {
        display: none !important;
      }
    `],
  })
  class HiddenPaginatorHeightHostComponent {
    actionOption: SdTableOption<Row> = {
      type: 'local',
      items: () => [{ id: 1, name: 'Only row' }],
      reload: { visible: true },
      paginate: { pageSize: 20 },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
    };

    summaryOption: SdTableOption<Row> = {
      type: 'local',
      items: () => [{ id: 1, name: 'Only row' }],
      paginate: { pageSize: 20 },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
    };

    visiblePaginatorOption: SdTableOption<Row> = {
      type: 'local',
      items: () => Array.from({ length: 21 }, (_, index) => ({ id: index + 1, name: `Row ${index + 1}` })),
      paginate: { pageSize: 20 },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HiddenPaginatorHeightHostComponent] });
  });

  function createLoadedFixture(): ComponentFixture<HiddenPaginatorHeightHostComponent> {
    const fixture = TestBed.createComponent(HiddenPaginatorHeightHostComponent);
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
    return fixture;
  }

  it('contains the 48px action touch target without creating an outer table scrollbar', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const table = fixture.nativeElement.querySelector('.action-table sd-table') as HTMLElement;
    const container = table.querySelector('.c-container') as HTMLElement;
    const paginatorFooter = table.querySelector('.c-paginator') as HTMLElement;
    const paginator = table.querySelector('mat-paginator') as HTMLElement;

    expect(getComputedStyle(paginator).display)
      .withContext('short data set should hide mat-paginator')
      .toBe('none');
    expect(paginatorFooter.querySelector('sd-button'))
      .withContext('fixture must render a footer action button')
      .not.toBeNull();
    expect(paginatorFooter.getBoundingClientRect().height)
      .withContext("footer must contain Material's 48px touch target")
      .toBeGreaterThanOrEqual(48);
    expect(table.scrollHeight)
      .withContext('sd-table host must not gain a redundant vertical scrollbar')
      .toBeLessThanOrEqual(table.clientHeight);
    expect(container.scrollHeight)
      .withContext('c-container must contain the footer without overflow propagation')
      .toBeLessThanOrEqual(container.clientHeight);

    fixture.destroy();
  }));

  it('keeps the hidden-paginator summary compact when there are no footer actions', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const table = fixture.nativeElement.querySelector('.summary-table sd-table') as HTMLElement;
    const paginatorFooter = table.querySelector('.c-paginator') as HTMLElement;
    const paginator = table.querySelector('mat-paginator') as HTMLElement;

    expect(getComputedStyle(paginator).display).toBe('none');
    expect(paginatorFooter.querySelector('sd-button')).toBeNull();
    expect(paginatorFooter.getBoundingClientRect().height)
      .withContext('conditional action rule must not reserve an empty 48px footer')
      .toBeLessThan(48);

    fixture.destroy();
  }));

  it('preserves the normal visible paginator height', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const table = fixture.nativeElement.querySelector('.visible-paginator-table sd-table') as HTMLElement;
    const paginatorFooter = table.querySelector('.c-paginator') as HTMLElement;
    const paginator = table.querySelector('mat-paginator') as HTMLElement;

    expect(getComputedStyle(paginator).display).not.toBe('none');
    expect(paginatorFooter.getBoundingClientRect().height).toBeGreaterThanOrEqual(56);

    fixture.destroy();
  }));
});
