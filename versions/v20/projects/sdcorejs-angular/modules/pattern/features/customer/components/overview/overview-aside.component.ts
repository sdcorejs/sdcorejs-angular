import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdEmptyPipe, SdFormatDatePipe } from '@sdcorejs/angular/pipes';
import type { CustomerDto } from '../../services/customer.model';

@Component({
  selector: 'overview-aside',
  imports: [SdSection, SdSectionItem, SdEmptyPipe, SdFormatDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-wrap: anywhere;
    }
  `,
  template: `
    @let item = customer();
    <sd-section title="Thông tin chung">
      @if (item.type === 'business') {
        <sd-section-item label="Mã số thuế" labelWidth="96px">{{ item.taxCode | sdEmpty }}</sd-section-item>
      }
      <sd-section-item label="Hạng" labelWidth="96px">{{ item.tier === 'vip' ? 'VIP' : 'Tiêu chuẩn' }}</sd-section-item>
      <sd-section-item label="Điện thoại" labelWidth="96px">{{ item.phone | sdEmpty }}</sd-section-item>
      <sd-section-item label="Email" labelWidth="96px">{{ item.email | sdEmpty }}</sd-section-item>
      <sd-section-item label="Địa chỉ" labelWidth="96px">{{ item.address | sdEmpty }}</sd-section-item>
      <sd-section-item label="Ngày tạo" labelWidth="96px">{{ item.createdAt | sdFormatDate }}</sd-section-item>
    </sd-section>
    <sd-section title="Ghi chú"
      ><p class="m-0 p-16 T14R">{{ item.note | sdEmpty }}</p></sd-section
    >
  `,
})
export class OverviewAsideComponent {
  readonly customer = input.required<CustomerDto>();
}
