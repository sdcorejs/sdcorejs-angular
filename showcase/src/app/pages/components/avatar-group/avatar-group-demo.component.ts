import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdAvatarGroup, SdAvatarGroupItem } from '@sdcorejs/angular/components/avatar';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

const MEMBERS: SdAvatarGroupItem[] = [
  { src: 'Lê Lan Anh', status: 'success', statusLabel: 'Đang hoạt động' },
  { src: 'Phạm Minh Quân', status: 'success', statusLabel: 'Đang gọi', statusPulse: true },
  { src: 'Trần Thu Hà', status: 'secondary', statusLabel: 'Ngoại tuyến' },
  { src: 'Đỗ Hải', status: 'warning', statusLabel: 'Vắng mặt' },
  { src: 'Nguyễn Bảo Ngọc', status: 'success', statusLabel: 'Đang hoạt động' },
  { src: 'https://i.pravatar.cc/80?img=12', name: 'Vũ Hoàng Long', status: 'error', statusLabel: 'Không làm phiền' },
  { src: 'Hoàng Mai Chi' },
];

@Component({
  selector: 'app-avatar-group-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdAvatarGroup],
  template: `
    <demo-page
      #demoPage
      title="Avatar group"
      description="Nhóm avatar chồng nhau: hiện tối đa max người, phần còn lại gộp vào ô “+N”; bấm ô này để xem danh sách đầy đủ.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhom-avatar') {
        <demo-section
          heading="Nhóm avatar"
          [props]="[
            { name: 'items', value: '[…]' },
            { name: 'max', value: '3 / 4 / 5' },
            { name: 'ariaLabel', value: 'text' },
          ]"
          note="Rê chuột vào từng avatar để xem tên và trạng thái; bấm “+N” để mở danh sách (Esc đóng và trả focus về ô).">
          <div class="group-demo-rows">
            @for (max of maxes; track max) {
              <div class="group-demo-row">
                <span class="group-demo-label">max {{ max }}</span>
                <sd-avatar-group [items]="members" [max]="max" ariaLabel="Người phụ trách" />
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
        <demo-section heading="Kích thước" [props]="[{ name: 'size', value: '24 / 32 / 40 / 64' }]">
          <div class="group-demo-rows">
            @for (size of sizes; track size) {
              <div class="group-demo-row">
                <span class="group-demo-label">{{ size }}</span>
                <sd-avatar-group [items]="members" [size]="size" />
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-du-dung-mot-nguoi') {
        <demo-section
          heading="Dư đúng một người"
          [props]="[{ name: 'max', value: '6' }]"
          note="7 người với max 6: hiện luôn người thứ 7 thay cho ô “+1”.">
          <sd-avatar-group [items]="members" [max]="6" />
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tu-mo-man-hinh-khac') {
        <demo-section
          heading="Tự mở màn hình khác"
          [props]="[{ name: '(moreClick)', value: 'output' }]"
          note="Có người nghe moreClick thì “+N” không mở popover mặc định mà phát danh sách người bị ẩn.">
          <div class="group-demo-row">
            <sd-avatar-group [items]="members" (moreClick)="onMore($event)" />
            <span class="group-demo-log">{{ moreLog() }}</span>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .group-demo-rows {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .group-demo-row {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .group-demo-label {
        width: 48px;
        font-size: 12px;
        color: var(--sd-text-secondary);
      }
      .group-demo-log {
        font-size: 12px;
        color: var(--sd-text-secondary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarGroupDemoComponent {
  readonly members = MEMBERS;
  readonly maxes = [3, 4, 5];
  readonly sizes = [24, 32, 40, 64];
  readonly moreLog = signal('Chưa bấm “+N”.');

  onMore(hidden: SdAvatarGroupItem[]): void {
    this.moreLog.set(`moreClick: ${hidden.map(item => item.name || item.src).join(', ')}`);
  }
}
