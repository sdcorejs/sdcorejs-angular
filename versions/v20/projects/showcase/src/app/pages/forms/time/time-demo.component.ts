import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SdTime } from '@sdcorejs/angular/forms/time';

import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-time-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, ReactiveFormsModule, SdTime],
  template: `
    <demo-page #demoPage title="Time" description="sd-time – nhập hoặc chọn giờ thuần theo mô hình HH:mm, không mang ngày hay múi giờ.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
        <demo-section
          heading="Cơ bản"
          [props]="[{ name: '[(model)]', value: basic() ?? 'null' }]"
          note="Có thể gõ 9:05 để nhận model chuẩn hóa 09:05, hoặc mở bộ chọn giờ.">
          <div style="width: 320px">
            <sd-time [form]="form" name="basic" label="Giờ bắt đầu" clearable [(model)]="basic"></sd-time>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gioi-han-va-buoc-phut') {
        <demo-section
          heading="Giới hạn và bước phút"
          [props]="[
            { name: 'min', value: '08:00' },
            { name: 'max', value: '18:00' },
            { name: 'step', value: '15' },
          ]"
          note="Min/max bao gồm biên; phím mũi tên và bộ chọn cùng dùng bước 15 phút.">
          <div style="width: 320px">
            <sd-time [form]="form" name="bounded" label="Ca làm việc" min="08:00" max="18:00" [step]="15" [(model)]="bounded"> </sd-time>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validation') {
        <demo-section
          heading="Validation"
          [props]="[{ name: 'required', value: 'true' }]"
          note="Text sai như 25:10 được giữ lại để sửa, control invalid và model hợp lệ trước đó không bị ghi đè.">
          <div style="width: 320px">
            <sd-time [form]="validationForm" name="requiredTime" label="Giờ bắt buộc" required [(model)]="requiredTime"></sd-time>
          </div>
          <button type="button" (click)="validationForm.markAllAsTouched()">Hiện lỗi</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
        <demo-section
          heading="Trạng thái"
          [props]="[{ name: 'disabled / readonly / viewed', value: 'true' }]"
          note="Cùng một model time-only trong các trạng thái không chỉnh sửa.">
          <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
            <sd-time style="width:220px" label="Disabled" [model]="'08:30'" disabled></sd-time>
            <sd-time style="width:220px" label="Readonly" [model]="'12:00'" readonly></sd-time>
            <sd-time style="width:220px" label="Viewed" [model]="'17:30'" viewed></sd-time>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeDemoComponent {
  readonly form = new FormGroup({});
  readonly validationForm = new FormGroup({});
  readonly basic = signal<string | null>('09:05');
  readonly bounded = signal<string | null>('08:30');
  readonly requiredTime = signal<string | null>(null);
}
