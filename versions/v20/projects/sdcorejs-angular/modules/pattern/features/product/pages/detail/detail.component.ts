import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { PRODUCT_STATUS_OPTIONS, productStatusBadge, type ProductDto } from '../../services/product.model';

@Component({
  selector: 'detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageComponent, SdButton, SdSection, SdView, SdPermissionDirective, SdFormatNumberPipe],
  template: `
    @let product = entity();
    <sd-page-detail [title]="'Chi tiết sản phẩm #' + product.code" [description]="product.name" [badges]="badges()" [backLink]="['../..']">
      <sd-button
        headerRight
        *sdPermission="'PATTERN_PRODUCT_U_UPDATE'"
        title="Cập nhật"
        type="fill"
        color="primary"
        autoId="product-update"
        [routerLink]="['../update']" />
      <div class="d-flex flex-column gap-16 py-16">
        <sd-section title="Thông tin chung">
          <div class="row p-8">
            <div class="col-12 col-md-6 p-8"><sd-view label="Mã sản phẩm" [display]="product.code" /></div>
            <div class="col-12 col-md-6 p-8"><sd-view label="Tên sản phẩm" [display]="product.name" /></div>
            <div class="col-12 col-md-6 p-8"><sd-view label="Trạng thái" [display]="statusName()" /></div>
          </div>
        </sd-section>
        <sd-section title="Giá bán">
          <div class="row p-8">
            <div class="col-12 col-md-6 p-8"><sd-view label="Giá bán (₫)" [display]="product.price | sdFormatNumber: 0" /></div>
            <div class="col-12 col-md-6 p-8"><sd-view label="Đơn vị tính" [display]="product.unit" /></div>
          </div>
        </sd-section>
      </div>
    </sd-page-detail>
  `,
})
export class DetailComponent {
  /** Sản phẩm do resolver tải trước khi mở trang; đổi ID thì nhận bản ghi mới. */
  protected readonly entity = toSignal(inject(ActivatedRoute).data.pipe(map(data => data['entity'] as ProductDto)), { requireSync: true });
  protected readonly badges = computed(() => [productStatusBadge(this.entity().status)]);
  protected readonly statusName = computed(() => PRODUCT_STATUS_OPTIONS.find(option => option.id === this.entity().status)?.name);
}
