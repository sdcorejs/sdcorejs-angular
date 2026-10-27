import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdTable, SdTableCellDefDirective, type SdTableColumn, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList, type SdPageListDetail } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import type { PagingReq } from '@sdcorejs/utils/models';
// Chỉ có ở /pattern: drawer "Tuỳ chỉnh hiển thị" bật/tắt các vùng của màn. Màn thật chọn sẵn một cấu hình.
import { PatternSettingsButtonComponent } from '../../../../core/pattern-shell/settings/settings-button.component';
import { PatternSettingsStore, type PatternOrderSettings } from '../../../../core/pattern-shell/settings/pattern-settings.store';
import { apiErrorMessage } from '../../../../utils/api-error';
import { BulkResultComponent, type OrderBulkSummary } from '../../components/bulk-result/bulk-result.component';
import { SummaryCardsComponent } from '../../components/summary-cards/summary-cards.component';
import { OrderService } from '../../services/order.service';
import {
  ORDER_CHANNELS,
  ORDER_PAYMENTS,
  ORDER_STATUS_OPTIONS,
  ORDER_WAREHOUSES,
  orderStatusBadge,
  type OrderAction,
  type OrderActionReq,
  type OrderCounts,
  type OrderDto,
  type OrderStatus,
} from '../../services/order.model';

type SelectorAction = NonNullable<NonNullable<SdTableOption<OrderDto>['selector']>['actions']>[number];

const TABS: readonly { readonly label: string; readonly status: OrderStatus | null }[] = [
  { label: 'Tất cả', status: null },
  ...ORDER_STATUS_OPTIONS.map(option => ({ label: option.name, status: option.id })),
];

const values = (items: readonly string[]) => ({ items: items.map(value => ({ value })), valueField: 'value', displayField: 'value' });

/** Cột của danh sách; `withTabs`: có tab trạng thái thì không lọc trạng thái dưới cột (E6). */
function columns(withTabs: boolean): SdTableColumn<OrderDto>[] {
  return [
    { field: 'code', title: 'Mã đơn', type: 'string', width: '130px', sortable: true },
    { field: 'customer', title: 'Khách hàng', type: 'string', minWidth: '180px' },
    { field: 'channel', title: 'Kênh', type: 'values', width: '130px', option: values(ORDER_CHANNELS) },
    { field: 'createdAt', title: 'Ngày tạo', type: 'date', width: '170px', filter: { type: 'daterange' }, sortable: true },
    { field: 'total', title: 'Tổng tiền (₫)', type: 'number', width: '130px', align: 'right', sortable: true },
    {
      field: 'status',
      title: 'Trạng thái',
      type: 'values',
      width: '150px',
      option: { items: ORDER_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
      useBadge: status => orderStatusBadge(status),
      filter: withTabs ? { disabled: true } : undefined,
    },
  ];
}

@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    SdPageList,
    SdButton,
    SdTabGroup,
    SdTab,
    SdTable,
    SdTableCellDefDirective,
    SdPermissionDirective,
    SummaryCardsComponent,
    BulkResultComponent,
    PatternSettingsButtonComponent,
  ],
})
export class ListComponent {
  readonly #orderService = inject(OrderService);
  readonly #permission = inject(SdPermissionService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly pageList = viewChild.required(SdPageList);
  private readonly table = viewChild.required(SdTable);
  protected readonly canOpenDetail = this.#permission.hasPermission('PATTERN_ORDER_R_DETAIL');
  readonly #canExport = this.#permission.hasPermission('PATTERN_ORDER_R_EXPORT');
  protected readonly settings = inject(PatternSettingsStore).settings;
  protected readonly tabs = TABS;

  // #region state
  /** Một state cho tab, score card và request: đổi trạng thái thì đọc lại từ trang 1. */
  protected readonly status = signal<OrderStatus | null>(null);
  protected readonly tabIndex = computed(() => TABS.findIndex(tab => tab.status === this.status()));
  protected readonly counts = signal<OrderCounts | null>(null);
  // #endregion
  protected readonly bulkResult = signal<OrderBulkSummary | null>(null);
  #lastBulk: { readonly action: OrderAction; readonly reqs: readonly OrderActionReq[] } | null = null;

  /** Tạo và cập nhật (`data.detail: 'page'`) thay chỗ danh sách; chi tiết mở theo cấu hình (drawer mặc định). */
  readonly #childMode = toSignal(
    this.#router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.#route.firstChild?.snapshot.data['detail'] as SdPageListDetail | undefined)
    ),
    { requireSync: true }
  );
  protected readonly detailMode = computed<SdPageListDetail>(() => this.#childMode() ?? this.settings().detail);

  protected readonly option = computed(() => this.#tableOption(this.settings()));

  constructor() {
    let status = this.status();
    effect(() => {
      const next = this.status();
      if (next === status) return;
      status = next;
      untracked(() => void this.table().reloadFirstPage());
    });
    // Bật/tắt tab trạng thái thì về "Tất cả".
    let tabs = this.settings().tabs;
    effect(() => {
      const next = this.settings().tabs;
      if (next === tabs) return;
      tabs = next;
      untracked(() => this.status.set(null));
    });
    // Lưu hoặc đổi trạng thái ở màn con xong rồi quay về: tải lại trang hiện tại, giữ bộ lọc.
    let changes = this.#orderService.changes();
    effect(() => {
      const next = this.#orderService.changes();
      if (this.pageList().childActive() || next === changes) return;
      changes = next;
      untracked(() => void this.table().reload(true, false));
    });
  }

  protected selectTab(index: number): void {
    this.status.set(TABS[index]?.status ?? null);
  }

  protected retryFailed(): void {
    const last = this.#lastBulk;
    const failed = new Set(this.bulkResult()?.failed.map(item => item.id) ?? []);
    if (last && failed.size)
      void this.#runBulk(
        last.action,
        last.reqs.filter(req => failed.has(req.id))
      );
  }

  async #read(req: PagingReq<OrderDto>) {
    const status = untracked(this.status);
    // Số trên tab và thẻ theo cùng bộ lọc của bảng, chưa tính trạng thái đang chọn.
    void firstValueFrom(this.#orderService.counts(req.filters ?? []))
      .then(counts => this.counts.set(counts))
      .catch(() => this.counts.set(null));
    const filters = status ? [...(req.filters ?? []), { field: 'status' as const, operator: 'EQUAL' as const, data: status }] : req.filters;
    return firstValueFrom(this.#orderService.list({ ...req, filters }));
  }

  #tableOption(settings: PatternOrderSettings): SdTableOption<OrderDto> {
    return {
      type: 'server',
      rowKey: 'id',
      items: (_, req) => this.#read(req),
      sort: { enable: true },
      columns: columns(settings.tabs),
      paginate: { pageSize: settings.pageSize, pages: [10, 20, 50] },
      selector: settings.selector ? { visible: true, preserveSelection: true, actions: this.#selectorActions() } : { visible: false },
      reload: { visible: settings.footerButtons },
      export: settings.footerButtons && this.#canExport ? { visible: 'EXCEL' } : undefined,
      config: { visible: settings.footerButtons },
      filter: {
        hideInlineFilter: !settings.inlineFilter ? true : settings.autoHide ? 'auto' : false,
        quickSearch: settings.quickSearch
          ? {
              placeholder: 'Tìm theo mã đơn, khách hàng',
              containFields: ['code', 'customer'],
              filters: settings.warehouse
                ? [{ field: 'warehouse', title: 'Kho xuất', type: 'values', option: values(ORDER_WAREHOUSES) }]
                : [],
            }
          : undefined,
        // External filter chỉ chứa field không có cột (E6).
        externalFilters: settings.externalFilter
          ? [
              { field: 'payment', title: 'Thanh toán', type: 'values', option: values(ORDER_PAYMENTS) },
              { field: 'creator', title: 'Người tạo', type: 'string' },
              { field: 'deliveredAt', title: 'Ngày giao', type: 'daterange' },
              { field: 'source', title: 'Nguồn đơn', type: 'string' },
              { field: 'tracking', title: 'Mã vận đơn', type: 'string' },
              { field: 'note', title: 'Ghi chú nội bộ', type: 'string' },
            ]
          : undefined,
        externalFilterPerRow: settings.externalFilterPerRow,
        externalFilterCollapsed: settings.externalFilterCollapsed || undefined,
        manualFilter: settings.manualFilter,
      },
    } as SdTableOption<OrderDto>;
  }

  /** Tác vụ trên các dòng đã chọn, theo quyền (đã nạp trước khi mở màn). */
  #selectorActions(): SelectorAction[] {
    const can = (code: string) => this.#permission.hasPermission(code);
    return [
      { title: 'Xác nhận', icon: 'check', hidden: !can('PATTERN_ORDER_U_CONFIRM'), click: items => void this.#confirmOrders(items ?? []) },
      { title: 'In phiếu giao', icon: 'print', hidden: !can('PATTERN_ORDER_R_PRINT'), click: items => this.#print(items ?? []) },
      {
        title: 'Huỷ đơn',
        icon: 'cancel',
        color: 'error',
        hidden: !can('PATTERN_ORDER_U_CANCEL'),
        click: items => void this.#cancelOrders(items ?? []),
      },
    ];
  }

  async #confirmOrders(orders: readonly OrderDto[]): Promise<void> {
    try {
      await this.#confirm.confirm(`Xác nhận ${orders.length} đơn hàng đã chọn? Đơn chuyển sang Đang giao.`, {
        title: 'Xác nhận đơn hàng',
        yesTitle: 'Xác nhận',
        noTitle: 'Không',
      });
    } catch {
      return;
    }
    await this.#runBulk(
      'confirm',
      orders.map(order => ({ id: order.id }))
    );
  }

  async #cancelOrders(orders: readonly OrderDto[]): Promise<void> {
    let reason: string;
    try {
      reason = await this.#confirm.withInput(`Huỷ ${orders.length} đơn hàng đã chọn. Lý do được ghi vào từng đơn.`, {
        title: 'Huỷ đơn hàng',
        label: 'Lý do huỷ',
        required: true,
        maxlength: 200,
        yesTitle: 'Huỷ đơn',
        noTitle: 'Không huỷ',
        yesButtonColor: 'error',
      });
    } catch {
      return;
    }
    await this.#runBulk(
      'cancel',
      orders.map(order => ({ id: order.id, reason }))
    );
  }

  #print(orders: readonly OrderDto[]): void {
    this.#notify.info(`Đã gửi ${orders.length} phiếu giao tới máy in.`);
  }

  /** Chạy tác vụ hàng loạt, báo kết quả từng phần, giữ các dòng lỗi đang chọn và cho thử lại phần lỗi. */
  async #runBulk(action: OrderAction, reqs: readonly OrderActionReq[]): Promise<void> {
    const table = this.table();
    const selected = table.selectedTableItems();
    const codeOf = (id: string) => selected.find(item => item.data.id === id)?.data.code ?? id;
    try {
      const { results } = await firstValueFrom(this.#orderService.bulk(action, reqs));
      const failed = results.filter(result => !result.ok);
      const succeeded = new Set(results.filter(result => result.ok).map(result => result.id));
      this.#lastBulk = { action, reqs };
      this.bulkResult.set({
        done: action === 'confirm' ? 'Đã xác nhận' : 'Đã huỷ',
        total: results.length,
        failed: failed.map(result => ({ id: result.id, code: codeOf(result.id), message: result.message ?? 'Không thực hiện được.' })),
      });
      // Bỏ chọn đúng các đơn đã xong; đơn lỗi vẫn được chọn sau khi tải lại (preserveSelection).
      for (const item of selected) {
        if (!succeeded.has(item.data.id)) continue;
        item.meta.selector!.isSelected = false;
        table.onSelect(item);
      }
      await table.reload(true, false);
    } catch (error) {
      this.#notify.error(apiErrorMessage(error));
    }
  }
}
