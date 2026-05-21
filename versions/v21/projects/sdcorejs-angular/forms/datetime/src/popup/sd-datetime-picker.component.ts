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
 * Datetime picker popup â€” Calendar (Angular Material) + Time Spinner + Footer.
 *
 * Component nÃ y Ä‘Æ°á»£c render trong CDK Overlay tá»« `sd-datetime`.
 * PhÃ¡t event `confirmed`/`cancelled` khi user thao tÃ¡c trÃªn footer.
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
  /** GiÃ¡ trá»‹ khá»Ÿi táº¡o cá»§a picker (native Date, cÃ³ thá»ƒ null). */
  initialValue = input<Date | null>(null);
  /** Min/max boundary (Date hoáº·c báº¥t ká»³ giÃ¡ trá»‹ nÃ o há»£p lá»‡ cho `new Date(...)`). */
  minDate = input<Date | string | number | null>(null);
  maxDate = input<Date | string | number | null>(null);
  /** Hiá»ƒn thá»‹ thÃªm cá»™t giÃ¢y (máº·c Ä‘á»‹nh áº©n â€” chá»‰ HH:MM). */
  showSeconds = input(false, { transform: booleanAttribute });
  /** Disabled state. */
  disabled = input(false, { transform: booleanAttribute });

  // ==========================================
  // OUTPUTS (legacy EventEmitter Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch Overlay subscription)
  // ==========================================
  @Output() confirmed = new EventEmitter<Date>();
  @Output() cancelled = new EventEmitter<void>();

  // ==========================================
  // STATE â€” signals ná»™i bá»™
  // ==========================================
  // date-fns lÃ  immutable â€” luÃ´n cáº¥p Date má»›i, khÃ´ng mutate.
  selectedDate = signal<Date>(new Date());
  hours = signal<number>(0);
  minutes = signal<number>(0);
  seconds = signal<number>(0);

  constructor() {
    // Khá»Ÿi táº¡o tá»« initialValue khi component Ä‘Æ°á»£c táº¡o.
    // Effect khÃ´ng cáº§n thiáº¿t vÃ¬ input chá»‰ set má»™t láº§n lÃºc má»Ÿ popup.
    queueMicrotask(() => this.#hydrateFromInput());
  }

  #hydrateFromInput() {
    const init = this.initialValue();
    // Clone báº±ng new Date(getTime()) Ä‘á»ƒ khÃ´ng chia sáº» reference vá»›i caller.
    const d = init instanceof Date && isValidDate(init) ? new Date(init.getTime()) : new Date();
    this.selectedDate.set(d);
    this.hours.set(d.getHours());
    this.minutes.set(d.getMinutes());
    this.seconds.set(d.getSeconds());
  }

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  /** Khi user chá»n ngÃ y trÃªn MatCalendar. */
  onDateSelected(date: Date | null) {
    if (!date) return;
    // Giá»¯ nguyÃªn giá»/phÃºt/giÃ¢y hiá»‡n táº¡i, chá»‰ thay Ä‘á»•i ngÃ y.
    const next = new Date(date.getTime());
    next.setHours(this.hours(), this.minutes(), this.seconds(), 0);
    this.selectedDate.set(next);
  }

  onConfirm() {
    if (this.disabled()) return;
    // Táº¡o Date má»›i tá»« selectedDate + hours/minutes/seconds hiá»‡n táº¡i.
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

  /** Äáº·t nhanh thá»i gian "BÃ¢y giá»". */
  onNow() {
    if (this.disabled()) return;
    const now = new Date();
    this.selectedDate.set(now);
    this.hours.set(now.getHours());
    this.minutes.set(now.getMinutes());
    this.seconds.set(now.getSeconds());
  }

  // Min/Max â€” chuyá»ƒn vá» Date cho MatCalendar (date-fns adapter dÃ¹ng native Date).
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

