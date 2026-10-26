import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { CUSTOMER_TYPE_OPTIONS, type CustomerType } from '../../services/customer.model';

/** Dropdown loại khách hàng. */
@Component({
  selector: 'customer-type-select',
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
export class CustomerTypeSelectComponent {
  readonly form = input<FormGroup>();
  readonly name = input('type');
  readonly label = input('Loại khách hàng');
  readonly required = input(true);
  readonly model = model<CustomerType | null | undefined>();
  protected readonly options = CUSTOMER_TYPE_OPTIONS;
}
