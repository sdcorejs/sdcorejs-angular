import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdTable, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SD_PAGE_LIST, SdPageList } from '@sdcorejs/angular/modules/layout';
import { CHANNELS, ORDER_STATUSES, ORDERS, PAYMENTS, WAREHOUSES, readPageListDemoConfig, type Order, type OrderStatus } from './page-list-live.data';

const TABS: readonly { readonly label: string; readonly status: OrderStatus | null }[] = [
  { label: 'Tất cả', status: null },
  ...ORDER_STATUSES.map(item => ({ label: item.display, status: item.value })),
];

const formatMoney = (value: number): string =>
  value >= 1_000_000_000 ? `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ` : `${Math.round(value / 1_000_000)} triệu`;

/** Score card của màn mẫu: lưới 4 thẻ; khi sd-page-list compact thì thành một dòng 36px. */
@Component({
  selector: 'app-order-summary',
  standalone: true,
  template: `
    <div class="summary" [class.summary--compact]="list.compact()" data-e2e="score">
      @for (card of cards(); track card.label) {
        <div class="summary__card" [class.summary__card--active]="card.status !== undefined && card.status === active()">
          <span class="summary__label">{{ card.label }}</span>
          <strong class="summary__value">{{ card.value }}</strong>
        </div>
      }
    </div>
  `,
  styles: `
    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .summary__card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 16px;
      border: 1px solid #e3e4ea;
      border-radius: 8px;
      background: #ffffff;
    }
    .summary__card--active {
      box-shadow: inset 0 0 0 2px var(--sd-primary, #005cbb);
    }
    .summary__label {
      font-size: 13px;
      color: #5f6368;
    }
    .summary__value {
      font-size: 22px;
      line-height: 28px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .summary--compact {
      display: flex;
      align-items: center;
      gap: 20px;
      height: 36px;
    }
    .summary--compact .summary__card {
      flex-direction: row;
      align-items: baseline;
      gap: 6px;
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
    }
    .summary--compact .summary__value {
      font-size: 14px;
      line-height: 20px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummaryComponent {
  readonly list = inject(SD_PAGE_LIST);
  readonly active = input<OrderStatus | null>(null);
  readonly cards = computed(() => {
    const count = (status: OrderStatus) => ORDERS.filter(order => order.status === status).length;
    const revenue = ORDERS.filter(order => order.status === 'done').reduce((sum, order) => sum + order.total, 0);
    return [
      { label: 'Tổng đơn', value: String(ORDERS.length), status: null },
      { label: 'Chờ xác nhận', value: String(count('pending')), status: 'pending' as const },
      { label: 'Đang giao', value: String(count('shipping')), status: 'shipping' as const },
      { label: 'Doanh thu hoàn tất', value: formatMoney(revenue), status: undefined },
    ];
  });
}

/**
 * Màn mẫu /demo/page-list: sd-page-list + sd-table với cấu hình đọc từ `?cfg=`. Dùng để xem và để e2e đo E1.
 * why: phủ toàn màn bằng position: fixed để không chịu topbar/sidebar của showcase, giống một màn của portal.
 */
@Component({
  selector: 'app-page-list-live',
  standalone: true,
  imports: [SdPageList, SdTable, SdTabGroup, SdTab, SdButton, OrderSummaryComponent],
  template: `
    @let _cfg = cfg;
    <sd-page-list title="Đơn hàng" description="Đơn bán lẻ từ mọi kênh." [detail]="_cfg.detail" [autoCompact]="_cfg.autoCompact">
      <sd-button headerRight title="Tạo đơn hàng" prefixIcon="add" type="fill" color="primary"></sd-button>
      @if (_cfg.tabs) {
        <sd-tab-group sdSubheader data-e2e="tabs" [(selectedIndex)]="tab">
          @for (item of tabs; track item.label) {
            <sd-tab [label]="item.label" [badge]="countOf(item.status)"></sd-tab>
          }
        </sd-tab-group>
      }
      @if (_cfg.score) {
        <app-order-summary [active]="tabStatus()"></app-order-summary>
      }
      <sd-table [option]="option()" autoId="orders"></sd-table>
    </sd-page-list>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      /* why: dưới backdrop (--sd-z-floating 99) và drawer (999) của sd-side-drawer, trên shell của showcase. */
      z-index: 98;
      display: block;
      background: var(--sd-page-bg, #f9f9f9);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageListLiveComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  /** Cấu hình đọc một lần khi vào màn; route con không làm đổi nó. */
  readonly cfg = readPageListDemoConfig(this.#route.snapshot.queryParamMap.get('cfg'));
  readonly tabs = TABS;
  readonly tab = signal(0);
  readonly tabStatus = computed(() => TABS[this.tab()]?.status ?? null);
  readonly table = viewChild(SdTable);

  readonly option = signal<SdTableOption<Order>>(this.#buildOption());

  constructor() {
    // Đổi tab về trang 1 và đọc lại; lần chạy đầu là lần đọc ban đầu của bảng nên bỏ qua.
    let previous = this.tab();
    effect(() => {
      const tab = this.tab();
      if (tab === previous) return;
      previous = tab;
      untracked(() => void this.table()?.reload(true));
    });
  }

  countOf(status: OrderStatus | null): number {
    return status ? ORDERS.filter(order => order.status === status).length : ORDERS.length;
  }

  #items(): Promise<Order[]> {
    const cfg = this.cfg;
    if (cfg.state === 'loading') return new Promise<Order[]>(() => undefined);
    if (cfg.state === 'error') return Promise.reject(new Error('Mock API trả 500'));
    const status = untracked(() => this.tabStatus());
    const rows = ORDERS.slice(0, cfg.records).filter(order => !status || order.status === status);
    return Promise.resolve(rows);
  }

  #buildOption(): SdTableOption<Order> {
    const cfg = this.cfg;
    const values = (items: readonly string[]) => ({ items: items.map(value => ({ value, display: value })), valueField: 'value', displayField: 'display' });
    return {
      type: 'local',
      rowKey: 'id',
      items: () => this.#items(),
      columns: [
        {
          field: 'code',
          title: 'Mã đơn',
          type: 'string',
          width: '130px',
          click: (_value, row) => void this.#router.navigate([row.id, 'detail'], { relativeTo: this.#route, queryParamsHandling: 'preserve' }),
        },
        { field: 'customer', title: 'Khách hàng', type: 'string' },
        { field: 'channel', title: 'Kênh', type: 'values', width: '130px', option: values(CHANNELS) },
        { field: 'createdAt', title: 'Ngày tạo', type: 'date', width: '170px', filter: { type: 'daterange' } },
        { field: 'total', title: 'Tổng tiền (₫)', type: 'number', width: '130px', align: 'right' },
        {
          field: 'status',
          title: 'Trạng thái',
          type: 'values',
          width: '150px',
          option: { items: [...ORDER_STATUSES], valueField: 'value', displayField: 'display' },
          useBadge: value => ({ type: 'round', color: ORDER_STATUSES.find(item => item.value === value)?.color }),
          // E6: có tab trạng thái thì không lọc trạng thái dưới cột.
          filter: cfg.tabs ? { disabled: true } : undefined,
        },
      ],
      paginate: { pageSize: cfg.pageSize, pages: [10, 20, 50] },
      selector: cfg.selector
        ? {
            visible: true,
            actions: [
              { title: 'Xác nhận', icon: 'check', click: () => undefined },
              { title: 'In phiếu giao', icon: 'print', click: () => undefined },
              { title: 'Huỷ đơn', icon: 'cancel', color: 'error', click: () => undefined },
            ],
          }
        : undefined,
      reload: { visible: cfg.footerButtons },
      export: cfg.footerButtons ? { visible: 'EXCEL' } : undefined,
      config: { visible: cfg.footerButtons },
      filter: {
        hideInlineFilter: cfg.inlineFilter === 'auto' ? 'auto' : !cfg.inlineFilter,
        quickSearch: cfg.quickSearch
          ? {
              placeholder: 'Tìm theo mã đơn, khách hàng',
              containFields: ['code', 'customer'],
              filters: cfg.warehouse ? [{ field: 'warehouse', title: 'Kho xuất', type: 'values', option: values(WAREHOUSES) }] : [],
            }
          : undefined,
        externalFilters: cfg.externalFilter
          ? [
              { field: 'payment', title: 'Thanh toán', type: 'values', option: values(PAYMENTS) },
              { field: 'creator', title: 'Người tạo', type: 'string' },
              { field: 'deliveredAt', title: 'Ngày giao', type: 'daterange' },
              { field: 'source', title: 'Nguồn đơn', type: 'string' },
              { field: 'tracking', title: 'Mã vận đơn', type: 'string' },
              { field: 'note', title: 'Ghi chú nội bộ', type: 'string' },
            ]
          : undefined,
        externalFilterCollapsed: cfg.externalFilterCollapsed || undefined,
      },
    } as SdTableOption<Order>;
  }
}
