import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_FORM_CONFIGURATION } from '@sdcorejs/angular/forms/models';
import { SdInput } from './input.component';
import { queryByCss } from '../../../testing/test-utils';

@Component({
  standalone: true,
  imports: [SdInput, FormsModule, ReactiveFormsModule],
  template: `<sd-input
    [label]="label"
    [placeholder]="placeholder"
    [helperText]="helperText"
    [type]="type"
    [required]="required"
    [disabled]="disabled"
    [readonly]="readonly"
    [maxlength]="maxlength"
    [minlength]="minlength"
    [hideInlineError]="hideInlineError"
    [inlineError]="inlineError"
    [blurOnEnter]="blurOnEnter"
    [pattern]="pattern"
    [patternErrorMessage]="patternErrorMessage"
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-input>`,
})
class HostComponent {
  label?: string;
  placeholder?: string;
  helperText?: string;
  type: 'text' | 'password' | 'number' | 'email' = 'text';
  required = false;
  disabled = false;
  readonly = false;
  maxlength?: number;
  minlength?: number;
  hideInlineError = false;
  inlineError?: string;
  blurOnEnter = false;
  pattern?: any;
  patternErrorMessage?: string;
  model?: any;
  changes: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
}

@Component({
  standalone: true,
  imports: [SdInput],
  template: `<sd-input name="username" [form]="fg"></sd-input>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  standalone: true,
  imports: [SdInput, FormsModule],
  template: `<form #f="ngForm"><sd-input name="username" [form]="f"></sd-input></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

describe('SdInput', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let input: SdInput;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.debugElement.query(el => el.componentInstance instanceof SdInput)
      ?.componentInstance as SdInput;
    if (!input) throw new Error('SdInput not found in fixture');
  });

  describe('creation & rendering', () => {
    it('creates the input', () => {
      expect(input).toBeTruthy();
      expect(fixture.nativeElement.querySelector('input')).not.toBeNull();
    });

    it('renders placeholder on input', () => {
      host.placeholder = 'Nháº­p...';
      fixture.detectChanges();
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      // placeholder fallback: placeholder() || label() || ''
      expect(el.getAttribute('placeholder')).toBe('Nháº­p...');
    });

    it('uses label as fallback placeholder when placeholder is empty', () => {
      host.label = 'Há» tÃªn';
      fixture.detectChanges();
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      expect(el.getAttribute('placeholder')).toBe('Há» tÃªn');
    });
  });

  describe('type', () => {
    it('defaults to text', () => {
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      expect(el.getAttribute('type')).toBe('text');
    });

    it('switches to password', () => {
      host.type = 'password';
      fixture.detectChanges();
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      expect(el.getAttribute('type')).toBe('password');
    });

    it('switches to number', () => {
      host.type = 'number';
      fixture.detectChanges();
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      expect(el.getAttribute('type')).toBe('number');
    });

    it('switches to email', () => {
      host.type = 'email';
      fixture.detectChanges();
      const el = queryByCss<HTMLInputElement>(fixture, 'input');
      expect(el.getAttribute('type')).toBe('email');
    });
  });

  describe('disabled', () => {
    it('disables formControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(input.formControl.disabled).toBe(true);
    });

    it('enables formControl when disabled toggled off', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(input.formControl.disabled).toBe(false);
    });
  });

  describe('required validator', () => {
    it('applies required validator', () => {
      // pre-seed: avoids NG0100 â€” ngAfterViewInit calls detectChanges();
      // a non-empty starting value keeps the control valid during that pass
      host.model = 'seed';
      host.required = true;
      fixture.detectChanges();
      input.formControl.setValue('', { emitEvent: false });
      input.formControl.updateValueAndValidity({ emitEvent: false });
      expect(input.formControl.hasError('required')).toBe(true);
    });

    it('passes validation when value provided', () => {
      host.model = '';
      host.required = true;
      fixture.detectChanges();
      input.formControl.setValue('abc', { emitEvent: false });
      input.formControl.updateValueAndValidity({ emitEvent: false });
      expect(input.formControl.hasError('required')).toBe(false);
    });

    it('removes required validator when required toggled off', () => {
      host.model = '';
      host.required = true;
      fixture.detectChanges();
      host.required = false;
      fixture.detectChanges();
      input.formControl.setValue('', { emitEvent: false });
      input.formControl.updateValueAndValidity({ emitEvent: false });
      expect(input.formControl.hasError('required')).toBe(false);
    });
  });

  describe('maxlength validator', () => {
    it('applies maxLength validator', () => {
      host.maxlength = 3;
      fixture.detectChanges();
      input.formControl.setValue('abcd', { emitEvent: false });
      input.formControl.updateValueAndValidity({ emitEvent: false });
      expect(input.formControl.hasError('maxlength')).toBe(true);
    });

    it('passes when within max length', () => {
      host.maxlength = 5;
      fixture.detectChanges();
      input.formControl.setValue('abc', { emitEvent: false });
      input.formControl.updateValueAndValidity({ emitEvent: false });
      expect(input.formControl.hasError('maxlength')).toBe(false);
    });
  });

  describe('minlength validator', () => {
    it('applies minLength validator', () => {
      host.minlength = 3;
      fixture.detectChanges();
      input.formControl.setValue('ab', { emitEvent: false });
      input.formControl.updateValueAndValidity({ emitEvent: false });
      expect(input.formControl.hasError('minlength')).toBe(true);
    });
  });

  describe('inlineError validator', () => {
    it('sets inlineError on formControl when inlineError is provided', () => {
      host.inlineError = 'Lá»—i';
      fixture.detectChanges();
      input.formControl.updateValueAndValidity();
      expect(input.formControl.hasError('inlineError')).toBe(true);
    });

    it('clears validator when inlineError is empty', () => {
      host.inlineError = 'Lá»—i';
      fixture.detectChanges();
      host.inlineError = '';
      fixture.detectChanges();
      input.formControl.updateValueAndValidity();
      expect(input.formControl.hasError('inlineError')).toBe(false);
    });
  });

  describe('model two-way binding', () => {
    it('updates formControl when model changes (effect)', () => {
      host.model = 'hello';
      fixture.detectChanges();
      expect(input.formControl.value).toBe('hello');
    });

    it('updates model when formControl emits valueChanges', () => {
      input.formControl.setValue('world');
      fixture.detectChanges();
      expect(host.model).toBe('world');
    });

    it('emits sdChange when formControl value changes', () => {
      input.formControl.setValue('changed');
      fixture.detectChanges();
      expect(host.changes).toContain('changed');
    });

    it('does NOT emit valueChanges when model effect re-syncs control', () => {
      const received: any[] = [];
      const sub = input.formControl.valueChanges.subscribe(v => received.push(v));
      host.model = 'silent';
      fixture.detectChanges();
      expect(input.formControl.value).toBe('silent');
      expect(received.length).toBe(0);
      sub.unsubscribe();
    });
  });

  describe('appearance', () => {
    it('defaults to "outline" without SD_FORM_CONFIGURATION token', () => {
      expect(input.appearance()).toBe('outline');
    });
  });

  describe('errorTooltipMessage getter', () => {
    it('returns "Vui lÃ²ng nháº­p thÃ´ng tin" for required error', () => {
      // pre-seed: avoids NG0100 â€” ngAfterViewInit calls detectChanges();
      // a non-empty starting value keeps the control valid during that pass
      host.model = 'seed';
      host.required = true;
      fixture.detectChanges();
      input.formControl.setValue('', { emitEvent: false });
      input.formControl.updateValueAndValidity({ emitEvent: false });
      expect(input.errorTooltipMessage).toBe('Vui lÃ²ng nháº­p thÃ´ng tin');
    });

    it('returns maxlength message with limit', () => {
      host.model = '';
      host.maxlength = 3;
      fixture.detectChanges();
      input.formControl.setValue('abcd', { emitEvent: false });
      input.formControl.updateValueAndValidity({ emitEvent: false });
      expect(input.errorTooltipMessage).toBe('Sá»‘ kÃ½ tá»± tá»‘i Ä‘a: 3');
    });

    it('returns inlineError message when inlineError validator fires', () => {
      host.inlineError = 'ÄÃ£ cÃ³ lá»—i';
      fixture.detectChanges();
      input.formControl.updateValueAndValidity();
      expect(input.errorTooltipMessage).toBe('ÄÃ£ cÃ³ lá»—i');
    });

    it('returns undefined when no errors', () => {
      input.formControl.setValue('x');
      expect(input.errorTooltipMessage).toBeUndefined();
    });
  });

  describe('onKeyupEnter', () => {
    it('trims value and emits keyupEnter', () => {
      const emitted: any[] = [];
      const sub = input.keyupEnter.subscribe(v => emitted.push(v));
      input.formControl.setValue('abc  ');
      input.onKeyupEnter();
      expect(input.formControl.value).toBe('abc');
      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('abc');
      sub.unsubscribe();
    });

    it('emits keyupEnter even when value has no whitespace', () => {
      const emitted: any[] = [];
      const sub = input.keyupEnter.subscribe(v => emitted.push(v));
      input.formControl.setValue('clean');
      input.onKeyupEnter();
      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('clean');
      sub.unsubscribe();
    });

    it('calls blur when blurOnEnter is true', () => {
      host.blurOnEnter = true;
      fixture.detectChanges();
      const blurSpy = spyOn(input, 'blur').and.callThrough();
      input.onKeyupEnter();
      expect(blurSpy).toHaveBeenCalled();
    });

    it('does NOT call blur when blurOnEnter is false (default)', () => {
      const blurSpy = spyOn(input, 'blur').and.callThrough();
      input.onKeyupEnter();
      expect(blurSpy).not.toHaveBeenCalled();
    });
  });

  describe('onBlur', () => {
    it('trims value on blur', () => {
      input.formControl.setValue('abc  ');
      input.onBlur();
      expect(input.formControl.value).toBe('abc');
    });

    it('emits sdBlur with the trimmed value', () => {
      const emitted: any[] = [];
      const sub = input.sdBlur.subscribe(v => emitted.push(v));
      input.formControl.setValue('hi  ');
      input.onBlur();
      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('hi');
      sub.unsubscribe();
    });
  });

  describe('focus tracking', () => {
    it('sets isFocused = true on focus', () => {
      input.onFocus();
      expect(input.isFocused).toBe(true);
    });

    it('sets isFocused = false on blur', () => {
      input.onFocus();
      input.onBlur();
      expect(input.isFocused).toBe(false);
    });

    it('emits sdFocus on focus', () => {
      let called = false;
      const sub = input.sdFocus.subscribe(() => { called = true; });
      input.onFocus();
      expect(called).toBe(true);
      sub.unsubscribe();
    });
  });

  describe('helper utilities', () => {
    it('getCurrentLength returns 0 for null/undefined value', () => {
      input.formControl.setValue(null);
      expect(input.getCurrentLength()).toBe(0);
    });

    it('getCurrentLength returns string length', () => {
      input.formControl.setValue('hello');
      expect(input.getCurrentLength()).toBe(5);
    });

    it('isMaxlengthExceeded returns true when over maxlength', () => {
      host.maxlength = 3;
      fixture.detectChanges();
      input.formControl.setValue('abcd');
      expect(input.isMaxlengthExceeded()).toBe(true);
    });

    it('isMaxlengthExceeded returns false when within maxlength', () => {
      host.maxlength = 5;
      fixture.detectChanges();
      input.formControl.setValue('abc');
      expect(input.isMaxlengthExceeded()).toBe(false);
    });

    it('isMaxlengthExceeded returns false when no maxlength set', () => {
      input.formControl.setValue('abcd');
      expect(input.isMaxlengthExceeded()).toBe(false);
    });
  });

  describe('pattern resolution (VALIDATION_PATTERNS)', () => {
    const setPattern = (val: any) => {
      host.pattern = val;
      fixture.detectChanges();
    };

    it('resolves a known type key to its regex string', () => {
      setPattern('EMAIL');
      expect(input.resolvedPattern()).toMatch(/^\^.+@.+\$$/);
    });

    it('passes through a raw regex string as-is', () => {
      setPattern('[0-9]+');
      expect(input.resolvedPattern()).toBe('[0-9]+');
    });

    it('returns undefined when pattern is null/undefined', () => {
      setPattern(undefined);
      expect(input.resolvedPattern()).toBeUndefined();
      setPattern(null);
      expect(input.resolvedPattern()).toBeUndefined();
    });

    it('skips when value is not a string (number / boolean / object)', () => {
      setPattern(123);
      expect(input.resolvedPattern()).toBeUndefined();
      setPattern(true);
      expect(input.resolvedPattern()).toBeUndefined();
      setPattern({ source: '\\d+' });
      expect(input.resolvedPattern()).toBeUndefined();
    });

    it('remaps legacy type names (PHONE_VN â†’ VN_PHONE)', () => {
      setPattern('PHONE_VN');
      const legacy = input.resolvedPattern();
      setPattern('VN_PHONE');
      const current = input.resolvedPattern();
      expect(legacy).toBe(current);
      expect(legacy).toBeTruthy();
    });

    it('resolves i18n key for error message when matching a known type', () => {
      setPattern('EMAIL');
      expect(input.resolvedPatternErrorMsg()).toBeTruthy();
    });

    it('returns custom patternErrorMessage when set, regardless of type match', () => {
      host.pattern = 'EMAIL';
      host.patternErrorMessage = 'Email khÃ´ng há»£p lá»‡';
      fixture.detectChanges();
      expect(input.resolvedPatternErrorMsg()).toBe('Email khÃ´ng há»£p lá»‡');
    });

    it('returns undefined error message for raw regex without custom message', () => {
      setPattern('[0-9]+');
      expect(input.resolvedPatternErrorMsg()).toBeUndefined();
    });
  });

  describe('reValidate', () => {
    it('triggers updateValueAndValidity on the form control', () => {
      const spy = spyOn(input.formControl, 'updateValueAndValidity').and.callThrough();
      input.reValidate();
      expect(spy).toHaveBeenCalled();
    });
  });
});

describe('SdInput (FormGroup lifecycle)', () => {
  let fg: FormGroup;
  let fixture: ComponentFixture<FgHost>;

  beforeEach(async () => {
    fg = new FormGroup({});
    await TestBed.configureTestingModule({
      imports: [FgHost, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(FgHost);
    fixture.componentInstance.fg = fg;
    fixture.detectChanges();
  });

  it('adds control to FormGroup on init', () => {
    expect(fg.contains('username')).toBe(true);
  });

  it('removes control on destroy', () => {
    fixture.destroy();
    expect(fg.contains('username')).toBe(false);
  });
});

describe('SdInput (NgForm extraction)', () => {
  let fixture: ComponentFixture<NgFormHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgFormHost, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(NgFormHost);
    fixture.detectChanges();
  });

  it('extracts FormGroup from NgForm and registers the control', fakeAsync(() => {
    tick();
    const ngForm = fixture.componentInstance.ngForm;
    expect(ngForm).toBeTruthy();
    expect(ngForm.form.contains('username')).toBe(true);
  }));
});

describe('SdInput (with SD_FORM_CONFIGURATION fill)', () => {
  @Component({
    standalone: true,
    imports: [SdInput],
    template: `<sd-input></sd-input>`,
  })
  class StubHost {}

  let fixture: ComponentFixture<StubHost>;
  let input: SdInput;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StubHost, NoopAnimationsModule],
      providers: [{ provide: SD_FORM_CONFIGURATION, useValue: { appearance: 'fill' } }],
    }).compileComponents();
    fixture = TestBed.createComponent(StubHost);
    fixture.detectChanges();
    input = fixture.debugElement.query(el => el.componentInstance instanceof SdInput)
      ?.componentInstance as SdInput;
  });

  it('uses appearance from SD_FORM_CONFIGURATION token', () => {
    expect(input.appearance()).toBe('fill');
  });
});

