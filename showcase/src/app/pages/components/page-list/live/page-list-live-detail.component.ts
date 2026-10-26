import { NgTemplateOutlet } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SD_PAGE_LIST, SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { ORDER_STATUSES, ORDERS } from './page-list-live.data';

/**
 * Route con `:id/detail` của màn mẫu: mở chi tiết theo `detail` của sd-page-list — drawer 600px đè lên danh sách,
 * hoặc một sd-page-detail thay chỗ danh sách.
 */
@Component({
  selector: 'app-page-list-live-detail',
  standalone: true,
  imports: [NgTemplateOutlet, SdSideDrawer, SdButton, SdSection, SdPageComponent],
  template: `
    @let _order = order();
    @if (mode === 'drawer') {
      <sd-side-drawer [title]="'Đơn ' + (_order?.code ?? '')" width="600px" (sdClosed)="close()" data-e2e="detail-drawer">
        <div class="p-16 fields">
          <ng-container [ngTemplateOutlet]="fields"></ng-container>
        </div>
        <sd-button sdFooterRight title="Cập nhật" type="fill" color="primary"></sd-button>
      </sd-side-drawer>
    } @else {
      <sd-page-detail [title]="'Đơn ' + (_order?.code ?? '')" [badges]="badges()" [backLink]="['../..']" data-e2e="detail-page">
        <sd-button headerRight title="Cập nhật" type="fill" color="primary"></sd-button>
        <sd-section title="Thông tin chung">
          <div class="p-16 fields"><ng-container [ngTemplateOutlet]="fields"></ng-container></div>
        </sd-section>
      </sd-page-detail>
    }
    <ng-template #fields>
      <div><span>Khách hàng</span><strong>{{ _order?.customer }}</strong></div>
      <div><span>Kênh bán</span><strong>{{ _order?.channel }}</strong></div>
      <div><span>Kho xuất</span><strong>{{ _order?.warehouse }}</strong></div>
      <div><span>Thanh toán</span><strong>{{ _order?.payment }}</strong></div>
      <div><span>Tổng tiền</span><strong>{{ _order?.total }}</strong></div>
    </ng-template>
  `,
  styles: `
    .fields {
      display: grid;
      gap: 12px;
    }
    .fields div {
      display: flex;
      justify-content: space-between;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageListLiveDetailComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly mode = inject(SD_PAGE_LIST).detail();
  readonly drawer = viewChild(SdSideDrawer);
  readonly order = computed(() => ORDERS.find(order => order.id === Number(this.#route.snapshot.paramMap.get('id'))));
  readonly badges = computed(() => {
    const status = ORDER_STATUSES.find(item => item.value === this.order()?.status);
    return status ? [{ title: status.display, color: status.color }] : [];
  });

  constructor() {
    afterNextRender(() => this.drawer()?.open());
  }

  close(): void {
    // why: X, Esc, backdrop đều đi qua sdClosed; quay về danh sách bằng điều hướng để nút Back cũng đóng được.
    // Route con có hai segment (:id/detail) nên phải lùi hai bậc.
    void this.#router.navigate(['../..'], { relativeTo: this.#route, queryParamsHandling: 'preserve' });
  }
}
