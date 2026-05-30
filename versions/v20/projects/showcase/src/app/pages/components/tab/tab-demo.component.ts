import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdTab, SdTabClosedEvent, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdButton } from '@sdcorejs/angular/components/button';

interface FileTab {
  id: string;
  name: string;
}

@Component({
  selector: 'app-tab-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdTabGroup, SdTab, SdButton],
  template: `
    <demo-page
      title="Tab Group"
      description="Container tab khai báo — hỗ trợ icon, badge, disabled, closable. Nội dung tab được lazy mount.">

      <demo-section heading="Tab cơ bản với text">
        <div class="full">
          <sd-tab-group>
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

      <demo-section heading="Tab với icon, badge và disabled">
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

      <demo-section heading="Tab đóng được (closable)">
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

      <demo-section heading="Căn tab về phía bên phải (stretchTabs = false + alignTabs = end)" note="Default stretchTabs=true (Material default) làm tabs giãn full width. Tắt stretch + đặt alignTabs để dồn về 1 phía.">
        <div class="full">
          <sd-tab-group [stretchTabs]="false" alignTabs="end">
            <sd-tab label="Tổng quan" icon="dashboard">Nội dung Tổng quan.</sd-tab>
            <sd-tab label="Báo cáo" icon="bar_chart">Nội dung Báo cáo.</sd-tab>
            <sd-tab label="Cài đặt" icon="settings">Nội dung Cài đặt.</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>

      <demo-section heading="Biến thể pills (variant=pills)" note="Pill rounded, active filled — nhẹ nhàng, không underline, lý tưởng cho nested tab.">
        <div class="full">
          <sd-tab-group variant="pills" [stretchTabs]="false">
            <sd-tab label="Tuần này" icon="today">Nội dung tuần này.</sd-tab>
            <sd-tab label="Tháng này" icon="calendar_month" [badge]="3">Nội dung tháng này.</sd-tab>
            <sd-tab label="Quý này">Nội dung quý này.</sd-tab>
            <sd-tab label="Năm" [disabled]="true">Năm</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>

      <demo-section heading="Biến thể segmented (variant=segmented)" note="Container bo tròn với 1 viền — iOS-style. Phù hợp cho toggle nhỏ trong toolbar.">
        <div class="full">
          <sd-tab-group variant="segmented" [stretchTabs]="false">
            <sd-tab label="Danh sách">Hiển thị dạng danh sách.</sd-tab>
            <sd-tab label="Bảng">Hiển thị dạng bảng.</sd-tab>
            <sd-tab label="Lưới">Hiển thị dạng lưới.</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>

      <demo-section heading="Bảng màu (color)" note="Đổi màu indicator + badge theo bộ Core: primary / secondary / info / success / warning / error.">
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

      <demo-section heading="Nested tab — outer line, inner pills" note="Khi tab lồng tab, đặt variant khác nhau để mắt phân biệt rõ outer vs inner. Outer giữ default line; inner đổi sang pills hoặc segmented.">
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

      <demo-section heading="Điều khiển tab từ bên ngoài (two-way binding)">
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

