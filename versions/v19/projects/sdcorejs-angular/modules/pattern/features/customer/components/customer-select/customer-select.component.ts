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
