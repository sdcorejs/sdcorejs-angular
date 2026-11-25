import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import type { CustomerDebtDto } from '../../services/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'debts-view',
  standalone: true,
  imports: [RouterLink, SdTable, SdTableCellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-table autoId="customer-debts" syncQueryParams [option]="option">
      <ng-template sdTableCellDef="orderCode" let-debt="item">
        @if (canOpenOrder) {
          <a [routerLink]="['../../../order', debt.orderId, 'detail']">{{ debt.orderCode }}</a>
        } @else {
          {{ debt.orderCode }}
        }
      </ng-template>
    </sd-table>
  `,
})
export class DebtsViewComponent {
  readonly #service = inject(CustomerService);
  readonly #destroy = inject(DestroyRef);
  protected readonly canOpenOrder = inject(SdPermissionService).hasPermission('PATTERN_ORDER_R_DETAIL');
  readonly customerId = input.required<string>();
  protected readonly option: SdTableOption<CustomerDebtDto> = {
    type: 'server',
    rowKey: 'id',
    items: (_, req) => firstValueFrom(this.#service.debts(this.customerId(), req).pipe(takeUntilDestroyed(this.#destroy))),
    paginate: { pageSize: 10 },
    filter: {},
    columns: [
      { field: 'orderCode', title: 'Đơn hàng', type: 'string', width: '140px' },
      { field: 'dueDate', title: 'Hạn thanh toán', type: 'date', width: '160px' },
      {
        field: 'status',
        title: 'Trạng thái',
        type: 'values',
        option: {
          items: [
            { id: 'OVERDUE', name: 'Quá hạn' },
            { id: 'CURRENT', name: 'Trong hạn' },
          ],
          valueField: 'id',
          displayField: 'name',
        },
        useBadge: (status, debt) =>
          status === 'OVERDUE'
            ? { title: 'Quá hạn ' + debt.overdueDays + ' ngày', color: 'error' }
            : { title: 'Trong hạn', color: 'secondary' },
      },
      { field: 'amount', title: 'Còn nợ (₫)', type: 'number', align: 'right' },
    ],
  };
}
