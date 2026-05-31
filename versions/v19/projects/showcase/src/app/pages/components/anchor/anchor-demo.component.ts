import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdAnchor, SdAnchorItem } from '@sdcorejs/angular/components/anchor';

@Component({
  selector: 'app-anchor-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdAnchor, SdAnchorItem],
  template: `
    <demo-page
      title="Anchor"
      description="Điều hướng scroll-spy dạng cột bên — TOC tự highlight khi cuộn qua từng section.">

      <demo-section heading="Anchor mặc định với danh mục section">
        <div class="anchor-wrap">
          <sd-anchor sidebarWidth="200px">
            <sd-anchor-item title="Thông tin chung" icon="person">
              <div class="block">
                <h3>Thông tin chung</h3>
                <p>Họ tên, email, số điện thoại của nhân viên.</p>
              </div>
            </sd-anchor-item>
            <sd-anchor-item title="Hợp đồng" icon="description">
              <div class="block">
                <h3>Hợp đồng</h3>
                <p>Loại hợp đồng, ngày hiệu lực và các điều khoản đính kèm.</p>
              </div>
            </sd-anchor-item>
            <sd-anchor-item title="Phân quyền" icon="lock">
              <div class="block">
                <h3>Phân quyền</h3>
                <p>Vai trò, nhóm quyền được gán cho tài khoản.</p>
              </div>
            </sd-anchor-item>
            <sd-anchor-item title="Lịch sử thao tác" icon="history">
              <div class="block">
                <h3>Lịch sử thao tác</h3>
                <p>Các thay đổi được ghi nhận theo thời gian.</p>
              </div>
            </sd-anchor-item>
          </sd-anchor>
        </div>
      </demo-section>

      <demo-section heading="Đổi màu highlight và bật ellipsis">
        <div class="anchor-wrap">
          <sd-anchor color="success" ellipsis sidebarWidth="180px">
            <sd-anchor-item title="Báo cáo doanh thu chi nhánh quý 4 năm 2026" icon="trending_up">
              <div class="block">
                <h3>Báo cáo doanh thu</h3>
                <p>Tổng hợp doanh thu của tất cả chi nhánh trong quý 4.</p>
              </div>
            </sd-anchor-item>
            <sd-anchor-item title="Phân tích chi phí vận hành" icon="paid">
              <div class="block">
                <h3>Phân tích chi phí</h3>
                <p>Chi tiết theo từng khoản chi phí.</p>
              </div>
            </sd-anchor-item>
          </sd-anchor>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .anchor-wrap {
      width: 100%;
      height: 360px;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      overflow: hidden;
    }
    .block {
      height: 320px;
      padding: 12px 16px;
      border-bottom: 1px dashed #d6d6d6;
    }
    .block h3 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 6px;
    }
    .block p {
      font-size: 13px;
      color: #555;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnchorDemoComponent {}

