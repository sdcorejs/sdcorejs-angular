import { FormControl, AsyncValidatorFn, ValidatorFn, FormControlOptions, FormControlState } from '@angular/forms';
import { Subject } from 'rxjs';

export class SdFormControl extends FormControl {
  sdChanges: Subject<boolean> = new Subject<boolean>();
  untouchChanges: Subject<boolean> = new Subject<boolean>();
  touchChanges: Subject<boolean> = new Subject<boolean>();
  pristineChanges: Subject<boolean> = new Subject<boolean>();
  constructor(
    formState?: FormControlState<any>,
    validatorOrOpts?: ValidatorFn | ValidatorFn[] | FormControlOptions | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null
  ) {
    super(formState, validatorOrOpts, asyncValidator);
  }

  override markAsUntouched(opts?: { onlySelf?: boolean; emitEvent?: boolean }): void {
    super.markAsUntouched(opts);
    this.untouchChanges.next(true);
    this.sdChanges.next(true);
  }

  override markAsTouched(opts?: { onlySelf?: boolean; emitEvent?: boolean }): void {
    super.markAsTouched(opts);
    this.touchChanges.next(true);
    this.sdChanges.next(true);
  }

  override markAsPristine(opts?: { onlySelf?: boolean; emitEvent?: boolean }): void {
    super.markAsPristine(opts);
    this.pristineChanges.next(true);
    this.sdChanges.next(true);
  }
}
