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
