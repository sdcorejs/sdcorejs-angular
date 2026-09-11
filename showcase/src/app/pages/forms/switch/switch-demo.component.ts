import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';

@Component({
  selector: 'app-switch-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdSwitch, SdTable, SdTableCellDefDirective],
  template: `
    <demo-page #demoPage title="Switch" description="sd-switch – công tắc bật/tắt boolean. Ba kích thước, màu chủ đề, disabled / viewed.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chiều, hiển thị trạng thái ngay bên cạnh.">
        <div style="display:flex; flex-direction:column; gap:8px; width:100%">
          <sd-switch label="Nhận thông báo qua email" [(model)]="notify" [form]="form"></sd-switch>
          <div style="font-size:12px; color:#555">
            Trạng thái: <b>{{ notify() ? 'BẬT' : 'TẮT' }}</b>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
      <demo-section heading="Kích thước" [props]="[{ name: 'size', value: 'sm / md / lg' }]" note="Mặc định md. Track lần lượt 36×20px, 52×32px và 60×36px.">
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:24px">
          <div style="display:flex; flex-direction:column; gap:12px">
            <sd-switch size="sm" label="sm · Bật" [model]="true" />
            <sd-switch size="sm" label="sm · Tắt" [model]="false" />
          </div>
          <div style="display:flex; flex-direction:column; gap:12px">
            <sd-switch size="md" label="md · Bật" [model]="true" />
            <sd-switch size="md" label="md · Tắt" [model]="false" />
          </div>
          <div style="display:flex; flex-direction:column; gap:12px">
            <sd-switch size="lg" label="lg · Bật" [model]="true" />
            <sd-switch size="lg" label="lg · Tắt" [model]="false" />
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ben-trong-bang') {
      <demo-section heading="Bên trong bảng" [props]="[{ name: 'sdTableCellDef', value: 'template' }]" note="Switch trong sd-table tự hiển thị cỡ sm, kể cả khi cell template không truyền size.">
        <sd-table [option]="switchTable" style="width:100%">
          <ng-template sdTableCellDef="active" let-item="item">
            <sd-switch label="Hoạt động" [(model)]="item.active" hideInlineError />
          </ng-template>
        </sd-table>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-danh-sach-cau-hinh') {
      <demo-section heading="Danh sách cấu hình" note="Mỗi switch điều khiển một option độc lập.">
        <div style="display:flex; flex-direction:column; gap:6px">
          <sd-switch label="Tự động lưu" [(model)]="autoSave" [form]="form"></sd-switch>
          <sd-switch label="Chế độ tối" [(model)]="darkMode" [form]="form"></sd-switch>
          <sd-switch label="Đồng bộ Cloud" [(model)]="cloudSync" [form]="form"></sd-switch>
          <div style="font-size:12px; color:#555; margin-top:6px">
            Tóm tắt: autoSave={{ autoSave() }} · darkMode={{ darkMode() }} · cloud={{ cloudSync() }}
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-sac') {
      <demo-section heading="Màu sắc" [props]="[{ name: 'color', value: 'primary / success / warning / error' }]" note="Thuộc tính color thay đổi accent track.">
        <div style="display:flex; gap:20px; flex-wrap:wrap">
          <sd-switch label="primary" color="primary" [(model)]="s1" [form]="form"></sd-switch>
          <sd-switch label="success" color="success" [(model)]="s2" [form]="form"></sd-switch>
          <sd-switch label="warning" color="warning" [(model)]="s3" [form]="form"></sd-switch>
          <sd-switch label="error" color="error" [(model)]="s4" [form]="form"></sd-switch>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Trạng thái" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Hai trạng thái khoá.">
        <div style="display:flex; gap:20px; flex-wrap:wrap">
          <sd-switch label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-switch>
          <sd-switch label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-switch>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-xem') {
      <demo-section heading="Chế độ xem" [props]="[{ name: 'viewed', value: 'true' }, { name: 'viewed', value: 'inline' }]" note="viewed=true hiện chữ Bật/Tắt; 'inline' vẫn gạt được, disabled+inline thì xem tĩnh.">
        <div style="display:flex; gap:20px; flex-wrap:wrap">
          <sd-switch label="viewed=true (tĩnh)" [(model)]="viewedFlag" [form]="form" viewed></sd-switch>
          <sd-switch label="inline (vẫn gạt được)" [viewed]="'inline'" [(model)]="inlineFlag" [form]="form"></sd-switch>
          <sd-switch label="disabled + inline → tĩnh" [viewed]="'inline'" [(model)]="viewedFlag" [form]="form" disabled></sd-switch>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchDemoComponent {
  readonly switchRows = [
    { id: 1, name: 'Thông báo email', active: true },
    { id: 2, name: 'Tự động lưu', active: false },
  ];
  readonly switchTable: SdTableOption<(typeof this.switchRows)[number]> = {
    type: 'local',
    items: () => this.switchRows,
    columns: [
      { field: 'name', title: 'Tính năng', type: 'string' },
      { field: 'active', title: 'Trạng thái', type: 'boolean' },
    ],
  };

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
