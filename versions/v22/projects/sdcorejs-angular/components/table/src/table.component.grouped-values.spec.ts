import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { ColumnFilterComponent } from './components/filter/column-filter/column-filter.component';
import { SdTableColumn } from './models/table-column.model';
import { SdTableOption } from './models/table-option.model';
import { SdTable } from './table.component';

// A `values` column under a grouped header (`type: 'children'`) never had its list loaded: the table loaded lookups
// for top-level columns only. Its cells showed the raw codes, and with `items` as a function its filter list was empty.

interface Order {
  id: number;
  code: string;
  status: string;
  channel: number;
  stage: string;
}

type LocalOption = Extract<SdTableOption<Order>, { type: 'local' }>;

const STATUSES = [
  { id: 'new', name: 'Chờ xác nhận' },
  { id: 'done', name: 'Hoàn tất' },
];
const CHANNELS = [
  { id: 1, name: 'Website' },
  { id: 2, name: 'Shopee' },
];
const STAGES = signal([
  { id: 'pack', name: 'Đóng gói' },
  { id: 'ship', name: 'Vận chuyển' },
]);

const ROWS: Order[] = [
  { id: 1, code: 'DH-1', status: 'new', channel: 2, stage: 'ship' },
  { id: 2, code: 'DH-2', status: 'done', channel: 1, stage: 'pack' },
];

describe('SdTable values lookups under a grouped header', () => {
  let fixture: ComponentFixture<SdTable<Order>>;
  let table: SdTable<Order>;
  let channels: jasmine.Spy;

  const columns = (): SdTableColumn<Order>[] => [
    { field: 'code', title: 'Mã', type: 'string' },
    {
      field: 'detail',
      title: 'Chi tiết',
      type: 'children',
      children: [
        { field: 'status', title: 'Trạng thái', type: 'values', option: { items: STATUSES, valueField: 'id', displayField: 'name' } },
        { field: 'channel', title: 'Kênh', type: 'values', option: { items: channels, valueField: 'id', displayField: 'name' } },
        { field: 'stage', title: 'Công đoạn', type: 'values', option: { items: STAGES, valueField: 'id', displayField: 'name' } },
      ],
    },
  ];

  const settle = () => {
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
  };

  const cells = (field: string): string[] =>
    Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll(`tbody td.mat-column-${field}`)).map(cell => cell.textContent!.trim());

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [SdTable, NoopAnimationsModule],
      providers: [{ provide: SdViewportService, useValue: { isMobile: signal(false) } }],
    });
    channels = jasmine.createSpy('channels').and.callFake(() => Promise.resolve(CHANNELS));
    fixture = TestBed.createComponent(SdTable<Order>);
    table = fixture.componentInstance;
    fixture.componentRef.setInput('autoId', 'orders');
    fixture.componentRef.setInput('option', { type: 'local', items: () => ROWS, columns: columns() } satisfies LocalOption);
    settle();
  }));

  afterEach(() => fixture?.destroy());

  it('shows the display text of a child values column, for every kind of items', fakeAsync(() => {
    expect(cells('status')).toEqual(['Chờ xác nhận', 'Hoàn tất']);
    expect(cells('channel')).toEqual(['Shopee', 'Website']);
    expect(cells('stage')).toEqual(['Vận chuyển', 'Đóng gói']);
  }));

  it('loads the list of a child values column whose items is a function, once', fakeAsync(() => {
    expect(channels).toHaveBeenCalledTimes(1);
    expect(table.cacheValues['channel']?.length).toBe(2);
  }));

  it('fills the filter list of that column', fakeAsync(() => {
    const filter = fixture.debugElement
      .queryAll(By.directive(ColumnFilterComponent))
      .map(debug => debug.componentInstance as ColumnFilterComponent)
      .find(component => component.column()?.field === 'channel');
    expect(filter).toBeDefined();
    expect((filter!.items() as unknown[]).length).toBe(2);
  }));
});
