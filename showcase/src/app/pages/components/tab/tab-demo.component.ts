import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdTab, SdTabClosedEvent, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdButton } from '@sdcorejs/angular/components/button';
import { TabClosableExampleComponent } from './examples/tab-closable.example';
import { TabCountsExampleComponent } from './examples/tab-counts.example';
import { TabDisabledExampleComponent } from './examples/tab-disabled.example';
import { TabFormExampleComponent } from './examples/tab-form.example';
import { TabLoadingExampleComponent } from './examples/tab-loading.example';
import { TabManyExampleComponent } from './examples/tab-many.example';
import { TabMixedExampleComponent } from './examples/tab-mixed.example';
import { TabTableExampleComponent } from './examples/tab-table.example';
import { TabViewsExampleComponent } from './examples/tab-views.example';

interface FileTab {
  id: string;
  name: string;
}

@Component({
  selector: 'app-tab-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    SdTabGroup,
    SdTab,
    SdButton,
    TabManyExampleComponent,
    TabCountsExampleComponent,
    TabViewsExampleComponent,
    TabMixedExampleComponent,
    TabTableExampleComponent,
    TabFormExampleComponent,
    TabLoadingExampleComponent,
    TabDisabledExampleComponent,
    TabClosableExampleComponent,
  ],
  template: `
    <demo-page #demoPage
      title="Tab Group"
      description="Container tab khai báo — hỗ trợ icon, badge, disabled, closable. Nội dung tab được lazy mount.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tab-co-ban') {
      <demo-section heading="Tab cơ bản" [props]="[{ name: 'label', value: 'text' }, { name: 'headerClass', value: 'bg-white' }, { name: 'bodyClass', value: 'p-16' }]"
        note="Nền trắng chỉ áp dụng cho header của group này; body giữ nền theme và có khoảng đệm riêng.">
        <div class="full">
          <sd-tab-group headerClass="bg-white" bodyClass="p-16"
            [headerStyle]="{ paddingInline: '8px' }"
            [bodyStyle]="{ backgroundColor: 'var(--sd-surface)' }">
            <sd-tab label="Thông tin">
              <p>Thông tin chung của bản ghi sẽ hiển thị ở đây.</p>
            </sd-tab>
            <sd-tab label="Lịch sử">
              <p>Lịch sử thao tác — danh sách các thay đổi gần đây.</p>
            </sd-tab>
            <sd-tab label="Quyền truy cập">
              <p>Cấu hình vai trò và nhóm quyền cho người dùng.</p>
            </sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tab-co-icon-badge-disabled') {
      <demo-section heading="Tab có icon / badge / disabled" [props]="[{ name: 'icon', value: 'name' }, { name: 'badge', value: '7 / 99+' }, { name: 'disabled', value: 'true' }]">
        <div class="full">
          <sd-tab-group>
            <sd-tab label="Hồ sơ" icon="person">
              <p>Trang hồ sơ cá nhân.</p>
            </sd-tab>
            <sd-tab label="Thông báo" icon="notifications" [badge]="unreadCount()">
              <p>Bạn có {{ unreadCount() }} thông báo chưa đọc.</p>
            </sd-tab>
            <sd-tab label="Tin nhắn" icon="mail" [badge]="'99+'">
              <p>Hộp thư đến.</p>
            </sd-tab>
            <sd-tab label="Đang khóa" icon="lock" [disabled]="true">
              <p>Tab này không thể truy cập.</p>
            </sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tab-dong-duoc') {
      <demo-section heading="Tab đóng được" [props]="[{ name: 'closable', value: 'true' }, { name: '(tabClosed)', value: 'event' }]">
        <div class="full">
          <sd-tab-group (tabClosed)="onTabClosed($event)">
            @for (file of files(); track file.id) {
              <sd-tab [label]="file.name" icon="description" [closable]="true">
                <p>Nội dung của file <strong>{{ file.name }}</strong></p>
              </sd-tab>
            }
          </sd-tab-group>
          @if (files().length === 0) {
            <p style="padding: 16px; color: #888; font-style: italic;">Tất cả các tab đã được đóng.</p>
          }
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-can-tab-sang-phai') {
      <demo-section heading="Căn tab sang phải" [props]="[{ name: 'stretchTabs', value: 'false' }, { name: 'alignTabs', value: 'end' }]" note="Default stretchTabs=true (Material default) làm tabs giãn full width. Tắt stretch + đặt alignTabs để dồn về 1 phía.">
        <div class="full">
          <sd-tab-group [stretchTabs]="false" alignTabs="end">
            <sd-tab label="Tổng quan" icon="dashboard">Nội dung Tổng quan.</sd-tab>
            <sd-tab label="Báo cáo" icon="bar_chart">Nội dung Báo cáo.</sd-tab>
            <sd-tab label="Cài đặt" icon="settings">Nội dung Cài đặt.</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-variant-pills') {
      <demo-section heading="Variant pills" [props]="[{ name: 'variant', value: 'pills' }]" note="Pill nền light, chữ/icon theo màu chủ đạo. Bấm lại tab active hoặc điều hướng bàn phím để kiểm tra màu chữ ổn định.">
        <div class="full">
          <sd-tab-group variant="pills" [stretchTabs]="false">
            <sd-tab label="Tuần này" icon="today">Nội dung tuần này.</sd-tab>
            <sd-tab label="Tháng này" icon="calendar_month" [badge]="3">Nội dung tháng này.</sd-tab>
            <sd-tab label="Quý này">Nội dung quý này.</sd-tab>
            <sd-tab label="Năm" [disabled]="true">Năm</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-variant-segmented') {
      <demo-section heading="Variant segmented" [props]="[{ name: 'variant', value: 'segmented' }]" note="Container bo tròn với 1 viền — iOS-style. Phù hợp cho toggle nhỏ trong toolbar.">
        <div class="full">
          <sd-tab-group variant="segmented" [stretchTabs]="false">
            <sd-tab label="Danh sách">Hiển thị dạng danh sách.</sd-tab>
            <sd-tab label="Bảng">Hiển thị dạng bảng.</sd-tab>
            <sd-tab label="Lưới">Hiển thị dạng lưới.</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bang-mau-color') {
      <demo-section heading="Bảng màu color" [props]="[{ name: 'color', value: 'primary / secondary / info / success / warning / error' }]" note="Đổi màu indicator + badge theo bộ Core: primary / secondary / info / success / warning / error.">
        <div class="full color-stack">
          <sd-tab-group [stretchTabs]="false" color="primary">
            <sd-tab label="primary" icon="info" [badge]="3">Mặc định.</sd-tab>
            <sd-tab label="Tab 2">Nội dung 2.</sd-tab>
          </sd-tab-group>
          <sd-tab-group [stretchTabs]="false" color="success" variant="pills">
            <sd-tab label="success" icon="check_circle">Pill xanh — trạng thái hoàn thành.</sd-tab>
            <sd-tab label="Đã duyệt" [badge]="12">Nội dung.</sd-tab>
          </sd-tab-group>
          <sd-tab-group [stretchTabs]="false" color="warning" variant="pills">
            <sd-tab label="warning" icon="warning">Pill vàng — cần chú ý.</sd-tab>
            <sd-tab label="Chờ xử lý" [badge]="5">Nội dung.</sd-tab>
          </sd-tab-group>
          <sd-tab-group [stretchTabs]="false" color="error" variant="pills">
            <sd-tab label="error" icon="error">Pill đỏ — lỗi / nghiêm trọng.</sd-tab>
            <sd-tab label="Bị từ chối" [badge]="2">Nội dung.</sd-tab>
          </sd-tab-group>
          <sd-tab-group [stretchTabs]="false" color="info" variant="segmented">
            <sd-tab label="info">Segmented info.</sd-tab>
            <sd-tab label="Chi tiết">Nội dung.</sd-tab>
          </sd-tab-group>
          <sd-tab-group [stretchTabs]="false" color="secondary" variant="segmented">
            <sd-tab label="secondary">Segmented neutral.</sd-tab>
            <sd-tab label="Lưu trữ">Nội dung.</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tab-long-tab') {
      <demo-section heading="Tab lồng tab" [props]="[{ name: 'variant', value: 'pills / segmented' }]" note="Khi tab lồng tab, đặt variant khác nhau để mắt phân biệt rõ outer vs inner. Outer giữ default line; inner đổi sang pills hoặc segmented.">
        <div class="full">
          <sd-tab-group>
            <sd-tab label="Thông tin chung" icon="info">
              <p>Khung outer giữ underline Material default.</p>
              <sd-tab-group variant="pills" [stretchTabs]="false">
                <sd-tab label="Cá nhân">Họ tên, email, số điện thoại.</sd-tab>
                <sd-tab label="Công việc">Phòng ban, chức vụ, mã NV.</sd-tab>
                <sd-tab label="Liên hệ khẩn cấp">Người thân, số điện thoại.</sd-tab>
              </sd-tab-group>
            </sd-tab>
            <sd-tab label="Cài đặt" icon="settings">
              <sd-tab-group variant="segmented" [stretchTabs]="false">
                <sd-tab label="Bảo mật">Đổi mật khẩu, 2FA.</sd-tab>
                <sd-tab label="Thông báo">Email, push, SMS.</sd-tab>
                <sd-tab label="Quyền">Vai trò, nhóm.</sd-tab>
              </sd-tab-group>
            </sd-tab>
            <sd-tab label="Lịch sử" icon="history" [badge]="12">
              <p>Bảng nhật ký thao tác.</p>
            </sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dieu-khien-tu-ngoai') {
      <demo-section heading="Điều khiển từ ngoài" [props]="[{ name: '[(selectedIndex)]', value: 'two-way' }]">
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <sd-button type="light" color="secondary" prefixIcon="chevron_left" title="Tab trước" (click)="prev()"></sd-button>
          <sd-button type="light" color="secondary" suffixIcon="chevron_right" title="Tab kế" (click)="next()"></sd-button>
          <span style="align-self: center; color: #555;">Đang xem tab #{{ twowayIndex() }}</span>
        </div>
        <div class="full">
          <sd-tab-group [(selectedIndex)]="twowayIndexValue">
            <sd-tab label="Bước 1">Nội dung bước 1.</sd-tab>
            <sd-tab label="Bước 2">Nội dung bước 2.</sd-tab>
            <sd-tab label="Bước 3">Nội dung bước 3.</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhieu-nhom-noi-dung') {
      <demo-section heading="Nhiều nhóm nội dung"
        data-example-typescript="./examples/tab-many.example.ts" data-example-template="./examples/tab-many.example.html" data-example-style="./examples/tab-pattern-example.scss"
        [props]="[{ name: 'stretchTabs', value: 'false' }, { name: 'sd-tab', value: '10 nhóm' }]"
        note="Thanh tab tự cuộn khi thiếu chỗ; không ép toàn bộ nhãn vào một hàng.">
        <app-tab-many-example />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-phan-nhom-co-so-luong') {
      <demo-section heading="Phân nhóm có số lượng"
        data-example-typescript="./examples/tab-counts.example.ts" data-example-template="./examples/tab-counts.example.html" data-example-style="./examples/tab-pattern-example.scss"
        [props]="[{ name: 'badge', value: 'count' }, { name: '[(selectedIndex)]', value: 'two-way' }]"
        note="Badge dùng số lượng thật của từng nhóm; bấm hoàn tất để thấy số lượng thay đổi.">
        <app-tab-counts-example />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuyen-cach-xem-du-lieu') {
      <demo-section heading="Chuyển cách xem dữ liệu"
        data-example-typescript="./examples/tab-views.example.ts" data-example-template="./examples/tab-views.example.html" data-example-style="./examples/tab-pattern-example.scss"
        [props]="[{ name: 'variant', value: 'segmented' }]"
        note="Segmented cho hai cách xem. Giữ nguyên nguồn dữ liệu khi chuyển.">
        <app-tab-views-example />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-noi-dung-hon-hop') {
      <demo-section heading="Nội dung hỗn hợp"
        data-example-typescript="./examples/tab-mixed.example.ts" data-example-template="./examples/tab-mixed.example.html" data-example-style="./examples/tab-pattern-example.scss"
        [props]="[{ name: 'sd-section', value: 'thông tin' }, { name: 'sd-table', value: 'danh sách' }, { name: 'list', value: 'lịch sử' }]"
        note="Chọn cấu trúc phù hợp từng tab, không ép mọi nội dung thành bảng.">
        <app-tab-mixed-example />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tab-chua-bang') {
      <demo-section heading="Tab chứa bảng"
        data-example-typescript="./examples/tab-table.example.ts" data-example-template="./examples/tab-table.example.html" data-example-style="./examples/tab-pattern-example.scss"
        [props]="[{ name: 'filter.quickSearch', value: 'containFields' }, { name: 'paginate', value: 'pageSize / pages' }]"
        note="Dùng quickSearch từ option Core Table; bảng tự quản lý trang và số dòng.">
        <app-tab-table-example />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-form-chia-nhom') {
      <demo-section heading="Form chia nhóm"
        data-example-typescript="./examples/tab-form.example.ts" data-example-template="./examples/tab-form.example.html" data-example-style="./examples/tab-pattern-example.scss"
        [props]="[{ name: '[(selectedIndex)]', value: 'two-way' }, { name: 'SdNotifyService', value: 'warning / success' }]"
        note="Giữ dữ liệu khi đổi tab; khi lưu, chuyển tới nhóm lỗi và báo Notify.">
        <app-tab-form-example />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tai-rong-loi') {
      <demo-section heading="Tải / Rỗng / Lỗi"
        data-example-typescript="./examples/tab-loading.example.ts" data-example-template="./examples/tab-loading.example.html" data-example-style="./examples/tab-pattern-example.scss"
        [props]="[{ name: 'sd-data-state', value: 'loading / empty / error' }, { name: '(selectedIndexChange)', value: 'event' }]"
        note="Loading 1–2 giây; lỗi có thử lại; trạng thái rỗng có lời giải thích.">
        <app-tab-loading-example />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhom-chua-kha-dung') {
      <demo-section heading="Nhóm chưa khả dụng"
        data-example-typescript="./examples/tab-disabled.example.ts" data-example-template="./examples/tab-disabled.example.html" data-example-style="./examples/tab-pattern-example.scss"
        [props]="[{ name: 'disabled', value: 'theo điều kiện' }, { name: 'sd-inform', value: 'giải thích' }]"
        note="Không chỉ vô hiệu hóa: giải thích điều kiện và cung cấp thao tác đáp ứng điều kiện.">
        <app-tab-disabled-example />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mo-nhieu-ho-so') {
      <demo-section heading="Mở nhiều hồ sơ"
        data-example-typescript="./examples/tab-closable.example.ts" data-example-template="./examples/tab-closable.example.html" data-example-style="./examples/tab-pattern-example.scss"
        [props]="[{ name: 'closable', value: 'true' }, { name: 'beforeClose', value: 'SdTabBeforeClose' }, { name: '(close)', value: 'event' }]"
        note="Tab đóng được; thay tên rồi đóng để thử xác nhận dữ liệu chưa lưu.">
        <app-tab-closable-example />
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    .full { width: 100%; }
    .color-stack { display: flex; flex-direction: column; gap: 16px; }
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabDemoComponent {
  readonly unreadCount = signal(7);

  readonly files = signal<FileTab[]>([
    { id: 'a', name: 'README.md' },
    { id: 'b', name: 'app.component.ts' },
    { id: 'c', name: 'styles.scss' },
  ]);

  onTabClosed(ev: SdTabClosedEvent) {
    this.files.update((arr) => arr.filter((_, i) => i !== ev.index));
  }

  readonly twowayIndex = signal(0);

  get twowayIndexValue() { return this.twowayIndex(); }
  set twowayIndexValue(v: number) { this.twowayIndex.set(v); }

  prev() { this.twowayIndex.update((v) => Math.max(0, v - 1)); }
  next() { this.twowayIndex.update((v) => Math.min(2, v + 1)); }
}
