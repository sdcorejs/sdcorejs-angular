# States

Đang tải, rỗng, lỗi và thiếu quyền. Thanh công cụ của `/pattern` đổi độ trễ, lỗi giả lập (500, timeout, 404, 403) và vai trò để xem từng trạng thái trên mọi route; drawer "Tuỳ chỉnh hiển thị" của `/pattern/order` ép trạng thái đọc của danh sách.

## Khi nào dùng / khi nào không

- Mọi vùng tải dữ liệu đều có trạng thái đang tải, rỗng và lỗi riêng.
- Bảng `sd-table` đã tự có ba trạng thái này: không bọc thêm.

## Code mẫu

Tab Tài liệu tải ở lần mở đầu tiên và dùng trạng thái của `sd-table`.

<!-- @source features/customer/components/documents-view/documents-view.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { SdDataState, SdDataStateTemplateDirective } from '@sdcorejs/angular/components/data-state';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import type { CustomerDocumentDto } from '../../services/customer.model';
import { CustomerService } from '../../services/customer.service';
import { DocumentPreviewComponent } from './document-preview.component';

@Component({
  selector: 'documents-view',
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdDataState, SdDataStateTemplateDirective, SdFormatNumberPipe, DocumentPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-table #table autoId="customer-documents" syncQueryParams [option]="option">
      <ng-template sdDataStateTemplate let-state let-retry="retry">
        <sd-data-state
          [state]="state"
          compact
          [retryable]="state === 'error'"
          [title]="state === 'error' ? 'Không tải được tài liệu' : undefined"
          [message]="
            state === 'empty' ? (table.isFiltered() ? 'Không có tài liệu phù hợp với bộ lọc.' : 'Khách hàng chưa có tài liệu.') : undefined
          "
          (sdRetry)="retry()" />
      </ng-template>
      <ng-template sdTableCellDef="name" let-document="item">
        <button class="text-primary" type="button" (click)="preview.open(document)">{{ document.name }}</button>
      </ng-template>
      <ng-template sdTableCellDef="size" let-document="item">{{ document.size / 1024 | sdFormatNumber: 0 }} KB</ng-template>
    </sd-table>
    <document-preview #preview />
  `,
  styles: `
    button {
      font: inherit;
      text-align: start;
      cursor: pointer;
      padding: 0;
      border: 0;
      background: none;
    }
    button:hover {
      text-decoration: underline;
    }
  `,
})
export class DocumentsViewComponent {
  readonly #service = inject(CustomerService);
  readonly #destroy = inject(DestroyRef);
  readonly customerId = input.required<string>();
  protected readonly option: SdTableOption<CustomerDocumentDto> = {
    type: 'server',
    rowKey: 'id',
    items: (_, req) => firstValueFrom(this.#service.documents(this.customerId(), req).pipe(takeUntilDestroyed(this.#destroy))),
    paginate: { pageSize: 10 },
    filter: { hideInlineFilter: 'auto' },
    columns: [
      { field: 'name', title: 'Tên tài liệu', type: 'string' },
      { field: 'uploadedAt', title: 'Ngày tải lên', type: 'date', width: '160px' },
      { field: 'size', title: 'Dung lượng', type: 'number', align: 'right', width: '130px', filter: { disabled: true } },
    ],
  };
}
```

Lỗi trước khi mở trang thuộc resolver; host chuyển 404, 403, lỗi mạng sang trang lỗi của mình:

<!-- @source features/customer/entity.resolver.ts -->
```ts
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { CustomerService } from './services/customer.service';
import type { CustomerDto } from './services/customer.model';

/** Tải khách hàng bằng `detail(id)` trước khi mở hồ sơ 360°; lỗi đi tới navigation error handler của host. */
export const entityResolver: ResolveFn<CustomerDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(CustomerService)
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

Quyền vào route bằng `canActivateChild: [SdPermissionGuard]` và `data.permission` trên từng route:

<!-- @source features/order/routes.ts -->
```ts
import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { CustomerService } from '../customer/services/customer.service';
import { ProductService } from '../product/services/product.service';
import { entityResolver, updatableEntityResolver } from './entity.resolver';
import { OrderService } from './services/order.service';

/**
 * Chi tiết là route con của danh sách (drawer hoặc trang theo `detail`); tạo và cập nhật là trang thay chỗ danh sách
 * (`data.detail: 'page'`). CustomerService và ProductService được cấp ở đây cho `customer-select`, `product-select`
 * và các pipe relation: đơn hàng dùng wrapper của feature sở hữu entity, không tự gọi API của entity khác.
 */
export const routes: Routes = [
  {
    path: '',
    providers: [OrderService, CustomerService, ProductService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Đơn hàng',
        data: { permission: 'PATTERN_ORDER_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            title: 'Tạo mới đơn hàng',
            data: { permission: 'PATTERN_ORDER_C_CREATE', detail: 'page' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
          },
          {
            path: ':id/detail',
            title: 'Chi tiết đơn hàng',
            data: { permission: 'PATTERN_ORDER_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
          },
          {
            path: ':id/update',
            title: 'Cập nhật đơn hàng',
            data: { permission: 'PATTERN_ORDER_U_UPDATE', detail: 'page' },
            resolve: { entity: updatableEntityResolver },
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

## Quy tắc

- MUST để lỗi tải bản ghi bắt buộc đi qua resolver tới navigation error handler của host; không mở trang rồi mới báo lỗi.
- MUST khai báo `data.permission` cho mọi route con; guard từ chối route quên khai báo.
- MUST giữ các vùng phụ (tab của hồ sơ, relation) có trạng thái riêng; lỗi một vùng không làm hỏng cả trang.
- MUST không biến lỗi thành dữ liệu rỗng thành công; có nút thử lại khi lỗi có thể hết.
- MUST giữ dữ liệu người dùng đã nhập khi lưu lỗi (500, timeout).
- SHOULD dùng `sd-data-state` cho vùng không phải bảng; `retryable` khi thử lại có ý nghĩa.

## Lỗi hay gặp

- Bắt lỗi API rồi trả mảng rỗng: người dùng thấy "Không có dữ liệu" khi máy chủ đang lỗi.
- Chỉ ẩn nút theo quyền mà không chặn route: mở URL trực tiếp vẫn vào được.
- Đổi vai trò mà không chạy lại guard: nút theo quyền cũ còn trên màn. `*sdPermission` đọc quyền lúc tạo, nên màn phải mở lại.
