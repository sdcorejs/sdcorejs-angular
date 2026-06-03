import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';

// TODO: <sd-tab-router-outlet> là router-shell, cần Router + nhiều route được decorate
// bằng @SdTabComponent để hoạt động đầy đủ. Trong môi trường showcase đơn giản (route phẳng,
// mỗi trang là một demo độc lập) không thể demo trực tiếp mà không thay đổi cấu trúc route.
// Trang này hiển thị mô tả + ảnh minh họa pill, kèm hướng dẫn xem ví dụ thật trong code.

@Component({
  selector: 'app-tab-router-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBadge],
  template: `
    <demo-page
      title="Tab Router"
      description="Shell router dạng tab kiểu trình duyệt — mỗi URL được mở thành một tab, giữ nguyên state khi chuyển qua lại.">

      <demo-section [props]="[{ name: 'routes' }]">
        <div class="strip">
          <sd-badge type="tag" primary icon="dashboard" title="Trang chủ"></sd-badge>
          <sd-badge type="tag" info icon="person" title="Nhân viên #001"></sd-badge>
          <sd-badge type="tag" warning icon="edit" title="Đang chỉnh sửa hợp đồng"></sd-badge>
          <sd-badge type="tag" success icon="check_circle" title="Phê duyệt yêu cầu"></sd-badge>
          <sd-badge type="tag" secondary icon="settings" title="Cài đặt hệ thống"></sd-badge>
        </div>
        <p class="note">
          Mỗi pill ở trên đại diện cho một tab. Click sẽ điều hướng đến URL tương ứng;
          tab giữ state (form, scroll, request) khi user chuyển sang tab khác và quay lại.
        </p>
      </demo-section>

      <demo-section [props]="[{ name: '@SdTabComponent' }]">
        <div class="code">
          <pre>{{ snippet1 }}</pre>
        </div>
        <p class="note">
          Decorate component đích bằng <code>&#64;SdTabComponent</code> để cung cấp metadata
          (name, icon, color) cho pill. Outlet sẽ tự dựng tab khi route được activate.
        </p>
      </demo-section>

      <demo-section [props]="[{ name: 'replaceTab' }, { name: 'beforeClose' }]">
        <div class="code">
          <pre>{{ snippet2 }}</pre>
        </div>
        <p class="note">
          Truyền <code>state.replaceTab</code> để thay tab hiện tại thay vì mở thêm. Gán
          <code>tab.beforeClose</code> để xác nhận trước khi đóng (vd: cảnh báo unsaved changes).
        </p>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px;
      border: 1px dashed #d6d6d6;
      border-radius: 8px;
      background: #fafafa;
      width: 100%;
    }
    .note {
      width: 100%;
      font-size: 13px;
      color: #555;
      margin: 8px 0 0;
    }
    .code {
      width: 100%;
      background: #1e1e1e;
      color: #d4d4d4;
      border-radius: 8px;
      padding: 12px 16px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      overflow-x: auto;
    }
    .code pre { margin: 0; white-space: pre; }
    code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabRouterDemoComponent {
  readonly snippet1 = `<!-- app.component.html -->
<sd-page>
  <sd-tab-router-outlet></sd-tab-router-outlet>
</sd-page>

// employee-detail.component.ts
@SdTabComponent({
  component: EmployeeDetailComponent,
  name: ({ params }) => 'Nhân viên #' + params.id,
  icon: 'person',
  color: 'primary'
})
@Component({ /* ... */ })
export class EmployeeDetailComponent {}`;

  readonly snippet2 = `// Thay tab hiện tại
this.router.navigate(['/employees', id, 'edit'], {
  state: { replaceTab: true }
});

// Xác nhận trước khi đóng tab
this.tab.beforeClose = async () => {
  if (!this.form.dirty) return true;
  return await this.confirm.ask('Bạn có thay đổi chưa lưu. Đóng tab?');
};`;
}
