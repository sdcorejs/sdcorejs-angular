import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdBadge } from '@sdcorejs/angular/components/badge';

interface Contract {
  code: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'EXPIRED';
  statusName: string;
  createdById: string;
  createdByName: string;
  amount: number;
}

@Component({
  selector: 'app-view-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdView, SdBadge, DatePipe],
  template: `
    <demo-page #demoPage
      title="View"
      description="Hiển thị cặp nhãn / giá trị chỉ đọc trên trang chi tiết. Là phiên bản read-only của sd-input / sd-select.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhan-va-gia-tri-co-ban') {
      <demo-section heading="Nhãn và giá trị cơ bản" [props]="[{ name: 'display', value: 'text' }]">
        <div class="grid-3">
          <sd-view label="Mã hợp đồng" [display]="contract.code"></sd-view>
          <sd-view label="Tên hợp đồng" [display]="contract.name"></sd-view>
          <sd-view label="Giá trị (VND)" [display]="contract.amount.toLocaleString('vi-VN')"></sd-view>
          <sd-view label="Ngày bắt đầu" [display]="contract.startDate | date:'dd/MM/yyyy'"></sd-view>
          <sd-view label="Ngày kết thúc" [display]="contract.endDate | date:'dd/MM/yyyy'"></sd-view>
          <sd-view label="Ghi chú" [display]="null"></sd-view>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-co-sieu-lien-ket') {
      <demo-section heading="Giá trị có siêu liên kết" [props]="[{ name: 'hyperlink', value: 'url' }]">
        <div class="grid-3">
          <sd-view
            label="Người tạo"
            [display]="contract.createdByName"
            [hyperlink]="'/users/' + contract.createdById">
          </sd-view>
          <sd-view
            label="Đường dẫn ngoài"
            display="Mở tài liệu hợp đồng"
            hyperlink="https://example.com/contracts/HD-2025-0001">
          </sd-view>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-template-tuy-chinh-gia-tri') {
      <demo-section heading="Template tùy chỉnh giá trị" [props]="[{ name: '#sdValue', value: 'template' }]">
        <div class="grid-3">
          <sd-view label="Trạng thái" [display]="contract.statusName" [value]="contract.status">
            <ng-template #sdValue let-display let-status="value">
              <sd-badge
                [title]="display"
                [color]="status === 'ACTIVE' ? 'success' : 'error'">
              </sd-badge>
            </ng-template>
          </sd-view>
          <sd-view label="Loại hợp đồng" display="Dịch vụ thường xuyên"></sd-view>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px 24px;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDemoComponent {
  readonly contract: Contract = {
    code: 'HD-2025-0001',
    name: 'Hợp đồng cung cấp dịch vụ phần mềm',
    startDate: new Date(2025, 0, 1),
    endDate: new Date(2025, 11, 31),
    status: 'ACTIVE',
    statusName: 'Đang hiệu lực',
    createdById: 'u-128',
    createdByName: 'Nguyễn Văn An',
    amount: 1_280_000_000,
  };
}
