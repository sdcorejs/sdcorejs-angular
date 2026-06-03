import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';

@Component({
  selector: 'app-switch-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdSwitch],
  template: `
    <demo-page title="Switch" description="sd-switch – công tắc bật/tắt boolean. Hỗ trợ màu chủ đề, disabled / viewed.">
      <demo-section [props]="[{ name: '[(model)]' }]" note="Bind hai chiều, hiển thị trạng thái ngay bên cạnh.">
        <div style="display:flex; flex-direction:column; gap:8px; width:100%">
          <sd-switch label="Nhận thông báo qua email" [(model)]="notify" [form]="form"></sd-switch>
          <div style="font-size:12px; color:#555">
            Trạng thái: <b>{{ notify() ? 'BẬT' : 'TẮT' }}</b>
          </div>
        </div>
      </demo-section>

      <demo-section heading="danh sách cấu hình" note="Mỗi switch điều khiển một option độc lập.">
        <div style="display:flex; flex-direction:column; gap:6px">
          <sd-switch label="Tự động lưu" [(model)]="autoSave" [form]="form"></sd-switch>
          <sd-switch label="Chế độ tối" [(model)]="darkMode" [form]="form"></sd-switch>
          <sd-switch label="Đồng bộ Cloud" [(model)]="cloudSync" [form]="form"></sd-switch>
          <div style="font-size:12px; color:#555; margin-top:6px">
            Tóm tắt: autoSave={{ autoSave() }} · darkMode={{ darkMode() }} · cloud={{ cloudSync() }}
          </div>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'color', value: 'primary / success / warning / error' }]" note="Thuộc tính color thay đổi accent track.">
        <div style="display:flex; gap:20px; flex-wrap:wrap">
          <sd-switch label="primary" color="primary" [(model)]="s1" [form]="form"></sd-switch>
          <sd-switch label="success" color="success" [(model)]="s2" [form]="form"></sd-switch>
          <sd-switch label="warning" color="warning" [(model)]="s3" [form]="form"></sd-switch>
          <sd-switch label="error" color="error" [(model)]="s4" [form]="form"></sd-switch>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'disabled' }, { name: 'viewed' }]" note="Hai trạng thái khoá.">
        <div style="display:flex; gap:20px; flex-wrap:wrap">
          <sd-switch label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-switch>
          <sd-switch label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-switch>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'viewed', value: 'true' }, { name: 'viewed', value: 'inline' }]" note="viewed=true hiện chữ Bật/Tắt; 'inline' vẫn gạt được, disabled+inline thì xem tĩnh.">
        <div style="display:flex; gap:20px; flex-wrap:wrap">
          <sd-switch label="viewed=true (tĩnh)" [(model)]="viewedFlag" [form]="form" viewed></sd-switch>
          <sd-switch label="inline (vẫn gạt được)" [viewed]="'inline'" [(model)]="inlineFlag" [form]="form"></sd-switch>
          <sd-switch label="disabled + inline → tĩnh" [viewed]="'inline'" [(model)]="viewedFlag" [form]="form" disabled></sd-switch>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchDemoComponent {
  form = new FormGroup({});

  notify = signal<boolean>(true);

  autoSave = signal<boolean>(true);
  darkMode = signal<boolean>(false);
  cloudSync = signal<boolean>(true);

  s1 = signal<boolean>(true);
  s2 = signal<boolean>(true);
  s3 = signal<boolean>(true);
  s4 = signal<boolean>(false);

  lockedA = signal<boolean>(true);
  lockedB = signal<boolean>(false);

  viewedFlag = signal<boolean>(true);
  inlineFlag = signal<boolean>(false);
}
