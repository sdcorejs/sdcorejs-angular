import { Validators } from '@angular/forms';
import { SdFormControl } from './sd-form-control.model';

// why: SdFormControl's super signature is the typed FormControl form
// (formState: FormControlState<any> | T). For tests we keep it simple by
// using no-arg construction + setValue/setValidators.
describe('SdFormControl', () => {
  it('extends FormControl with the standard signature (initial value + validators)', () => {
    const c = new SdFormControl();
    c.setValue('hello');
    c.setValidators(Validators.required);
    c.updateValueAndValidity();
    expect(c.value).toBe('hello');
    expect(c.valid).toBeTrue();
    c.setValue('');
    expect(c.invalid).toBeTrue();
  });

  it('emits on sdChanges + touchChanges when markAsTouched is called', () => {
    const c = new SdFormControl();
    const sd: boolean[] = [];
    const touch: boolean[] = [];
    c.sdChanges.subscribe(v => sd.push(v));
    c.touchChanges.subscribe(v => touch.push(v));

    c.markAsTouched();

    expect(touch).toEqual([true]);
    expect(sd).toEqual([true]);
    expect(c.touched).toBeTrue();
  });

  it('emits on sdChanges + untouchChanges when markAsUntouched is called', () => {
    const c = new SdFormControl();
    c.markAsTouched();

    const sd: boolean[] = [];
    const untouch: boolean[] = [];
    c.sdChanges.subscribe(v => sd.push(v));
    c.untouchChanges.subscribe(v => untouch.push(v));

    c.markAsUntouched();

    expect(untouch).toEqual([true]);
    expect(sd).toEqual([true]);
    expect(c.touched).toBeFalse();
  });

  it('emits on sdChanges + pristineChanges when markAsPristine is called', () => {
    const c = new SdFormControl();
    c.markAsDirty();

    const sd: boolean[] = [];
    const pristine: boolean[] = [];
    c.sdChanges.subscribe(v => sd.push(v));
    c.pristineChanges.subscribe(v => pristine.push(v));

    c.markAsPristine();

    expect(pristine).toEqual([true]);
    expect(sd).toEqual([true]);
    expect(c.pristine).toBeTrue();
  });

  it('passes onlySelf/emitEvent opts through to the parent FormControl impl', () => {
    const c = new SdFormControl();
    // Track value/status changes — emitEvent:false should suppress them.
    let valueChangeFired = false;
    c.valueChanges.subscribe(() => (valueChangeFired = true));

    // markAsTouched({emitEvent:false}) should still fire sdChanges/touchChanges
    // (those are our own Subjects), but the underlying control's events get the opts.
    const sd: boolean[] = [];
    c.sdChanges.subscribe(v => sd.push(v));
    c.markAsTouched({ emitEvent: false });
    expect(sd).toEqual([true]);
    expect(valueChangeFired).toBeFalse();
  });
});
