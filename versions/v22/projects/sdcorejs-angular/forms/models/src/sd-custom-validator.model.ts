import { AbstractControl, AsyncValidatorFn, ValidatorFn } from '@angular/forms';

export type SdCustomValidator = (value: any) => string | Promise<string>;

/**
 * Inline-error sentinel validator. Returns `{ inlineError: true }` so the form
 * template can render `<mat-error>{{ inlineError }}</mat-error>` whenever the
 * host component has a non-empty `[inlineError]` input. The error message
 * itself is read from the input — this validator only flags the state.
 *
 * why: each form component (input, textarea, select, checkbox, radio, switch,
 * date, datetime, input-number, autocomplete) previously declared the same
 * private `customInlineErrorValidator()` method. Centralized here so adding
 * another form component does not silently re-introduce the duplicate.
 */
export const SdInlineErrorValidator: ValidatorFn = (): Record<string, unknown> | null => ({ inlineError: true });

export const HandleSdCustomValidator = (func: SdCustomValidator): AsyncValidatorFn => {
  return async (c: AbstractControl): Promise<Record<string, any> | null> => {
    const value = c.value === 0 ? c.value : c.value || null;
    if (func && typeof func === 'function') {
      const result = func(value);
      if (result instanceof Promise) {
        const message = await result;
        if (message) {
          return {
            customValidator: message,
          };
        }
        return null;
      }
      if (result) {
        return {
          customValidator: result,
        };
      }
      return null;
    }
    return null;
  };
};
