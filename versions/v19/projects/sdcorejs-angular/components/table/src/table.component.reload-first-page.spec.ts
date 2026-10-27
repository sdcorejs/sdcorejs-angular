import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import type { PagingReq } from '@sdcorejs/utils/models';
import { SdTableOption } from './models/table-option.model';
import { SdTable } from './table.component';

interface Row {
  id: number;
  name: string;
}
type ServerOption = Extract<SdTableOption<Row>, { type: 'server' }>;

describe('SdTable reloadFirstPage', () => {
  let fixture: ComponentFixture<SdTable<Row>>;
  let table: SdTable<Row>;
  let loader: jasmine.Spy<ServerOption['items']>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SdTable, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SdTable<Row>);
    table = fixture.componentInstance;
    loader = jasmine.createSpy<ServerOption['items']>('rows').and.callFake(async (_filter, req: PagingReq<Row>) => {
      const start = (req.pageNumber ?? 0) * (req.pageSize ?? 10);
      return { items: Array.from({ length: 10 }, (_, index) => ({ id: start + index, name: `Row ${start + index}` })), total: 45 };
    });
    fixture.componentRef.setInput('option', {
      type: 'server',
      items: loader,
      paginate: { pageSize: 10 },
      columns: [{ field: 'name', title: 'Name', type: 'string' }],
    } satisfies ServerOption);
  });

  afterEach(() => fixture.destroy());

  const lastPage = (): number | undefined => loader.calls.mostRecent().args[1].pageNumber;

  it('reads the first page again, while reload() keeps the current page', fakeAsync(() => {
    fixture.detectChanges();
    flushMicrotasks();
    tick(1000);
    fixture.detectChanges();

    table.paginator()!.pageIndex = 3;
    table.reload();
    flushMicrotasks();
    tick(1000);
    expect(lastPage()).toBe(3);

    table.reloadFirstPage();
    flushMicrotasks();
    tick(1000);
    expect(lastPage()).toBe(0);
    expect(table.paginator()!.pageIndex).toBe(0);
  }));
});
