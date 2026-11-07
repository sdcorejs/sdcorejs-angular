import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import type { Filter } from '@sdcorejs/utils/models';
import { CreateSideDrawerComponent } from '../../components/create-side-drawer/create-side-drawer.component';
import { DetailSideDrawerComponent } from '../../components/detail-side-drawer/detail-side-drawer.component';
import { SummaryCardsComponent } from '../../components/summary-cards/summary-cards.component';
import { UpdateSideDrawerComponent } from '../../components/update-side-drawer/update-side-drawer.component';
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

/** Drawer đang mở trên danh sách: tạo, hay chi tiết / cập nhật khách hàng `id`. */
type CustomerDrawer = { readonly type: 'create' } | { readonly type: 'detail' | 'update'; readonly id: string };

/**
 * Danh sách khách hàng. Chi tiết, tạo và cập nhật mở trong drawer trên danh sách, không đổi URL; hồ sơ 360° là route con
 * thay chỗ danh sách.
 */
@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SdPageList,
    SdButton,
    SdTable,
    SdTableCellDefDirective,
    SdPermissionDirective,
    SummaryCardsComponent,
    CreateSideDrawerComponent,
    DetailSideDrawerComponent,
    UpdateSideDrawerComponent,
  ],
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
  /**
   * Mỗi lần mở dựng drawer mới (`@if`), nên form luôn bắt đầu từ dữ liệu mới; đóng thì gỡ khỏi màn. Chi tiết sang cập
   * nhật thay drawer này bằng drawer kia, không chồng hai lớp.
   */
  protected readonly drawer = signal<CustomerDrawer | null>(null);

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
    // Chỉ tải lại danh sách khi drawer/trang con đã lưu thành công, và sau khi chúng đóng: không phải mỗi lần đóng.
    let changes = this.#customerService.changes();
    effect(() => {
      const next = this.#customerService.changes();
      if (this.drawer() || this.pageList().childActive() || next === changes) return;
      changes = next;
      untracked(() => void this.table().reload(true, false));
    });
  }

  /** Mã là link mở drawer chi tiết ngay trên danh sách: chặn điều hướng của `href`, URL giữ nguyên. */
  protected openDetail(event: Event, id: string): void {
    event.preventDefault();
    this.drawer.set({ type: 'detail', id });
  }

  /** Hồ sơ 360° là trang: đóng drawer chi tiết rồi sang route con, danh sách ẩn đi. */
  protected openProfile(id: string): void {
    this.drawer.set(null);
    void this.#router.navigate([id, '360'], { relativeTo: this.#route });
  }
}
