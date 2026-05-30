import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';

@Component({
  selector: 'app-side-drawer-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton, SdSideDrawer, SdSection, SdSectionItem],
  template: `
    <demo-page
      title="Side Drawer"
      description="Panel trượt từ cạnh phải màn hình — dùng cho form tạo / sửa / xem chi tiết khi không muốn rời trang hiện tại.">

      <demo-section heading="Drawer cơ bản với footer">
        <sd-button type="fill" color="primary" prefixIcon="add" title="Tạo mới" (click)="createDrawer.open()"></sd-button>

        <sd-side-drawer #createDrawer title="Tạo nhân viên mới" width="480px">
          <sd-section icon="person" title="Thông tin cá nhân">
            <sd-section-item label="Họ và tên">Nguyễn Văn An</sd-section-item>
            <sd-section-item label="Email">an.nv&#64;onemount.com</sd-section-item>
            <sd-section-item label="Số điện thoại">0901 234 567</sd-section-item>
          </sd-section>

          <div sdFooter style="display: flex; gap: 8px; justify-content: flex-end;">
            <sd-button type="outline" color="secondary" title="Hủy" (click)="createDrawer.close()"></sd-button>
            <sd-button type="fill" color="primary" title="Lưu" prefixIcon="save" (click)="createDrawer.close()"></sd-button>
          </div>
        </sd-side-drawer>
      </demo-section>

      <demo-section heading="Drawer xem chi tiết (chặn backdrop close)">
        <sd-button type="light" color="primary" prefixIcon="visibility" title="Xem chi tiết" (click)="detailDrawer.open()"></sd-button>

        <sd-side-drawer #detailDrawer title="Chi tiết yêu cầu" width="560px" disableBackdropClose>
          <sd-section icon="description" title="Thông tin yêu cầu">
            <sd-section-item label="Mã yêu cầu">REQ-2026-0042</sd-section-item>
            <sd-section-item label="Người tạo">Trần Thị Bích</sd-section-item>
            <sd-section-item label="Ngày tạo">15/05/2026</sd-section-item>
            <sd-section-item label="Trạng thái">Đang xử lý</sd-section-item>
          </sd-section>

          <sd-section icon="comment" title="Ghi chú">
            <p>Yêu cầu phê duyệt cấp ngân sách bổ sung cho quý 3.</p>
          </sd-section>

          <div sdFooter style="display: flex; justify-content: flex-end;">
            <sd-button type="outline" color="secondary" title="Đóng" (click)="detailDrawer.close()"></sd-button>
          </div>
        </sd-side-drawer>
      </demo-section>

      <demo-section heading="Drawer rộng với header-right action">
        <sd-button type="outline" color="primary" prefixIcon="filter_list" title="Bộ lọc" (click)="filterDrawer.open()"></sd-button>

        <sd-side-drawer #filterDrawer title="Bộ lọc nâng cao" width="420px">
          <sd-button sdHeaderRight type="link" color="primary" prefixIcon="refresh" tooltip="Đặt lại bộ lọc"></sd-button>

          <p style="margin: 0 0 12px;">Thiết lập bộ lọc cho danh sách bên dưới. Nội dung sẽ được áp dụng sau khi nhấn <strong>Áp dụng</strong>.</p>
          <sd-section icon="tune" title="Tiêu chí lọc" [hideHeader]="false">
            <sd-section-item label="Khoảng thời gian">01/01/2026 - 31/12/2026</sd-section-item>
            <sd-section-item label="Trạng thái">Đang hoạt động</sd-section-item>
            <sd-section-item label="Phòng ban">Kinh doanh, Marketing</sd-section-item>
          </sd-section>

          <div sdFooter style="display: flex; justify-content: space-between;">
            <sd-button type="link" color="secondary" title="Đặt lại"></sd-button>
            <sd-button type="fill" color="primary" title="Áp dụng" (click)="filterDrawer.close()"></sd-button>
          </div>
        </sd-side-drawer>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideDrawerDemoComponent {}

