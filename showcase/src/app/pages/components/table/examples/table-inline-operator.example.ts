import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

interface Order {
  id: number;
  code: string;
  name: string;
  region: string;
  amount: number;
}

const CUSTOMERS = ['An Phát', 'Minh Long', 'Bình Minh', 'Đại Việt', 'Hải Nam', 'Phú Gia', 'Thiên An', 'Trường Sơn'];
const REGIONS = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];

const ORDERS: Order[] = Array.from({ length: 24 }, (_, index) => ({
  id: 2400 - index,
  code: `ĐH-${2400 - index}`,
  name: CUSTOMERS[index % CUSTOMERS.length],
  region: REGIONS[Math.floor(index / 3) % REGIONS.length],
  amount: (index + 2) * 1_750_000,
}));

const normalize = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();

/** Demo backend: applies the operator the table sends for each inline column filter. */
function matchesText(actual: string, filter: unknown, operator = 'CONTAIN'): boolean {
  const left = normalize(actual);
  const right = normalize(filter);
  if (!right) return true;
  if (operator === 'EQUAL') return left === right;
  if (operator === 'START_WITH') return left.startsWith(right);
  return left.includes(right);
}

function matchesNumber(actual: number, filter: unknown, operator = 'EQUAL'): boolean {
  if (filter === null || filter === undefined || filter === '') return true;
  const right = Number(filter);
  switch (operator) {
    case 'GREATER_THAN':
      return actual > right;
    case 'GREATER_OR_EQUAL':
      return actual >= right;
    case 'LESS_THAN':
      return actual < right;
    case 'LESS_OR_EQUAL':
      return actual <= right;
    default:
      return actual === right;
  }
}

@Component({
  selector: 'app-table-inline-operator-example',
  standalone: true,
  imports: [SdTable],
  templateUrl: './table-inline-operator.example.html',
  styleUrl: './table-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableInlineOperatorExampleComponent {
  readonly option: SdTableOption<Order> = {
    type: 'server',
    rowKey: 'id',
    items: async ({ rawColumnFilter, columnOperator, pageNumber, pageSize }) => {
      await new Promise(resolve => setTimeout(resolve, 400));
      // Every column condition must hold (AND); paging runs after filtering.
      const rows = ORDERS.filter(
        row =>
          matchesText(row.name, rawColumnFilter.name, columnOperator.name) &&
          matchesNumber(row.amount, rawColumnFilter.amount, columnOperator.amount)
      );
      return { items: rows.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize), total: rows.length };
    },
    paginate: { pageSize: 6, pages: [6, 12, 24] },
    filter: { cacheable: false, hideInlineFilter: false },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '120px', filter: { disabled: true } },
      {
        field: 'name',
        title: 'Khách hàng',
        type: 'string',
        width: '240px',
        filter: { operator: { enable: true, list: ['CONTAIN', 'EQUAL', 'START_WITH'] } },
      },
      { field: 'region', title: 'Khu vực', type: 'string', width: '120px', filter: { disabled: true } },
      {
        field: 'amount',
        title: 'Giá trị (VND)',
        type: 'number',
        align: 'right',
        width: '240px',
        filter: { operator: { enable: true, list: ['EQUAL', 'GREATER_THAN', 'GREATER_OR_EQUAL', 'LESS_THAN', 'LESS_OR_EQUAL'] } },
      },
    ],
  };
}
