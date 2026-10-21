import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdBadge, SdBadgePicker, SdBadgePickerValue, SdBadgeType } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { Color } from '@sdcorejs/utils/models';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-badge-picker-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, JsonPipe, SdBadge, SdBadgePicker, SdButton],
  template: `
    <demo-page
      #demoPage
      title="Badge picker"
      description="Chọn cùng lúc kiểu, màu và icon của sd-badge trong một panel. Panel chỉ sửa bản nháp; đóng panel mới ghi giá trị và phát sdChange một lần.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-badge') {
        <demo-section
          heading="Chọn badge"
          [props]="[
            { name: '[(type)]', value: 'two-way' },
            { name: '[(color)]', value: 'two-way' },
            { name: '[(icon)]', value: 'two-way' },
            { name: 'previewTitle', value: 'text' },
            { name: '(sdChange)', value: 'output' },
          ]"
          note="Bấm ra ngoài, bấm Xong hoặc Tab ra khỏi panel để ghi; Esc huỷ thay đổi.">
          <div class="picker-demo-row">
            <sd-badge-picker
              class="picker-demo-field"
              label="Hiển thị trạng thái"
              previewTitle="Đã duyệt"
              autoId="status"
              [(type)]="type"
              [(color)]="color"
              [(icon)]="icon"
              (sdChange)="onChange($event)" />
            <div class="picker-demo-log">
              <div>type: {{ type() ?? 'undefined' }} · color: {{ color() ?? 'undefined' }} · icon: {{ icon() ?? 'null' }}</div>
              <div>sdChange: {{ lastChange() ? (lastChange() | json) : 'chưa phát' }} ({{ changeCount() }} lần)</div>
              @if (type(); as currentType) {
                <div class="picker-demo-result">
                  Trong bảng:
                  <sd-badge [type]="currentType" [color]="color()" [icon]="icon()" title="Đã duyệt" label="SLA" />
                </div>
              }
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trong-form') {
        <demo-section
          heading="Trong form"
          [props]="[
            { name: '[form]', value: 'FormGroup' },
            { name: 'name', value: 'statusBadge' },
            { name: 'required', value: 'true' },
          ]"
          note="Value của control là { type, color, icon } | null. Lỗi bắt buộc hiện sau lần đóng panel đầu tiên hoặc khi submit.">
          <div class="picker-demo-row">
            <sd-badge-picker class="picker-demo-field" [form]="form" name="statusBadge" label="Hiển thị trạng thái" required />
            <div class="picker-demo-log">
              <div>form.value: {{ formValue() | json }}</div>
              <div class="d-flex gap-8 mt-8">
                <sd-button type="outline" title="Kiểm tra" (click)="validate()"></sd-button>
                <sd-button type="light" title="Đặt lại" (click)="reset()"></sd-button>
              </div>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
        <demo-section
          heading="Kích thước"
          [props]="[{ name: 'size', value: 'sm / md / lg' }]"
          note="Cùng thang với sd-select. Ở cỡ sm ẩn dòng tóm tắt; cỡ lg dùng badge cỡ md trong ô.">
          <div class="picker-demo-column">
            <sd-badge-picker label="Cỡ sm" size="sm" type="round" color="success" icon="check_circle" previewTitle="Đã duyệt" />
            <sd-badge-picker label="Cỡ md" size="md" type="round" color="success" icon="check_circle" previewTitle="Đã duyệt" />
            <sd-badge-picker label="Cỡ lg" size="lg" type="round" color="success" icon="check_circle" previewTitle="Đã duyệt" />
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhan-va-placeholder') {
        <demo-section
          heading="Nhãn và placeholder"
          [props]="[
            { name: 'floatLabel', value: 'auto / always' },
            { name: 'labelPlacement', value: 'top' },
            { name: 'helperText', value: 'text' },
          ]">
          <div class="picker-demo-column">
            <sd-badge-picker label="floatLabel auto" />
            <sd-badge-picker label="floatLabel always" floatLabel="always" />
            <sd-badge-picker
              label="Hiển thị trạng thái"
              labelPlacement="top"
              helperText="Áp dụng cho cột Trạng thái của bảng đơn hàng"
              type="round"
              color="success" />
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gioi-han-lua-chon') {
        <demo-section
          heading="Giới hạn lựa chọn"
          [props]="[
            { name: 'types', value: '[…]' },
            { name: 'colors', value: '[…]' },
            { name: 'icons', value: '[…]' },
          ]">
          <div class="picker-demo-column">
            <sd-badge-picker
              label="Mức ưu tiên"
              previewTitle="Khẩn"
              [types]="priorityTypes"
              [colors]="priorityColors"
              [icons]="priorityIcons" />
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mo-ta-trong-ban-xem-truoc') {
        <demo-section
          heading="Mô tả trong bản xem trước"
          [props]="[{ name: 'previewDescription', value: 'text' }]"
          note="Chỉ hiện ở bản xem trước lớn, với kiểu icon và tag; kiểu khác có ghi chú.">
          <div class="picker-demo-column">
            <sd-badge-picker label="Hiển thị trạng thái" previewTitle="Đã duyệt" previewDescription="Bởi Nguyễn Văn A" type="tag" color="success" />
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-xem-va-vo-hieu') {
        <demo-section
          heading="Chỉ xem và vô hiệu"
          [props]="[
            { name: 'viewed', value: 'true' },
            { name: 'disabled', value: 'true' },
          ]">
          <div class="picker-demo-column">
            <sd-badge-picker label="Chỉ xem" viewed type="round" color="success" icon="check_circle" previewTitle="Đã duyệt" />
            <sd-badge-picker label="Vô hiệu" disabled type="solid" color="error" previewTitle="Quá hạn" />
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .picker-demo-row {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        align-items: flex-start;
      }
      .picker-demo-field {
        width: 320px;
        max-width: 100%;
      }
      .picker-demo-column {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 320px;
        max-width: 100%;
      }
      .picker-demo-log {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        color: var(--sd-text-secondary);
      }
      .picker-demo-result {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgePickerDemoComponent {
  readonly type = signal<SdBadgeType | undefined>('round');
  readonly color = signal<Color | undefined>('success');
  readonly icon = signal<string | null>('check_circle');
  readonly lastChange = signal<SdBadgePickerValue | null>(null);
  readonly changeCount = signal(0);

  readonly form = new FormGroup({});
  readonly formValue = signal<unknown>(null);

  readonly priorityTypes: SdBadgeType[] = ['round', 'solid'];
  readonly priorityColors: Color[] = ['info', 'warning', 'error'];
  readonly priorityIcons = ['flag', 'bolt', 'schedule'];

  constructor() {
    this.form.valueChanges.subscribe(() => this.formValue.set((this.form.getRawValue() as Record<string, unknown>)['statusBadge'] ?? null));
  }

  onChange(value: SdBadgePickerValue): void {
    this.lastChange.set(value);
    this.changeCount.update(count => count + 1);
  }

  validate(): void {
    this.form.markAllAsTouched();
  }

  reset(): void {
    this.form.reset();
    this.formValue.set(null);
  }
}
