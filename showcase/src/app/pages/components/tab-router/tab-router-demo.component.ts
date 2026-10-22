import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { TAB_ROUTER_DEMO_BASE } from './live/tab-router-live.component';

// why: outlet nghe toàn bộ router, nên không nhúng được vào trang docs (route lá ở đây là chính trang docs). Demo
// sống chạy ở route riêng `/demo/tab-router` với các màn con được `@SdTabComponent` khai tên và icon.

@Component({
  selector: 'app-tab-router-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton],
  template: `
    <demo-page #demoPage
      title="Tab Router"
      description="Shell router dạng tab kiểu trình duyệt — mỗi URL được mở thành một tab, giữ nguyên state khi chuyển qua lại.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-thu-truc-tiep') {
      <demo-section
        heading="Thử trực tiếp"
        [props]="[{ name: 'routes', value: '[…]' }, { name: '@SdTabComponent', value: 'template' }]"
        note="Mở một màn có sd-tab-router-outlet thật: một tab thì thanh ẩn, mở thêm tab thì thanh hiện; thử 16 tab, rê chuột vào tên bị cắt để xem tooltip.">
        <sd-button
          data-tab-router-link="live"
          type="fill"
          color="primary"
          prefixIcon="open_in_new"
          title="Mở demo tab router"
          (click)="openLive()"></sd-button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tich-hop-app-shell') {
      <demo-section heading="Tích hợp app shell" [props]="[{ name: '@SdTabComponent', value: 'template' }]">
        <div class="code">
          <pre>{{ snippet1 }}</pre>
        </div>
        <p class="note">
          Decorate component đích bằng <code>&#64;SdTabComponent</code> để cung cấp metadata
          (name, icon, color) cho pill. Outlet sẽ tự dựng tab khi route được activate.
        </p>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-replacetab-beforeclose') {
      <demo-section heading="replaceTab + beforeClose" [props]="[{ name: 'replaceTab', value: 'fn' }, { name: 'beforeClose', value: 'fn' }]">
        <div class="code">
          <pre>{{ snippet2 }}</pre>
        </div>
        <p class="note">
          Truyền <code>state.replaceTab</code> để thay tab hiện tại thay vì mở thêm. Gán
          <code>tab.beforeClose</code> để xác nhận trước khi đóng (vd: cảnh báo unsaved changes).
        </p>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
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
  readonly #router = inject(Router);

  openLive = (): void => {
    void this.#router.navigateByUrl(`${TAB_ROUTER_DEMO_BASE}/overview`);
  };

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
