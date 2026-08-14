import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableItem } from './models/table-item.model';
import { SdGroupPipe } from './pipes/sd-group.pipe';
import { buildColumnWidthMap } from './services/column-width.util';
import { SdTableCommandHeaderDefDirective } from './directives/sd-table-command-header-def.directive';

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

  // ── A11y ──────────────────────────────────────────────────────────────
  // why: bảng tải BẤT ĐỒNG BỘ nhưng trước đây spinner chỉ là hình ảnh — không có live region nào
  // báo cho screen reader biết đang tải hay bảng đã trả về 0 dòng.

  // why: nội dung bảng chỉ render sau khi vòng load (debounce ~800ms) chạy xong. `beforeEach` gọi
  // detectChanges NGOÀI fakeAsync nên timer đầu tiên nằm ở zone thật và `tick()` không flush được —
  // phải set lại option BÊN TRONG fakeAsync để vòng load chạy trong fake zone rồi mới tick.
  const settleWith = (option: SdTableOption<EmployeeRow>) => {
    host.tableOption.set(option);
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
  };

  const employeeOption = (): SdTableOption<EmployeeRow> => ({
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

  it('announces the loading state through a polite live region and marks the grid busy', fakeAsync(() => {
    settleWith(employeeOption());
    const tableComponent = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<EmployeeRow>;

    tableComponent.loading.set(true);
    fixture.detectChanges();

    const status = sdTableEl.querySelector('.c-loading') as HTMLElement;
    expect(status).not.toBeNull();
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-label')).toBeTruthy();
    expect(sdTableEl.querySelector('.c-table')?.getAttribute('aria-busy')).toBe('true');

    tableComponent.loading.set(false);
    fixture.detectChanges();

    expect(sdTableEl.querySelector('.c-table')?.getAttribute('aria-busy')).toBeNull();
    flush();
  }));

  it('announces the empty state through a polite live region', fakeAsync(() => {
    settleWith({
      type: 'local',
      items: () => [],
      columns: [{ field: 'id', type: 'number', title: 'ID' }],
    });

    const empty = sdTableEl.querySelector('.c-no-data-row') as HTMLElement;
    expect(empty).not.toBeNull();
    expect(empty.getAttribute('role')).toBe('status');
    expect(empty.getAttribute('aria-live')).toBe('polite');
    flush();
  }));

  // why: header sắp xếp từng mang aria-hidden="true". `mat-sort-header` tự gắn role="button" +
  // tabindex + aria-sort lên chính div đó, nên aria-hidden xoá cả tên cột lẫn hướng sắp xếp khỏi
  // accessibility tree → người dùng screen reader mất hoàn toàn khả năng sắp xếp bảng.
  it('keeps the sortable column headers in the accessibility tree', fakeAsync(() => {
    settleWith(employeeOption());
    const headers = Array.from(sdTableEl.querySelectorAll<HTMLElement>('.c-header-title'));
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach(header => expect(header.hasAttribute('aria-hidden')).toBe(false));
    expect(headers.some(header => header.hasAttribute('aria-sort'))).toBe(true);
    flush();
  }));
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

describe('empty result reload action', () => {
  interface Row {
    id: number;
    name: string;
  }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table autoId="empty-result" [option]="tableOption"></sd-table>`,
  })
  class EmptyResultReloadHostComponent {
    itemsSpy = jasmine.createSpy('items').and.callFake(() => Promise.resolve({ items: [], total: 0 }));
    tableOption: SdTableOption<Row> = {
      type: 'server',
      items: this.itemsSpy,
      reload: { visible: true },
      export: { visible: 'ALL' },
      paginate: { pageSize: 20 },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EmptyResultReloadHostComponent] });
  });

  function createLoadedFixture(): ComponentFixture<EmptyResultReloadHostComponent> {
    const fixture = TestBed.createComponent(EmptyResultReloadHostComponent);
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
    return fixture;
  }

  function getReloadButton(fixture: ComponentFixture<EmptyResultReloadHostComponent>): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(
      'button[data-autoid="components-button-components-table-empty-result-reload"]'
    ) as HTMLButtonElement | null;
  }

  it('keeps reload enabled when the server returns no rows', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const reloadButton = getReloadButton(fixture);

    expect(reloadButton).withContext('reload action must remain rendered for an empty result').not.toBeNull();
    expect(reloadButton!.disabled).withContext('empty rows must not disable reload').toBeFalse();

    fixture.destroy();
  }));

  it('refetches an empty server result when reload is clicked', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const host = fixture.componentInstance;
    const reloadButton = getReloadButton(fixture)!;
    host.itemsSpy.calls.reset();

    reloadButton.click();
    tick();
    flush();

    expect(host.itemsSpy).toHaveBeenCalledTimes(1);

    fixture.destroy();
  }));

  it('keeps export hidden for an empty result', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const exportButton = fixture.nativeElement.querySelector(
      'button[data-autoid="components-button-components-table-empty-result-export"]'
    );

    expect(exportButton).toBeNull();

    fixture.destroy();
  }));

  it('keeps the paginator hidden when total is zero', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const paginator = fixture.nativeElement.querySelector('mat-paginator') as HTMLElement;

    expect(paginator.classList.contains('d-none')).toBeTrue();

    fixture.destroy();
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

describe('selector disabled select-all', () => {
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
    rows: Row[] = [
      { id: 1, name: 'Enabled' },
      { id: 2, name: 'Disabled' },
    ];
    action = { title: 'Process', click: () => undefined };
    onSelectAllSpy = jasmine.createSpy('onSelectAll');
    opt: SdTableOption<Row> = {
      type: 'local',
      items: () => this.rows,
      selector: {
        visible: true,
        actions: [this.action],
        disabled: current => current?.id === 2,
        onSelectAll: this.onSelectAllSpy,
      },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let table: SdTable<Row>;

  function settleTable() {
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
    tick();
    flush();
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('select-all skips a row disabled by the selector predicate', fakeAsync(() => {
    settleTable();

    expect(table.items()[0].meta.selector!.selectable).toBeTrue();
    expect(table.items()[1].meta.selector!.selectable).toBeFalse();

    table.isSelectAll.set(true);
    table.onSelectAll();

    expect(table.items()[0].meta.selector!.isSelected).toBeTrue();
    expect(table.items()[1].meta.selector!.isSelected).toBeFalse();
    expect(host.onSelectAllSpy).toHaveBeenCalledOnceWith([host.rows[0]]);
  }));

  it('resets the header when no row is selectable', fakeAsync(() => {
    host.opt.selector!.disabled = () => true;
    settleTable();

    expect(table.items().every(item => item.meta.selector!.selectable === false)).toBeTrue();

    table.isSelectAll.set(true);
    table.onSelectAll();

    expect(table.items().every(item => item.meta.selector!.isSelected === false)).toBeTrue();
    expect(host.onSelectAllSpy).toHaveBeenCalledOnceWith([]);
    expect(table.isSelectAll()).toBeFalse();
  }));

  it('checks the header after initial eligibility resolves when every selectable row is default-selected', fakeAsync(() => {
    host.opt.selector!.defaultSelected = current => current.id === 1;

    settleTable();

    expect(table.items()[0].meta.selector!.isSelected).toBeTrue();
    expect(table.items()[1].meta.selector!.selectable).toBeFalse();
    expect(table.isSelectAll()).toBeTrue();
  }));
});

describe('selector action-dependent header state', () => {
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
    rows: Row[] = [
      { id: 1, name: 'Action A' },
      { id: 2, name: 'Action B' },
    ];
    actionA = {
      title: 'Action A',
      hidden: (current?: Row) => current?.id !== 1,
      click: () => undefined,
    };
    actionB = {
      title: 'Action B',
      hidden: (current?: Row) => current?.id !== 2,
      click: () => undefined,
    };
    opt: SdTableOption<Row> = {
      type: 'local',
      items: () => this.rows,
      selector: {
        visible: true,
        actions: [this.actionA, this.actionB],
      },
      columns: [
        { field: 'id', type: 'number', title: 'ID' },
        { field: 'name', type: 'string', title: 'Name' },
      ],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;
  let table: SdTable<Row>;

  function settleTable() {
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
    tick();
    flush();
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('recomputes the header after row selection changes action compatibility', fakeAsync(() => {
    settleTable();
    const [rowA, rowB] = table.items();
    expect(rowA.meta.selector!.selectable).toBeTrue();
    expect(rowB.meta.selector!.selectable).toBeTrue();

    rowA.meta.selector!.isSelected = true;
    table.onSelect(rowA);
    fixture.detectChanges();

    expect(rowB.meta.selector!.selectable).toBeFalse();
    expect(table.isSelectAll()).toBeTrue();
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
      <div class="table-shell bare-table">
        <sd-table [option]="bareOption"></sd-table>
      </div>
    `,
    styles: [
      `
        .table-shell {
          width: 600px;
          height: 240px;
        }

        :host ::ng-deep .d-none {
          display: none !important;
        }
      `,
    ],
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

    // Bảng trần: không phân trang, không reload/export/config → footer không có gì để hiện.
    bareOption: SdTableOption<Row> = {
      type: 'local',
      items: () => [{ id: 1, name: 'Only row' }],
      paginate: { hidden: true },
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

    expect(getComputedStyle(paginator).display).withContext('short data set should hide mat-paginator').toBe('none');
    expect(paginatorFooter.querySelector('sd-button')).withContext('fixture must render a footer action button').not.toBeNull();
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

  // why: hai lỗi ngược nhau của cùng một nguyên nhân — khoảng đệm đặt trên container thay vì trên
  // nội dung. Không có gì để hiện thì footer vẫn giữ 10px; còn khi chỉ có dòng "Đang hiển thị" thì
  // dòng đó không được đệm và bị bó sát mép.
  it('collapses the footer entirely when it has nothing to show', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const table = fixture.nativeElement.querySelector('.bare-table sd-table') as HTMLElement;
    const paginatorFooter = table.querySelector('.c-paginator') as HTMLElement;
    const paginator = table.querySelector('mat-paginator') as HTMLElement;

    expect(getComputedStyle(paginator).display).toBe('none');
    expect(paginatorFooter.querySelector('sd-button')).toBeNull();
    expect(paginatorFooter.querySelector('.c-summary')).withContext('hidden paginator hides the summary too').toBeNull();
    expect(paginatorFooter.getBoundingClientRect().height).withContext('an empty footer must not reserve any height').toBe(0);

    fixture.destroy();
  }));

  it('gives the showing-summary its own breathing room', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const table = fixture.nativeElement.querySelector('.summary-table sd-table') as HTMLElement;
    const summary = table.querySelector('.c-summary') as HTMLElement;

    expect(summary).withContext('short data set must render the summary').not.toBeNull();
    const padding = getComputedStyle(summary);
    expect(parseFloat(padding.paddingTop)).toBeGreaterThanOrEqual(4);
    expect(parseFloat(padding.paddingBottom)).toBeGreaterThanOrEqual(4);
    expect(summary.getBoundingClientRect().height).withContext('summary must not be squeezed flat').toBeGreaterThanOrEqual(28);

    fixture.destroy();
  }));

  // why: Material sơn nền paginator bằng --mat-sys-surface, khác màu nền của footer, nên nửa phải
  // của thanh footer hiện ra như một mảng màu riêng.
  it('lets the paginator inherit the footer background instead of painting its own', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const table = fixture.nativeElement.querySelector('.visible-paginator-table sd-table') as HTMLElement;
    const paginator = table.querySelector('mat-paginator') as HTMLElement;

    expect(getComputedStyle(paginator).backgroundColor).toBe('rgba(0, 0, 0, 0)');

    fixture.destroy();
  }));

  // why: ngưỡng cũ là >= 56px, tức đúng min-height mặc định của Material. Bảng này là UI dày đặc
  // (dòng 36px) nên footer được hạ xuống qua token; phép đo giờ khoá KHOẢNG cao hợp lệ — vẫn phải
  // dựng đủ chỗ cho paginator, nhưng không được quay lại 56px.
  it('keeps the visible paginator compact', fakeAsync(() => {
    const fixture = createLoadedFixture();
    const table = fixture.nativeElement.querySelector('.visible-paginator-table sd-table') as HTMLElement;
    const paginatorFooter = table.querySelector('.c-paginator') as HTMLElement;
    const paginator = table.querySelector('mat-paginator') as HTMLElement;
    const container = paginator.querySelector('.mat-mdc-paginator-container') as HTMLElement;
    const nextButton = paginator.querySelector('.mat-mdc-paginator-navigation-next') as HTMLElement;

    expect(getComputedStyle(paginator).display).not.toBe('none');
    expect(container.getBoundingClientRect().height).withContext('paginator row must not fall back to the 56px default').toBeLessThan(56);
    expect(paginatorFooter.getBoundingClientRect().height).withContext('footer still has to fit the paginator').toBeGreaterThanOrEqual(40);
    expect(nextButton.getBoundingClientRect().height)
      .withContext('page buttons keep the smaller hover state layer')
      .toBeLessThanOrEqual(32);

    fixture.destroy();
  }));
});

// ---------------------------------------------------------------------------
// sdTableCommandHeaderDef — nội dung cho ô header của cột command
// ---------------------------------------------------------------------------

describe('sdTableCommandHeaderDef', () => {
  interface Row {
    id: number;
    name: string;
  }

  const rowOption = (): SdTableOption<Row> => ({
    type: 'local',
    items: () => [
      { id: 1, name: 'Implementation' },
      { id: 2, name: 'Training' },
    ],
    commands: [{ icon: 'edit', click: () => undefined }],
    columns: [
      { field: 'id', type: 'number', title: 'ID' },
      { field: 'name', type: 'string', title: 'Name' },
    ],
  });

  @Component({
    standalone: true,
    imports: [SdTable, SdTableCommandHeaderDefDirective],
    template: `
      <sd-table [option]="option">
        <ng-template sdTableCommandHeaderDef>
          <button type="button" class="add-row" (click)="added = added + 1">+</button>
        </ng-template>
      </sd-table>
    `,
  })
  class WithHeaderHost {
    option = rowOption();
    added = 0;
  }

  @Component({
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="option"></sd-table>`,
  })
  class WithoutHeaderHost {
    option = rowOption();
  }

  function settle(fixture: ComponentFixture<WithHeaderHost | WithoutHeaderHost>): void {
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
  }

  function commandHeader(fixture: ComponentFixture<WithHeaderHost | WithoutHeaderHost>): HTMLElement {
    const host = fixture.nativeElement as HTMLElement;
    // why: mat-table gắn `mat-column-<matColumnDef>` lên mọi cell — bám vào đó thay vì đoán vị trí,
    // vì cột command sticky ở ĐẦU khi `command.align` không phải 'right'.
    const header = host.querySelector<HTMLElement>('th.mat-column-sdCommand');
    if (!header) throw new Error('command header cell not rendered');
    return header;
  }

  it('renders the projected template inside the command header cell', fakeAsync(() => {
    const fixture = TestBed.createComponent(WithHeaderHost);
    settle(fixture);

    const header = commandHeader(fixture);
    expect(header.querySelector('.add-row')).withContext('projected content must land in the command header').not.toBeNull();

    fixture.destroy();
  }));

  it('keeps the projected control interactive', fakeAsync(() => {
    const fixture = TestBed.createComponent(WithHeaderHost);
    settle(fixture);

    commandHeader(fixture).querySelector<HTMLElement>('.add-row')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.added).toBe(1);

    fixture.destroy();
  }));

  // why: ô header của cột command vốn trống — không khai báo template thì nó phải TIẾP TỤC trống,
  // không sinh thêm wrapper hay chiều cao nào.
  it('leaves the command header empty when no template is projected', fakeAsync(() => {
    const fixture = TestBed.createComponent(WithoutHeaderHost);
    settle(fixture);

    const header = commandHeader(fixture);
    expect(header.querySelector('.sd-command-header')).toBeNull();
    expect(header.textContent?.trim()).toBe('');

    fixture.destroy();
  }));
});
