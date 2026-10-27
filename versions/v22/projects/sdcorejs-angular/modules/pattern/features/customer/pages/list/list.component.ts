import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList, type SdPageListDetail } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import type { Filter } from '@sdcorejs/utils/models';
import { SummaryCardsComponent } from '../../components/summary-cards/summary-cards.component';
import { CustomerService } from '../../services/customer.service';
import {
  CUSTOMER_STATUS_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  customerStatusBadge,
  type CustomerCounts,
  type CustomerDto,
  type CustomerSegment,
} from '../../services/customer.model';

/** Điều kiện của nhóm khách đang chọn trên score card. */
const SEGMENT_FILTER: Readonly<Record<CustomerSegment, Filter<CustomerDto>>> = {
  individual: { field: 'type', operator: 'EQUAL', data: 'individual' },
  business: { field: 'type', operator: 'EQUAL', data: 'business' },
  vip: { field: 'tier', operator: 'EQUAL', data: 'vip' },
};

@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageList, SdButton, SdTable, SdTableCellDefDirective, SdPermissionDirective, SummaryCardsComponent],
})
export class ListComponent {
  readonly #customerService = inject(CustomerService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly pageList = viewChild.required(SdPageList);
  private readonly table = viewChild.required(SdTable);
  protected readonly canOpenDetail = inject(SdPermissionService).hasPermission('PATTERN_CUSTOMER_R_DETAIL');

  /** Một state cho score card và request: đổi nhóm thì đọc lại từ trang 1. */
  protected readonly segment = signal<CustomerSegment | null>(null);
  protected readonly counts = signal<CustomerCounts | null>(null);
  /** Detail, create, update mở trong drawer; hồ sơ 360° (`data.detail: 'page'`) thay chỗ danh sách. */
  protected readonly detailMode = toSignal(
    this.#router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map((): SdPageListDetail => (this.#route.firstChild?.snapshot.data['detail'] === 'page' ? 'page' : 'drawer'))
    ),
    { requireSync: true }
  );

  protected readonly tableOption: SdTableOption<CustomerDto> = {
    type: 'server',
    rowKey: 'id',
    items: async (_, req) => {
      const segment = untracked(this.segment);
      // Số trên thẻ theo cùng bộ lọc của bảng, chưa tính nhóm đang chọn.
      void firstValueFrom(this.#customerService.counts(req.filters ?? [])).then(counts => this.counts.set(counts));
      const filters = segment ? [...(req.filters ?? []), SEGMENT_FILTER[segment]] : req.filters;
      return firstValueFrom(this.#customerService.list({ ...req, filters }));
    },
    sort: { enable: true },
    filter: {
      quickSearch: { containFields: ['code', 'name', 'phone'], placeholder: 'Tìm theo mã, tên hoặc số điện thoại' },
    },
    columns: [
      { field: 'code', title: 'Mã khách hàng', type: 'string', width: '150px', sortable: true },
      { field: 'name', title: 'Tên khách hàng', type: 'string', minWidth: '220px', sortable: true },
      {
        field: 'type',
        title: 'Loại',
        type: 'values',
        width: '140px',
        option: { items: CUSTOMER_TYPE_OPTIONS, valueField: 'id', displayField: 'name' },
        // Score card là chỗ lọc theo loại khách: mỗi field chỉ một chỗ lọc (E6).
        filter: { disabled: true },
      },
      { field: 'phone', title: 'Điện thoại', type: 'string', width: '140px' },
      { field: 'email', title: 'Email', type: 'string', minWidth: '200px' },
      { field: 'debt', title: 'Công nợ (₫)', type: 'number', width: '150px', align: 'right', sortable: true },
      {
        field: 'status',
        title: 'Trạng thái',
        type: 'values',
        width: '170px',
        option: { items: CUSTOMER_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => customerStatusBadge(status),
      },
    ],
  };

  constructor() {
    let segment = this.segment();
    effect(() => {
      const next = this.segment();
      if (next === segment) return;
      segment = next;
      untracked(() => void this.table().reloadFirstPage());
    });
    // Chỉ tải lại danh sách khi drawer/trang con đã lưu thành công, không phải mỗi lần đóng.
    let changes = this.#customerService.changes();
    effect(() => {
      const next = this.#customerService.changes();
      if (this.pageList().childActive() || next === changes) return;
      changes = next;
      untracked(() => void this.table().reload(true, false));
    });
  }
}
