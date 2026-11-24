import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { ORDER_STATUS_OPTIONS, orderStatusBadge } from '../../../order/services/order.model';
import type { CustomerOrderDto } from '../../services/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'orders-view',
  standalone: true,
  imports: [RouterLink, SdTable, SdTableCellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-table autoId="customer-orders" syncQueryParams [option]="option">
      <ng-template sdTableCellDef="code" let-order="item">
        @if (canOpenOrder) {
          <a [routerLink]="['../../../order', order.id, 'detail']">{{ order.code }}</a>
        } @else {
          {{ order.code }}
        }
      </ng-template>
    </sd-table>
  `,
})
export class OrdersViewComponent {
  readonly #service = inject(CustomerService);
  readonly #destroy = inject(DestroyRef);
  protected readonly canOpenOrder = inject(SdPermissionService).hasPermission('PATTERN_ORDER_R_DETAIL');
  readonly customerId = input.required<string>();
  protected readonly option: SdTableOption<CustomerOrderDto> = {
    type: 'server',
    rowKey: 'id',
    items: (_, req) => firstValueFrom(this.#service.orders(this.customerId(), req).pipe(takeUntilDestroyed(this.#destroy))),
    paginate: { pageSize: 10 },
    filter: { hideInlineFilter: 'auto' },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '140px' },
      { field: 'createdAt', title: 'Ngày tạo', type: 'date', width: '160px' },
      {
        field: 'status',
        title: 'Trạng thái',
        type: 'values',
        option: { items: ORDER_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => orderStatusBadge(status),
      },
      { field: 'total', title: 'Tổng tiền (₫)', type: 'number', align: 'right' },
    ],
  };
}
