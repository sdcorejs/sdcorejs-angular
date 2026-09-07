import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdInputNumber } from './input-number.component';

for (const format of ['1.234.567,89', '1,234,567.89'] as const) {
  for (const precision of [0, 2]) {
    describe(`SdInputNumber paste (${format}, precision=${precision})`, () => {
      let fixture: ComponentFixture<SdInputNumber>;
      let comp: SdInputNumber;
      let input: HTMLInputElement;
      const decimal = format === '1.234.567,89' ? ',' : '.';
      const thousand = decimal === ',' ? '.' : ',';

      beforeEach(async () => {
        await TestBed.configureTestingModule({
          imports: [SdInputNumber, NoopAnimationsModule],
          providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { format: { number: format } } }],
        }).compileComponents();
        fixture = TestBed.createComponent(SdInputNumber);
        comp = fixture.componentInstance;
        fixture.componentRef.setInput('precision', precision);
        fixture.detectChanges();
        input = fixture.nativeElement.querySelector('input');
      });

      function paste(text: string, start = 0, end = input.value.length): ClipboardEvent {
        input.setSelectionRange(start, end);
        const clipboardData = new DataTransfer();
        clipboardData.setData('text', text);
        const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
        input.dispatchEvent(event);
        fixture.detectChanges();
        return event;
      }

      for (const text of [
        '1234567',
        '1.234.567',
        '1,234,567',
        ' 1234567 ',
        '\n1234567\r\n',
        '\u00a0123\u00a0456\u202f7\u00a0',
        '1 234 567',
        '\t 1.234.567 \n',
        '\t 1,234,567 \n',
      ]) {
        it(`normalizes integer clipboard ${JSON.stringify(text)}`, () => {
          const changed = jasmine.createSpy('sdChange');
          comp.sdChange.subscribe(changed);
          expect(paste(text).defaultPrevented).toBeTrue();
          expect(comp.formControl.value).toBe(1234567);
          expect(comp.valueModel()).toBe(1234567);
          expect(input.value).toBe(`1${thousand}234${thousand}567`);
          expect(changed).toHaveBeenCalledOnceWith(1234567);
          expect(comp.inputControl.dirty).toBeTrue();
        });
      }

      for (const text of [
        '1234567,89',
        '1234567.89',
        '1.234.567,89',
        '1,234,567.89',
        '\u00a0 1.234.567,899\n',
        '\u202f1,234,567.899\r\n',
      ]) {
        it(`truncates decimals from ${JSON.stringify(text)}`, () => {
          paste(text);
          const expected = precision === 0 ? 1234567 : 1234567.89;
          expect(comp.formControl.value).toBe(expected);
          expect(input.value).toBe(`1${thousand}234${thousand}567${precision ? decimal + '89' : ''}`);
        });
      }

      for (const text of [
        '',
        ' \n\u00a0',
        'abc',
        '12abc',
        'NaN',
        'Infinity',
        '1e3',
        '1.2.3',
        '1,2,3',
        '12,34,567',
        '1.234,56.78',
        '9'.repeat(310),
      ]) {
        it(`rejects invalid clipboard ${JSON.stringify(text).slice(0, 35)} without changing value`, () => {
          fixture.componentRef.setInput('model', 42);
          fixture.detectChanges();
          const changed = jasmine.createSpy('sdChange');
          comp.sdChange.subscribe(changed);
          expect(paste(text).defaultPrevented).toBeTrue();
          expect(comp.formControl.value).toBe(42);
          expect(input.value).toBe('42');
          expect(changed).not.toHaveBeenCalled();
        });
      }

      for (const [value, error] of [
        [5, 'min'],
        [150, 'max'],
      ] as const) {
        it(`applies ${error} exactly as typing`, () => {
          fixture.componentRef.setInput('min', 10);
          fixture.componentRef.setInput('max', 100);
          fixture.detectChanges();
          paste(String(value));
          expect(comp.formControl.value).toBe(value);
          expect(comp.formControl.hasError(error)).toBeTrue();
          const errors = comp.formControl.errors;
          comp.inputControl.setValue(String(value));
          expect(comp.formControl.errors).toEqual(errors);
        });
      }

      it('prefers configured format for an ambiguous single separator', () => {
        paste(`1${thousand}234`);
        expect(comp.formControl.value).toBe(1234);
        paste(`1${decimal}234`);
        expect(comp.formControl.value).toBe(precision ? 1.23 : 1);
      });

      it('replaces only the selection and preserves the caret', () => {
        fixture.componentRef.setInput('model', 123456);
        fixture.detectChanges();
        paste(' 99 ', 1, 3);
        expect(comp.formControl.value).toBe(199456);
        expect(input.value).toBe(`199${thousand}456`);
        expect(input.selectionStart).toBe(3);
      });

      it('preserves sign and truncates negative fractions toward zero', () => {
        paste('-12.99');
        expect(comp.formControl.value).toBe(precision ? -12.99 : -12);
      });

      it('rejects negative paste for positive type', () => {
        fixture.componentRef.setInput('type', 'positive');
        fixture.detectChanges();
        paste('-12.99');
        expect(comp.formControl.value).toBeUndefined();
      });

      it('rejects unsigned paste for negative type', () => {
        fixture.componentRef.setInput('type', 'negative');
        fixture.detectChanges();
        paste('12');
        expect(comp.formControl.value).toBeUndefined();
      });

      for (const modifier of ['ctrlKey', 'metaKey']) {
        it(`lets ${modifier}+V reach paste even during an incomplete edit`, () => {
          input.value = '-';
          const event = new KeyboardEvent('keydown', { key: 'v', [modifier]: true, bubbles: true, cancelable: true });
          input.dispatchEvent(event);
          expect(event.defaultPrevented).toBeFalse();
        });
      }

      it('requires groups of three digits in the numeric pattern', () => {
        const pattern = new RegExp(`^${comp.regexPattern()}`);
        expect(pattern.test(`1${thousand}234${thousand}567`)).toBeTrue();
        expect(pattern.test(`1${thousand}2${thousand}3`)).toBeFalse();
        expect(pattern.test(`12${thousand}34`)).toBeFalse();
      });

      it('allows typing another digit after an automatically grouped value', () => {
        input.value = `1${thousand}234`;
        input.setSelectionRange(input.value.length, input.value.length);
        const event = new KeyboardEvent('keydown', { key: '5', bubbles: true, cancelable: true });
        input.dispatchEvent(event);
        expect(event.defaultPrevented).toBeFalse();
      });

      it('keeps precision enforcement for ordinary keydown', () => {
        input.value = precision ? `12${decimal}34` : '12';
        input.setSelectionRange(input.value.length, input.value.length);
        const event = new KeyboardEvent('keydown', { key: precision ? '5' : decimal, bubbles: true, cancelable: true });
        input.dispatchEvent(event);
        expect(event.defaultPrevented).toBeTrue();
      });
    });
  }
}
