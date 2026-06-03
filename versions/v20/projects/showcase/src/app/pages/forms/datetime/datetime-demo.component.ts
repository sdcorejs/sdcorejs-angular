import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';

@Component({
  selector: 'app-datetime-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdDatetime],
  template: `
    <demo-page title="Datetime" description="sd-datetime – chọn ngày + giờ trong cùng một control. Bind hai chiều với chuỗi 'YYYY-MM-DD HH:mm'.">
      <demo-section heading="cơ bản" note="Mở popup picker để chọn ngày và giờ.">
        <div style="width: 340px; display:flex; flex-direction:column; gap:8px">
          <sd-datetime label="Thời điểm cuộc họp" helperText="Bao gồm ngày và giờ"
            [(model)]="meeting" [form]="form"></sd-datetime>
          <div style="font-size:12px; color:#555">Giá trị: <b>{{ meeting() || '(trống)' }}</b></div>
        </div>
      </demo-section>

      <demo-section heading="Validator (required)" note="Bỏ trống và bấm Kiểm tra để xem lỗi.">
        <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
          <sd-datetime label="required"
            [(model)]="startAt" [form]="formValid" required></sd-datetime>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái (state)" note="Hai trạng thái không cho chỉnh sửa.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-datetime style="width: 260px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-datetime>
          <sd-datetime style="width: 260px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-datetime>
        </div>
      </demo-section>

      <demo-section heading="Inline edit ('inline')" note="Bấm vào để mở overlay datetime; text giữ nguyên tới khi chọn. Hover hiện × để xoá.">
        <div style="width: 300px; font-size:13px; color:#555">
          Hẹn lúc: <sd-datetime [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-datetime>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  meeting = signal<string | null>(null);
  startAt = signal<string | null>(null);
  lockedA = signal<string | null>('2025-01-15 09:30');
  lockedB = signal<string | null>('2025-02-20 14:00');

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
