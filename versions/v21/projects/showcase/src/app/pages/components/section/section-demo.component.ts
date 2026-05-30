import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdBadge } from '@sdcorejs/angular/components/badge';

@Component({
  selector: 'app-section-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdSection, SdSectionItem, SdButton, SdBadge],
  template: `
    <demo-page
      title="Section"
      description="Card chứa nội dung có header (icon + title + subtitle) và body — chuẩn để nhóm thông tin trên trang chi tiết.">

      <demo-section heading="Card thông tin với label : value">
        <sd-section
          icon="info"
          iconColor="primary"
          title="Thông tin chung"
          subTitle="Thông tin cơ bản của nhân viên"
          style="width: 100%; max-width: 640px;">
          <sd-section-item label="Họ và tên">Nguyễn Văn An</sd-section-item>
          <sd-section-item label="Email">an.nv&#64;onemount.com</sd-section-item>
          <sd-section-item label="Số điện thoại">0901 234 567</sd-section-item>
          <sd-section-item label="Phòng ban">
            <sd-badge type="round" primary title="Phòng Kinh doanh"></sd-badge>
          </sd-section-item>
        </sd-section>
      </demo-section>

      <demo-section heading="Section có nút thao tác bên phải">
        <sd-section
          icon="group"
          title="Thành viên dự án"
          style="width: 100%; max-width: 640px;">
          <sd-button sdHeaderRight
            type="fill" color="primary" size="sm" prefixIcon="add"
            title="Thêm thành viên">
          </sd-button>
          <sd-section-item label="Trưởng dự án">Trần Thị Bích</sd-section-item>
          <sd-section-item label="Thành viên">Lê Minh Hoàng, Phạm Quỳnh Anh, Đỗ Văn Đạt</sd-section-item>
        </sd-section>
      </demo-section>

      <demo-section heading="Section gập (collapsable) với two-way binding">
        <sd-section
          icon="filter_list"
          title="Bộ lọc nâng cao"
          subTitle="Click vào header để gập / mở"
          [collapsable]="true"
          [(collapsed)]="filterCollapsed"
          style="width: 100%; max-width: 640px;">
          <sd-section-item label="Trạng thái">Đang hoạt động</sd-section-item>
          <sd-section-item label="Ngày tạo">Từ 01/01/2026 đến 31/12/2026</sd-section-item>
          <sd-section-item label="Loại">Khách hàng doanh nghiệp</sd-section-item>
        </sd-section>
        <p style="margin: 8px 0 0; font-size: 12px; color: #6b6b6b;">
          Trạng thái hiện tại: <strong>{{ filterCollapsed() ? 'Đã gập' : 'Đang mở' }}</strong>
        </p>
      </demo-section>

      <demo-section heading="Section không header (plain card)">
        <sd-section [hideHeader]="true" style="width: 100%; max-width: 640px;">
          <p style="margin: 0;">
            Section không có header — phù hợp khi bạn chỉ cần một card padding 16px, bo góc.
            Nội dung tự do có thể đặt bất kỳ component nào ở đây.
          </p>
        </sd-section>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionDemoComponent {
  readonly filterCollapsed = signal(false);
}

