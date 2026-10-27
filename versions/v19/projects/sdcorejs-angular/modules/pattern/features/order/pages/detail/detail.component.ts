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
