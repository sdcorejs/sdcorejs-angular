import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdDate } from './date.component';

// Một ngày đang có chỉ được thay bằng null khi người dùng CHỐT bỏ nó (rời ô trống, Enter trên ô trống, nút xoá).
// Chuỗi đang gõ dở không được chạm vào control, model hay sdChange; chuỗi chưa thành ngày (dở dang, hoặc ngày không
// có trên lịch) được giữ lại trong ô kèm lỗi thay vì bị xoá. Mọi spec ở đây bắn sự kiện DOM thật
// (`input` từng phím, `change`, `blur`) để listener của MatDatepickerInput cùng chạy như trên trình duyệt.

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdDate],
  template: `<sd-date
    name="day"
    [form]="fg"
    [required]="required"
    [viewed]="viewed"
    [transform]="transform"
    [model]="model"
    (modelChange)="model = $event"
    (sdChange)="changes.push($event)"></sd-date>`,
})
class TypingHost {
  fg = new FormGroup({});
  required = false;
  viewed = false;
  transform: 'ISOString' | undefined;
  model: string | null | undefined = '2026/11/19';
  changes: unknown[] = [];
}

describe('SdDate (typing never commits an unfinished date)', () => {
  let fixture: ComponentFixture<TypingHost>;
  let host: TypingHost;
  let comp: SdDate;
  let input: HTMLInputElement;
  let controlValues: (Date | null)[];
  let formValues: unknown[];
  let textAtLastChange: string;

  const findInput = () => {
    input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  };

  beforeEach(() => {
    localStorage.setItem('sd-core.language', 'vi');
    TestBed.configureTestingModule({ imports: [TypingHost, NoopAnimationsModule] });
    fixture = TestBed.createComponent(TypingHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDate).componentInstance as SdDate;
    findInput();

    controlValues = [];
    formValues = [];
    comp.formControl.valueChanges.subscribe(value => controlValues.push(value as Date | null));
    host.fg.valueChanges.subscribe(value => formValues.push((value as Record<string, unknown>)['day']));
    focus();
  });

  // ----- bàn phím giả lập: sửa đúng tại con trỏ như trình duyệt, rồi bắn `input` -----
  function focus(): void {
    input.dispatchEvent(new Event('focus'));
    textAtLastChange = input.value;
  }

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

  /** Trình duyệt chỉ bắn `change` khi chuỗi khác lần chốt trước. */
  const fireChangeIfEdited = () => {
    if (input.value === textAtLastChange) return;
    textAtLastChange = input.value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const pressEnter = () => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fireChangeIfEdited();
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
  };

  const blur = () => {
    fireChangeIfEdited();
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };

  const controlDay = () => {
    const value = comp.formControl.value as Date | null;
    return value ? `${value.getFullYear()}/${value.getMonth() + 1}/${value.getDate()}` : null;
  };

  const expectNothingCommitted = () => {
    expect(controlDay()).toBe('2026/11/19');
    expect((host.fg.value as Record<string, unknown>)['day'] instanceof Date).toBeTrue();
    expect(host.model).toBe('2026/11/19');
    expect(host.changes).toEqual([]);
  };

  it('starts from the bound date', () => {
    expect(input.value).toBe('19/11/2026');
    expectNothingCommitted();
  });

  describe('editing the month in place', () => {
    it('backspace + digit: every intermediate text leaves the value alone, the finished date commits', () => {
      select(5);
      backspace();
      expect(input.value).not.toBe('19/11/2026');
      expectNothingCommitted();

      typeChar('0');
      expect(input.value).toBe('19/10/2026');
      expect(controlDay()).toBe('2026/10/19');
      // Connector đẩy ngày gõ xong ra model ngay, không đợi rời ô.
      expect(host.model).toBe('2026/10/19');
      expect(host.changes).toEqual(['2026/10/19']);

      blur();

      expect(input.value).toBe('19/10/2026');
      expect(host.model).toBe('2026/10/19');
      expect(host.changes).toEqual(['2026/10/19']);
      expect(controlValues).not.toContain(null);
      expect(formValues).not.toContain(null);
    });

    it('select the month and type over it', () => {
      select(3, 5);
      typeChar('1');
      expectNothingCommitted();

      typeChar('0');
      expect(input.value).toBe('19/10/2026');

      blur();

      expect(host.model).toBe('2026/10/19');
      expect(host.changes).toEqual(['2026/10/19']);
      expect(controlValues).not.toContain(null);
    });

    it('Enter commits the finished date without leaving the field', () => {
      select(5);
      backspace();
      typeChar('0');

      pressEnter();

      expect(host.model).toBe('2026/10/19');
      expect(host.changes).toEqual(['2026/10/19']);
      expect(input.value).toBe('19/10/2026');
    });
  });

  describe('retyping the same date', () => {
    it('emits nothing at all', () => {
      select(10);
      backspace();
      expect(input.value).toBe('19/11/202');
      expectNothingCommitted();

      typeChar('6');
      blur();

      expect(input.value).toBe('19/11/2026');
      expectNothingCommitted();
      expect(controlValues).not.toContain(null);
    });
  });

  describe('unfinished text', () => {
    const cutToPartial = () => {
      select(4, 10);
      backspace();
      expect(input.value).toBe('19/1');
    };

    it('keeps the value while the field has focus', () => {
      cutToPartial();

      expectNothingCommitted();
      expect(controlValues).toEqual([]);
      expect(formValues).toEqual([]);
    });

    it('marks the control dirty on the first keystroke', () => {
      expect(comp.formControl.dirty).toBeFalse();

      select(10);
      backspace();

      expect(comp.formControl.dirty).toBeTrue();
    });

    it('reports no error while it is still being typed', () => {
      cutToPartial();

      expect(comp.formControl.hasError('date')).toBeFalse();
    });

    it('Enter does not commit it, keeps the text and reports the format error', () => {
      cutToPartial();

      pressEnter();

      expect(input.value).toBe('19/1');
      expectNothingCommitted();
      expect(comp.formControl.errors?.['date']).toBe('Sai định dạng');
    });

    it('leaving the field keeps the text and the value, and reports the format error', () => {
      cutToPartial();

      blur();

      expect(input.value).toBe('19/1');
      expectNothingCommitted();
      expect(comp.formControl.errors?.['date']).toBe('Sai định dạng');
      expect(comp.formControl.touched).toBeTrue();
    });

    it('can still be completed after Enter was pressed on it', () => {
      cutToPartial();
      pressEnter();

      type('0/2026');
      expect(input.value).toBe('19/10/2026');
      blur();

      expect(host.model).toBe('2026/10/19');
      expect(host.changes).toEqual(['2026/10/19']);
    });
  });

  describe('a date that does not exist', () => {
    const typeImpossible = () => {
      select(0, 2);
      type('31');
      select(3, 5);
      type('02');
      expect(input.value).toBe('31/02/2026');
    };

    const errorText = () => (fixture.nativeElement.querySelector('mat-error') as HTMLElement | null)?.textContent?.trim();

    it('is reported as soon as it is typed in full, without changing the value', () => {
      typeImpossible();

      expectNothingCommitted();
      expect(comp.formControl.errors?.['date']).toBe('Ngày không hợp lệ');
    });

    it('stays in the field when the user leaves it: value kept, control and form invalid, message shown', () => {
      typeImpossible();

      blur();

      expect(input.value).toBe('31/02/2026');
      expectNothingCommitted();
      expect(comp.formControl.invalid).toBeTrue();
      expect(host.fg.invalid).toBeTrue();
      expect(errorText()).toBe('Ngày không hợp lệ');
      expect(controlValues).not.toContain(null);
    });

    it('Enter reports it too and commits nothing', () => {
      typeImpossible();

      pressEnter();

      expect(input.value).toBe('31/02/2026');
      expectNothingCommitted();
      expect(comp.formControl.errors?.['date']).toBe('Ngày không hợp lệ');
    });

    it('29/02 is invalid in a common year and valid in a leap year', () => {
      select(0, input.value.length);
      backspace();
      type('29022026');
      blur();
      expect(comp.formControl.errors?.['date']).toBe('Ngày không hợp lệ');
      expectNothingCommitted();

      focus();
      select(10);
      backspace();
      typeChar('8');
      blur();

      expect(comp.formControl.hasError('date')).toBeFalse();
      expect(host.model).toBe('2028/02/29');
      expect(host.changes).toEqual(['2028/02/29']);
    });

    it('correcting the text clears the error and commits the corrected date', () => {
      typeImpossible();
      blur();

      focus();
      select(0, 2);
      type('28');
      expect(input.value).toBe('28/02/2026');
      expect(comp.formControl.hasError('date')).toBeFalse();
      blur();

      expect(host.model).toBe('2026/02/28');
      expect(host.changes).toEqual(['2026/02/28']);
      expect(host.fg.valid).toBeTrue();
      expect(errorText()).toBeUndefined();
    });

    it('survives a later validity recalculation', () => {
      typeImpossible();
      blur();

      comp.formControl.updateValueAndValidity();
      host.required = true;
      fixture.detectChanges();

      expect(comp.formControl.errors?.['date']).toBe('Ngày không hợp lệ');
    });

    it('a calendar pick replaces it and clears the error', () => {
      typeImpossible();
      blur();

      comp.datePicker()!.select(new Date(2026, 0, 5));
      fixture.detectChanges();

      expect(input.value).toBe('05/01/2026');
      expect(comp.formControl.hasError('date')).toBeFalse();
      expect(host.changes).toEqual(['2026/01/05']);
    });

    it('the clear button removes the text, the value and the error', () => {
      typeImpossible();
      blur();

      comp.clear(undefined);
      fixture.detectChanges();

      expect(input.value).toBe('');
      expect(comp.formControl.value).toBeNull();
      expect(comp.formControl.hasError('date')).toBeFalse();
      expect(host.changes).toEqual([null]);
    });

    it('a model reset to null from the parent removes the text and the error', () => {
      typeImpossible();
      blur();

      host.model = null;
      fixture.detectChanges();

      expect(input.value).toBe('');
      expect(comp.formControl.value).toBeNull();
      expect(comp.formControl.hasError('date')).toBeFalse();
      expect(host.changes).toEqual([]);
    });

    it('a new model from the parent replaces it and clears the error', () => {
      typeImpossible();
      blur();

      host.model = '2027/03/04';
      fixture.detectChanges();

      expect(input.value).toBe('04/03/2027');
      expect(comp.formControl.hasError('date')).toBeFalse();
      expect(host.changes).toEqual([]);
    });

    it('emptying the field afterwards and leaving it commits null and clears the error', () => {
      typeImpossible();
      blur();

      focus();
      select(0, input.value.length);
      backspace();
      blur();

      expect(comp.formControl.hasError('date')).toBeFalse();
      expect(host.model).toBeNull();
      expect(host.changes).toEqual([null]);
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

      expect(comp.formControl.value).toBeNull();
      expect(host.model).toBeNull();
      expect(host.changes).toEqual([null]);
    });

    it('Enter on the empty field commits the removal', () => {
      selectAllAndDelete();

      pressEnter();

      expect(comp.formControl.value).toBeNull();
      expect(host.model).toBeNull();
      expect(host.changes).toEqual([null]);
    });

    it('typing a new date after emptying never passes through null', () => {
      selectAllAndDelete();
      type('05012027');
      expect(input.value).toBe('05/01/2027');
      expect(controlDay()).toBe('2027/1/5');
      expect(host.changes).toEqual(['2027/01/05']);

      blur();

      expect(host.model).toBe('2027/01/05');
      expect(host.changes).toEqual(['2027/01/05']);
      expect(controlValues).not.toContain(null);
      expect(formValues).not.toContain(null);
    });
  });

  describe('required', () => {
    beforeEach(() => {
      host.required = true;
      fixture.detectChanges();
    });

    it('does not report required while an existing date is being edited', () => {
      select(4, 10);
      backspace();

      expect(comp.formControl.hasError('required')).toBeFalse();
    });

    it('reports required once the emptied field is left', () => {
      select(0, input.value.length);
      backspace();
      expect(comp.formControl.hasError('required')).toBeFalse();

      blur();

      expect(comp.formControl.hasError('required')).toBeTrue();
    });
  });

  describe('other ways to commit', () => {
    it('a calendar pick commits at once', () => {
      comp.datePicker()!.select(new Date(2026, 0, 5));
      fixture.detectChanges();

      expect(controlDay()).toBe('2026/1/5');
      expect(host.model).toBe('2026/01/05');
      expect(host.changes).toEqual(['2026/01/05']);
      expect(input.value).toBe('05/01/2026');
    });

    it('a calendar pick replaces unfinished text', () => {
      select(4, 10);
      backspace();

      comp.datePicker()!.select(new Date(2026, 0, 5));
      fixture.detectChanges();

      expect(input.value).toBe('05/01/2026');
      expect(host.changes).toEqual(['2026/01/05']);
    });

    it('the clear button commits null', () => {
      comp.clear(undefined);
      fixture.detectChanges();

      expect(comp.formControl.value).toBeNull();
      expect(host.changes).toEqual([null]);
    });

    it('a model reset from the parent wins over unfinished text', () => {
      select(4, 10);
      backspace();

      host.model = null;
      fixture.detectChanges();

      expect(comp.formControl.value).toBeNull();
      expect(host.changes).toEqual([]);
    });
  });

  describe('input re-created by viewed', () => {
    it('still keeps the value while typing after viewed is switched off again', () => {
      host.viewed = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input')).toBeNull();

      host.viewed = false;
      fixture.detectChanges();
      findInput();
      focus();
      expect(input.value).toBe('19/11/2026');

      select(4, 10);
      backspace();

      expectNothingCommitted();
      expect(controlValues).toEqual([]);
    });
  });

  describe('transform', () => {
    it('keeps the serialized form value while typing and commits the finished date', () => {
      host.transform = 'ISOString';
      fixture.detectChanges();
      const iso = (host.fg.value as Record<string, unknown>)['day'];
      expect(typeof iso).toBe('string');
      host.changes.length = 0;
      formValues.length = 0;

      select(5);
      backspace();
      expect((host.fg.value as Record<string, unknown>)['day']).toBe(iso);
      expect(host.changes).toEqual([]);

      typeChar('0');
      fixture.detectChanges();
      const committed = new Date(2026, 9, 19).toISOString();
      expect(host.changes).toEqual([committed]);

      blur();

      expect(host.model).toBe(committed);
      expect((host.fg.value as Record<string, unknown>)['day']).toBe(committed);
      expect(host.changes).toEqual([committed]);
      expect(formValues).not.toContain(null);
    });
  });

  describe('starting empty', () => {
    beforeEach(() => {
      host.model = null;
      fixture.detectChanges();
      host.changes.length = 0;
      controlValues.length = 0;
      focus();
    });

    it('commits only when the date is complete', () => {
      type('1911202');
      expect(input.value).toBe('19/11/202');
      expect(comp.formControl.value).toBeNull();
      expect(controlValues).toEqual([]);

      typeChar('6');
      expect(controlDay()).toBe('2026/11/19');
      expect(host.changes).toEqual(['2026/11/19']);

      blur();

      expect(host.model).toBe('2026/11/19');
      expect(host.changes).toEqual(['2026/11/19']);
    });

    it('leaving unfinished text keeps it with the format error and emits nothing', () => {
      type('1911');

      blur();

      expect(input.value).toBe('19/11/');
      expect(host.changes).toEqual([]);
      expect(comp.formControl.value).toBeNull();
      expect(comp.formControl.errors?.['date']).toBe('Sai định dạng');
    });

    it('a date that does not exist is kept with the invalid-date error and no value', () => {
      type('31022026');

      blur();

      expect(input.value).toBe('31/02/2026');
      expect(host.changes).toEqual([]);
      expect(comp.formControl.value).toBeNull();
      expect(comp.formControl.errors?.['date']).toBe('Ngày không hợp lệ');
      expect(host.fg.invalid).toBeTrue();
    });
  });
});
