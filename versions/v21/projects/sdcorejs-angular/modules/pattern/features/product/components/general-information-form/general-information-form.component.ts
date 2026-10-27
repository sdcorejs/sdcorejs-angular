import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FormControl, FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import type { ProductSaveReq, ProductStatus } from '../../services/product.model';
import { ProductStatusSelectComponent } from '../product-status-select/product-status-select.component';

/** Các field Core tự đăng ký control qua `[form]` + `name`; page không khai báo trước control trùng tên. */
export type ProductForm = FormGroup<{
  code?: FormControl<string>;
  name?: FormControl<string>;
  unit?: FormControl<string>;
  price?: FormControl<number>;
  status?: FormControl<ProductStatus>;
}>;

/** Giá trị form → request lưu. `code` truyền vào khi cập nhật (mã bị khoá). */
export function productSaveReq(form: ProductForm, code?: string): ProductSaveReq {
  const value = form.getRawValue();
  return {
    code: code ?? value.code ?? '',
    name: value.name ?? '',
    unit: value.unit ?? '',
    price: value.price ?? 0,
    status: value.status ?? 'active',
  };
}

/** Nhóm "Thông tin chung" của form sản phẩm, dùng chung cho tạo mới và cập nhật. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdInput, SdInputNumber, SdSection, ProductStatusSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-section title="Thông tin chung">
    <div class="row p-8">
      <div class="col-12 col-md-6">
        <sd-input
          label="Mã sản phẩm"
          name="code"
          autoId="product-code"
          [form]="form()"
          [model]="seed().code"
          [disabled]="editing()"
          [inlineError]="errors()['code']"
          maxlength="20"
          required />
      </div>
      <div class="col-12 col-md-6">
        <sd-input
          label="Tên sản phẩm"
          name="name"
          autoId="product-name"
          [form]="form()"
          [model]="seed().name"
          [inlineError]="errors()['name']"
          maxlength="100"
          required />
      </div>
      <div class="col-12 col-md-6">
        <sd-input label="Đơn vị tính" name="unit" autoId="product-unit" [form]="form()" [model]="seed().unit" maxlength="20" />
      </div>
      <div class="col-12 col-md-6">
        <sd-input-number
          label="Giá bán (₫)"
          name="price"
          autoId="product-price"
          type="positive"
          [precision]="0"
          [form]="form()"
          [model]="seed().price"
          [inlineError]="errors()['price']"
          required />
      </div>
      <div class="col-12 col-md-6">
        <product-status-select [form]="form()" [model]="seed().status" />
      </div>
    </div>
  </sd-section>`,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<FormGroup>();
  readonly seed = input.required<ProductSaveReq>();
  readonly editing = input(false);
  /** Lỗi theo field do API trả về. */
  readonly errors = input<Readonly<Record<string, string>>>({});
}
