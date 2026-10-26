import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import type { FormControl, FormGroup } from '@angular/forms';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import type { CustomerSaveReq, CustomerStatus, CustomerTier, CustomerType } from '../../services/customer.model';
import { CustomerTypeSelectComponent } from '../customer-type-select/customer-type-select.component';

/** Các field Core tự đăng ký control qua `[form]` + `name`. */
export type CustomerForm = FormGroup<{
  name?: FormControl<string>;
  type?: FormControl<CustomerType>;
  taxCode?: FormControl<string | null>;
  vip?: FormControl<boolean>;
  email?: FormControl<string>;
  phone?: FormControl<string>;
  address?: FormControl<string>;
  active?: FormControl<boolean>;
  note?: FormControl<string | null>;
}>;

/** Ba nhóm của form; nhóm còn lỗi sau khi bấm Lưu hiện `sd-inform` cảnh báo ngay trong nhóm. */
export type CustomerFormGroup = 'general' | 'contact' | 'other';

const GROUP_FIELDS: Readonly<Record<CustomerFormGroup, readonly string[]>> = {
  general: ['name', 'type', 'taxCode', 'vip'],
  contact: ['email', 'phone', 'address'],
  other: ['active', 'note'],
};

/** Nhóm có field không hợp lệ: field còn lỗi validate hoặc lỗi do API trả về. */
export function invalidCustomerGroups(form: CustomerForm, apiErrors: Readonly<Record<string, string>>): CustomerFormGroup[] {
  return (Object.keys(GROUP_FIELDS) as CustomerFormGroup[]).filter(group =>
    GROUP_FIELDS[group].some(field => form.get(field)?.invalid || !!apiErrors[field])
  );
}

/** Giá trị form → request lưu. */
export function customerSaveReq(form: CustomerForm): CustomerSaveReq {
  const value = form.getRawValue();
  const type: CustomerType = value.type ?? 'individual';
  const tier: CustomerTier = value.vip ? 'vip' : 'standard';
  const status: CustomerStatus = value.active === false ? 'inactive' : 'active';
  return {
    name: value.name ?? '',
    type,
    tier,
    email: value.email ?? '',
    phone: value.phone ?? '',
    address: value.address ?? '',
    taxCode: type === 'business' ? (value.taxCode ?? null) : null,
    status,
    note: value.note || null,
  };
}

/** Form khách hàng ba nhóm, dùng chung cho drawer tạo mới và cập nhật. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdSection, SdInput, SdTextarea, SdSwitch, SdInform, CustomerTypeSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let invalid = invalidGroups();
    <div class="d-flex flex-column gap-16">
      <sd-section title="Thông tin chung">
        <div class="d-flex flex-column gap-8 p-16">
          @if (invalid.includes('general')) {
            <sd-inform warning description="Kiểm tra tên và loại khách hàng." autoId="customer-general-warning" />
          }
          <sd-input
            label="Tên khách hàng"
            name="name"
            autoId="customer-name"
            [form]="form()"
            [model]="seed().name"
            [inlineError]="errors()['name']"
            maxlength="120"
            required />
          <customer-type-select [form]="form()" [model]="seed().type" (modelChange)="type.set($event ?? 'individual')" />
          @if (type() === 'business') {
            <sd-input
              label="Mã số thuế"
              name="taxCode"
              autoId="customer-tax-code"
              [form]="form()"
              [model]="seed().taxCode"
              [inlineError]="errors()['taxCode']"
              maxlength="14"
              required />
          }
          <sd-switch label="Khách VIP" name="vip" [form]="form()" [model]="seed().tier === 'vip'" />
        </div>
      </sd-section>
      <sd-section title="Liên hệ">
        <div class="d-flex flex-column gap-8 p-16">
          @if (invalid.includes('contact')) {
            <sd-inform warning description="Kiểm tra email và số điện thoại." autoId="customer-contact-warning" />
          }
          <sd-input
            label="Email"
            name="email"
            autoId="customer-email"
            [form]="form()"
            [model]="seed().email"
            [inlineError]="errors()['email']"
            pattern="EMAIL"
            required />
          <sd-input
            label="Điện thoại"
            name="phone"
            autoId="customer-phone"
            [form]="form()"
            [model]="seed().phone"
            [inlineError]="errors()['phone']"
            maxlength="15"
            required />
          <sd-input label="Địa chỉ" name="address" autoId="customer-address" [form]="form()" [model]="seed().address" maxlength="200" />
        </div>
      </sd-section>
      <sd-section title="Khác">
        <div class="d-flex flex-column gap-8 p-16">
          <sd-switch label="Đang hoạt động" name="active" [form]="form()" [model]="seed().status !== 'inactive'" />
          <sd-textarea label="Ghi chú" name="note" [form]="form()" [model]="seed().note" maxlength="500" />
        </div>
      </sd-section>
    </div>
  `,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<CustomerForm>();
  readonly seed = input.required<CustomerSaveReq>();
  /** Lỗi theo field do API trả về. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly invalidGroups = input<readonly CustomerFormGroup[]>([]);
  /** Loại khách đang chọn: doanh nghiệp mới có mã số thuế. */
  protected readonly type = linkedSignal(() => this.seed().type);
}
