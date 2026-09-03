/**
 * Regression tests cho lớp lỗi "binding cấp phát / tính lại ở MỖI change-detection pass"
 * trong sd-table.
 *
 * Điểm chung của các assert ở đây: KHÔNG chỉ kiểm tra output đúng, mà kiểm tra
 * (a) reference ổn định qua nhiều CD pass, và/hoặc (b) call-count chứng minh công việc
 * không bị lặp lại mỗi pass.
 */
import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableItem } from './models/table-item.model';
import { SdTableGroupDefDirective } from './directives/sd-table-group-def.directive';
import { DesktopCommand } from './components/command/desktop-command.component';

interface Row {
  id: number;
  name: string;
  group?: string;
}

const noop = () => undefined;

/** Chạy hết pipeline load (debounce 200ms + format async) rồi settle DOM. */
function settle<T>(fixture: ComponentFixture<T>) {
  fixture.detectChanges();
  tick(800);
  flush();
  fixture.detectChanges();
  tick();
  flush();
  fixture.detectChanges();
}

function tableOf<T>(fixture: ComponentFixture<T>): SdTable<Row> {
  return fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
}

// ============================================================================
// Item 2 — header select-all: computed thay cho pipe async + setTimeout(500)
// ============================================================================
describe('sd-table — select-all header (không còn timer 500ms)', () => {
  @Component({
    changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    opt: SdTableOption<Row> = {
      type: 'server',
      items: () =>
        Promise.resolve({
          items: [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
          ],
          total: 2,
        }),
      selector: { visible: true, actions: [{ title: 'Duyệt', click: noop }] },
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('visibleSelectAll() true NGAY trong pass render đầu — không cần chờ 500ms', fakeAsync(() => {
    settle(fixture);
    const table = tableOf(fixture);

    // why: bản cũ đọc meta.selector.actions do pipe ở cell BODY ghi, mà header render
    // TRƯỚC body → phải sleep 500ms mới có dữ liệu. Computed tự tính nên đúng ngay.
    expect(table.visibleSelectAll()).toBe(true);

    const headerCheckbox = fixture.nativeElement.querySelector('th.cdk-column-sdSelection mat-checkbox');
    expect(headerCheckbox).toBeTruthy();
  }));

  it('không tạo timer nào cho quyết định select-all (fakeAsync queue sạch sau khi render)', fakeAsync(() => {
    settle(fixture);
    const table = tableOf(fixture);

    for (let i = 0; i < 5; i++) table.detectChanges();

    // Nếu còn timer 500ms tồn đọng, fakeAsync sẽ ném "timer(s) still in the queue".
    expect(table.visibleSelectAll()).toBe(true);
  }));

  it('false khi selector.single', fakeAsync(() => {
    fixture.componentInstance.opt = {
      ...fixture.componentInstance.opt,
      selector: { visible: true, single: true, actions: [{ title: 'Duyệt', click: noop }] },
    } as SdTableOption<Row>;
    settle(fixture);

    expect(tableOf(fixture).visibleSelectAll()).toBe(false);
    expect(fixture.nativeElement.querySelector('th.cdk-column-sdSelection mat-checkbox')).toBeNull();
  }));
});

// ============================================================================
// Item 3 — desktop-command: dataIndex thay cho groupedItems.indexOf(item)
// ============================================================================
describe('sd-table — command cell dùng dataIndex (không quét mảng mỗi CD pass)', () => {
  @Component({
    changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    opt: SdTableOption<Row> = {
      type: 'server',
      items: () =>
        Promise.resolve({
          items: [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
            { id: 3, name: 'C' },
          ],
          total: 3,
        }),
      commands: [{ title: 'Sửa', click: noop } as never],
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('itemIndex nhận đúng 0,1,2 theo dataIndex của CDK', fakeAsync(() => {
    settle(fixture);
    const commands = fixture.debugElement.queryAll(By.directive(DesktopCommand)).map(d => d.componentInstance as DesktopCommand);

    expect(commands.length).toBe(3);
    expect(commands.map(c => c.itemIndex())).toEqual([0, 1, 2]);
  }));

  it('KHÔNG gọi Array.indexOf trên SdTableItem trong các CD pass tiếp theo', fakeAsync(() => {
    settle(fixture);
    const table = tableOf(fixture);

    // why: bản cũ bind `groupedItems.indexOf(item)` → quét toàn mảng cho MỖI dòng ở
    // MỖI pass (O(n²) trên đường render). Đếm trực tiếp lượt tra cứu SdTableItem.
    // `table.detectChanges()` chứ KHÔNG phải `fixture.detectChanges()`: sd-table là
    // OnPush nên pass từ host sẽ bỏ qua view của nó → assert sẽ vô nghĩa.
    const original = Array.prototype.indexOf;
    let itemLookups = 0;
    spyOn(Array.prototype, 'indexOf').and.callFake(function (this: unknown[], search: unknown, fromIndex?: number) {
      if (search && typeof search === 'object' && 'meta' in (search as Record<string, unknown>)) itemLookups++;
      return original.call(this, search, fromIndex);
    });

    for (let i = 0; i < 3; i++) table.detectChanges();

    expect(itemLookups).toBe(0);
  }));

  it('rowCommands() giữ NGUYÊN reference qua các CD pass (không cấp phát [] mỗi pass)', fakeAsync(() => {
    settle(fixture);
    const table = tableOf(fixture);

    const first = table.rowCommands();
    table.detectChanges();
    table.detectChanges();

    expect(table.rowCommands()).toBe(first);
  }));

  it('rowCommands() trả CÙNG một mảng rỗng khi option không khai báo command', fakeAsync(() => {
    fixture.componentInstance.opt = { ...fixture.componentInstance.opt, commands: undefined } as SdTableOption<Row>;
    settle(fixture);
    const table = tableOf(fixture);

    expect(table.rowCommands()).toBe(table.rowCommands());
    expect(table.rowCommands().length).toBe(0);
  }));
});

// ============================================================================
// Items 4 + 5 — group header: context precompute + selection state cache
// ============================================================================
describe('sd-table — group header context + selection cache', () => {
  @Component({
    changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
    standalone: true,
    imports: [SdTable, SdTableGroupDefDirective],
    template: `
      <sd-table [option]="opt">
        <ng-template sdTableGroupDef let-values="values" let-data="data">
          <span class="spec-group-label">{{ values.group }} ({{ data.length }})</span>
        </ng-template>
      </sd-table>
    `,
  })
  class HostComponent {
    opt: SdTableOption<Row> = {
      type: 'server',
      items: () =>
        Promise.resolve({
          items: [
            { id: 1, name: 'A', group: 'G1' },
            { id: 2, name: 'B', group: 'G1' },
            { id: 3, name: 'C', group: 'G2' },
          ],
          total: 3,
        }),
      group: { fields: ['group'] },
      selector: { visible: true },
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;
  let table: SdTable<Row>;

  const headerOf = (key: string): SdTableItem<Row> =>
    table.groupHost.headers.find(h => h.meta.group?.values?.['group'] === key) as SdTableItem<Row>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('groupContext(header) trả CÙNG một reference qua nhiều lần gọi / CD pass', fakeAsync(() => {
    settle(fixture);
    table = tableOf(fixture);
    const header = headerOf('G1');

    const ctx = table.groupContext(header);
    table.detectChanges();
    table.detectChanges();

    expect(table.groupContext(header)).toBe(ctx);
    expect(table.groupContext(header)).toBe(table.groupContext(header));
  }));

  it('context.data dùng lại mảng đã precompute trên meta.group (không map lại mỗi pass)', fakeAsync(() => {
    settle(fixture);
    table = tableOf(fixture);
    const header = headerOf('G1');

    expect(table.groupContext(header).data).toBe(header.meta.group!.data!);
    expect(header.meta.group!.data!.length).toBe(2);

    const dataRef = table.groupContext(header).data;
    table.detectChanges();
    expect(table.groupContext(header).data).toBe(dataRef);
  }));

  it('group header checkbox phản ánh selection ngay ở lần render ĐẦU TIÊN', fakeAsync(() => {
    settle(fixture);
    table = tableOf(fixture);
    const header = headerOf('G1');

    // Chọn sẵn mọi child, mô phỏng defaultSelected/preserveSelection chạy trong #render.
    for (const child of header.meta.group!.items!) child.meta.selector!.isSelected = true;
    table.detectChanges();

    // why: đây là ca đã hỏng khi checkbox đọc cache `meta.group.isSelected`. Cache do SdGroupPipe
    // ghi lúc DỰNG header, thời điểm đó `selector.selectable` của children vẫn là mặc định `false`
    // (chỉ SdSelectionVisiblePipe ở cell BODY mới đặt đúng, mà CDK dựng header TRƯỚC body) → pipe
    // đếm được `total = 0` → khoá cứng `isSelected = false`. Pipe là pure nên không bao giờ tự sửa.
    expect(table.isGroupAllSelected(header)).toBeTrue();
    expect(table.groupContext(header).isSelected).toBeTrue();
  }));

  it('groupContext giữ NGUYÊN reference nhưng làm tươi selection mỗi lần đọc', fakeAsync(() => {
    settle(fixture);
    table = tableOf(fixture);
    const header = headerOf('G1');

    const first = table.groupContext(header);
    expect(first.isSelected).toBeFalse();

    for (const child of header.meta.group!.items!) child.meta.selector!.isSelected = true;
    const second = table.groupContext(header);

    // Reference ổn định → ngTemplateOutlet không dựng lại embedded view...
    expect(second).toBe(first);
    // ...nhưng giá trị phải tươi.
    expect(second.isSelected).toBeTrue();
  }));

  it('meta.group.isSelected/indeterminate được cache và cập nhật theo selection', fakeAsync(() => {
    settle(fixture);
    table = tableOf(fixture);
    const header = headerOf('G1');

    expect(header.meta.group!.isSelected).toBe(false);
    expect(header.meta.group!.indeterminate).toBe(false);

    // Chọn 1/2 child → indeterminate
    const firstChild = header.meta.group!.items![0];
    firstChild.meta.selector!.isSelected = true;
    table.onSelect(firstChild);
    expect(header.meta.group!.isSelected).toBe(false);
    expect(header.meta.group!.indeterminate).toBe(true);

    // Chọn cả group → isSelected
    table.onSelectGroup(header, true);
    expect(header.meta.group!.isSelected).toBe(true);
    expect(header.meta.group!.indeterminate).toBe(false);

    // Bỏ chọn hết
    table.onSelectGroup(header, false);
    expect(header.meta.group!.isSelected).toBe(false);
    expect(header.meta.group!.indeterminate).toBe(false);
  }));

  it('context được đồng bộ TẠI CHỖ khi selection đổi (giữ reference, giá trị mới)', fakeAsync(() => {
    settle(fixture);
    table = tableOf(fixture);
    const header = headerOf('G1');
    const ctx = table.groupContext(header);

    table.onSelectGroup(header, true);

    expect(table.groupContext(header)).toBe(ctx);
    expect(ctx.isSelected).toBe(true);
  }));

  it('checkbox của group header render theo state đã cache', fakeAsync(() => {
    settle(fixture);
    table = tableOf(fixture);
    const header = headerOf('G1');

    table.onSelectGroup(header, true);
    fixture.detectChanges();

    const groupCheckbox = fixture.nativeElement.querySelector('.sd-group-selection-slot input[type=checkbox]') as HTMLInputElement;
    expect(groupCheckbox?.checked).toBe(true);
  }));

  it('context.toggleSelect() chọn/bỏ chọn cả group qua host callback', fakeAsync(() => {
    settle(fixture);
    table = tableOf(fixture);
    const header = headerOf('G1');

    table.groupContext(header).toggleSelect();
    expect(header.meta.group!.items!.every(c => c.meta.selector!.isSelected)).toBe(true);

    table.groupContext(header).toggleSelect();
    expect(header.meta.group!.items!.some(c => c.meta.selector!.isSelected)).toBe(false);
  }));

  it('group header có id duy nhất + ổn định theo group key', fakeAsync(() => {
    settle(fixture);
    table = tableOf(fixture);

    const ids = table.groupHost.headers.map(h => h.meta.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => id.startsWith('sd-group-'))).toBe(true);

    const before = headerOf('G1').meta.id;
    fixture.detectChanges();
    expect(headerOf('G1').meta.id).toBe(before);
  }));
});

// ============================================================================
// Item 6 — style.rowCss resolve 1 lần/render vào meta.rowStyle
// ============================================================================
describe('sd-table — rowCss resolve một lần mỗi render', () => {
  const rowCssSpy = jasmine.createSpy('rowCss').and.callFake((row: Row) => ({ color: row.id % 2 ? 'red' : 'blue' }));

  @Component({
    changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    opt: SdTableOption<Row> = {
      type: 'server',
      items: () =>
        Promise.resolve({
          items: [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
            { id: 3, name: 'C' },
          ],
          total: 3,
        }),
      style: { rowCss: rowCssSpy },
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    rowCssSpy.calls.reset();
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('KHÔNG gọi lại rowCss ở các CD pass sau khi đã render', fakeAsync(() => {
    settle(fixture);
    const table = tableOf(fixture);
    rowCssSpy.calls.reset();

    // why: bản cũ bind `[ngStyle]="rowStyle(row)"` → callback của consumer chạy cho TỪNG
    // dòng ở MỖI pass. Sau khi render xong, thêm pass KHÔNG được gọi lại lần nào.
    for (let i = 0; i < 5; i++) table.detectChanges();

    expect(rowCssSpy).not.toHaveBeenCalled();
  }));

  it('mỗi lần render gọi rowCss đúng 1 lần cho mỗi row', fakeAsync(() => {
    settle(fixture);
    const table = tableOf(fixture);
    rowCssSpy.calls.reset();

    table.reload();
    tick(800);
    flush();
    fixture.detectChanges();

    expect(rowCssSpy.calls.count()).toBe(3);
    expect(rowCssSpy.calls.allArgs().map(([row]) => (row as Row).id)).toEqual([1, 2, 3]);
  }));

  it('meta.rowStyle giữ NGUYÊN reference qua các CD pass', fakeAsync(() => {
    settle(fixture);
    const table = tableOf(fixture);
    const row = table.items()[0];
    const styleRef = row.meta.rowStyle;

    expect(styleRef).toEqual({ color: 'red' });
    table.detectChanges();
    table.detectChanges();

    expect(row.meta.rowStyle).toBe(styleRef!);
  }));

  it('áp style lên DOM của row', fakeAsync(() => {
    settle(fixture);
    const rows = fixture.nativeElement.querySelectorAll('tr.c-row') as NodeListOf<HTMLElement>;

    expect(rows.length).toBe(3);
    expect(rows[0].style.color).toBe('red');
    expect(rows[1].style.color).toBe('blue');
  }));

  it('meta.rowStyle = null khi option không cấu hình rowCss', fakeAsync(() => {
    fixture.componentInstance.opt = { ...fixture.componentInstance.opt, style: {} } as SdTableOption<Row>;
    settle(fixture);
    const table = tableOf(fixture);

    expect(table.items().every(i => i.meta.rowStyle === null)).toBe(true);
    expect(rowCssSpy).not.toHaveBeenCalled();
  }));
});

// ============================================================================
// Item 7 — row identity: rowKey do caller cấp, không hash nội dung
// ============================================================================
describe('sd-table — row identity (option.rowKey)', () => {
  @Component({
    changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
    standalone: true,
    imports: [SdTable],
    template: `<sd-table [option]="opt"></sd-table>`,
  })
  class HostComponent {
    opt: SdTableOption<Row> = {
      type: 'server',
      rowKey: 'id',
      items: () =>
        Promise.resolve({
          items: [
            { id: 1, name: 'Trùng' },
            { id: 2, name: 'Trùng' },
          ],
          total: 2,
        }),
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
    } as SdTableOption<Row>;
  }

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('meta.id lấy từ option.rowKey và trackBy trả đúng giá trị đó', fakeAsync(() => {
    settle(fixture);
    const table = tableOf(fixture);

    expect(table.items().map(i => i.meta.id)).toEqual(['1', '2']);
    expect(table.trackBy(0, table.items()[0])).toBe('1');
  }));

  it('2 row TRÙNG nội dung vẫn có id khác nhau khi không có rowKey', fakeAsync(() => {
    fixture.componentInstance.opt = { ...fixture.componentInstance.opt, rowKey: undefined } as SdTableOption<Row>;
    settle(fixture);
    const table = tableOf(fixture);

    const [a, b] = table.items();
    expect(a.meta.id).not.toBe(b.meta.id);
    expect(table.items().length).toBe(2);
  }));

  it('id sống sót qua một lần reload của server (cùng rowKey)', fakeAsync(() => {
    settle(fixture);
    const table = tableOf(fixture);
    const before = table.items().map(i => i.meta.id);

    table.reload();
    tick(800);
    flush();
    fixture.detectChanges();

    expect(table.items().map(i => i.meta.id)).toEqual(before);
  }));
});
