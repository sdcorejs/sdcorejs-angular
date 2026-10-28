import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDataState, SdDataStateTemplateDirective, type SdDataStateKind } from '@sdcorejs/angular/components/data-state';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

type Scenario = 'ready' | 'empty' | 'error';

interface Order {
  id: number;
  code: string;
  name: string;
  region: string;
  amount: number;
}

const CUSTOMERS = ['An Phát', 'Minh Long', 'Bình Minh', 'Đại Việt', 'Hải Nam', 'Phú Gia', 'Thiên An', 'Trường Sơn'];
const REGIONS = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];

const ORDERS: Order[] = Array.from({ length: 12 }, (_, index) => ({
  id: 2400 - index,
  code: `ĐH-${2400 - index}`,
  name: CUSTOMERS[index % CUSTOMERS.length],
  region: REGIONS[Math.floor(index / 3) % REGIONS.length],
  amount: (index + 2) * 1_750_000,
}));

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();

@Component({
  selector: 'app-table-states-example',
  standalone: true,
  imports: [SdButton, SdDataState, SdDataStateTemplateDirective, SdTable],
  templateUrl: './table-states.example.html',
  styleUrl: './table-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableStatesExampleComponent {
  readonly table = viewChild.required(SdTable<Order>);
  readonly scenario = signal<Scenario>('ready');
  /** Fake API delay. 150 ms stays under `loading.showDelay` (nothing shows); 600 ms shows the bar and its hold. */
  readonly delays = [0, 150, 600, 3000] as const;
  readonly delay = signal<number>(600);
  // Only the next read fails, so Retry succeeds and keeps the query.
  readonly failNext = signal(false);

  readonly option: SdTableOption<Order> = {
    type: 'server',
    rowKey: 'id',
    items: async ({ quickSearch, pageNumber, pageSize, orderBy, orderDirection }) => {
      await new Promise(resolve => setTimeout(resolve, this.delay()));
      if (this.failNext()) {
        this.failNext.set(false);
        throw new Error('Không thể tải đơn hàng mẫu.');
      }
      const term = normalize(quickSearch?.term ?? '');
      const rows = this.scenario() === 'empty' ? [] : ORDERS.filter(row => normalize(`${row.code} ${row.name}`).includes(term));
      if (orderBy === 'code' || orderBy === 'amount') {
        const direction = orderDirection === 'DESC' ? -1 : 1;
        rows.sort((a, b) => direction * (orderBy === 'amount' ? a.amount - b.amount : a.code.localeCompare(b.code)));
      }
      return { items: rows.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize), total: rows.length };
    },
    selector: { visible: false },
    sort: { enable: true },
    paginate: { pageSize: 6, pages: [6, 12] },
    filter: {
      cacheable: false,
      hideInlineFilter: true,
      quickSearch: { containFields: ['code', 'name'], placeholder: 'Tìm mã hoặc tên khách hàng' },
    },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '120px', sortable: true },
      { field: 'name', title: 'Khách hàng', type: 'string', width: '180px' },
      { field: 'region', title: 'Khu vực', type: 'string', width: '120px' },
      { field: 'amount', title: 'Giá trị (VND)', type: 'number', align: 'right', width: '150px', sortable: true },
    ],
  };

  show(scenario: Scenario): void {
    this.scenario.set(scenario);
    this.failNext.set(scenario === 'error');
    void this.table().reload(true);
  }

  title(state: SdDataStateKind): string {
    if (state === 'loading') return 'Đang tải đơn hàng…';
    if (state === 'error') return 'Không thể tải đơn hàng';
    return this.scenario() === 'empty' ? 'Chưa có đơn hàng' : 'Không có kết quả phù hợp';
  }

  message(state: SdDataStateKind): string {
    if (state === 'loading') return '';
    if (state === 'error') return 'Lỗi mô phỏng. Thử lại sẽ tải thành công và giữ nguyên từ khóa tìm kiếm.';
    return this.scenario() === 'empty' ? 'Chọn Tải dữ liệu để xem danh sách mẫu.' : 'Thử từ khóa khác hoặc xóa từ khóa tìm kiếm.';
  }
}
