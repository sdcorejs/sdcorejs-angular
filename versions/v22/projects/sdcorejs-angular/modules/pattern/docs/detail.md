# Detail

Xem một bản ghi: `sd-page-detail`. Route mẫu: `/pattern/product/:id/detail` (section và `sd-view`), `/pattern/order/:id/detail` (workflow duyệt, cột phụ quy trình), `/pattern/customer/:id/360` (hồ sơ nhiều tab).

## Khi nào dùng / khi nào không

- Dùng khi bản ghi có nhiều nhóm thông tin, quan hệ hoặc tác vụ nghiệp vụ.
- Bản ghi ngắn, xem nhanh ngay trên danh sách: dùng drawer chi tiết ([drawer](drawer.md)).
- Nhiều tab, bảng quan hệ lớn (hồ sơ 360°): luôn là trang, không đặt vào drawer.

## Code mẫu

Bản ghi do resolver tải trước khi mở trang; trang nhận bản ghi qua `ActivatedRoute.data`, không gọi lại API chính.

<!-- @source features/product/entity.resolver.ts -->
```ts
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { ProductService } from './services/product.service';
import type { ProductDto } from './services/product.model';

/** Tải sản phẩm trước khi mở detail/update; lỗi (404, 403, timeout) đi tới navigation error handler của host. */
export const entityResolver: ResolveFn<ProductDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(ProductService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};
```

<!-- @source features/product/pages/detail/detail.component.ts -->
```ts
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
```

Hồ sơ 360°: tab trong `sdSubheader`, tab ghi trên URL, mở tab nào mới tải tab đó:

<!-- @source features/customer/pages/profile/profile.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { DebtsViewComponent } from '../../components/debts-view/debts-view.component';
import { DocumentsViewComponent } from '../../components/documents-view/documents-view.component';
import { GeneralInformationViewComponent } from '../../components/general-information-view/general-information-view.component';
import { OrdersViewComponent } from '../../components/orders-view/orders-view.component';
import { customerStatusBadge, customerTypeName, type CustomerDto } from '../../services/customer.model';

const TABS = [
  { key: 'info', label: 'Thông tin' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'debts', label: 'Công nợ' },
  { key: 'documents', label: 'Tài liệu' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/**
 * Hồ sơ 360° (`:id/360`): thông tin chung và các quan hệ của khách hàng theo tab. Tab ghi trên URL (`?tab=`);
 * mở tab nào mới tải tab đó, mỗi tab tự có trạng thái đang tải, rỗng và lỗi.
 */
@Component({
  selector: 'profile',
  standalone: true,
  imports: [
    RouterLink,
    SdPageComponent,
    SdButton,
    SdTabGroup,
    SdTab,
    SdPermissionDirective,
    GeneralInformationViewComponent,
    OrdersViewComponent,
    DebtsViewComponent,
    DocumentsViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let customer = entity();
    <sd-page-detail
      [title]="'Hồ sơ khách hàng #' + customer.code"
      [description]="customer.name + ' · ' + typeName()"
      [badges]="badges()"
      [backLink]="['../..']">
      <sd-button
        headerRight
        *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
        title="Cập nhật khách hàng"
        type="fill"
        color="primary"
        autoId="customer-profile-update"
        [routerLink]="['../update']" />
      <sd-tab-group sdSubheader [selectedIndex]="tabIndex()" (selectedIndexChange)="selectTab($event)">
        @for (tab of tabs; track tab.key) {
          <sd-tab [label]="tab.label" />
        }
      </sd-tab-group>
      <div class="py-16">
        @for (tab of tabs; track tab.key; let index = $index) {
          @if (opened().has(tab.key)) {
            <div [hidden]="tabIndex() !== index" [attr.data-customer-tab]="tab.key">
              @switch (tab.key) {
                @case ('info') {
                  <general-information-view [customer]="customer" />
                }
                @case ('orders') {
                  <orders-view [customerId]="customer.id" />
                }
                @case ('debts') {
                  <debts-view [customerId]="customer.id" />
                }
                @case ('documents') {
                  <documents-view [customerId]="customer.id" />
                }
              }
            </div>
          }
        }
      </div>
    </sd-page-detail>
  `,
})
export class ProfileComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  protected readonly tabs = TABS;
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as CustomerDto)), { requireSync: true });
  protected readonly badges = computed(() => [customerStatusBadge(this.entity().status)]);
  protected readonly typeName = computed(() => customerTypeName(this.entity().type));
  readonly #tabParam = toSignal(this.#route.queryParamMap.pipe(map(params => params.get('tab'))), { requireSync: true });
  protected readonly tabIndex = computed(() =>
    Math.max(
      0,
      TABS.findIndex(tab => tab.key === this.#tabParam())
    )
  );
  /** Tab đã mở ít nhất một lần: giữ lại khi chuyển tab, không tải lại. Đổi khách hàng thì bắt đầu lại. */
  protected readonly opened = linkedSignal<CustomerDto, ReadonlySet<TabKey>>({
    source: this.entity,
    // untracked: đổi tab không được đặt lại các tab đã mở; chỉ đổi khách hàng mới bắt đầu lại.
    computation: () => new Set<TabKey>([TABS[untracked(this.tabIndex)].key]),
  });

  protected selectTab(index: number): void {
    const key = TABS[index]?.key ?? 'info';
    this.opened.update(opened => new Set([...opened, key]));
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: { tab: key === 'info' ? null : key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
```

## Quy tắc

- MUST đặt title "Chi tiết <entity> #<mã>", badge trạng thái cạnh title qua `[badges]` (tối đa hai: trạng thái trước, thuộc tính sau), mô tả ngắn ở dòng thứ hai. Không thay cả vùng trái bằng `headerLeft` chỉ để thêm nút ←: dùng `backLink` (E2).
- MUST tải bản ghi bằng resolver gọi `detail(id)` của service sở hữu entity; lỗi (404, 403, timeout) để navigation error handler của host xử lý, không mở trang với bản ghi rỗng.
- MUST nhận bản ghi mới khi đổi ID (`runGuardsAndResolvers: 'paramsChange'`, đọc `data` dạng signal).
- MUST đặt nút chính "Cập nhật <entity>" (`type="fill"`) ở `headerRight`; tối đa ba tác vụ cấp ngoài, từ tác vụ thứ ba gom vào Action Popover ([header-actions](header-actions.md)).
- MUST hiện tác vụ theo quyền (`*sdPermission`) và theo trạng thái nghiệp vụ (computed trong TS); quyền xem không suy ra quyền cập nhật.
- SHOULD chia thông tin theo `sd-section`; trong section dùng `sd-view` cho field ngắn hoặc `sd-section-item` cho dạng thuộc tính.
- SHOULD dùng `sdAside` cho thông tin phụ (quy trình duyệt, người phụ trách); dưới 1200px cột phụ xuống dưới thân.

## Lỗi hay gặp

- Gọi API tải bản ghi trong `ngOnInit` của trang: trang mở trước khi có dữ liệu, lỗi 404 hiện thành trang trống.
- Hiện ID quan hệ thay vì tên: dùng pipe [relation](relation.md).
- Tải mọi tab của hồ sơ 360° ngay khi mở trang: chậm và tốn request cho tab người dùng không xem.
