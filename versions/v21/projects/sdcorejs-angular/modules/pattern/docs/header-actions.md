# Header actions

Nút ở header của trang và tác vụ trên dòng, trên thanh chọn nhiều. Mẫu: `/pattern/product` (menu Nhập/Xuất + Tạo mới), `/pattern/order/:id/detail` (tác vụ theo trạng thái duyệt), `/pattern/order` (tác vụ hàng loạt), `/pattern/category` (thao tác theo dòng).

## Khi nào dùng / khi nào không

- Header chứa tác vụ của cả trang: tạo mới, nhập, xuất, cập nhật bản ghi, tác vụ trạng thái.
- Tác vụ của một dòng: `command` của `sd-table`; của nhiều dòng đã chọn: `selector.actions`.

## Code mẫu

Một wrapper `headerRight`; nút chính `type="fill"` ngoài cùng bên phải; menu dùng Action Popover của `sd-button`:

<!-- @source features/product/pages/list/list.component.html -->
```html
<sd-page-list title="Sản phẩm" description="Danh mục sản phẩm đang kinh doanh.">
  <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
    <sd-button
      *sdPermission="'PATTERN_PRODUCT_R_MENU'"
      title="Nhập/Xuất"
      suffixIcon="expand_more"
      type="outline"
      autoId="product-data-menu">
      <sd-button-item *sdPermission="'PATTERN_PRODUCT_C_IMPORT'" prefixIcon="upload" (click)="openImport()">Nhập dữ liệu</sd-button-item>
      <sd-button-item *sdPermission="'PATTERN_PRODUCT_R_EXPORT'" prefixIcon="download" (click)="exportData()">Xuất dữ liệu</sd-button-item>
    </sd-button>
    <sd-button
      *sdPermission="'PATTERN_PRODUCT_C_CREATE'"
      title="Tạo mới"
      prefixIcon="add"
      type="fill"
      color="primary"
      autoId="product-create"
      [routerLink]="['create']" />
  </div>

  <sd-table autoId="product-list" [option]="tableOption">
    <ng-template sdTableCellDef="code" let-product="item">
      <a *sdPermission="'PATTERN_PRODUCT_R_DETAIL'" [routerLink]="[product.id, 'detail']">{{ product.code }}</a>
      @if (!canOpenDetail) {
        <span>{{ product.code }}</span>
      }
    </ng-template>
  </sd-table>
</sd-page-list>
```

Tác vụ theo quyền và trạng thái, xác nhận trước khi đổi trạng thái, Từ chối bắt buộc lý do:

<!-- @source features/order/pages/detail/detail.component.ts -->
```ts
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdView } from '@sdcorejs/angular/components/view';
import { SD_PAGE_LIST, SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdEmptyPipe, SdFormatDatePipe, SdFormatDatetimePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { CustomerDetailPipe } from '../../../customer/pipes/customer-detail.pipe';
import { ApprovalStepsComponent } from '../../components/approval-steps/approval-steps.component';
import { LinesViewComponent } from '../../components/lines-view/lines-view.component';
import { OrderService } from '../../services/order.service';
import {
  canUpdateOrder,
  ORDER_APPROVAL_OPTIONS,
  orderApprovalBadge,
  orderStatusBadge,
  type OrderAction,
  type OrderDto,
} from '../../services/order.model';

/**
 * Chi tiết đơn (`:id/detail`, route con của danh sách). Mở trong drawer 600px hoặc trang `sd-page-detail` theo
 * `detail` của `sd-page-list`. Gửi duyệt, Duyệt và Từ chối đều hỏi xác nhận; Từ chối bắt buộc lý do (E13).
 */
@Component({
  selector: 'detail',
  standalone: true,
  imports: [
    AsyncPipe,
    NgTemplateOutlet,
    RouterLink,
    SdPageComponent,
    SdSideDrawer,
    SdBadge,
    SdButton,
    SdSection,
    SdSectionItem,
    SdView,
    SdPermissionDirective,
    SdEmptyPipe,
    SdFormatDatePipe,
    SdFormatDatetimePipe,
    SdFormatNumberPipe,
    CustomerDetailPipe,
    ApprovalStepsComponent,
    LinesViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let order = entity();
    @let customer = order.customerId | customerDetail | async;
    <ng-template #actions>
      @if (order.approval === 'submitted') {
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_REJECT'"
          title="Từ chối"
          prefixIcon="close"
          type="light"
          color="warning"
          autoId="order-reject"
          [disabled]="pending()"
          (click)="act('reject')" />
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_APPROVE'"
          title="Duyệt"
          prefixIcon="check"
          type="fill"
          color="success"
          autoId="order-approve"
          [disabled]="pending()"
          (click)="act('approve')" />
      }
      @if (editable()) {
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_SUBMIT'"
          title="Gửi duyệt"
          prefixIcon="send"
          type="outline"
          autoId="order-submit"
          [disabled]="pending()"
          (click)="act('submit')" />
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_UPDATE'"
          title="Cập nhật đơn hàng"
          prefixIcon="edit"
          type="fill"
          color="primary"
          autoId="order-update"
          [disabled]="pending()"
          [routerLink]="['../update']" />
      }
    </ng-template>

    @if (mode() === 'drawer') {
      <sd-side-drawer width="600px" autoId="order-detail" (sdClosed)="closed()">
        <div sdHeaderLeft class="d-flex align-items-center gap-8">
          <span class="T16M">Đơn hàng {{ order.code }}</span>
          <sd-badge size="md" type="round" [title]="statusBadge().title" [color]="statusBadge().color" />
        </div>
        <sd-section title="Thông tin chung">
          <sd-section-item label="Khách hàng">{{ order.customer }}</sd-section-item>
          <sd-section-item label="Kênh bán">{{ order.channel }}</sd-section-item>
          <sd-section-item label="Kho xuất">{{ order.warehouse }}</sd-section-item>
          <sd-section-item label="Thanh toán">{{ order.payment }}</sd-section-item>
          <sd-section-item label="Ngày tạo">{{ order.createdAt | sdFormatDatetime }}</sd-section-item>
          <sd-section-item label="Tổng tiền (₫)">{{ order.total | sdFormatNumber: 0 }}</sd-section-item>
          <sd-section-item label="Trạng thái">{{ statusBadge().title }} · {{ approvalName() }}</sd-section-item>
        </sd-section>
        <div sdFooterRight class="d-flex align-items-center gap-8 flex-wrap">
          <ng-container [ngTemplateOutlet]="actions" />
        </div>
      </sd-side-drawer>
    } @else {
      <sd-page-detail
        [title]="'Chi tiết đơn hàng #' + order.code"
        [description]="order.customer + ' · ' + order.channel"
        [badges]="badges()"
        [backLink]="['../..']">
        <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
          <ng-container [ngTemplateOutlet]="actions" />
        </div>
        <div class="d-flex flex-column gap-16 py-16">
          <sd-section title="Thông tin chung">
            <div class="row p-8">
              <div class="col-12 col-md-6 p-8"><sd-view label="Khách hàng" [display]="order.customer" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Điện thoại" [display]="customer?.phone" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Kênh bán" [display]="order.channel" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Kho xuất" [display]="order.warehouse" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Thanh toán" [display]="order.payment" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Ngày tạo" [display]="order.createdAt | sdFormatDatetime" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Ngày giao" [display]="order.deliveredAt | sdFormatDate" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Mã vận đơn" [display]="order.tracking" /></div>
            </div>
          </sd-section>
          <lines-view [lines]="order.lines" />
          <sd-section title="Thông tin phê duyệt">
            <sd-section-item label="Trạng thái duyệt">{{ approvalName() }}</sd-section-item>
            <sd-section-item label="Người gửi duyệt">{{ submitted()?.by | sdEmpty }}</sd-section-item>
            <sd-section-item label="Người duyệt">{{ decided()?.by | sdEmpty }}</sd-section-item>
            <sd-section-item label="Lý do từ chối">{{ decided()?.reason | sdEmpty }}</sd-section-item>
            <sd-section-item label="Ghi chú">{{ order.note | sdEmpty }}</sd-section-item>
          </sd-section>
        </div>
        <approval-steps sdAside [steps]="order.approvalHistory" />
      </sd-page-detail>
    }
  `,
})
export class DetailComponent {
  readonly #orderService = inject(OrderService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly drawer = viewChild(SdSideDrawer);
  protected readonly mode = inject(SD_PAGE_LIST).detail;
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as OrderDto)), { requireSync: true });
  /** Đơn do resolver tải; sau mỗi tác vụ thay bằng đơn API trả về. */
  protected readonly entity = linkedSignal(() => this.#resolved());
  protected readonly pending = signal(false);
  protected readonly statusBadge = computed(() => orderStatusBadge(this.entity().status));
  protected readonly badges = computed(() => [this.statusBadge(), orderApprovalBadge(this.entity().approval)]);
  protected readonly approvalName = computed(() => ORDER_APPROVAL_OPTIONS.find(option => option.id === this.entity().approval)?.name);
  protected readonly editable = computed(() => canUpdateOrder(this.entity()));
  protected readonly submitted = computed(() => [...this.entity().approvalHistory].reverse().find(step => step.action === 'submit'));
  protected readonly decided = computed(() =>
    this.entity().approval === 'approved' || this.entity().approval === 'rejected' ? this.entity().approvalHistory.at(-1) : undefined
  );

  constructor() {
    afterNextRender(() => this.drawer()?.open());
  }

  protected closed(): void {
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
  }

  /** Hỏi xác nhận (Từ chối kèm lý do), gọi API, rồi hiển thị đơn mới; lỗi giữ nguyên màn để thử lại. */
  protected async act(action: Extract<OrderAction, 'submit' | 'approve' | 'reject'>): Promise<void> {
    const order = this.entity();
    let reason: string | undefined;
    try {
      if (action === 'reject') {
        reason = await this.#confirm.withInput(`Từ chối đơn ${order.code}. Lý do được gửi cho người lập đơn.`, {
          title: 'Từ chối đơn hàng',
          label: 'Lý do từ chối',
          required: true,
          maxlength: 200,
          yesTitle: 'Từ chối',
          noTitle: 'Không',
          yesButtonColor: 'warning',
        });
      } else {
        await this.#confirm.confirm(action === 'approve' ? `Duyệt đơn ${order.code}?` : `Gửi đơn ${order.code} cho người duyệt?`, {
          title: action === 'approve' ? 'Duyệt đơn hàng' : 'Gửi duyệt',
          yesTitle: action === 'approve' ? 'Duyệt' : 'Gửi duyệt',
          noTitle: 'Không',
        });
      }
    } catch {
      return;
    }
    this.pending.set(true);
    try {
      this.entity.set(await firstValueFrom(this.#orderService.act(action, { id: order.id, reason })));
      this.#notify.success(action === 'approve' ? 'Đã duyệt đơn.' : action === 'reject' ? 'Đã từ chối đơn.' : 'Đã gửi duyệt.');
    } catch (error) {
      this.#notify.error(apiErrorMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
```

Tác vụ hàng loạt báo kết quả từng phần, giữ các dòng lỗi đang chọn, cho thử lại phần lỗi:

<!-- @source features/order/components/bulk-result/bulk-result.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdInform } from '@sdcorejs/angular/components/inform';

/** Kết quả của một tác vụ hàng loạt: số thành công trên tổng và từng đơn lỗi. */
export interface OrderBulkSummary {
  /** Động từ của tác vụ, ví dụ "Đã xác nhận". */
  readonly done: string;
  readonly total: number;
  readonly failed: readonly { readonly id: string; readonly code: string; readonly message: string }[];
}

/** Báo kết quả từng phần (E13): "Đã xác nhận 8/10. 2 đơn lỗi." kèm lỗi từng đơn và nút thử lại phần lỗi. */
@Component({
  selector: 'bulk-result',
  standalone: true,
  imports: [SdInform],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _result = result();
    <sd-inform
      autoId="order-bulk-result"
      [color]="_result.failed.length ? 'warning' : 'success'"
      [title]="title()"
      [description]="failures()"
      [actionLabel]="_result.failed.length ? 'Thử lại phần lỗi' : undefined"
      closable
      (sdAction)="retry.emit()"
      (sdClosed)="dismiss.emit()" />
  `,
})
export class BulkResultComponent {
  readonly result = input.required<OrderBulkSummary>();
  readonly retry = output<void>();
  readonly dismiss = output<void>();
  protected readonly title = computed(() => {
    const { done, total, failed } = this.result();
    return `${done} ${total - failed.length}/${total}.` + (failed.length ? ` ${failed.length} đơn lỗi.` : '');
  });
  // why: nội dung chiếu vào sd-inform thay cả tiêu đề lẫn nút hành động; lỗi từng đơn đi qua `description`.
  protected readonly failures = computed(
    () =>
      this.result()
        .failed.map(item => `${item.code}: ${item.message}`)
        .join(' ') || undefined
  );
}
```

## Quy tắc

- MUST có một nút chính nổi bật; nút phụ dùng kiểu nhẹ hơn và thứ tự ổn định.
- MUST tối đa ba tác vụ cấp ngoài trong mỗi vùng; từ bốn tác vụ, giữ hai tác vụ ưu tiên và gom từ tác vụ thứ ba vào "Thao tác khác".
- MUST dùng "Cập nhật <entity>", không dùng "Chỉnh sửa" (E5); nút cập nhật có icon `edit`.
- MUST gắn `*sdPermission` cho từng tác vụ và cho menu; điều kiện trạng thái tính trong TS. Không có nhóm rỗng khi mọi tác vụ con bị ẩn.
- MUST hỏi xác nhận trước Xoá, Duyệt, Từ chối và mọi tác vụ đổi trạng thái, cả từng bản ghi lẫn hàng loạt; Từ chối và Huỷ bắt buộc lý do (E13).
- MUST báo kết quả hàng loạt theo từng bản ghi: "Đã xác nhận 8/10. 2 đơn lỗi.", giữ dòng lỗi đang chọn, có "Thử lại phần lỗi".
- MUST chặn bấm lặp khi tác vụ đang chạy (`disabled`, `loading`).

## Lỗi hay gặp

- Coi request hàng loạt trả 200 là thành công toàn bộ: API trả kết quả từng bản ghi, phải đọc.
- Bỏ chọn tất cả sau tác vụ hàng loạt: người dùng mất dấu các dòng lỗi.
- Tác vụ Cập nhật, Chi tiết trên dòng danh sách: mở chi tiết bằng link trên mã; cập nhật nằm ở chi tiết.
