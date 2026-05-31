import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';

@Component({
  selector: 'app-avatar-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdAvatar],
  template: `
    <demo-page
      title="Avatar"
      description="Ảnh đại diện tròn — tự sinh chữ cái đầu với màu cố định theo tên khi không có URL ảnh.">

      <demo-section heading="Sinh chữ cái đầu từ tên Tiếng Việt">
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

      <demo-section heading="Avatar dạng ảnh URL">
        <div class="row">
          <sd-avatar src="https://i.pravatar.cc/80?img=11" [size]="48"></sd-avatar>
          <sd-avatar src="https://i.pravatar.cc/80?img=22" [size]="48"></sd-avatar>
          <sd-avatar src="https://i.pravatar.cc/80?img=33" [size]="48"></sd-avatar>
          <sd-avatar src="https://i.pravatar.cc/80?img=44" [size]="48"></sd-avatar>
        </div>
      </demo-section>

      <demo-section heading="Kích thước (size)">
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

      <demo-section heading="Fallback khi không có dữ liệu">
        <div class="row">
          <sd-avatar [src]="null" [size]="48"></sd-avatar>
          <sd-avatar src="" [size]="48"></sd-avatar>
          <sd-avatar src="?" [size]="48"></sd-avatar>
        </div>
      </demo-section>
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
export class AvatarDemoComponent {}
