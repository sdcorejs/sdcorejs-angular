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
