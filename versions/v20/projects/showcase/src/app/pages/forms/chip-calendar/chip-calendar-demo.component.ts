import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdChipCalendar } from '@sdcorejs/angular/forms/chip-calendar';

@Component({
  selector: 'app-chip-calendar-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdChipCalendar],
  template: `
    <demo-page title="Chip Calendar" description="sd-chip-calendar – chọn nhiều ngày dưới dạng chip. Mở lịch để pick, bấm X để xoá ngày.">
      <demo-section heading="cơ bản" note="Mở lịch và chọn nhiều ngày.">
        <div style="width: 460px; display:flex; flex-direction:column; gap:8px">
          <sd-chip-calendar label="Ngày nghỉ phép" helperText="Chọn các ngày dự kiến nghỉ"
            [(model)]="leaves" [form]="form"></sd-chip-calendar>
          <div style="font-size:12px; color:#555">
            Đã chọn <b>{{ leaves().length }}</b> ngày: {{ leaves().join(' · ') || '(trống)' }}
          </div>
        </div>
      </demo-section>

      <demo-section heading="Validator (required + min=3)" note="Cần tối thiểu 3 ngày. Bấm Kiểm tra để xem lỗi.">
        <div style="width: 460px; display:flex; flex-direction:column; gap:12px">
          <sd-chip-calendar label="required + min=3"
            [(model)]="duty" [form]="formValid" required [min]="3"></sd-chip-calendar>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái (state)" note="Khoá thao tác – chỉ hiển thị các chip đã chọn.">
        <div style="width: 460px">
          <sd-chip-calendar label="disabled" [(model)]="lockedDates" [form]="form" disabled></sd-chip-calendar>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipCalendarDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  leaves = signal<string[]>(['2025/01/15', '2025/01/20']);
  duty = signal<string[]>([]);
  lockedDates = signal<string[]>(['2025/01/10', '2025/01/11', '2025/01/12']);

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
