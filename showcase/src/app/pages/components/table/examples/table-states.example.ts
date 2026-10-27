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
  // Only the first read after choosing "error" fails, so Retry succeeds and keeps the query.
  #failNextRead = false;

  readonly option: SdTableOption<Order> = {
    type: 'server',
    rowKey: 'id',
    items: async ({ quickSearch, pageNumber, pageSize }) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (this.#failNextRead) {
        this.#failNextRead = false;
        throw new Error('Không thể tải đơn hàng mẫu.');
      }
      const term = normalize(quickSearch?.term ?? '');
      const rows = this.scenario() === 'empty' ? [] : ORDERS.filter(row => normalize(`${row.code} ${row.name}`).includes(term));
      return { items: rows.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize), total: rows.length };
    },
    selector: { visible: false },
    paginate: { pageSize: 6, pages: [6, 12] },
    filter: {
      cacheable: false,
      hideInlineFilter: true,
      quickSearch: { containFields: ['code', 'name'], placeholder: 'Tìm mã hoặc tên khách hàng' },
    },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '120px' },
      { field: 'name', title: 'Khách hàng', type: 'string', width: '180px' },
      { field: 'region', title: 'Khu vực', type: 'string', width: '120px' },
      { field: 'amount', title: 'Giá trị (VND)', type: 'number', align: 'right', width: '150px' },
    ],
  };

  show(scenario: Scenario): void {
    this.scenario.set(scenario);
    this.#failNextRead = scenario === 'error';
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
