import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import {
  SdTable,
  SdTableFilterRequest,
  SdTableOption,
  SdTableRowMobileDefDirective,
  SdTableServerHasMoreResult,
  SdTableServerTotalResult,
} from '@sdcorejs/angular/components/table';

type AuditEventType = 'LOGIN' | 'LOGOUT' | 'LOGIN_ERROR' | 'UPDATE_PROFILE';

interface AuditEvent {
  id: number;
  time: Date;
  type: AuditEventType;
  user: string;
  ip: string;
}

interface EventQuery {
  first: number;
  max: number;
  user: string;
  types: string[];
  direction: 'ASC' | 'DESC';
}

const EVENT_TYPES: { value: AuditEventType; display: string }[] = [
  { value: 'LOGIN', display: 'Đăng nhập' },
  { value: 'LOGOUT', display: 'Đăng xuất' },
  { value: 'LOGIN_ERROR', display: 'Đăng nhập lỗi' },
  { value: 'UPDATE_PROFILE', display: 'Cập nhật hồ sơ' },
];
const USERS = ['an.nguyen', 'binh.tran', 'cuong.le', 'dung.pham', 'em.hoang'];

function seedEvents(count: number): AuditEvent[] {
  const start = Date.UTC(2026, 9, 20, 8, 0, 0);
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    time: new Date(start - index * 7 * 60_000),
    type: EVENT_TYPES[(index * 7) % EVENT_TYPES.length].value,
    user: USERS[(index * 3) % USERS.length],
    ip: `10.0.${index % 4}.${20 + index}`,
  }));
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Component({
  selector: 'app-table-unknown-total-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdTable, SdTableRowMobileDefDirective, SdButton, SdCheckbox, DatePipe],
  templateUrl: './table-unknown-total-example.component.html',
  styles: [
    `
      /* The demo body is a flex row: without min-width 0 the wide desktop table stretches the whole example on phones. */
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .ut-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 16px;
        margin-bottom: 12px;
      }
      .ut-log {
        margin: 12px 0 0;
        padding-left: 20px;
        font: 12px/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        color: var(--sd-text-secondary, #5e5e62);
      }
      .ut-heading {
        margin: 24px 0 8px;
      }
    `,
  ],
})
export class TableUnknownTotalDemoComponent {
  /** Events in the fake backend; the API never reports this count. */
  readonly sourceSize = signal(32);
  readonly failNext = signal(false);
  readonly slow = signal(false);
  readonly readState = signal('idle');
  readonly log = signal<string[]>([]);
  #source = seedEvents(32);
  #request = 0;

  // Offset/limit API like many audit/event endpoints: it pages by `first`/`max` and returns only a list.
  async #listEvents(query: EventQuery): Promise<AuditEvent[]> {
    const id = ++this.#request;
    await wait(this.slow() ? 1500 : 500);
    if (this.failNext()) {
      this.failNext.set(false);
      this.#write(`#${id} first=${query.first} max=${query.max} → lỗi 503`);
      throw new Error('503 Service Unavailable');
    }
    const rows = this.#matching(query).slice(query.first, query.first + query.max);
    this.#write(`#${id} first=${query.first} max=${query.max} → ${rows.length} dòng`);
    return rows;
  }

  #matching(query: Omit<EventQuery, 'first' | 'max'>): AuditEvent[] {
    const user = query.user.trim().toLowerCase();
    return this.#source
      .filter(event => (!user || event.user.includes(user)) && (!query.types.length || query.types.includes(event.type)))
      .sort((a, b) => (query.direction === 'ASC' ? 1 : -1) * (a.time.getTime() - b.time.getTime()));
  }

  #query(filter: SdTableFilterRequest<AuditEvent>): Omit<EventQuery, 'first' | 'max'> {
    const types = filter.rawColumnFilter.type;
    return {
      user: String(filter.rawColumnFilter.user ?? ''),
      types: (Array.isArray(types) ? types : types ? [types] : []).map(String),
      direction: filter.orderBy === 'time' && filter.orderDirection === 'ASC' ? 'ASC' : 'DESC',
    };
  }

  #write(line: string): void {
    this.log.update(lines => [line, ...lines].slice(0, 6));
  }

  readonly #columns: SdTableOption<AuditEvent>['columns'] = [
    { field: 'time', type: 'datetime', title: 'Thời điểm', width: '170px', sortable: true },
    {
      field: 'type',
      type: 'values',
      title: 'Sự kiện',
      width: '160px',
      option: { valueField: 'value', displayField: 'display', items: EVENT_TYPES },
    },
    { field: 'user', type: 'string', title: 'Người dùng', width: '150px' },
    { field: 'ip', type: 'string', title: 'IP', width: '130px' },
  ];

  readonly unknownOption: SdTableOption<AuditEvent> = {
    type: 'server',
    rowKey: 'id',
    index: { enabled: true },
    sort: { enable: true },
    reload: { visible: true },
    paginate: { total: 'unknown', pageSize: 10, pages: [5, 10, 25], showFirstLastButtons: true },
    columns: this.#columns,
    items: async (filter, paging): Promise<SdTableServerHasMoreResult<AuditEvent>> => {
      const max = paging.pageSize ?? 10;
      // Offset follows the page size, never the lookahead row.
      const first = (paging.pageNumber ?? 0) * max;
      // One extra row proves that a next page exists; a full page alone does not.
      const rows = await this.#listEvents({ first, max: max + 1, ...this.#query(filter) });
      return { items: rows.slice(0, max), hasMore: rows.length > max };
    },
  };

  readonly knownOption: SdTableOption<AuditEvent> = {
    type: 'server',
    rowKey: 'id',
    sort: { enable: true },
    paginate: { pageSize: 10, pages: [5, 10, 25], showFirstLastButtons: true },
    columns: this.#columns,
    items: async (filter, paging): Promise<SdTableServerTotalResult<AuditEvent>> => {
      await wait(300);
      const max = paging.pageSize ?? 10;
      const first = (paging.pageNumber ?? 0) * max;
      const matching = this.#matching(this.#query(filter));
      return { items: matching.slice(first, first + max), total: matching.length };
    },
  };

  /** Simulate rows deleted at the source while the user pages: Next can now reach an empty page. */
  shrink(): void {
    this.#source = this.#source.slice(0, 12);
    this.sourceSize.set(this.#source.length);
    this.#write('Nguồn còn 12 sự kiện (chưa tải lại bảng)');
  }

  restore(): void {
    this.#source = seedEvents(32);
    this.sourceSize.set(32);
    this.#write('Khôi phục 32 sự kiện');
  }
}
