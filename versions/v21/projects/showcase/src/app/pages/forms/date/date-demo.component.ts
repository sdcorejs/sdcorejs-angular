import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdDate } from '@sdcorejs/angular/forms/date';

@Component({
  selector: 'app-date-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdDate],
  template: `
    <demo-page title="Date" description="sd-date – chọn 1 ngày, hiển thị theo định dạng dd/MM/yyyy. Bind hai chiều với chuỗi ISO.">
      <demo-section heading="cơ bản" note="Mở lịch và chọn ngày.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:8px">
          <sd-date label="Ngày sinh" helperText="Theo CMND/CCCD"
            [(model)]="birthday" [form]="form"></sd-date>
          <div style="font-size:12px; color:#555">
            Giá trị: <b>{{ birthday() || '(trống)' }}</b>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Validator (required)" note="Để trống và bấm Kiểm tra để hiện lỗi inline.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-date label="required"
            [(model)]="startDate" [form]="formValid" required></sd-date>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái (state)" note="Hai trạng thái khoá.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-date style="width: 240px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-date>
          <sd-date style="width: 240px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-date>
        </div>
      </demo-section>

      <demo-section heading="Kích thước (size)" note="UI gọn cho toolbar.">
        <div style="width: 280px">
          <sd-date label="sm" size="sm" [(model)]="filter" [form]="form"></sd-date>
        </div>
      </demo-section>

      <demo-section heading="Inline edit ('inline')" note="Bấm vào ngày để mở lịch ngay; text giữ nguyên tới khi chọn. Hover hiện × để xoá.">
        <div style="width: 260px; font-size:13px; color:#555">
          Ngày sinh: <sd-date [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-date>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  birthday = signal<string | null>(null);
  startDate = signal<string | null>(null);
  lockedA = signal<string | null>('2025-01-15');
  lockedB = signal<string | null>('2025-02-20');
  filter = signal<string | null>(null);

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
