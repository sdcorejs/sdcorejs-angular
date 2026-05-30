import { FormControl } from '@angular/forms';
import { HandleSdCustomValidator, SdInlineErrorValidator } from './sd-custom-validator.model';

describe('SdInlineErrorValidator', () => {
  it('always returns { inlineError: true }', () => {
    const c = new FormControl('anything');
    expect(SdInlineErrorValidator(c)).toEqual({ inlineError: true });
  });
});

describe('HandleSdCustomValidator', () => {
  it('returns null when validator function is null/undefined', async () => {
    // @ts-expect-error testing falsy input branch
    const validator = HandleSdCustomValidator(null);
    const c = new FormControl('x');
    const result = await validator(c);
    expect(result).toBeNull();
  });

  it('returns null when validator function returns "" (no error)', async () => {
    const validator = HandleSdCustomValidator(() => '');
    const c = new FormControl('x');
    const result = await validator(c);
    expect(result).toBeNull();
  });

  it('wraps synchronous error string into { customValidator }', async () => {
    const validator = HandleSdCustomValidator(() => 'bad value');
    const c = new FormControl('x');
    const result = await validator(c);
    expect(result).toEqual({ customValidator: 'bad value' });
  });

  it('awaits Promise result and wraps non-empty resolved string', async () => {
    const validator = HandleSdCustomValidator(() => Promise.resolve('async-error'));
    const c = new FormControl('x');
    const result = await validator(c);
    expect(result).toEqual({ customValidator: 'async-error' });
  });

  it('awaits Promise result and returns null when resolved string is empty', async () => {
    const validator = HandleSdCustomValidator(() => Promise.resolve(''));
    const c = new FormControl('x');
    const result = await validator(c);
    expect(result).toBeNull();
  });

  it('passes 0 through as-is (not coerced to null) — fix for numeric "required" validators', async () => {
    const spy = jasmine.createSpy('fn').and.returnValue('');
    const validator = HandleSdCustomValidator(spy);
    const c = new FormControl(0);
    await validator(c);
    expect(spy).toHaveBeenCalledWith(0);
  });

  it('coerces falsy non-zero values (null, undefined, "") to null', async () => {
    const spy = jasmine.createSpy('fn').and.returnValue('');
    const validator = HandleSdCustomValidator(spy);

    await validator(new FormControl(''));
    expect(spy).toHaveBeenCalledWith(null);

    spy.calls.reset();
    await validator(new FormControl(null));
    expect(spy).toHaveBeenCalledWith(null);

    spy.calls.reset();
    await validator(new FormControl(undefined));
    expect(spy).toHaveBeenCalledWith(null);
  });

  it('passes truthy values through unchanged', async () => {
    const spy = jasmine.createSpy('fn').and.returnValue('');
    const validator = HandleSdCustomValidator(spy);
    await validator(new FormControl('hi'));
    expect(spy).toHaveBeenCalledWith('hi');
  });
});
