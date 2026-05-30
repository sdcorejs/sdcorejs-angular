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
    template: `
      <sd-table
        [autoId]="autoId()"
        [option]="tableOption()">
      </sd-table>
    `,
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

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let table: SdTable<Row>;

  function setupTable() {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('onFilterCommit ghi columnFilter vào filterRegister với notReload:true — không trigger reload', fakeAsync(() => {
    setupTable();
    tick();
    flush();
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
    tick();
    flush();
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
    tick();
    flush();
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
    tick();
    flush();
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
    tick();
    flush();
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
    expect('name' in table.columnFilter!).withContext('key đã clear bị xóa in place').toBe(false);
    expect(table.columnFilter!['id']).toBe(5);
  }));
});

describe('STT (index) column — renderIndex fix (multiTemplateDataRows)', () => {
  interface Row { id: number; name: string; }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    itemsSpy = jasmine
      .createSpy('items')
      .and.callFake(() => Promise.resolve({ items: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }], total: 3 }));
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
    const values = Array.from(cells).map(c => c.textContent?.trim()).filter(v => v && v.length > 0);
    expect(values).toContain('1');
    expect(values).toContain('2');
    expect(values).toContain('3');
    // why: bug cũ trước fix sẽ render 'NaN' khi index context không có (multiTemplateDataRows).
    values.forEach(v => expect(v).not.toBe('NaN'));
  }));
});

describe('group helpers — isGroupAllSelected / isGroupIndeterminate / onSelectGroup / sdGroupColspan / groupContext', () => {
  interface Row { id: number; group: string; }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    itemsSpy = jasmine
      .createSpy('items')
      .and.callFake(() => Promise.resolve({
        items: [
          { id: 1, group: 'A' },
          { id: 2, group: 'A' },
          { id: 3, group: 'B' },
        ], total: 3,
      }));
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
  interface OrgNode { id: number; name: string; children?: OrgNode[]; }

  const ORG: OrgNode[] = [{
    id: 1, name: 'Khối A', children: [
      { id: 11, name: 'P1', children: [{ id: 111, name: 'T1' }] },
      { id: 12, name: 'P2' },
    ],
  }];

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
      tree: { childrenKey: 'children', defaultExpanded: 5 },
      index: { enabled: true },
      columns: [
        { field: 'name', type: 'string', title: 'Name' },
      ],
    } as SdTableOption<OrgNode>;
  }

  let fixture: ComponentFixture<HostComponent>;
  let table: SdTable<OrgNode>;

  function waitForLoad() {
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<OrgNode>;
    tick(800); flush(); fixture.detectChanges();
    tick(); flush(); fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('STT cell render label hierarchical "1", "1.1", "1.1.1", "1.2"', fakeAsync(() => {
    waitForLoad();
    const cells = fixture.nativeElement.querySelectorAll('td.cdk-column-sdIndex') as NodeListOf<HTMLTableCellElement>;
    const labels = Array.from(cells).map(c => c.textContent?.trim()).filter(s => s && s.length > 0);
    // ORG flatten với defaultExpanded > depth → 4 rows: root, P1, T1, P2
    expect(labels).toContain('1');
    expect(labels).toContain('1.1');
    expect(labels).toContain('1.1.1');
    expect(labels).toContain('1.2');
  }));

  it('Root level (level 0) STT có class .sd-stt-root (bold via SCSS)', fakeAsync(() => {
    waitForLoad();
    const rootSttSpans = fixture.nativeElement.querySelectorAll('td.cdk-column-sdIndex span.sd-stt-root') as NodeListOf<HTMLElement>;
    expect(rootSttSpans.length).toBeGreaterThanOrEqual(1);
    expect(rootSttSpans[0].textContent?.trim()).toBe('1');
  }));

  it('Child level (level > 0) STT KHÔNG có class .sd-stt-root', fakeAsync(() => {
    waitForLoad();
    const allSpans = fixture.nativeElement.querySelectorAll('td.cdk-column-sdIndex span') as NodeListOf<HTMLElement>;
    const childSpans = Array.from(allSpans).filter(s => {
      const t = s.textContent?.trim() ?? '';
      return t.includes('.');
    });
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

describe('group DOM render — separate row def + colspan + checkbox slot', () => {
  interface Row { id: number; group: string; }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    itemsSpy = jasmine.createSpy('items').and.callFake(() =>
      Promise.resolve({
        items: [
          { id: 1, group: 'A' }, { id: 2, group: 'A' },
          { id: 3, group: 'B' },
        ], total: 3,
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
    tick(800); flush(); fixture.detectChanges();
    tick(); flush(); fixture.detectChanges();
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
    const out = new SdGroupPipe().transform(
      table.items() as SdTableItem<Row>[],
      table.tableOption()!,
      table.groupExpandState,
    );
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
    tick(); flush(); fixture.detectChanges();

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
    tick(); flush(); fixture.detectChanges();

    const headerA = getHeaderA();
    expect(headerA.meta.group!.items!.every(c => c.meta.selector!.isSelected)).toBe(true);
  }));
});

describe('selector.preserveSelection — giữ selection xuyên trang/filter/reload', () => {
  interface Row { id: number; name: string; }

  const PAGE = (start: number, size: number): Row[] =>
    Array.from({ length: size }, (_, i) => ({ id: start + i, name: `R${start + i}` }));

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
