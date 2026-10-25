import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdChip } from './chip.component';

// Design handoff (design-icon-chip-table) · CH2: the input experience B1–B7 and the minCount / maxCount names (D3),
// through real typing, keys, blur, paste and clicks.

describe('SdChip · design handoff CH2', () => {
  let fixture: ComponentFixture<SdChip>;
  let comp: SdChip;
  let modelChanges: unknown[];
  let changes: unknown[];
  let outside: HTMLButtonElement;

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
  const chipTexts = () => rows().map(row => row.querySelector('.sd-chip__chip-text')?.textContent?.trim());
  const input = (): HTMLInputElement => host().querySelector('input.sd-chip-input')!;
  const live = (): string => host().querySelector('.sd-chip__live')?.textContent?.trim() ?? '';
  const matError = (): string | null => host().querySelector('mat-error')?.textContent?.trim() ?? null;
  const press = (target: Element, key: string, keyCode: number) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    Object.defineProperty(event, 'keyCode', { get: () => keyCode });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  const type = (text: string) => {
    const el = input();
    el.focus();
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };
  const enter = () => press(input(), 'Enter', 13);
  const paste = (text: string) => {
    const data = new DataTransfer();
    data.setData('text/plain', text);
    const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
    input().focus();
    input().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [SdChip, NoopAnimationsModule] }).compileComponents();
    outside = document.createElement('button');
    document.body.appendChild(outside);
  });
  afterEach(() => outside.remove());

  describe('B1 · addOnBlur', () => {
    it('adds the typed text as a chip when the field loses focus', fakeAsync(() => {
      create();
      type('alpha');
      outside.focus();
      tick(200);
      fixture.detectChanges();
      expect(modelChanges).toEqual([['alpha']]);
      expect(input().value).toBe('');
    }));

    it('drops the typed text on blur with [addOnBlur]="false", as before', fakeAsync(() => {
      create({ addOnBlur: false });
      type('alpha');
      outside.focus();
      tick(200);
      fixture.detectChanges();
      expect(modelChanges).toEqual([]);
      expect(input().value).toBe('');
    }));

    it('keeps the typed text when the input gets focus again', () => {
      create();
      type('al');
      input().dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      expect(input().value).toBe('al');
    });
  });

  describe('B2 · paste a list', () => {
    it('adds every value of a pasted list in one change', () => {
      create();
      const event = paste('a, b\nc');
      expect(event.defaultPrevented).toBeTrue();
      expect(modelChanges).toEqual([['a', 'b', 'c']]);
      expect(changes.length).toBe(1);
      expect(live()).toBe('Đã thêm 3');
    });

    it('skips duplicates and says how many', () => {
      create({ model: ['a'] });
      paste('a, b\nb\tc');
      expect(modelChanges).toEqual([['a', 'b', 'c']]);
      expect(live()).toBe('Đã thêm 2 · bỏ 2 trùng');
    });

    it('keeps the values the validator refuses in the input, with the error', () => {
      create({ chipValidator: (value: string | number) => (String(value).includes('@') ? null : 'Email không hợp lệ') });
      paste('an@x.vn, abc');
      expect(modelChanges).toEqual([['an@x.vn']]);
      expect(input().value).toBe('abc');
      expect(matError()).toBe('Email không hợp lệ');
    });

    it('leaves a paste without separators to the browser', () => {
      create();
      const event = paste('single');
      expect(event.defaultPrevented).toBeFalse();
      expect(modelChanges).toEqual([]);
    });
  });

  describe('B3 · duplicates, limit, addable', () => {
    it('flashes the chip that already exists, says so and clears the text', () => {
      create({ model: ['a', 'b'] });
      type('a');
      enter();
      expect(modelChanges).toEqual([]);
      expect(rows()[0].classList).toContain('sd-chip__chip--duplicate');
      expect(live()).toBe('“a” đã có');
      expect(input().value).toBe('');
    });

    it('stops adding at maxCount and says the field is full', () => {
      create({ model: ['a', 'b'], maxCount: 2 });
      type('c');
      enter();
      expect(modelChanges).toEqual([]);
      expect(live()).toBe('Đã đủ 2 giá trị');
      expect(input().getAttribute('placeholder')).toBe('Đã đủ 2 giá trị');
    });

    it('shows a counter n/max', () => {
      create({ model: ['a'], maxCount: 3 });
      expect(host().querySelector('.sd-chip__counter')?.textContent?.trim()).toBe('1/3');
    });

    it('addable false: the input cannot be typed into or tabbed to', () => {
      create({ addable: false, model: ['a'] });
      expect(input().readOnly).toBeTrue();
      expect(input().getAttribute('tabindex')).toBe('-1');
      expect(input().getAttribute('placeholder')).toBeNull();
    });

    it('says a locked chip cannot be removed when Backspace reaches it', () => {
      create({ model: ['locked'], removable: () => false });
      press(input(), 'Backspace', 8);
      press(document.activeElement!, 'Backspace', 8);
      expect(modelChanges).toEqual([]);
      expect(live()).toBe('Không xoá được');
    });
  });

  describe('B4 · chipTransform and chipValidator', () => {
    const lower = (raw: string) => raw.trim().toLowerCase();

    it('normalises with chipTransform before comparing and storing', () => {
      create({ model: ['an@x.vn'], chipTransform: lower });
      type(' AN@X.VN ');
      enter();
      expect(modelChanges).toEqual([]);
      type('Binh@X.vn');
      enter();
      expect(modelChanges).toEqual([['an@x.vn', 'binh@x.vn']]);
    });

    it('drops a value when chipTransform returns null', () => {
      create({ chipTransform: () => null });
      type('x');
      enter();
      expect(modelChanges).toEqual([]);
    });

    it('keeps a refused value in the input and shows the error under the field', () => {
      create({ chipValidator: (value: string | number) => (value === 'abc' ? 'Sai định dạng' : null) });
      type('abc');
      enter();
      expect(modelChanges).toEqual([]);
      expect(input().value).toBe('abc');
      expect(matError()).toBe('Sai định dạng');
      expect(input().getAttribute('aria-invalid')).toBe('true');
    });

    it('translates an i18n key returned by chipValidator', () => {
      create({ chipValidator: () => 'core.form.chip.required' });
      type('x');
      enter();
      expect(matError()).toBe('Vui lòng nhập thông tin');
    });

    it('clears the error once the text changes', () => {
      create({ chipValidator: (value: string | number) => (value === 'abc' ? 'Sai định dạng' : null) });
      type('abc');
      enter();
      type('ab');
      expect(matError()).toBeNull();
    });
  });

  describe('B5 · placeholder', () => {
    it('uses the default placeholder, never the label', () => {
      create({ placeholder: undefined });
      expect(input().getAttribute('placeholder')).toBe('Nhập rồi nhấn Enter');
    });

    it('keeps the placeholder of the consumer', () => {
      create({ placeholder: 'Thêm tag' });
      expect(input().getAttribute('placeholder')).toBe('Thêm tag');
    });
  });

  describe('separators', () => {
    it('commits on the keys of separators only', () => {
      create({ separators: ['Enter', ';'] });
      type('x');
      press(input(), ';', 186);
      expect(modelChanges).toEqual([['x']]);
      type('y');
      press(input(), ',', 188);
      expect(modelChanges.length).toBe(1);
    });

    it('commits on comma by default', () => {
      create();
      type('x');
      const event = press(input(), ',', 188);
      expect(event.defaultPrevented).toBeTrue();
      expect(modelChanges).toEqual([['x']]);
    });
  });

  describe('B6 · clearable', () => {
    it('removes the removable chips in one change and keeps the locked ones', () => {
      create({ model: ['a', 'locked', 'b'], removable: (value: string) => value !== 'locked', clearable: true });
      const clear = host().querySelector('.sd-chip__clear') as HTMLButtonElement;
      expect(clear.getAttribute('aria-label')).toBe('Xoá tất cả');
      clear.click();
      fixture.detectChanges();
      expect(modelChanges).toEqual([['locked']]);
      expect(changes.length).toBe(1);
    });

    it('moves focus to the input, since the button hides once nothing is left to clear', fakeAsync(() => {
      create({ model: ['a', 'b'], clearable: true });
      const clear = host().querySelector('.sd-chip__clear') as HTMLButtonElement;
      clear.focus();
      clear.click();
      tick(100);
      fixture.detectChanges();
      expect(document.activeElement).toBe(input());
    }));

    it('keeps its place while there is nothing to clear', () => {
      create({ model: [], clearable: true });
      const clear = host().querySelector('.sd-chip__clear') as HTMLElement;
      expect(clear).not.toBeNull();
      expect(getComputedStyle(clear).visibility).toBe('hidden');
    });

    it('is not offered when required or disabled', () => {
      create({ model: ['a'], clearable: true, required: true });
      expect(host().querySelector('.sd-chip__clear')).toBeNull();
      fixture.componentRef.setInput('required', false);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(host().querySelector('.sd-chip__clear')).toBeNull();
    });
  });

  describe('B7 · maxVisible', () => {
    it('folds the chips past maxVisible into “+N” while the field is not focused', () => {
      create({ model: ['a', 'b', 'c', 'd'], maxVisible: 2 });
      expect(chipTexts()).toEqual(['a', 'b']);
      const more = host().querySelector('.sd-chip__more')!;
      expect(more.textContent?.trim()).toBe('+2');
      expect(more.getAttribute('aria-label')).toBe('Xem thêm 2');
    });

    it('shows every chip while the field has focus', () => {
      create({ model: ['a', 'b', 'c', 'd'], maxVisible: 2 });
      input().focus();
      fixture.detectChanges();
      expect(chipTexts()).toEqual(['a', 'b', 'c', 'd']);
      expect(host().querySelector('.sd-chip__more')).toBeNull();
    });

    it('“+N” moves focus to the input, where every chip shows', fakeAsync(() => {
      create({ model: ['a', 'b', 'c', 'd'], maxVisible: 2 });
      (host().querySelector('.sd-chip__more') as HTMLButtonElement).click();
      tick(100);
      fixture.detectChanges();
      expect(document.activeElement).toBe(input());
      expect(chipTexts().length).toBe(4);
    }));

    it('caps the chip text at 240px', () => {
      create({ model: ['x'.repeat(80)] });
      expect(getComputedStyle(host().querySelector('.sd-chip__chip-text')!).maxWidth).toBe('240px');
    });
  });

  describe('D3 · minCount / maxCount', () => {
    it('minCount and maxCount add the length validators', () => {
      create({ minCount: 2, maxCount: 3 });
      comp.formControl.setValue(['a']);
      expect(comp.formControl.hasError('minlength')).toBeTrue();
      comp.formControl.setValue(['a', 'b', 'c', 'd']);
      expect(comp.formControl.hasError('maxlength')).toBeTrue();
    });

    it('minCount wins when min is set too', () => {
      create({ min: 1, minCount: 3 });
      comp.formControl.setValue(['a', 'b']);
      expect(comp.formControl.getError('minlength')?.requiredLength).toBe(3);
    });

    it('min / max still work and warn once per instance in dev mode', () => {
      const warn = spyOn(console, 'warn');
      create({ min: 2 });
      fixture.componentRef.setInput('min', 3);
      fixture.detectChanges();
      comp.formControl.setValue(['a']);
      expect(comp.formControl.hasError('minlength')).toBeTrue();
      const deprecations = warn.calls.allArgs().filter(args => String(args[0]).startsWith('[sd-chip]'));
      expect(deprecations).toEqual([['[sd-chip] `min` / `max` are deprecated; use `minCount` / `maxCount`.']]);
    });
  });
});
