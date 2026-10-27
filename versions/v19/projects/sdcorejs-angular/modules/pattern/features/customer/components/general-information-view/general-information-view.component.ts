import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdEmptyPipe, SdFormatDatePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { customerTypeName, type CustomerDto } from '../../services/customer.model';

/** Thông tin khách hàng dạng hàng `sd-section-item`: nhãn bên trái, giá trị bên phải. */
@Component({
  selector: 'general-information-view',
  standalone: true,
  imports: [SdSection, SdSectionItem, SdEmptyPipe, SdFormatDatePipe, SdFormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let item = customer();
    <div class="d-flex flex-column gap-16">
      <sd-section title="Thông tin chung">
        <sd-section-item label="Mã khách hàng">{{ item.code }}</sd-section-item>
        <sd-section-item label="Tên khách hàng">{{ item.name }}</sd-section-item>
        <sd-section-item label="Loại khách hàng">{{ typeName() }}{{ item.tier === 'vip' ? ' · VIP' : '' }}</sd-section-item>
        @if (item.type === 'business') {
          <sd-section-item label="Mã số thuế">{{ item.taxCode | sdEmpty }}</sd-section-item>
        }
        <sd-section-item label="Ngày tạo">{{ item.createdAt | sdFormatDate }}</sd-section-item>
      </sd-section>
      <sd-section title="Liên hệ">
        <sd-section-item label="Email">{{ item.email }}</sd-section-item>
        <sd-section-item label="Điện thoại">{{ item.phone }}</sd-section-item>
        <sd-section-item label="Địa chỉ">{{ item.address | sdEmpty }}</sd-section-item>
      </sd-section>
      <sd-section title="Khác">
        <sd-section-item label="Công nợ (₫)">{{ item.debt | sdFormatNumber: 0 }}</sd-section-item>
        <sd-section-item label="Ghi chú">{{ item.note | sdEmpty }}</sd-section-item>
      </sd-section>
    </div>
  `,
})
export class GeneralInformationViewComponent {
  readonly customer = input.required<CustomerDto>();
  protected readonly typeName = computed(() => customerTypeName(this.customer().type));
}
