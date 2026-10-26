import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SdTable, type SdTableOption } from '@sdcorejs/angular/components/table';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDebtDto } from '../../services/customer.model';

/** Tab Công nợ của hồ sơ 360°. */
@Component({
  selector: 'debts-view',
  standalone: true,
  imports: [SdTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-table autoId="customer-debts" [option]="option" />`,
})
export class DebtsViewComponent {
  readonly #customerService = inject(CustomerService);
  readonly customerId = input.required<string>();
  protected readonly option: SdTableOption<CustomerDebtDto> = {
    type: 'server',
    items: () => firstValueFrom(this.#customerService.debts(this.customerId())),
    paginate: { pageSize: 10 },
    columns: [
      { field: 'orderCode', title: 'Đơn hàng', type: 'string', width: '140px' },
      { field: 'dueDate', title: 'Hạn thanh toán', type: 'date', width: '160px' },
      { field: 'amount', title: 'Còn nợ (₫)', type: 'number', align: 'right' },
    ],
  };
}
