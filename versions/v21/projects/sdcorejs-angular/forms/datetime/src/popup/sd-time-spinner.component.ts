import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

/**
 * Time spinner — UI chọn giờ/phút/(giây) compact, modern.
 *
 *  - Format 24h
 *  - Mặc định hiển thị HH:MM, bật `showSeconds` để hiện thêm cột giây
 *  - Hỗ trợ: click ▲▼, gõ trực tiếp, lăn chuột, mũi tên bàn phím
 *  - Wrap vòng (23 → ▲ → 00)
 */
@Component({
  selector: 'sd-time-spinner',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './sd-time-spinner.component.html',
  styleUrl: './sd-time-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdTimeSpinner {
  // Hai-chiều: cha có thể đọc/ghi từng đơn vị qua signal model.
  hours = model<number>(0);
  minutes = model<number>(0);
  seconds = model<number>(0);

  showSeconds = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });

  // Cache hiển thị 2 chữ số — pad-left "0".
  pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  // Bước nhảy ±1, wrap vòng quanh max.
  step(unit: 'h' | 'm' | 's', delta: number) {
    if (this.disabled()) return;
    if (unit === 'h') {
      const next = (this.hours() + delta + 24) % 24;
      this.hours.set(next);
    } else if (unit === 'm') {
      const next = (this.minutes() + delta + 60) % 60;
      this.minutes.set(next);
    } else {
      const next = (this.seconds() + delta + 60) % 60;
      this.seconds.set(next);
    }
  }

  /**
   * Buffer tích lũy chữ số đang gõ cho từng đơn vị.
   * Được reset khi: focus, commit (2 chữ số / auto-commit), blur.
   */
  private _buf: Record<'h' | 'm' | 's', string> = { h: '', m: '', s: '' };

  private _commitUnit(unit: 'h' | 'm' | 's', num: number) {
    if (unit === 'h') this.hours.set(num);
    else if (unit === 'm') this.minutes.set(num);
    else this.seconds.set(num);
  }

  /**
   * onInput chỉ xử lý các trường hợp không qua keydown:
   * paste, drag-drop, mobile soft-keyboard (không fire keydown).
   */
  onInput(unit: 'h' | 'm' | 's', event: Event) {
    if (this.disabled()) return;
    const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, '');
    if (!raw) {
      this._buf[unit] = '';
      return;
    }
    const max = unit === 'h' ? 23 : 59;
    const num = Math.min(parseInt(raw.slice(-2), 10), max);
    this._commitUnit(unit, num);
    this._buf[unit] = '';
  }

  // Lăn chuột trên input — cuộn lên = tăng.
  onWheel(unit: 'h' | 'm' | 's', event: WheelEvent) {
    if (this.disabled()) return;
    event.preventDefault();
    this._buf[unit] = '';
    this.step(unit, event.deltaY < 0 ? 1 : -1);
  }

  /**
   * Xử lý gõ phím:
   * - Chữ số: buffer 2 ký tự, auto-commit khi đủ hoặc chữ số đầu vượt ngưỡng
   * - Arrow: ±1, reset buffer
   * - Tab/Enter: commit buffer dở (nếu có)
   */
  onKeyDown(unit: 'h' | 'm' | 's', event: KeyboardEvent) {
    if (this.disabled()) return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._buf[unit] = '';
      this.step(unit, 1);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._buf[unit] = '';
      this.step(unit, -1);
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault(); // Ta tự kiểm soát hiển thị
      const max = unit === 'h' ? 23 : 59;
      // Chữ số đầu tối đa để còn có thể nhập chữ số 2 hợp lệ:
      // giờ  → max first digit = 2  (vd '3x' không hợp lệ vì max 23)
      // phút/giây → max first digit = 5
      const maxFirstDigit = unit === 'h' ? 2 : 5;
      const buf = this._buf[unit] + event.key;
      const el = event.target as HTMLInputElement;

      if (buf.length === 1) {
        const d = parseInt(event.key, 10);
        if (d > maxFirstDigit) {
          // Chữ số đầu không thể là hàng chục hợp lệ → commit ngay dạng 0X
          const num = Math.min(d, max);
          this._commitUnit(unit, num);
          el.value = this.pad(num);
          this._buf[unit] = '';
        } else {
          // Chờ chữ số thứ 2 — hiển thị ký tự đơn tạm thời
          this._buf[unit] = event.key;
          el.value = event.key;
        }
      } else {
        // Đã có 2 chữ số → commit
        const num = Math.min(parseInt(buf, 10), max);
        this._commitUnit(unit, num);
        el.value = this.pad(num);
        this._buf[unit] = '';
      }
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      this._buf[unit] = '';
      return; // browser tự xử lý xóa ký tự
    }

    if (event.key === 'Tab' || event.key === 'Enter') {
      // Commit nếu còn buffer chữ số đơn
      if (this._buf[unit]) {
        const max = unit === 'h' ? 23 : 59;
        const num = Math.min(parseInt(this._buf[unit], 10), max);
        this._commitUnit(unit, num);
        this._buf[unit] = '';
      }
    }
  }

  // Khi blur: commit buffer dở (nếu có) + chuẩn hóa hiển thị.
  onBlur(unit: 'h' | 'm' | 's', event: FocusEvent) {
    if (this._buf[unit]) {
      const max = unit === 'h' ? 23 : 59;
      const num = Math.min(parseInt(this._buf[unit], 10), max);
      this._commitUnit(unit, num);
      this._buf[unit] = '';
    }
    const el = event.target as HTMLInputElement;
    if (unit === 'h') el.value = this.pad(this.hours());
    else if (unit === 'm') el.value = this.pad(this.minutes());
    else el.value = this.pad(this.seconds());
  }

  // Chọn toàn bộ text khi focus + reset buffer.
  onFocus(unit: 'h' | 'm' | 's', event: FocusEvent) {
    this._buf[unit] = '';
    (event.target as HTMLInputElement).select();
  }
}
