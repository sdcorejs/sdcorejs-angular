import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';

interface Range { from?: string | null; to?: string | null }

@Component({
  selector: 'app-date-range-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdDateRange],
  template: `
    <demo-page title="Date Range" description="sd-date-range – chọn khoảng thời gian từ – đến. Model là object { from, to } dạng ISO.">
      <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Chọn ngày bắt đầu và ngày kết thúc trong cùng popup.">
        <div style="width: 380px; display:flex; flex-direction:column; gap:8px">
          <sd-date-range label="Khoảng thời gian báo cáo" helperText="Chọn ngày bắt đầu và kết thúc"
            [(model)]="period" [form]="form"></sd-date-range>
          <div style="font-size:12px; color:#555">
            Từ <b>{{ period()?.from || '...' }}</b> đến <b>{{ period()?.to || '...' }}</b>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="Để trống và bấm Kiểm tra.">
        <div style="width: 380px; display:flex; flex-direction:column; gap:12px">
          <sd-date-range label="required"
            [(model)]="billing" [form]="formValid" required></sd-date-range>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Khoảng đã set sẵn.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-date-range style="width: 300px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-date-range>
          <sd-date-range style="width: 300px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-date-range>
        </div>
      </demo-section>

      <demo-section heading="Chỉnh sửa nội tuyến" [props]="[{ name: 'viewed', value: 'inline' }]" note="Bấm vào khoảng để mở lịch chọn; text giữ nguyên tới khi chọn. Hover hiện × để xoá.">
        <div style="width: 340px; font-size:13px; color:#555">
          Kỳ: <sd-date-range [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-date-range>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  period = signal<Range | null>(null);
  billing = signal<Range | null>(null);
  lockedA = signal<Range | null>({ from: '2025-01-01', to: '2025-01-31' });
  lockedB = signal<Range | null>({ from: '2025-02-01', to: '2025-02-28' });

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
