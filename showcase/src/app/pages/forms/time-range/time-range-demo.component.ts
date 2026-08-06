import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SdTimeRange, SdTimeRangeValue } from '@sdcorejs/angular/forms/time-range';

import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-time-range-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, ReactiveFormsModule, SdTimeRange],
  template: `
    <demo-page
      #demoPage
      title="Time Range"
      description="sd-time-range – khoảng giờ thuần { from, to } với validation tổng hợp và endpoint độc lập.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
        <demo-section
          heading="Cơ bản"
          [props]="[{ name: '[(model)]', value: 'SdTimeRangeValue' }]"
          note="Hai ô cùng phát một model { from, to } đã chuẩn hóa HH:mm.">
          <div style="width: 520px; max-width:100%">
            <sd-time-range [form]="form" name="workingHours" label="Giờ làm việc" clearable [(model)]="workingHours"></sd-time-range>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gioi-han-va-thu-tu') {
        <demo-section
          heading="Giới hạn và thứ tự"
          [props]="[
            { name: 'min', value: '08:00' },
            { name: 'max', value: '18:00' },
            { name: 'step', value: '15' },
          ]"
          note="Mỗi đầu kiểm tra min/max/step; giờ bắt đầu sau giờ kết thúc tạo lỗi range.">
          <div style="width: 520px; max-width:100%">
            <sd-time-range
              [form]="form"
              name="boundedHours"
              label="Khung phục vụ"
              min="08:00"
              max="18:00"
              [step]="15"
              [(model)]="boundedHours">
            </sd-time-range>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-khoang-mo') {
        <demo-section
          heading="Khoảng mở"
          [props]="[{ name: 'allowOpenEnded', value: 'true' }]"
          note="Cho phép chỉ có mốc bắt đầu hoặc kết thúc khi field không required.">
          <div style="width: 520px; max-width:100%">
            <sd-time-range [form]="form" name="openHours" label="Áp dụng từ" allowOpenEnded [(model)]="openHours"> </sd-time-range>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
        <demo-section
          heading="Trạng thái"
          [props]="[{ name: 'disabled / readonly / viewed', value: 'true' }]"
          note="Viewed hiển thị model time-only mà không khởi tạo Date ở API công khai.">
          <div style="display:flex; gap:16px; flex-direction:column; max-width:520px">
            <sd-time-range label="Disabled" [model]="workingHours()" disabled></sd-time-range>
            <sd-time-range label="Readonly" [model]="workingHours()" readonly></sd-time-range>
            <sd-time-range label="Viewed" [model]="workingHours()" viewed></sd-time-range>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeRangeDemoComponent {
  readonly form = new FormGroup({});
  readonly workingHours = signal<SdTimeRangeValue | null>({ from: '08:30', to: '17:30' });
  readonly boundedHours = signal<SdTimeRangeValue | null>({ from: '08:15', to: '17:45' });
  readonly openHours = signal<SdTimeRangeValue | null>({ from: '09:00', to: null });
}
