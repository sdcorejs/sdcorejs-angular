import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdDatetime } from './datetime.component';

// Ô nhập ghi chuỗi đang gõ vào control sau MỖI phím. Chuỗi chưa gõ xong (kể cả ô vừa bị xoá trắng) không được
// đổi `model` hay phát `sdChange`: giá trị chỉ đổi khi chuỗi thành một thời điểm đủ format, và chỉ về null khi
// người dùng chốt bỏ nó (rời ô / Enter trên ô trống, nút xoá). Mọi spec bắn sự kiện DOM thật.

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdDatetime],
  template: `<sd-datetime
    name="at"
    [form]="fg"
    [showSeconds]="showSeconds"
    [transform]="transform"
    [model]="model"
    (modelChange)="model = $event"
    (sdChange)="changes.push($event)"></sd-datetime>`,
})
class TypingHost {
  fg = new FormGroup({});
  showSeconds = false;
  transform: 'ISOString' | undefined;
  model: string | null | undefined = '2026/11/19 10:30:00';
  changes: unknown[] = [];
}

describe('SdDatetime (typing never commits an unfinished datetime)', () => {
  let fixture: ComponentFixture<TypingHost>;
  let host: TypingHost;
  let comp: SdDatetime;
  let input: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TypingHost, NoopAnimationsModule] });
    fixture = TestBed.createComponent(TypingHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDatetime).componentInstance as SdDatetime;
    input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    host.changes.length = 0;
    input.dispatchEvent(new Event('focus'));
  });

  // ----- bàn phím giả lập: sửa đúng tại con trỏ như trình duyệt, rồi bắn `input` -----
  const fire = (inputType: string) => {
    input.dispatchEvent(new InputEvent('input', { inputType, bubbles: true }));
    fixture.detectChanges();
  };

  const select = (start: number, end = start) => input.setSelectionRange(start, end);

  const typeChar = (char: string) => {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    input.value = input.value.slice(0, start) + char + input.value.slice(end);
    input.setSelectionRange(start + 1, start + 1);
    fire('insertText');
  };

  const type = (text: string) => [...text].forEach(typeChar);

  const backspace = () => {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    input.value = input.value.slice(0, from) + input.value.slice(end);
    input.setSelectionRange(from, from);
    fire('deleteContentBackward');
  };

  const pressEnter = () => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
  };

  const blur = () => {
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };

  const expectNothingCommitted = () => {
    expect(host.model).toBe('2026/11/19 10:30:00');
    expect(host.changes).toEqual([]);
  };

  it('starts from the bound datetime', () => {
    expect(input.value).toBe('19/11/2026 10:30');
    expectNothingCommitted();
  });

  describe('editing in place', () => {
    it('month: the one-digit month in between is not read as January', () => {
      select(5);
      backspace();
      expect(input.value).toBe('19/1/2026 10:30');
      expectNothingCommitted();

      typeChar('0');
      expect(input.value).toBe('19/10/2026 10:30');
      expect(host.model).toBe('2026/10/19 10:30:00');
      expect(host.changes).toEqual(['2026/10/19 10:30:00']);

      blur();

      expect(input.value).toBe('19/10/2026 10:30');
      expect(host.changes).toEqual(['2026/10/19 10:30:00']);
    });

    it('hour: the one-digit hour in between is not read as 01:30', () => {
      select(13);
      backspace();
      expect(input.value).toBe('19/11/2026 1:30');
      expectNothingCommitted();

      typeChar('5');
      expect(input.value).toBe('19/11/2026 15:30');
      expect(host.changes).toEqual(['2026/11/19 15:30:00']);
    });

    it('year: a three-digit year in between is not read as year 202', () => {
      select(10);
      backspace();
      expect(input.value).toBe('19/11/202 10:30');
      expectNothingCommitted();

      typeChar('7');
      expect(host.changes).toEqual(['2027/11/19 10:30:00']);
    });

    it('minute: typing over the minutes commits once, at the second digit', () => {
      select(14, 16);
      typeChar('4');
      expect(input.value).toBe('19/11/2026 10:4');
      expectNothingCommitted();

      typeChar('5');
      expect(host.changes).toEqual(['2026/11/19 10:45:00']);
    });

    it('retyping the same datetime emits nothing', () => {
      select(16);
      backspace();
      typeChar('0');
      blur();

      expect(input.value).toBe('19/11/2026 10:30');
      expectNothingCommitted();
    });
  });

  describe('unfinished text', () => {
    const cutToPartial = () => {
      select(4, input.value.length);
      backspace();
      expect(input.value).toBe('19/1');
    };

    it('keeps the value while the field has focus', () => {
      cutToPartial();

      expectNothingCommitted();
    });

    it('Enter keeps the value and the text, and reports the format error', () => {
      cutToPartial();

      pressEnter();

      expect(input.value).toBe('19/1');
      expectNothingCommitted();
      expect(comp.formControl.hasError('date')).toBeTrue();
    });

    it('leaving the field keeps the value and reports the format error', () => {
      cutToPartial();

      blur();

      expectNothingCommitted();
      expect(comp.formControl.hasError('date')).toBeTrue();
    });

    it('can be completed afterwards, which clears the error', () => {
      cutToPartial();
      pressEnter();

      type('0/2026 08:15');
      expect(host.changes).toEqual(['2026/10/19 08:15:00']);

      blur();

      expect(comp.formControl.hasError('date')).toBeFalse();
      expect(host.changes).toEqual(['2026/10/19 08:15:00']);
    });

    it('a shorthand datetime commits on Enter and is rewritten to the display format', () => {
      select(0, input.value.length);
      backspace();
      type('1/2/2027 9:05');
      expectNothingCommitted();

      pressEnter();

      expect(input.value).toBe('01/02/2027 09:05');
      expect(host.model).toBe('2027/02/01 09:05:00');
      expect(host.changes).toEqual(['2027/02/01 09:05:00']);
    });
  });

  describe('emptied field', () => {
    const selectAllAndDelete = () => {
      select(0, input.value.length);
      backspace();
      expect(input.value).toBe('');
    };

    it('keeps the value until the user leaves the field', () => {
      selectAllAndDelete();

      expectNothingCommitted();

      blur();

      expect(host.model).toBeNull();
      expect(host.changes).toEqual([null]);
    });

    it('Enter on the empty field commits the removal', () => {
      selectAllAndDelete();

      pressEnter();

      expect(host.model).toBeNull();
      expect(host.changes).toEqual([null]);
    });

    it('typing a new datetime after emptying never passes through null', () => {
      selectAllAndDelete();
      type('05/01/2027 08:00');

      expect(host.changes).toEqual(['2027/01/05 08:00:00']);

      blur();

      expect(host.model).toBe('2027/01/05 08:00:00');
      expect(host.changes).toEqual(['2027/01/05 08:00:00']);
    });
  });

  describe('showSeconds', () => {
    beforeEach(() => {
      host.showSeconds = true;
      host.model = '2026/11/19 10:30:15';
      fixture.detectChanges();
      host.changes.length = 0;
    });

    it('commits only when the seconds are complete', () => {
      expect(input.value).toBe('19/11/2026 10:30:15');

      select(19);
      backspace();
      expect(input.value).toBe('19/11/2026 10:30:1');
      expect(host.model).toBe('2026/11/19 10:30:15');
      expect(host.changes).toEqual([]);

      typeChar('9');
      expect(host.changes).toEqual(['2026/11/19 10:30:19']);
    });
  });

  describe('transform', () => {
    it('keeps the serialized value while typing and commits the finished datetime', () => {
      host.transform = 'ISOString';
      fixture.detectChanges();
      host.changes.length = 0;
      const before = host.model;

      select(5);
      backspace();
      expect(host.model).toBe(before);
      expect(host.changes).toEqual([]);

      typeChar('0');
      const committed = new Date(2026, 9, 19, 10, 30, 0, 0).toISOString();

      expect(host.model).toBe(committed);
      expect(host.changes).toEqual([committed]);
    });
  });

  describe('other ways to commit', () => {
    it('the picker commits at once', () => {
      comp.onPickerConfirm(new Date(2026, 0, 5, 8, 15));
      fixture.detectChanges();

      expect(input.value).toBe('05/01/2026 08:15');
      expect(host.changes).toEqual(['2026/01/05 08:15:00']);
    });

    it('the picker replaces unfinished text', () => {
      select(4, input.value.length);
      backspace();

      comp.onPickerConfirm(new Date(2026, 0, 5, 8, 15));
      fixture.detectChanges();

      expect(input.value).toBe('05/01/2026 08:15');
      expect(host.changes).toEqual(['2026/01/05 08:15:00']);
    });

    it('the clear button commits null', () => {
      comp.clear(undefined);
      fixture.detectChanges();

      expect(host.model).toBeNull();
      expect(host.changes).toEqual([null]);
    });

    it('an empty string written from code outside typing still clears', () => {
      blur();

      comp.formControl.setValue('');
      fixture.detectChanges();

      expect(host.model).toBeNull();
    });
  });

  describe('starting empty', () => {
    beforeEach(() => {
      host.model = null;
      fixture.detectChanges();
      host.changes.length = 0;
    });

    it('commits only when the datetime is complete', () => {
      type('19/11/2026 10:3');
      expect(host.changes).toEqual([]);
      expect(host.model).toBeNull();

      typeChar('0');

      expect(host.model).toBe('2026/11/19 10:30:00');
      expect(host.changes).toEqual(['2026/11/19 10:30:00']);
    });

    it('leaving unfinished text emits nothing', () => {
      type('19/11');

      blur();

      expect(host.changes).toEqual([]);
    });
  });
});
