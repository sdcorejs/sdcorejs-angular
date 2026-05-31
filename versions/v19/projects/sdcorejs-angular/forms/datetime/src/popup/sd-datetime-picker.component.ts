import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  booleanAttribute,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { isValid as isValidDate } from 'date-fns';
import { SdTimeSpinner } from './sd-time-spinner.component';

/**
 * Datetime picker popup — Calendar (Angular Material) + Time Spinner + Footer.
 *
 * Component này được render trong CDK Overlay từ `sd-datetime`.
 * Phát event `confirmed`/`cancelled` khi user thao tác trên footer.
 */
@Component({
  selector: 'sd-datetime-picker',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule, MatButtonModule, SdTimeSpinner, TranslatePipe],
  templateUrl: './sd-datetime-picker.component.html',
  styleUrls: ['./sd-datetime-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdDatetimePicker {
  // ==========================================
  // INPUTS
  // ==========================================
  /** Giá trị khởi tạo của picker (native Date, có thể null). */
  initialValue = input<Date | null>(null);
  /** Min/max boundary (Date hoặc bất kỳ giá trị nào hợp lệ cho `new Date(...)`). */
  minDate = input<Date | string | number | null>(null);
  maxDate = input<Date | string | number | null>(null);
  /** Hiển thị thêm cột giây (mặc định ẩn — chỉ HH:MM). */
  showSeconds = input(false, { transform: booleanAttribute });
  /** Disabled state. */
  disabled = input(false, { transform: booleanAttribute });

  // ==========================================
  // OUTPUTS (legacy EventEmitter để tương thích Overlay subscription)
  // ==========================================
  @Output() confirmed = new EventEmitter<Date>();
  @Output() cancelled = new EventEmitter<void>();

  // ==========================================
  // STATE — signals nội bộ
  // ==========================================
  // date-fns là immutable — luôn cấp Date mới, không mutate.
  selectedDate = signal<Date>(new Date());
  hours = signal<number>(0);
  minutes = signal<number>(0);
  seconds = signal<number>(0);

  constructor() {
    // Khởi tạo từ initialValue khi component được tạo.
    // Effect không cần thiết vì input chỉ set một lần lúc mở popup.
    queueMicrotask(() => this.#hydrateFromInput());
  }

  #hydrateFromInput() {
    const init = this.initialValue();
    // Clone bằng new Date(getTime()) để không chia sẻ reference với caller.
    const d = init instanceof Date && isValidDate(init) ? new Date(init.getTime()) : new Date();
    this.selectedDate.set(d);
    this.hours.set(d.getHours());
    this.minutes.set(d.getMinutes());
    this.seconds.set(d.getSeconds());
  }

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  /** Khi user chọn ngày trên MatCalendar. */
  onDateSelected(date: Date | null) {
    if (!date) return;
    // Giữ nguyên giờ/phút/giây hiện tại, chỉ thay đổi ngày.
    const next = new Date(date.getTime());
    next.setHours(this.hours(), this.minutes(), this.seconds(), 0);
    this.selectedDate.set(next);
  }

  onConfirm() {
    if (this.disabled()) return;
    // Tạo Date mới từ selectedDate + hours/minutes/seconds hiện tại.
    const base = this.selectedDate();
    const result = new Date(base.getTime());
    result.setHours(
      this.hours(),
      this.minutes(),
      this.showSeconds() ? this.seconds() : 0,
      0,
    );
    this.confirmed.emit(result);
  }

  onCancel() {
    this.cancelled.emit();
  }

  /** Đặt nhanh thời gian "Bây giờ". */
  onNow() {
    if (this.disabled()) return;
    const now = new Date();
    this.selectedDate.set(now);
    this.hours.set(now.getHours());
    this.minutes.set(now.getMinutes());
    this.seconds.set(now.getSeconds());
  }

  // Min/Max — chuyển về Date cho MatCalendar (date-fns adapter dùng native Date).
  get _minDate(): Date | null {
    const v = this.minDate();
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return isValidDate(v) ? v : null;
    const d = new Date(v);
    return isValidDate(d) ? d : null;
  }
  get _maxDate(): Date | null {
    const v = this.maxDate();
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return isValidDate(v) ? v : null;
    const d = new Date(v);
    return isValidDate(d) ? d : null;
  }
}
