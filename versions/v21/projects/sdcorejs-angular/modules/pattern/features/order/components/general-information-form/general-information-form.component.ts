import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FormArray, FormControl, FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { CustomerSelectComponent } from '../../../customer/components/customer-select/customer-select.component';
import { ORDER_CHANNELS, ORDER_PAYMENTS, ORDER_WAREHOUSES, type OrderLineDto, type OrderSaveReq } from '../../services/order.model';

/** Form đơn hàng: field của đầu chứng từ do Core tự đăng ký; `lines` là FormArray do `lines-form` quản lý. */
export type OrderForm = FormGroup<{
  customerId?: FormControl<string | null>;
  channel?: FormControl<string>;
  warehouse?: FormControl<string>;
  payment?: FormControl<string>;
  note?: FormControl<string | null>;
  lines?: FormArray<FormGroup>;
}>;

/** Giá trị form → request lưu. */
export function orderSaveReq(form: OrderForm): OrderSaveReq {
  const value = form.getRawValue();
  const lines = (value.lines ?? []) as Partial<OrderLineDto>[];
  return {
    customerId: value.customerId ?? '',
    channel: value.channel ?? ORDER_CHANNELS[0],
    warehouse: value.warehouse ?? ORDER_WAREHOUSES[0],
    payment: value.payment ?? ORDER_PAYMENTS[0],
    note: value.note || null,
    lines: lines.map(line => ({
      productId: line.productId ?? '',
      quantity: Number(line.quantity ?? 0),
      unitPrice: Number(line.unitPrice ?? 0),
    })),
  };
}

const options = (values: readonly string[]) => values.map(value => ({ value }));

/** Nhóm "Thông tin chung" của đơn hàng. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdSection, SdSelect, CustomerSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-section title="Thông tin chung">
      <div class="row p-8">
        <div class="col-12 col-md-6">
          <customer-select autoId="order-customer" [form]="form()" [model]="seed().customerId || null" required />
        </div>
        <div class="col-12 col-md-6">
          <sd-select
            label="Kênh bán"
            name="channel"
            [form]="form()"
            [model]="seed().channel"
            [items]="channels"
            valueField="value"
            displayField="value"
            [clearable]="false"
            required />
        </div>
        <div class="col-12 col-md-6">
          <sd-select
            label="Kho xuất"
            name="warehouse"
            [form]="form()"
            [model]="seed().warehouse"
            [items]="warehouses"
            valueField="value"
            displayField="value"
            [clearable]="false"
            required />
        </div>
        <div class="col-12 col-md-6">
          <sd-select
            label="Thanh toán"
            name="payment"
            [form]="form()"
            [model]="seed().payment"
            [items]="payments"
            valueField="value"
            displayField="value"
            [clearable]="false"
            required />
        </div>
      </div>
    </sd-section>
  `,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<OrderForm>();
  readonly seed = input.required<OrderSaveReq>();
  protected readonly channels = options(ORDER_CHANNELS);
  protected readonly warehouses = options(ORDER_WAREHOUSES);
  protected readonly payments = options(ORDER_PAYMENTS);
}
