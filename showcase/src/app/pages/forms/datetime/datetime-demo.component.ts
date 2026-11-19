import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';

@Component({
  selector: 'app-datetime-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdDatetime],
  template: `
    <demo-page
      #demoPage
      title="Datetime"
      description="sd-datetime – chọn ngày + giờ trong cùng một control. Bind hai chiều với chuỗi 'YYYY-MM-DD HH:mm'.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
        <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Mở popup picker để chọn ngày và giờ.">
          <div style="width: 340px; display:flex; flex-direction:column; gap:8px">
            <sd-datetime label="Thời điểm cuộc họp" helperText="Bao gồm ngày và giờ" [(model)]="meeting" [form]="form"></sd-datetime>
            <div style="font-size:12px; color:#555">
              Giá trị: <b>{{ meeting() || '(trống)' }}</b>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
        <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="Bỏ trống và bấm Kiểm tra để xem lỗi.">
          <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
            <sd-datetime label="required" [(model)]="startAt" [form]="formValid" required></sd-datetime>
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
          note="Hai trạng thái không cho chỉnh sửa.">
          <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
            <sd-datetime style="width: 260px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-datetime>
            <sd-datetime style="width: 260px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-datetime>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
        <demo-section
          heading="Chỉnh sửa nội tuyến"
          [props]="[{ name: 'viewed', value: 'inline' }]"
          note="Bấm vào để mở overlay datetime; text giữ nguyên tới khi chọn. Hover hiện × để xoá.">
          <div style="width: 300px; font-size:13px; color:#555">
            Hẹn lúc: <sd-datetime [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-datetime>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-hoa-gia-tri-dau-ra') {
        <demo-section
          heading="Chuẩn hoá giá trị đầu ra"
          [props]="[
            { name: 'transform', value: 'ISOString / UTCString' },
            { name: 'showSeconds', value: 'true' },
          ]"
          note="transform chỉ đổi giá trị đi ra — ô nhập vẫn theo showSeconds. Độ chính xác vẫn do showSeconds quy định: tắt thì giây về 0, bật thì giữ giây; mili-giây luôn bằng 0.">
          <div class="transform-grid">
            <div>
              <sd-datetime label="ISOString" transform="ISOString" [(model)]="isoAt"></sd-datetime>
              <code>{{ isoAt() ?? '—' }}</code>
            </div>
            <div>
              <sd-datetime label="UTCString + giây" transform="UTCString" [showSeconds]="true" [(model)]="utcAt"></sd-datetime>
              <code>{{ utcAt() ?? '—' }}</code>
            </div>
            <div>
              <sd-datetime label="Không transform" [(model)]="plainAt"></sd-datetime>
              <code>{{ plainAt() ?? '—' }}</code>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chot-gia-tri-khi-go') {
        <demo-section
          heading="Chốt giá trị khi gõ"
          [props]="[{ name: '(sdChange)', value: 'event' }]"
          note="Sửa ngay trong ô: chuỗi đang gõ dở không đổi giá trị. Thời điểm chỉ đổi khi gõ đủ dd/MM/yyyy HH:mm; chuỗi dở dang hoặc ngày giờ không tồn tại được giữ lại trong ô kèm lỗi. Giá trị chỉ về trống khi rời ô trống, nhấn Enter trên ô trống hoặc bấm xoá.">
          <div style="width: 340px; display:flex; flex-direction:column; gap:8px">
            <sd-datetime label="Giờ hẹn" autoId="commit" [(model)]="commitValue" (sdChange)="logCommit($event)"></sd-datetime>
            <div style="font-size:12px; color:#555">
              model: <code data-e2e="commit-model">{{ commitValue() ?? 'null' }}</code>
            </div>
            <div style="font-size:12px; color:#555">
              sdChange: <code data-e2e="commit-log">{{ commitLogJson() }}</code>
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
      flex: 1 1 240px;
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
export class DatetimeDemoComponent {
  isoAt = signal<string | null>(null);
  utcAt = signal<string | null>(null);
  plainAt = signal<string | null>(null);

  form = new FormGroup({});
  formValid = new FormGroup({});

  meeting = signal<string | null>(null);
  startAt = signal<string | null>(null);
  lockedA = signal<string | null>('2025-01-15 09:30');
  lockedB = signal<string | null>('2025-02-20 14:00');

  commitValue = signal<string | null>('2026/11/19 10:30:00');
  readonly commitLog = signal<(string | null)[]>([]);
  readonly commitLogJson = computed(() => JSON.stringify(this.commitLog()));

  logCommit(value: string | null) {
    this.commitLog.update(log => [...log, value]);
  }

  check() {
    this.formValid.markAllAsTouched();
  }
  reset() {
    this.formValid.reset();
    this.formValid.markAsUntouched();
  }
}
