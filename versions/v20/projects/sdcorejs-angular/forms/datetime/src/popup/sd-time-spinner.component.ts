import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

/**
 * Time spinner â€” UI chá»n giá»/phÃºt/(giÃ¢y) compact, modern.
 *
 *  - Format 24h
 *  - Máº·c Ä‘á»‹nh hiá»ƒn thá»‹ HH:MM, báº­t `showSeconds` Ä‘á»ƒ hiá»‡n thÃªm cá»™t giÃ¢y
 *  - Há»— trá»£: click â–²â–¼, gÃµ trá»±c tiáº¿p, lÄƒn chuá»™t, mÅ©i tÃªn bÃ n phÃ­m
 *  - Wrap vÃ²ng (23 â†’ â–² â†’ 00)
 */
@Component({
  selector: 'sd-time-spinner',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './sd-time-spinner.component.html',
  styleUrls: ['./sd-time-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdTimeSpinner {
  // Hai-chiá»u: cha cÃ³ thá»ƒ Ä‘á»c/ghi tá»«ng Ä‘Æ¡n vá»‹ qua signal model.
  hours = model<number>(0);
  minutes = model<number>(0);
  seconds = model<number>(0);

  showSeconds = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });

  // Cache hiá»ƒn thá»‹ 2 chá»¯ sá»‘ â€” pad-left "0".
  pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  // BÆ°á»›c nháº£y Â±1, wrap vÃ²ng quanh max.
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
   * Buffer tÃ­ch lÅ©y chá»¯ sá»‘ Ä‘ang gÃµ cho tá»«ng Ä‘Æ¡n vá»‹.
   * ÄÆ°á»£c reset khi: focus, commit (2 chá»¯ sá»‘ / auto-commit), blur.
   */
  private _buf: Record<'h' | 'm' | 's', string> = { h: '', m: '', s: '' };

  private _commitUnit(unit: 'h' | 'm' | 's', num: number) {
    if (unit === 'h') this.hours.set(num);
    else if (unit === 'm') this.minutes.set(num);
    else this.seconds.set(num);
  }

  /**
   * onInput chá»‰ xá»­ lÃ½ cÃ¡c trÆ°á»ng há»£p khÃ´ng qua keydown:
   * paste, drag-drop, mobile soft-keyboard (khÃ´ng fire keydown).
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

  // LÄƒn chuá»™t trÃªn input â€” cuá»™n lÃªn = tÄƒng.
  onWheel(unit: 'h' | 'm' | 's', event: WheelEvent) {
    if (this.disabled()) return;
    event.preventDefault();
    this._buf[unit] = '';
    this.step(unit, event.deltaY < 0 ? 1 : -1);
  }

  /**
   * Xá»­ lÃ½ gÃµ phÃ­m:
   * - Chá»¯ sá»‘: buffer 2 kÃ½ tá»±, auto-commit khi Ä‘á»§ hoáº·c chá»¯ sá»‘ Ä‘áº§u vÆ°á»£t ngÆ°á»¡ng
   * - Arrow: Â±1, reset buffer
   * - Tab/Enter: commit buffer dá»Ÿ (náº¿u cÃ³)
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
      event.preventDefault(); // Ta tá»± kiá»ƒm soÃ¡t hiá»ƒn thá»‹
      const max = unit === 'h' ? 23 : 59;
      // Chá»¯ sá»‘ Ä‘áº§u tá»‘i Ä‘a Ä‘á»ƒ cÃ²n cÃ³ thá»ƒ nháº­p chá»¯ sá»‘ 2 há»£p lá»‡:
      // giá»  â†’ max first digit = 2  (vd '3x' khÃ´ng há»£p lá»‡ vÃ¬ max 23)
      // phÃºt/giÃ¢y â†’ max first digit = 5
      const maxFirstDigit = unit === 'h' ? 2 : 5;
      const buf = this._buf[unit] + event.key;
      const el = event.target as HTMLInputElement;

      if (buf.length === 1) {
        const d = parseInt(event.key, 10);
        if (d > maxFirstDigit) {
          // Chá»¯ sá»‘ Ä‘áº§u khÃ´ng thá»ƒ lÃ  hÃ ng chá»¥c há»£p lá»‡ â†’ commit ngay dáº¡ng 0X
          const num = Math.min(d, max);
          this._commitUnit(unit, num);
          el.value = this.pad(num);
          this._buf[unit] = '';
        } else {
          // Chá» chá»¯ sá»‘ thá»© 2 â€” hiá»ƒn thá»‹ kÃ½ tá»± Ä‘Æ¡n táº¡m thá»i
          this._buf[unit] = event.key;
          el.value = event.key;
        }
      } else {
        // ÄÃ£ cÃ³ 2 chá»¯ sá»‘ â†’ commit
        const num = Math.min(parseInt(buf, 10), max);
        this._commitUnit(unit, num);
        el.value = this.pad(num);
        this._buf[unit] = '';
      }
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      this._buf[unit] = '';
      return; // browser tá»± xá»­ lÃ½ xÃ³a kÃ½ tá»±
    }

    if (event.key === 'Tab' || event.key === 'Enter') {
      // Commit náº¿u cÃ²n buffer chá»¯ sá»‘ Ä‘Æ¡n
      if (this._buf[unit]) {
        const max = unit === 'h' ? 23 : 59;
        const num = Math.min(parseInt(this._buf[unit], 10), max);
        this._commitUnit(unit, num);
        this._buf[unit] = '';
      }
    }
  }

  // Khi blur: commit buffer dá»Ÿ (náº¿u cÃ³) + chuáº©n hÃ³a hiá»ƒn thá»‹.
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

  // Chá»n toÃ n bá»™ text khi focus + reset buffer.
  onFocus(unit: 'h' | 'm' | 's', event: FocusEvent) {
    this._buf[unit] = '';
    (event.target as HTMLInputElement).select();
  }
}

