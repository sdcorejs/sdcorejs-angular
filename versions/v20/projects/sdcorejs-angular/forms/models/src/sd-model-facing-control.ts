import { Signal, computed, effect, untracked } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { sdFormControlState } from './form-control-state';
import { SdFormControl } from './sd-form-control.model';

export interface ɵSdModelFacingControlOptions<TModel> {
  /** Whether the model-facing control should be the one registered in the parent form. */
  readonly active: Signal<boolean>;
  /** The component's public model. */
  readonly model: Signal<TModel>;
  /** Applies an external write that arrived through the registered control. */
  readonly writeModel: (value: TModel) => void;
  /** The internal UI control whose validity, disabled and interaction state must be mirrored. */
  readonly source: Signal<AbstractControl>;
  /** Compares two model values; defaults to `Object.is`. */
  readonly modelEquals?: (left: TModel, right: TModel) => boolean;
}

export interface ɵSdModelFacingControl<TModel> {
  /** The control itself. Holds the public model value, never the editor representation. */
  readonly control: SdFormControl;
  /** Feed straight into `ɵsdFormControlConnector`'s `registeredControl`. */
  readonly registered: Signal<AbstractControl | null>;
}

/**
 * A second control that carries the **public model** so it can be registered in the parent form in
 * place of the editor-facing control.
 *
 * why: `<sd-date>` and friends bind their control directly to the Material editor, so that control
 * necessarily holds a `Date` or a display string. That is invisible until `transform` is set — at
 * which point the consumer is told `form.get(name).value` equals `model`, and finding a raw `Date`
 * there instead makes the promise false. Rather than reshaping the editor binding (which would
 * change behaviour for every existing consumer), this mirrors the model into a control of its own
 * and hands *that* one to the form.
 *
 * Both directions are wired, and neither can feed back on the other:
 *  - model changes are pushed in with `emitEvent: false`, so they raise no `valueChanges`;
 *  - a write that arrives on this control goes to `writeModel`, exactly like a write on the editor
 *    control would, so `modelChange` / `sdChange` still fire once.
 *
 * Validity, disabled and touched/dirty are mirrored from `source`, so registering this control does
 * not quietly drop the editor's validators (min/max, parse errors, required) from the parent form.
 *
 * Must be called from an injection context.
 */
export function ɵsdModelFacingControl<TModel>(options: ɵSdModelFacingControlOptions<TModel>): ɵSdModelFacingControl<TModel> {
  const control = new SdFormControl();
  const modelEquals = options.modelEquals ?? Object.is;
  const sourceState = sdFormControlState(options.source);

  // Model → control. `emitEvent: false` is what keeps a user commit from bouncing back as a second
  // `modelChange`; the value is already the committed one by the time it lands here.
  effect(() => {
    const value = options.model() as unknown;
    untracked(() => {
      if (!modelEquals(control.value as TModel, value as TModel)) {
        control.setValue(value, { emitEvent: false });
      }
    });
  });

  // Control → model, for writes the consumer makes through the registered control.
  effect(onCleanup => {
    const subscription = control.valueChanges.subscribe(value => {
      if (!modelEquals(options.model(), value as TModel)) options.writeModel(value as TModel);
    });
    onCleanup(() => subscription.unsubscribe());
  });

  // why: control này KHÔNG mang validator nào của riêng nó — nó chỉ phản chiếu. Nếu không copy
  // `errors` sang, đăng ký nó vào form cha sẽ làm `form.valid` bỏ qua required/min/max/parse của
  // editor, tức là form submit được trong khi field đang đỏ.
  effect(() => {
    const snapshot = sourceState();
    const source = options.source();
    untracked(() => {
      const errors = source.errors;
      const currentErrors = control.errors;
      const changed = JSON.stringify(errors ?? null) !== JSON.stringify(currentErrors ?? null);
      if (changed) control.setErrors(errors, { emitEvent: false });

      if (snapshot.disabled !== control.disabled) {
        if (snapshot.disabled) control.disable({ emitEvent: false });
        else control.enable({ emitEvent: false });
      }

      if (source.touched && !control.touched) control.markAsTouched({ emitEvent: false } as never);
      if (!source.touched && control.touched) control.markAsUntouched({ emitEvent: false } as never);
      if (source.dirty && !control.dirty) control.markAsDirty({ onlySelf: true });
      if (!source.dirty && control.dirty) control.markAsPristine({ emitEvent: false } as never);
    });
  });

  return { control, registered: computed(() => (options.active() ? control : null)) };
}
