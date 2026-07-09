import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'sd-time-spinner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './time-spinner.component.html',
  styleUrls: ['./time-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sd-time-spinner' },
})
export class SdTimeSpinner {
  public readonly value = input<Date | null>(null);
  public readonly showSeconds = input<boolean>(false);
  public readonly stepMinute = input<number>(1);
  public readonly disabled = input<boolean>(false);

  public readonly valueChange = output<Date>();

  public readonly hour = computed(() => this.value()?.getHours() ?? 0);
  public readonly minute = computed(() => this.value()?.getMinutes() ?? 0);
  public readonly second = computed(() => this.value()?.getSeconds() ?? 0);

  private readonly _focusedUnit = signal<'hour' | 'minute' | 'second' | null>(null);

  /** Display string for each column: unpadded while focused (so the user can type freely), padded to 2 digits otherwise. */
  public readonly displayHour = computed(() =>
    this._focusedUnit() === 'hour' ? String(this.hour()) : String(this.hour()).padStart(2, '0'),
  );
  public readonly displayMinute = computed(() =>
    this._focusedUnit() === 'minute' ? String(this.minute()) : String(this.minute()).padStart(2, '0'),
  );
  public readonly displaySecond = computed(() =>
    this._focusedUnit() === 'second' ? String(this.second()) : String(this.second()).padStart(2, '0'),
  );

  public setFocus(unit: 'hour' | 'minute' | 'second'): void { this._focusedUnit.set(unit); }
  public clearFocus(): void { this._focusedUnit.set(null); }

  public stepHourUp(): void { this.#step('hour', +1); }
  public stepHourDown(): void { this.#step('hour', -1); }
  public stepMinuteUp(): void { this.#step('minute', +this.stepMinute()); }
  public stepMinuteDown(): void { this.#step('minute', -this.stepMinute()); }
  public stepSecondUp(): void { this.#step('second', +1); }
  public stepSecondDown(): void { this.#step('second', -1); }

  // delta ขึ้น/ลง พร้อม wrap-around เพื่อให้ 23+1=0, 0-1=23 เป็นต้น
  #step(unit: 'hour' | 'minute' | 'second', delta: number): void {
    if (this.disabled()) return;
    const base = this.value() ?? new Date(2026, 0, 1, 0, 0, 0);
    const next = new Date(base);
    if (unit === 'hour') next.setHours(this.#wrap(base.getHours() + delta, 24));
    if (unit === 'minute') next.setMinutes(this.#wrap(base.getMinutes() + delta, 60));
    if (unit === 'second') next.setSeconds(this.#wrap(base.getSeconds() + delta, 60));
    this.valueChange.emit(next);
  }

  // modulo ที่รองรับค่าลบ: ((v % mod) + mod) % mod
  #wrap(v: number, mod: number): number {
    return ((v % mod) + mod) % mod;
  }

  public onHourInput(raw: string): void { this.#setUnit('hour', raw, 0, 23); }
  public onMinuteInput(raw: string): void { this.#setUnit('minute', raw, 0, 59); }
  public onSecondInput(raw: string): void { this.#setUnit('second', raw, 0, 59); }

  public onDigitKeyDown(event: KeyboardEvent): void {
    // Allow control keys and modifier shortcuts (Ctrl/Cmd + A/C/V/X)
    if ((event.ctrlKey || event.metaKey) && /^[acvx]$/i.test(event.key)) return;
    const allowed = new Set([
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End',
    ]);
    if (allowed.has(event.key)) return;
    // Block any non-digit
    if (!/^\d$/.test(event.key)) event.preventDefault();
  }

  // Strip non-digits, clamp to [min, max] แล้ว emit เสมอ (ยกเว้น empty string)
  #setUnit(unit: 'hour' | 'minute' | 'second', raw: string, min: number, max: number): void {
    if (this.disabled()) return;
    // Strip non-digits and parse
    const cleaned = (raw ?? '').replace(/\D/g, '').slice(0, 2);
    if (cleaned === '') return;
    const v = Number.parseInt(cleaned, 10);
    if (Number.isNaN(v)) return;
    // Clamp to [min, max] (e.g. typing 25 for hour → 23; 99 for minute → 59)
    const clamped = Math.min(Math.max(v, min), max);
    const base = this.value() ?? new Date(2026, 0, 1, 0, 0, 0);
    const next = new Date(base);
    if (unit === 'hour') next.setHours(clamped);
    if (unit === 'minute') next.setMinutes(clamped);
    if (unit === 'second') next.setSeconds(clamped);
    this.valueChange.emit(next);
  }
}
