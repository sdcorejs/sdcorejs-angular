# Select

Chọn entity hoặc enum qua wrapper của feature sở hữu entity. Mẫu: `product-select` và `customer-select` (dòng đơn hàng, đầu đơn hàng), `product-status-select`, `customer-type-select`.

## Khi nào dùng / khi nào không

- Dùng wrapper mỗi khi một màn chọn entity của feature khác, hoặc chọn một enum của entity.
- Danh sách lựa chọn cố định chỉ dùng một lần trong chính feature (kênh bán của đơn hàng): `sd-select` với hằng số trong `<entity>.model.ts` là đủ.

## Code mẫu

Entity: lựa chọn mới chỉ gồm bản ghi đang hoạt động (`SEARCH`); giá trị đã chọn tải theo ID (`VALUE`) nên bản ghi đã ngừng vẫn hiện khi cập nhật. Option hai dòng có avatar:

<!-- @source features/customer/components/customer-select/customer-select.component.ts -->
```ts
import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';
import { SdItemDefDefDirective } from '@sdcorejs/angular/forms/directives';
import type { SdSearchReq } from '@sdcorejs/angular/forms/models';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import type { Filter } from '@sdcorejs/utils/models';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDto } from '../../services/customer.model';

/**
 * Chọn khách hàng cho màn khác (đơn hàng). Lựa chọn mới chỉ gồm khách đang hoạt động; giá trị đã chọn tải theo ID
 * (`VALUE`) nên khách đã ngừng vẫn hiện khi cập nhật. Option hai dòng có avatar: tên · mã · điện thoại.
 */
@Component({
  selector: 'customer-select',
  standalone: true,
  imports: [SdSelect, SdItemDefDefDirective, SdAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-select
    [label]="label()"
    [name]="name()"
    [form]="form()"
    [(model)]="model"
    [items]="search"
    valueField="id"
    displayField="name"
    [required]="required()"
    [autoId]="autoId()">
    <ng-template sdItemDef let-item="item">
      <div class="d-flex align-items-center gap-8">
        <sd-avatar [src]="null" [name]="item.name" [size]="28" />
        <div class="d-flex flex-column">
          <span>{{ item.name }}</span>
          <small class="text-secondary"
            >{{ item.code }} · {{ item.phone }}{{ item.status === 'inactive' ? ' · Ngừng hoạt động' : '' }}</small
          >
        </div>
      </div>
    </ng-template>
  </sd-select>`,
})
export class CustomerSelectComponent {
  readonly #customerService = inject(CustomerService);
  readonly form = input<FormGroup>();
  readonly name = input('customerId');
  readonly label = input<string | undefined>('Khách hàng');
  readonly required = input(false, { transform: booleanAttribute });
  readonly autoId = input<string>();
  readonly model = model<string | null | undefined>();

  protected readonly search = async (req: SdSearchReq): Promise<CustomerDto[]> => {
    if (req.type === 'VALUE') {
      const ids = (Array.isArray(req.value) ? req.value : [req.value]).filter((id): id is string => !!id);
      return Promise.all(ids.map(id => firstValueFrom(this.#customerService.cachedDetail(id))));
    }
    const filters: Filter<CustomerDto>[] = [{ field: 'status', operator: 'EQUAL', data: 'active' }];
    if (req.searchText) {
      filters.push({
        operator: 'OR',
        data: [
          { field: 'name', operator: 'CONTAIN', data: req.searchText },
          { field: 'code', operator: 'CONTAIN', data: req.searchText },
          { field: 'phone', operator: 'CONTAIN', data: req.searchText },
        ],
      });
    }
    const res = await firstValueFrom(this.#customerService.list({ pageNumber: 0, pageSize: 20, filters }));
    return res.items;
  };
}
```

<!-- @source features/product/components/product-select/product-select.component.ts -->
```ts
import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SdItemDefDefDirective } from '@sdcorejs/angular/forms/directives';
import type { SdSearchReq } from '@sdcorejs/angular/forms/models';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import type { Filter } from '@sdcorejs/utils/models';
import { ProductService } from '../../services/product.service';
import type { ProductDto } from '../../services/product.model';

/**
 * Chọn sản phẩm cho màn khác (dòng đơn hàng). Lựa chọn mới chỉ gồm sản phẩm đang hoạt động; giá trị đã chọn
 * được tải theo ID (`VALUE`) nên sản phẩm đã ngừng vẫn hiển thị khi cập nhật. Option hai dòng: tên · mã · đơn vị.
 */
@Component({
  selector: 'product-select',
  standalone: true,
  imports: [SdSelect, SdItemDefDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-select
    [label]="label()"
    [name]="name()"
    [form]="form()"
    [(model)]="model"
    [items]="search"
    valueField="id"
    displayField="name"
    [required]="required()"
    [autoId]="autoId()">
    <ng-template sdItemDef let-item="item">
      <div class="d-flex flex-column">
        <span>{{ item.name }}</span>
        <small class="text-secondary">{{ item.code }} · {{ item.unit }}{{ item.status === 'inactive' ? ' · Ngừng hoạt động' : '' }}</small>
      </div>
    </ng-template>
  </sd-select>`,
})
export class ProductSelectComponent {
  readonly #productService = inject(ProductService);
  readonly form = input<FormGroup>();
  readonly name = input('productId');
  readonly label = input<string | undefined>('Sản phẩm');
  readonly required = input(false, { transform: booleanAttribute });
  readonly autoId = input<string>();
  readonly model = model<string | null | undefined>();

  protected readonly search = async (req: SdSearchReq): Promise<ProductDto[]> => {
    if (req.type === 'VALUE') {
      const ids = (Array.isArray(req.value) ? req.value : [req.value]).filter((id): id is string => !!id);
      return Promise.all(ids.map(id => firstValueFrom(this.#productService.cachedDetail(id))));
    }
    const filters: Filter<ProductDto>[] = [{ field: 'status', operator: 'EQUAL', data: 'active' }];
    if (req.searchText) {
      filters.push({
        operator: 'OR',
        data: [
          { field: 'name', operator: 'CONTAIN', data: req.searchText },
          { field: 'code', operator: 'CONTAIN', data: req.searchText },
        ],
      });
    }
    const res = await firstValueFrom(this.#productService.list({ pageNumber: 0, pageSize: 20, filters }));
    return res.items;
  };
}
```

Enum: options và label thuộc model của feature:

<!-- @source features/product/components/product-status-select/product-status-select.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { PRODUCT_STATUS_OPTIONS, type ProductStatus } from '../../services/product.model';

/** Dropdown trạng thái sản phẩm: options và label thuộc feature, nơi dùng chỉ bind model/form. */
@Component({
  selector: 'product-status-select',
  standalone: true,
  imports: [SdSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-select
    [label]="label()"
    [name]="name()"
    [form]="form()"
    [(model)]="model"
    [items]="options"
    valueField="id"
    displayField="name"
    [required]="required()"
    [clearable]="false" />`,
})
export class ProductStatusSelectComponent {
  readonly form = input<FormGroup>();
  readonly name = input('status');
  readonly label = input('Trạng thái');
  readonly required = input(true);
  readonly model = model<ProductStatus | null | undefined>();
  protected readonly options = PRODUCT_STATUS_OPTIONS;
}
```

## Quy tắc

- MUST đặt wrapper trong `components/` của feature sở hữu entity; màn dùng nó (đơn hàng) không tự gọi API của entity khác, không khai báo lại `items`, `valueField`, `displayField`.
- MUST tách lựa chọn mới (`SEARCH`, có điều kiện như đang hoạt động) với giá trị đã chọn (`VALUE`, tải theo ID kể cả bản ghi đã ngừng).
- MUST cấp service của entity ở route của màn dùng wrapper (`providers` của route đơn hàng có `CustomerService`, `ProductService`).
- MUST giữ option tối đa hai dòng: dòng đầu là tên, dòng hai là mã và thông tin phân biệt; trong bảng nhập liệu, giá trị đã chọn chỉ hiện gọn trong ô.
- SHOULD mở input của wrapper chỉ cho thứ nơi dùng cần (`form`, `name`, `model`, `required`, `label`).

## Lỗi hay gặp

- Lọc bản ghi đang hoạt động ở client cho cả giá trị đã chọn: đơn của khách đã ngừng mở ra ô trống.
- Gọi `detail(id)` cho từng option: dùng kết quả tìm kiếm cho danh sách, chỉ tải theo ID cho giá trị đã chọn.
