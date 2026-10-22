import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Color } from '@sdcorejs/utils/models';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';

@Component({
  selector: 'app-avatar-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdAvatar],
  template: `
    <demo-page #demoPage
      title="Avatar"
      description="Ảnh đại diện tròn — chữ cái đầu đậm trên nền light, màu cố định theo tên khi không có URL ảnh.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chu-cai-dau-tu-ten') {
      <demo-section heading="Chữ cái đầu từ tên" [props]="[{ name: 'src', value: 'initials' }]">
        <div class="row">
          <div class="card">
            <sd-avatar src="Nguyễn Văn An" [size]="48"></sd-avatar>
            <span>Nguyễn Văn An</span>
          </div>
          <div class="card">
            <sd-avatar src="Trần Thị Bích" [size]="48"></sd-avatar>
            <span>Trần Thị Bích</span>
          </div>
          <div class="card">
            <sd-avatar src="Lê Minh Hoàng" [size]="48"></sd-avatar>
            <span>Lê Minh Hoàng</span>
          </div>
          <div class="card">
            <sd-avatar src="Phạm Quỳnh Anh" [size]="48"></sd-avatar>
            <span>Phạm Quỳnh Anh</span>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-anh-url') {
      <demo-section heading="Ảnh URL" [props]="[{ name: 'src', value: 'url' }]">
        <div class="row">
          <sd-avatar src="https://i.pravatar.cc/80?img=11" [size]="48"></sd-avatar>
          <sd-avatar src="https://i.pravatar.cc/80?img=22" [size]="48"></sd-avatar>
          <sd-avatar src="https://i.pravatar.cc/80?img=33" [size]="48"></sd-avatar>
          <sd-avatar src="https://i.pravatar.cc/80?img=44" [size]="48"></sd-avatar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cac-kich-thuoc') {
      <demo-section heading="Các kích thước" [props]="[{ name: 'size', value: '24 / 32 / 48 / 72 / 96' }]">
        <div class="row size-row">
          <div class="card">
            <sd-avatar src="Nguyễn Văn An" [size]="24"></sd-avatar>
            <span>24</span>
          </div>
          <div class="card">
            <sd-avatar src="Nguyễn Văn An" [size]="32"></sd-avatar>
            <span>32</span>
          </div>
          <div class="card">
            <sd-avatar src="Nguyễn Văn An" [size]="48"></sd-avatar>
            <span>48</span>
          </div>
          <div class="card">
            <sd-avatar src="Nguyễn Văn An" [size]="72"></sd-avatar>
            <span>72</span>
          </div>
          <div class="card">
            <sd-avatar src="Nguyễn Văn An" [size]="96"></sd-avatar>
            <span>96</span>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-fallback-khi-thieu-du-lieu') {
      <demo-section heading="Fallback khi thiếu dữ liệu" [props]="[{ name: 'src', value: 'null / empty' }]">
        <div class="row">
          <sd-avatar [src]="null" [size]="48"></sd-avatar>
          <sd-avatar src="" [size]="48"></sd-avatar>
          <sd-avatar src="?" [size]="48"></sd-avatar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cham-trang-thai') {
      <demo-section
        heading="Chấm trạng thái"
        [props]="[
          { name: 'status', value: 'success / warning / error / secondary' },
          { name: 'statusLabel', value: 'text' },
          { name: 'statusPulse', value: 'true' },
        ]"
        note="Chấm nằm trên mép avatar ở góc 45°, đường kính 25% cỡ avatar (8–20px), vòng viền màu nền. statusLabel là tooltip của chấm và được đọc cùng tên, ví dụ “Lê Lan Anh, Đang hoạt động”.">
        <div class="row">
          @for (item of statuses; track item.label) {
            <div class="card">
              <sd-avatar src="Lê Lan Anh" [size]="40" [status]="item.status" [statusLabel]="item.label" [statusPulse]="item.pulse"></sd-avatar>
              <span>{{ item.label }}</span>
            </div>
          }
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cham-theo-kich-thuoc') {
      <demo-section heading="Chấm theo kích thước" [props]="[{ name: 'size', value: '24 / 32 / 40 / 64 / 96' }]">
        <div class="row size-row">
          @for (size of statusSizes; track size) {
            <div class="card">
              <sd-avatar src="Lê Lan Anh" [size]="size" status="success" statusLabel="Đang hoạt động"></sd-avatar>
              <span>{{ size }}</span>
            </div>
          }
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-anh-co-ten') {
      <demo-section
        heading="Ảnh có tên"
        [props]="[{ name: 'name', value: 'text' }]"
        note="Rê chuột vào ảnh để xem tên. Ảnh lỗi thì chữ viết tắt và màu lấy từ name.">
        <div class="row">
          <sd-avatar src="https://i.pravatar.cc/80?img=11" name="Phạm Minh Quân" [size]="48" status="success" statusLabel="Đang gọi" statusPulse></sd-avatar>
          <sd-avatar src="https://example.invalid/missing.png" name="Trần Thu Hà" [size]="48"></sd-avatar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trong-danh-sach') {
      <demo-section heading="Trong danh sách" [props]="[{ name: 'status', value: 'color' }, { name: 'statusLabel', value: 'text' }]">
        <div class="people">
          @for (person of people; track person.name) {
            <div class="person">
              <sd-avatar aria-hidden="true" [src]="person.name" [size]="32" [status]="person.status" [statusLabel]="person.label"></sd-avatar>
              <span class="person-text">
                <span class="person-name">{{ person.name }}</span>
                <span class="person-status">{{ person.label }}</span>
              </span>
            </div>
          }
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
    .size-row { align-items: flex-end; }
    .people {
      display: flex;
      flex-direction: column;
      width: 280px;
      border: 1px solid var(--sd-border);
      border-radius: 8px;
    }
    .person {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
    }
    .person + .person {
      border-top: 1px solid var(--sd-border);
    }
    .person-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .person-name {
      font-size: 13px;
    }
    .person-status {
      font-size: 12px;
      color: var(--sd-text-secondary);
    }
    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #555;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarDemoComponent {
  readonly statuses: { status: Color; label: string; pulse: boolean }[] = [
    { status: 'success', label: 'Đang hoạt động', pulse: false },
    { status: 'success', label: 'Đang gọi', pulse: true },
    { status: 'warning', label: 'Vắng mặt', pulse: false },
    { status: 'error', label: 'Không làm phiền', pulse: false },
    { status: 'secondary', label: 'Ngoại tuyến', pulse: false },
  ];
  readonly statusSizes = [24, 32, 40, 64, 96];
  readonly people: { name: string; status: Color; label: string }[] = [
    { name: 'Lê Lan Anh', status: 'success', label: 'Đang hoạt động' },
    { name: 'Phạm Minh Quân', status: 'warning', label: 'Vắng mặt' },
    { name: 'Trần Thu Hà', status: 'secondary', label: 'Ngoại tuyến · 2 giờ trước' },
  ];
}
