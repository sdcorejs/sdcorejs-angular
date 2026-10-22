import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdChipCalendar, SdChipCalendarModel } from '@sdcorejs/angular/forms/chip-calendar';

/** `yyyy/MM/dd` of today plus `offset` days. */
const day = (offset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

@Component({
  selector: 'app-chip-calendar-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdChipCalendar],
  template: `
    <demo-page #demoPage title="Chip Calendar" description="sd-chip-calendar – chọn nhiều ngày dưới dạng chip. Mở lịch để pick, bấm X để xoá ngày.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lien-ket-hai-chieu') {
      <demo-section heading="Liên kết hai chiều" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Mở lịch và chọn nhiều ngày.">
        <div style="width: 460px; display:flex; flex-direction:column; gap:8px">
          <sd-chip-calendar label="Ngày nghỉ phép" [(model)]="leaves" [form]="form"></sd-chip-calendar>
          <div style="font-size:12px; color:#555">
            Đã chọn <b>{{ leaves().length }}</b> ngày: {{ leaves().join(' · ') || '(trống)' }}
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
      <demo-section heading="Kích thước" [props]="[{ name: 'size', value: 'sm | md | lg' }]" note="Field một dòng 32 / 40 / 48px, chip 20 / 24 / 28px.">
        <div style="width: 460px; display:flex; flex-direction:column; gap:12px">
          <sd-chip-calendar label="sm" size="sm" [(model)]="sizes" [form]="form"></sd-chip-calendar>
          <sd-chip-calendar label="md" [(model)]="sizes" [form]="form"></sd-chip-calendar>
          <sd-chip-calendar label="lg" size="lg" [(model)]="sizes" [form]="form"></sd-chip-calendar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bat-buoc-so-toi-thieu') {
      <demo-section heading="Bắt buộc & số tối thiểu" [props]="[{ name: 'required', value: 'true' }, { name: 'minCount', value: '3' }]" note="Cần tối thiểu 3 ngày. Lỗi hiện khi đóng lịch hoặc bấm Kiểm tra.">
        <div style="width: 460px; display:flex; flex-direction:column; gap:12px">
          <sd-chip-calendar label="required + minCount=3"
            [(model)]="duty" [form]="formValid" required [minCount]="3"></sd-chip-calendar>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gioi-han-ngay-va-so-luong') {
      <demo-section heading="Giới hạn ngày và số lượng"
        [props]="[{ name: 'minDate', value: 'TODAY' }, { name: 'dateFilter', value: 'thứ 2 – thứ 6' }, { name: 'maxCount', value: '3' }, { name: 'clearable', value: 'true' }]"
        note="Chỉ chọn ngày làm việc từ hôm nay, tối đa 3 ngày. Đủ 3 ngày thì các ô còn lại bị khoá.">
        <div style="width: 460px">
          <sd-chip-calendar label="Ngày trực" [(model)]="limited" [form]="form"
            minDate="TODAY" [dateFilter]="weekday" [maxCount]="3" clearable></sd-chip-calendar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-khoa-ngay-da-qua') {
      <demo-section heading="Khoá ngày đã qua" [props]="[{ name: 'removable', value: '(day) => day >= today' }, { name: 'clearable', value: 'true' }]"
        note="Ngày đã qua hiện ổ khoá thay cho ✕; Backspace, bấm lại trên lịch và Xoá hết đều giữ lại.">
        <div style="width: 460px">
          <sd-chip-calendar label="Ngày training" [(model)]="training" [form]="form"
            [removable]="canRemove" clearable></sd-chip-calendar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gon-trong-bo-loc-bang') {
      <demo-section heading="Gọn trong bộ lọc bảng" [props]="[{ name: 'size', value: 'sm' }, { name: 'maxVisible', value: '2' }, { name: 'hideInlineError', value: 'true' }]"
        note="Chỉ hiện 2 chip đầu, phần còn lại gộp vào “+N”; mở lịch thì hiện đủ.">
        <div style="width: 320px">
          <sd-chip-calendar size="sm" hideInlineError [maxVisible]="2" [(model)]="filterDays" [form]="form"></sd-chip-calendar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kieu-model-va-transform') {
      <demo-section heading="Kiểu model và transform" [props]="[{ name: '[model]', value: 'Date | number | string' }, { name: 'transform', value: 'ISOString' }]"
        note="Model nhận Date, timestamp, chuỗi ISO lẫn yyyy/MM/dd; sau thao tác đầu, model là string[] theo transform.">
        <div style="width: 460px; display:flex; flex-direction:column; gap:8px">
          <sd-chip-calendar label="Model trộn kiểu" [(model)]="mixed" [form]="form" transform="ISOString"></sd-chip-calendar>
          <pre style="margin:0; font-size:12px; color:#555; white-space:pre-wrap">{{ mixedText() }}</pre>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-vo-hieu-hoa') {
      <demo-section heading="Vô hiệu hoá" [props]="[{ name: 'disabled', value: 'true' }]" note="Khoá thao tác – chỉ hiển thị các chip đã chọn.">
        <div style="width: 460px">
          <sd-chip-calendar label="disabled" [(model)]="lockedDates" [form]="form" disabled></sd-chip-calendar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Chỉnh sửa nội tuyến" [props]="[{ name: 'viewed', value: 'inline' }]" note="Chip lịch vẫn sửa được, nhưng khi disabled thì rơi về xem tĩnh (viewed=true).">
        <div style="width: 460px; display:flex; flex-direction:column; gap:12px">
          <sd-chip-calendar label="Ngày nghỉ (inline)" [viewed]="'inline'" [(model)]="inlineDates" [form]="form"></sd-chip-calendar>
          <sd-chip-calendar label="disabled + inline → tĩnh" [viewed]="'inline'" [(model)]="inlineDates" [form]="form" disabled></sd-chip-calendar>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipCalendarDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  leaves = signal<string[]>(['2025/01/15', '2025/01/20']);
  sizes = signal<string[]>(['2026/10/05', '2026/10/12', '2026/10/27']);
  duty = signal<string[]>([]);
  limited = signal<string[]>([]);
  training = signal<string[]>([day(-9), day(-2), day(3), day(10)]);
  filterDays = signal<string[]>(['2026/10/27', '2026/10/05', '2026/10/12', '2026/10/19', '2026/10/26']);
  mixed = signal<SdChipCalendarModel>([new Date(2026, 9, 5), new Date(2026, 9, 12).getTime(), '2026-10-19T00:00:00', '2026/10/26']);
  lockedDates = signal<string[]>(['2025/01/10', '2025/01/11', '2025/01/12']);
  inlineDates = signal<string[]>(['2026/05/01', '2026/05/20']);

  /** Thứ 2 – thứ 6. */
  weekday = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6;
  /** Ngày đã qua không bỏ được; `yyyy/MM/dd` so được như chuỗi. */
  canRemove = (value: string) => value >= day(0);

  mixedText() {
    return JSON.stringify(this.mixed(), null, 1);
  }

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
