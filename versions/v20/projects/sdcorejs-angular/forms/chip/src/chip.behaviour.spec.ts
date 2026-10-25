import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdChip } from './chip.component';

// Design handoff (design-icon-chip-table) · CH1: A1–A8 through real keyboard, blur and submit, not through
// `onAdd` / `onRemove` with fake events (D4).

describe('SdChip · design handoff CH1', () => {
  let fixture: ComponentFixture<SdChip>;
  let comp: SdChip;
  let modelChanges: unknown[];
  let changes: unknown[];

  const create = (inputs: Record<string, unknown> = {}) => {
    fixture = TestBed.createComponent(SdChip);
    comp = fixture.componentInstance;
    modelChanges = [];
    changes = [];
    comp.model.subscribe(value => modelChanges.push(value));
    comp.sdChange.subscribe(value => changes.push(value));
    fixture.componentRef.setInput('label', 'Tags');
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
  };
  const host = (): HTMLElement => fixture.nativeElement;
  const rows = (): HTMLElement[] => Array.from(host().querySelectorAll('mat-chip-row'));
  // why: textContent of the row also holds the icon ligature (“close”); read the chip text alone.
  const chipTexts = () => rows().map(row => row.querySelector('.sd-chip__chip-text')?.textContent?.trim());
  const input = (): HTMLInputElement => host().querySelector('input.sd-chip-input')!;
  const press = (target: Element, key: string, keyCode: number) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    Object.defineProperty(event, 'keyCode', { get: () => keyCode });
    target.dispatchEvent(event);
  };
  const type = (text: string) => {
    const el = input();
    el.focus();
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [SdChip, NoopAnimationsModule] }).compileComponents();
  });

  describe('A1 · removable predicate on every path', () => {
    const keepLocked = (value: string) => value !== 'locked';

    beforeEach(() => create({ model: ['alpha', 'locked'], removable: keepLocked }));

    it('ignores Delete on a chip the predicate keeps', () => {
      press(rows()[1], 'Delete', 46);
      fixture.detectChanges();
      expect(modelChanges).toEqual([]);
      expect(changes).toEqual([]);
      expect(rows().length).toBe(2);
    });

    it('ignores Backspace twice from the empty input when the last chip is locked', () => {
      press(input(), 'Backspace', 8);
      fixture.detectChanges();
      // why: the first Backspace must have moved focus to the last chip, or the second one proves nothing.
      expect(rows()[1].contains(document.activeElement)).withContext('focus on the last chip').toBeTrue();
      press(document.activeElement!, 'Backspace', 8);
      fixture.detectChanges();
      expect(modelChanges).toEqual([]);
      expect(rows().length).toBe(2);
    });

    it('still removes a chip the predicate allows with Delete', () => {
      press(rows()[0], 'Delete', 46);
      fixture.detectChanges();
      expect(modelChanges).toEqual([['locked']]);
    });

    it('does not remove a kept chip through onRemove either', () => {
      comp.onRemove('locked');
      expect(modelChanges).toEqual([]);
      expect(changes).toEqual([]);
    });
  });

  describe('A2 · which items become chips', () => {
    it('renders a chip for the number 0', () => {
      create({ model: [0] });
      expect(chipTexts()).toEqual(['0']);
    });

    it('skips null, undefined and the empty string only', () => {
      create({ model: ['a', null, undefined, '', 0, 'b'] });
      expect(chipTexts()).toEqual(['a', '0', 'b']);
    });

    it('keeps the DOM node of the chips after the one removed', () => {
      create({ model: ['a', 'b', 'c'] });
      const cRow = rows()[2];
      comp.onRemove('a');
      fixture.detectChanges();
      expect(rows()[1]).toBe(cRow);
    });
  });

  describe('A3 · duplicates ignore the type', () => {
    it('does not add "1" typed when the model holds the number 1', () => {
      create({ model: [1, 2] });
      type('1');
      press(input(), 'Enter', 13);
      fixture.detectChanges();
      expect(modelChanges).toEqual([]);
      expect(comp.formControl.value).toEqual([1, 2]);
    });

    it('adds a value typed and confirmed with Enter', () => {
      create({ model: [1, 2] });
      type('gamma');
      press(input(), 'Enter', 13);
      fixture.detectChanges();
      expect(modelChanges).toEqual([[1, 2, 'gamma']]);
    });
  });

  describe('A4 · a null model clears the chips', () => {
    for (const empty of [null, undefined]) {
      it(`model ${empty} → formControl value [] and no chip`, () => {
        create({ model: ['a', 'b'] });
        fixture.componentRef.setInput('model', empty);
        fixture.detectChanges();
        expect(comp.formControl.value).toEqual([]);
        expect(rows().length).toBe(0);
      });
    }
  });

  describe('A5 · one error gate', () => {
    it('shows no error and no aria-invalid while a required field is untouched', () => {
      create({ required: true });
      expect(host().querySelector('mat-error')).toBeNull();
      expect(host().querySelector('.mat-form-field-invalid')).toBeNull();
      expect(input().getAttribute('aria-invalid')).not.toBe('true');
    });

    it('shows no error while the field is only dirty', () => {
      create({ required: true });
      comp.formControl.markAsDirty();
      fixture.detectChanges();
      expect(comp.matcher.isErrorState(null, null)).toBeFalse();
      expect(host().querySelector('.mat-form-field-invalid')).toBeNull();
    });

    it('shows the message, the outline and aria-invalid together once touched', () => {
      create({ required: true });
      comp.formControl.markAsTouched();
      fixture.detectChanges();
      expect(host().querySelector('mat-error')?.textContent?.trim()).toBe('Vui lòng nhập thông tin');
      expect(host().querySelector('.mat-form-field-invalid')).not.toBeNull();
      expect(input().getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('A6 · the remove button has a name', () => {
    it('names the ✕ "Xoá {value}" and uses the close icon', () => {
      create({ model: ['alpha'] });
      const remove = rows()[0].querySelector('[matChipRemove]')!;
      expect(remove.getAttribute('aria-label')).toBe('Xoá alpha');
      expect(remove.getAttribute('aria-hidden')).toBeNull();
      expect(remove.getAttribute('name')).toBe('close');
    });
  });

  describe('A7 · the wrapper is layout only', () => {
    it('keeps the wrapper out of the tab order and without a role when there is no sdViewDef', () => {
      create();
      const wrapper = host().querySelector(':scope > div') as HTMLElement;
      expect(wrapper).not.toBeNull();
      expect(wrapper.hasAttribute('tabindex')).toBeFalse();
      expect(wrapper.hasAttribute('role')).toBeFalse();
    });
  });

  describe('A8 · hidden error is tied to the input', () => {
    it('hideInlineError: aria-describedby of the input points at the hidden error text', () => {
      create({ required: true, hideInlineError: true });
      comp.formControl.markAsTouched();
      fixture.detectChanges();
      // why: chỉ đếm chữ lỗi ẩn trong suffix; vùng aria-live (CH2) cũng là sd-visually-hidden.
      const hidden = host().querySelectorAll('.sd-chip__error-suffix .sd-visually-hidden');
      expect(hidden.length).withContext('one hidden error text').toBe(1);
      const id = hidden[0].getAttribute('id');
      expect(id).toBeTruthy();
      expect((input().getAttribute('aria-describedby') ?? '').split(' ')).toContain(id!);
      expect(host().querySelectorAll('.sd-error-icon').length).withContext('one error icon').toBe(1);
    });

    it('inline error: aria-describedby of the input points at mat-error', () => {
      create({ required: true });
      comp.formControl.markAsTouched();
      fixture.detectChanges();
      const id = host().querySelector('mat-error')!.getAttribute('id');
      expect(id).toBeTruthy();
      expect((input().getAttribute('aria-describedby') ?? '').split(' ')).toContain(id!);
    });
  });

  // why: `mat-chip-grid` là ControlValueAccessor; khi blur nó hoãn một `setTimeout` rồi ghi text của các chip đang
  // render vào control (số thành chuỗi) và đè lên reset vừa xảy ra. Tìm ra khi thử “form reset về null” trên showcase.
  describe('the chip grid never writes back into the control', () => {
    let outside: HTMLButtonElement;

    beforeEach(() => {
      outside = document.createElement('button');
      document.body.appendChild(outside);
    });
    afterEach(() => outside.remove());

    it('keeps number items after the field loses focus', fakeAsync(() => {
      create({ model: [1, 2] });
      input().focus();
      outside.focus();
      tick(200);
      fixture.detectChanges();
      expect(comp.formControl.value).toEqual([1, 2]);
      expect(modelChanges).toEqual([]);
    }));

    it('keeps a form reset made while the input still had focus', fakeAsync(() => {
      create({ model: ['a', 'b'] });
      input().focus();
      outside.focus();
      comp.formControl.reset();
      tick(200);
      expect(comp.formControl.value).toBeNull();
      expect(comp.formControl.touched).toBeFalse();
    }));

    it('marks the field touched once focus leaves it', fakeAsync(() => {
      create({ model: ['a'] });
      input().focus();
      outside.focus();
      tick(200);
      expect(comp.formControl.touched).toBeTrue();
    }));

    it('does not mark the field touched while focus moves from the input to a chip', fakeAsync(() => {
      create({ model: ['a'] });
      input().focus();
      press(input(), 'Backspace', 8);
      tick(200);
      expect(rows()[0].contains(document.activeElement)).withContext('focus on the chip').toBeTrue();
      expect(comp.formControl.touched).toBeFalse();
    }));
  });
});

@Component({
  imports: [SdChip, FormsModule],
  template: `<form #f="ngForm"><sd-chip name="tags" label="Tags" [form]="f" required /></form>`,
})
class SubmitHost {
  @ViewChild('f') ngForm!: NgForm;
}

describe('SdChip · design handoff CH1 · submit', () => {
  it('A5 · shows the message, the outline and aria-invalid after a submit without touching the field', async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [SubmitHost, NoopAnimationsModule] }).compileComponents();
    const fixture = TestBed.createComponent(SubmitHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.componentInstance.ngForm.onSubmit(new Event('submit'));
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('mat-error')?.textContent?.trim()).withContext('mat-error').toBe('Vui lòng nhập thông tin');
    expect(el.querySelector('.mat-form-field-invalid')).withContext('outline').not.toBeNull();
    expect(el.querySelector('input')!.getAttribute('aria-invalid')).toBe('true');
  });
});

@Component({
  imports: [SdChip, SdViewDefDirective],
  template: `<sd-chip label="Tags" [model]="model" [disabled]="disabled">
    <ng-template sdViewDef let-value="value"
      ><span class="view-face">{{ value?.length }} tags</span></ng-template
    >
  </sd-chip>`,
})
class ViewDefHost {
  model: string[] = ['a', 'b'];
  disabled = false;
}

describe('SdChip · design handoff CH1 · sdViewDef trigger (A7)', () => {
  let fixture: ComponentFixture<ViewDefHost>;
  const trigger = (): HTMLElement | null => fixture.nativeElement.querySelector('.sd-chip__view-trigger');

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [ViewDefHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(ViewDefHost);
    fixture.detectChanges();
  });

  it('puts role="button" and tabindex="0" on the view face, not on the wrapper', () => {
    expect(trigger()?.getAttribute('role')).toBe('button');
    expect(trigger()?.getAttribute('tabindex')).toBe('0');
    expect(trigger()?.querySelector('.view-face')).not.toBeNull();
  });

  for (const [key, keyCode] of [
    ['Enter', 13],
    [' ', 32],
  ] as const) {
    it(`opens the editor with ${key === ' ' ? 'Space' : key}`, fakeAsync(() => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      Object.defineProperty(event, 'keyCode', { get: () => keyCode });
      trigger()!.dispatchEvent(event);
      fixture.detectChanges();
      tick(100);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input.sd-chip-input')).not.toBeNull();
      expect(event.defaultPrevented).toBeTrue();
    }));
  }

  it('takes the view face out of the tab order when disabled', () => {
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    expect(trigger()?.hasAttribute('tabindex')).toBeFalse();
    expect(trigger()?.getAttribute('aria-disabled')).toBe('true');
  });
});
