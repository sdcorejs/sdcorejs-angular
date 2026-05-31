import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInform, SdInformActionDirective } from '@sdcorejs/angular/components/inform';

const LONG = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec semper nunc in faucibus dictum. Suspendisse interdum tempor est, vitae rutrum mauris gravida vitae. Praesent mattis libero id consequat imperdiet. Donec egestas, purus at ultricies condimentum, nulla nisi pulvinar.`;

@Component({
  selector: 'app-inform-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdInform, SdInformActionDirective],
  template: `
    <demo-page
      title="Inform"
      description="Banner / alert neo trên page — báo lỗi, cảnh báo, thông tin. 6 màu, đóng được, action, line-clamp.">

      <demo-section heading="Bảng màu (color)">
        <sd-inform primary title="primary" description="Message body."></sd-inform>
        <sd-inform secondary title="secondary" description="Message body."></sd-inform>
        <sd-inform info title="info" description="Message body."></sd-inform>
        <sd-inform success title="success" description="Message body."></sd-inform>
        <sd-inform warning title="warning" description="Message body."></sd-inform>
        <sd-inform error title="error" description="Message body."></sd-inform>
      </demo-section>

      <demo-section heading="Đóng được + action link">
        <sd-inform error closable title="Không tải được dữ liệu" description="Máy chủ không phản hồi." actionLabel="Thử lại"></sd-inform>
        <sd-inform info closable title="Bản nháp đã lưu" description="Tự động lưu lúc 14:30." actionLabel="Xem"></sd-inform>
      </demo-section>

      <demo-section heading="Ẩn icon">
        <sd-inform success hideIcon title="Đã lưu" description="Không có icon."></sd-inform>
      </demo-section>

      <demo-section heading="Line-clamp (Xem thêm / Thu gọn)">
        <sd-inform info title="Điều khoản" [description]="long" [lineClamp]="3"></sd-inform>
        <sd-inform success [description]="long" [lineClamp]="2"></sd-inform>
      </demo-section>

      <demo-section heading="Action custom (projection)">
        <sd-inform warning title="Chế độ chỉ đọc" description="Bạn không có quyền chỉnh sửa.">
          <button sdInformAction class="demo-action-btn">Yêu cầu quyền</button>
        </sd-inform>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    :host ::ng-deep demo-section > * { display: block; margin-bottom: 12px; }
    .demo-action-btn { border: none; background: none; color: inherit; cursor: pointer; padding: 0; text-decoration: underline; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformDemoComponent {
  readonly long = LONG;
}
