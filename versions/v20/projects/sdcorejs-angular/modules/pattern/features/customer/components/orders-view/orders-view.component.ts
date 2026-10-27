import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { CustomerService } from '../../services/customer.service';
import type { CustomerOrderDto } from '../../services/customer.model';

/** Tab Đơn hàng của hồ sơ 360°: tải khi tab được mở lần đầu; bảng tự có trạng thái đang tải, rỗng và lỗi. */
@Component({
  selector: 'orders-view',
  standalone: true,
  imports: [RouterLink, SdTable, SdTableCellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-table autoId="customer-orders" [option]="option">
      <ng-template sdTableCellDef="code" let-order="item">
        <a [routerLink]="['../../../order', order.id, 'detail']">{{ order.code }}</a>
      </ng-template>
    </sd-table>
  `,
})
export class OrdersViewComponent {
  readonly #customerService = inject(CustomerService);
  readonly customerId = input.required<string>();
  protected readonly option: SdTableOption<CustomerOrderDto> = {
    type: 'server',
    items: () => firstValueFrom(this.#customerService.orders(this.customerId())),
    paginate: { pageSize: 10 },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '140px' },
      { field: 'createdAt', title: 'Ngày tạo', type: 'date', width: '160px' },
      { field: 'total', title: 'Tổng tiền (₫)', type: 'number', align: 'right' },
    ],
  };
}
