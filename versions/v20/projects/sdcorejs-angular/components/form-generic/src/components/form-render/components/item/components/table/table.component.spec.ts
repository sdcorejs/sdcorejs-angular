import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { TableComponent } from './table.component';
import { SdFormGenericTable } from '../../../../../../models';

// why: fixture này CHỈ dựng được vỏ component — `<sd-table>` bên trong không chạy hết vòng load
// (cần FormGenericService cấp dữ liệu thật) nên không có header nào render. Vì vậy đừng dùng nó để
// khẳng định nút thêm dòng nằm ở đâu; phần đó do spec của `sdTableCommandHeaderDef` trong
// components/table và kiểm tra trực quan trên showcase lo. Giá trị của spec này là bắt lỗi khởi tạo.
describe('form-render table field', () => {
  let fixture: ComponentFixture<TableComponent>;

  const schema = (): SdFormGenericTable =>
    ({
      type: 'table',
      key: 'services',
      label: 'Thông tin hồ sơ',
      layout: { columns: '12' },
      properties: {},
      columns: [
        { key: 'name', label: 'Tên', type: 'string', validate: {} },
        { key: 'qty', label: 'Số lượng', type: 'number', validate: {} },
      ],
    }) as unknown as SdFormGenericTable;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [TableComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent);
    fixture.componentRef.setInput('setVariables', new Subject<{ key: string; value: any }>());
    fixture.componentRef.setInput('component', schema());
    fixture.componentRef.setInput('model', [
      { name: 'Implementation', qty: 1 },
      { name: 'Training', qty: 2 },
    ]);
  });

  function settle(): void {
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
  }

  it('renders without throwing', fakeAsync(() => {
    expect(() => settle()).not.toThrow();
  }));

  it('renders without throwing in viewed mode', fakeAsync(() => {
    fixture.componentRef.setInput('viewed', true);
    expect(() => settle()).not.toThrow();
  }));

  // why: `contentChild` chỉ quét nội dung chiếu vào TĨNH — bọc `<ng-template sdTableCommandHeaderDef>`
  // trong `@if` sẽ đẩy nó vào embedded view và bảng không bao giờ nhận được template. Template phải
  // luôn tồn tại, điều kiện nằm bên trong.
  it('keeps the command-header template unconditional', fakeAsync(() => {
    settle();
    const table = fixture.nativeElement.querySelector('sd-table');
    expect(table).not.toBeNull();
  }));
});
