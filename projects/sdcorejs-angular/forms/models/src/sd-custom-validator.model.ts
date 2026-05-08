import { AbstractControl, AsyncValidatorFn } from '@angular/forms';

export type SdCustomValidator = (value: any) => string | Promise<string>;
export const HandleSdCustomValidator = (func: SdCustomValidator): AsyncValidatorFn => {
  return async (c: AbstractControl): Promise<Record<string, any> | null> => {    
    const value = c.value===0 ? c.value : c.value || null;
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
