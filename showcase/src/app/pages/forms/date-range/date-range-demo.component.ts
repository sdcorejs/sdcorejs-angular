import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';

interface Range {
  from?: string | null;
  to?: string | null;
}

@Component({
  selector: 'app-date-range-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, JsonPipe, SdDateRange],
  template: `
    <demo-page
      #demoPage
      title="Date Range"
      description="sd-date-range – chọn khoảng thời gian từ – đến. Model là object { from, to } dạng ISO.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
        <demo-section
          heading="Cơ bản"
          [props]="[{ name: '[(model)]', value: 'two-way' }]"
          note="Chọn ngày bắt đầu và ngày kết thúc trong cùng popup.">
          <div style="width: 380px; display:flex; flex-direction:column; gap:8px">
            <sd-date-range
              label="Khoảng thời gian báo cáo"
              helperText="Chọn ngày bắt đầu và kết thúc"
              [(model)]="period"
              [form]="form"></sd-date-range>
            <div style="font-size:12px; color:#555">
              Từ <b>{{ period()?.from || '...' }}</b> đến <b>{{ period()?.to || '...' }}</b>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
        <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="Để trống và bấm Kiểm tra.">
          <div style="width: 380px; display:flex; flex-direction:column; gap:12px">
            <sd-date-range label="required" [(model)]="billing" [form]="formValid" required></sd-date-range>
            <div style="display:flex; gap:8px">
              <button type="button" (click)="check()">Kiểm tra</button>
              <button type="button" (click)="reset()">Đặt lại</button>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
        <demo-section
          heading="Trạng thái"
          [props]="[
            { name: 'disabled', value: 'true' },
            { name: 'viewed', value: 'true' },
          ]"
          note="Khoảng đã set sẵn.">
          <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
            <sd-date-range style="width: 300px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-date-range>
            <sd-date-range style="width: 300px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-date-range>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
        <demo-section
          heading="Chỉnh sửa nội tuyến"
          [props]="[{ name: 'viewed', value: 'inline' }]"
          note="Bấm vào khoảng để mở lịch chọn; text giữ nguyên tới khi chọn. Hover hiện × để xoá.">
          <div style="width: 340px; font-size:13px; color:#555">
            Kỳ: <sd-date-range [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-date-range>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-hoa-gia-tri-dau-ra') {
        <demo-section
          heading="Chuẩn hoá giá trị đầu ra"
          [props]="[{ name: 'transform', value: 'ISOString / UTCString' }]"
          note="Mỗi đầu range được serialize RIÊNG — cả object không bao giờ bị gộp thành một chuỗi. Ô nhập vẫn là dd/MM/yyyy → dd/MM/yyyy; range thiếu một đầu vẫn giữ null ở đầu đó.">
          <div class="transform-grid">
            <div>
              <sd-date-range label="ISOString" transform="ISOString" [(model)]="isoPeriod"></sd-date-range>
              <code>{{ isoPeriod() | json }}</code>
            </div>
            <div>
              <sd-date-range label="UTCString" transform="UTCString" [(model)]="utcPeriod"></sd-date-range>
              <code>{{ utcPeriod() | json }}</code>
            </div>
            <div>
              <sd-date-range label="Không transform" [(model)]="plainPeriod"></sd-date-range>
              <code>{{ plainPeriod() | json }}</code>
            </div>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .transform-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      width: 100%;
    }

    .transform-grid > div {
      flex: 1 1 260px;
      min-width: 0;
    }

    .transform-grid code {
      display: block;
      margin-top: 4px;
      padding: 6px 8px;
      border: 1px solid #dfe3e8;
      border-radius: 6px;
      background: #f7f9fb;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeDemoComponent {
  isoPeriod = signal<Range | null>(null);
  utcPeriod = signal<Range | null>(null);
  plainPeriod = signal<Range | null>(null);

  form = new FormGroup({});
  formValid = new FormGroup({});

  period = signal<Range | null>(null);
  billing = signal<Range | null>(null);
  lockedA = signal<Range | null>({ from: '2025-01-01', to: '2025-01-31' });
  lockedB = signal<Range | null>({ from: '2025-02-01', to: '2025-02-28' });

  check() {
    this.formValid.markAllAsTouched();
  }
  reset() {
    this.formValid.reset();
    this.formValid.markAsUntouched();
  }
}
