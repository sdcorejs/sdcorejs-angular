# List

Danh sách có bảng: `sd-page-list` + `sd-table`. Route mẫu: `/pattern/product` (đơn giản), `/pattern/order` (tab, score card, chọn nhiều, tác vụ hàng loạt), `/pattern/customer` (score card lọc), `/pattern/category` (bảng cây).

## Khi nào dùng / khi nào không

- Dùng cho màn có một bảng chính: tìm, lọc, phân trang, mở chi tiết.
- Danh sách và chi tiết cần cạnh nhau để xử lý nhanh từng mục: dùng [split](split.md).
- Một bản ghi duy nhất (cài đặt): dùng [form](form.md), không dựng danh sách một dòng.

## Code mẫu

Danh sách đơn giản: quick search, filter dưới cột, mã là link theo quyền, header có menu Nhập/Xuất và Tạo mới.

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

<!-- @source features/product/pages/list/list.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, effect, inject, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton, SdButtonItem } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { ProductService } from '../../services/product.service';
import { PRODUCT_STATUS_OPTIONS, productStatusBadge, type ProductDto } from '../../services/product.model';

@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageList, SdButton, SdButtonItem, SdTable, SdTableCellDefDirective, SdPermissionDirective],
})
export class ListComponent {
  readonly #productService = inject(ProductService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly pageList = viewChild.required(SdPageList);
  private readonly table = viewChild.required(SdTable);
  // Route guard đã nạp quyền trước khi tạo page; dùng cho text thay link khi thiếu quyền xem chi tiết.
  protected readonly canOpenDetail = inject(SdPermissionService).hasPermission('PATTERN_PRODUCT_R_DETAIL');

  protected readonly tableOption: SdTableOption<ProductDto> = {
    type: 'server',
    items: (_, req) => firstValueFrom(this.#productService.list(req)),
    sort: { enable: true },
    filter: {
      quickSearch: {
        containFields: ['code', 'name'],
        placeholder: 'Tìm theo mã hoặc tên sản phẩm',
      },
    },
    columns: [
      { field: 'code', title: 'Mã sản phẩm', type: 'string', width: '160px', sortable: true },
      { field: 'name', title: 'Tên sản phẩm', type: 'string', minWidth: '240px', sortable: true },
      { field: 'unit', title: 'Đơn vị tính', type: 'string', width: '140px' },
      { field: 'price', title: 'Giá bán (₫)', type: 'number', width: '150px', align: 'right', sortable: true },
      {
        field: 'status',
        title: 'Trạng thái',
        type: 'values',
        width: '180px',
        option: { items: PRODUCT_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => productStatusBadge(status),
      },
    ],
  };

  constructor() {
    // Lưu ở trang con xong rồi quay về: tải lại đúng trang, bộ lọc và vị trí cuộn đang có.
    let seen = this.#productService.changes();
    effect(() => {
      const changes = this.#productService.changes();
      if (this.pageList().childActive() || changes === seen) return;
      seen = changes;
      untracked(() => void this.table().reload(true, false));
    });
  }

  protected openImport(): void {
    void this.#router.navigate(['../import'], { relativeTo: this.#route });
  }

  protected exportData(): void {
    this.table().exportExcel();
  }
}
```

Chi tiết, tạo và cập nhật là route con của danh sách, nên quay lại vẫn giữ bộ lọc, trang và vị trí cuộn:

<!-- @source features/product/routes.ts -->
```ts
import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { ProductService } from './services/product.service';

/** Detail, create và update là route con của danh sách: quay lại vẫn giữ bộ lọc, trang và vị trí cuộn. */
export const routes: Routes = [
  {
    path: '',
    providers: [ProductService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Sản phẩm',
        data: { permission: 'PATTERN_PRODUCT_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            title: 'Tạo sản phẩm',
            data: { permission: 'PATTERN_PRODUCT_C_CREATE' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
          },
          {
            path: ':id/detail',
            title: 'Chi tiết sản phẩm',
            data: { permission: 'PATTERN_PRODUCT_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
          },
          {
            path: ':id/update',
            title: 'Cập nhật sản phẩm',
            data: { permission: 'PATTERN_PRODUCT_U_UPDATE' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent),
          },
        ],
      },
    ],
  },
];
```

Tab, score card và request dùng chung một state; đổi trạng thái thì đọc lại từ trang 1:

<!-- @source features/order/pages/list/list.component.html -->
```html
@let _settings = settings();
<sd-page-list title="Đơn hàng" description="Đơn bán lẻ từ mọi kênh." [detail]="detailMode()" [autoCompact]="_settings.autoCompact">
  <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
    <!-- Chỉ có ở /pattern. -->
    <sd-pattern-settings-button />
    <sd-button
      *sdPermission="'PATTERN_ORDER_C_CREATE'"
      title="Tạo đơn hàng"
      prefixIcon="add"
      type="fill"
      color="primary"
      autoId="order-create"
      [routerLink]="['create']" />
  </div>

  @if (_settings.tabs) {
    <sd-tab-group sdSubheader [selectedIndex]="tabIndex()" (selectedIndexChange)="selectTab($event)">
      @for (tab of tabs; track tab.label) {
        <sd-tab [label]="tab.label" [badge]="counts()?.[tab.status ?? 'all']" />
      }
    </sd-tab-group>
  }
  @if (_settings.score) {
    <summary-cards [counts]="counts()" [(status)]="status" />
  }
  @if (bulkResult(); as result) {
    <bulk-result [result]="result" (retry)="retryFailed()" (dismiss)="bulkResult.set(null)" />
  }

  <sd-table autoId="orders" [option]="option()">
    <ng-template sdTableCellDef="code" let-order="item">
      <a *sdPermission="'PATTERN_ORDER_R_DETAIL'" [routerLink]="[order.id, 'detail']">{{ order.code }}</a>
      @if (!canOpenDetail) {
        <span>{{ order.code }}</span>
      }
    </ng-template>
  </sd-table>
</sd-page-list>
```

<!-- @source features/order/pages/list/list.component.ts#state -->
```ts
/** Một state cho tab, score card và request: đổi trạng thái thì đọc lại từ trang 1. */
protected readonly status = signal<OrderStatus | null>(null);
protected readonly tabIndex = computed(() => TABS.findIndex(tab => tab.status === this.status()));
protected readonly counts = signal<OrderCounts | null>(null);
```

## Quy tắc

- MUST dùng `sd-page-list`; bảng chính là `sd-table` trực tiếp trong thân (hoặc phần tử gắn `sdPageListMain`). Không viết `h-full`, `overflow` hay chiều cao cho danh sách (E1).
- MUST mở chi tiết bằng link trên mã hoặc tên ở cột dữ liệu đầu tiên. Không có tác vụ Xem/Cập nhật trên dòng, trên thanh chọn nhiều hay ở header.
- MUST hiện mã dạng chữ khi thiếu quyền xem chi tiết; chuẩn bị cờ quyền trong TS (`hasPermission` sau khi guard đã nạp quyền), không gọi service quyền trong template.
- MUST đặt chi tiết, tạo, cập nhật là route con của danh sách; `detail="page"` ẩn danh sách, `detail="drawer"` giữ danh sách trên màn.
- MUST tải lại danh sách khi trang con đã lưu thành công (service đếm số lần thay đổi), không tải lại mỗi lần đóng.
- MUST giữ một chỗ lọc cho mỗi field (E6): field có cột lọc dưới cột; external filter chỉ chứa field không có cột; có tab trạng thái thì tắt filter dưới cột Trạng thái. Không bật quick search cùng external filter.
- MUST truyền nguyên `PagingReq` (tham số thứ hai của `items`) vào service; service chuyển sang định dạng của API.
- SHOULD giữ mặc định `hideInlineFilter: false`; màn ít dữ liệu dùng `'auto'`; không dùng `true` (E7).
- SHOULD gọi `reloadFirstPage()` của `sd-table` khi một điều kiện ngoài bảng (tab, score card) đổi; `reload()` giữ trang hiện tại.

## Lỗi hay gặp

- Bọc `sd-table` trong `div` có chiều cao cố định hoặc `overflow: auto`: sinh scrollbar thứ hai, paginator bị đẩy khỏi màn hình.
- Lọc trạng thái ở cả tab, score card và dưới cột: ba state lệch nhau, request không khớp thứ người dùng thấy.
- Đổi tab mà vẫn ở trang 3: danh sách rỗng dù có dữ liệu.
- Lấy dữ liệu của dòng làm chi tiết: dòng chỉ có vài field; chi tiết luôn tải bằng `detail(id)`.
