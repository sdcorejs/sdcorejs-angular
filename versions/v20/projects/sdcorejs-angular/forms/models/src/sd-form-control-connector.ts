import { Signal, computed, effect, untracked } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormGroup, NgForm, ValidatorFn, Validators } from '@angular/forms';

import { sdFormControlState } from './form-control-state';
import { SdViewed } from './sd-viewed';

export type ɵSdFormControlParent = FormGroup | NgForm | { readonly form: unknown } | null | undefined;

interface ɵSdFormControlConnectorBaseOptions<TControl> {
  /** Parent form source. NgForm and wrapper values are unwrapped on every rebind. */
  readonly form: Signal<ɵSdFormControlParent>;
  /** Registration name. Empty names intentionally leave the control unregistered. */
  readonly name: Signal<string | null | undefined>;
  /** Canonical control registered in the parent form. */
  readonly control: Signal<AbstractControl<TControl>>;
  readonly validators?: Signal<ValidatorFn | readonly ValidatorFn[] | null | undefined>;
  readonly asyncValidators?: Signal<AsyncValidatorFn | readonly AsyncValidatorFn[] | null | undefined>;
  /** Adds/removes Validators.required while preserving validators supplied above. */
  readonly required?: Signal<boolean | null | undefined>;
  readonly disabled?: Signal<boolean | null | undefined>;
  /** UI-only read-only policy. This never disables the Angular control. */
  readonly readonly?: Signal<boolean | null | undefined>;
  /** Exact SDCoreJS display policy. This never disables the Angular control. */
  readonly viewed?: Signal<SdViewed | null | undefined>;
  /** Component-local validation message. Visibility is interaction-gated in state. */
  readonly validationError?: Signal<string | null | undefined>;
}

interface ɵSdFormControlRegistrationOptions<TControl> extends ɵSdFormControlConnectorBaseOptions<TControl> {
  readonly model?: never;
  readonly writeModel?: never;
  readonly modelToControl?: never;
  readonly controlToModel?: never;
  readonly modelEquals?: never;
  readonly controlEquals?: never;
}

interface ɵSdFormControlIdentityOptions<TValue> extends ɵSdFormControlConnectorBaseOptions<TValue> {
  readonly model: Signal<TValue>;
  readonly writeModel: (value: TValue) => void;
  readonly modelToControl?: never;
  readonly controlToModel?: never;
  readonly modelEquals?: (left: TValue, right: TValue) => boolean;
  readonly controlEquals?: (left: TValue, right: TValue) => boolean;
}

interface ɵSdFormControlAdaptedOptions<TModel, TControl> extends ɵSdFormControlConnectorBaseOptions<TControl> {
  readonly model: Signal<TModel>;
  readonly writeModel: (value: TModel) => void;
  readonly modelToControl: (value: TModel) => TControl;
  readonly controlToModel: (value: TControl) => TModel;
  readonly modelEquals?: (left: TModel, right: TModel) => boolean;
  readonly controlEquals?: (left: TControl, right: TControl) => boolean;
}

type ɵSdTypesExactlyMatch<TLeft, TRight> = [TLeft] extends [TRight] ? ([TRight] extends [TLeft] ? true : false) : false;

/**
 * @internal Unstable connector contract for cross-entrypoint SDCoreJS controls.
 * Consumers must use registration-only, same-type identity binding, or provide
 * both adapters when model and control representations differ.
 */
export type ɵSdFormControlConnectorOptions<TModel, TControl> =
  | ɵSdFormControlRegistrationOptions<TControl>
  | ɵSdFormControlAdaptedOptions<TModel, TControl>
  | (ɵSdTypesExactlyMatch<TModel, TControl> extends true ? ɵSdFormControlIdentityOptions<TModel> : never);

type ɵSdFormControlBindingOptions<TModel, TControl> =
  | ɵSdFormControlIdentityOptions<TControl>
  | ɵSdFormControlAdaptedOptions<TModel, TControl>;

type ɵSdFormControlImplementationOptions<TModel, TControl> =
  | ɵSdFormControlRegistrationOptions<TControl>
  | ɵSdFormControlBindingOptions<TModel, TControl>;

export interface ɵSdFormControlConnectorState<TControl> {
  readonly value: TControl | undefined;
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly touched: boolean;
  readonly dirty: boolean;
  readonly required: boolean;
  readonly readonly: boolean;
  readonly viewed: SdViewed;
  readonly isViewed: boolean;
  readonly isInline: boolean;
  readonly showValidationError: boolean;
  readonly validationError: string | undefined;
}

export interface ɵSdFormControlConnector<TControl = unknown> {
  readonly state: Signal<ɵSdFormControlConnectorState<TControl>>;
  markAsTouched(): void;
  markAsUntouched(): void;
  markAsDirty(): void;
  markAsPristine(): void;
}

/** Coerces the form shapes accepted by SDCoreJS controls into one FormGroup. */
export function ɵsdCoerceFormGroup(value: unknown): FormGroup | undefined {
  if (value instanceof NgForm) return value.form;
  if (value instanceof FormGroup) return value;
  if (typeof value !== 'object' || value === null || !('form' in value)) return undefined;

  const wrappedForm = (value as { readonly form: unknown }).form;
  return wrappedForm instanceof FormGroup ? wrappedForm : undefined;
}

function normalizeValidatorList<TValidator extends ValidatorFn | AsyncValidatorFn>(
  value: TValidator | readonly TValidator[] | null | undefined
): TValidator[] {
  if (!value) return [];
  return typeof value === 'function' ? [value] : [...value];
}

function hasModelBinding<TModel, TControl>(
  options: ɵSdFormControlImplementationOptions<TModel, TControl>
): options is ɵSdFormControlBindingOptions<TModel, TControl> {
  return options.model !== undefined && options.writeModel !== undefined;
}

function readControlValue<TModel, TControl>(options: ɵSdFormControlBindingOptions<TModel, TControl>): TControl {
  if (options.modelToControl) return options.modelToControl(options.model());
  return options.model();
}

function writeModelValue<TModel, TControl>(options: ɵSdFormControlBindingOptions<TModel, TControl>, controlValue: TControl): void {
  if (options.controlToModel) {
    const modelValue = options.controlToModel(controlValue);
    if (!(options.modelEquals ?? Object.is)(options.model(), modelValue)) options.writeModel(modelValue);
    return;
  }

  if (!(options.modelEquals ?? Object.is)(options.model(), controlValue)) options.writeModel(controlValue);
}

/**
 * Connects the signal-based SDCoreJS model contract to an Angular control.
 * Registration and subscriptions are rebound transactionally, and cleanup only
 * removes a control while the connector still owns that exact registration.
 */
export function ɵsdFormControlConnector<TModel, TControl>(
  options: ɵSdFormControlConnectorOptions<TModel, TControl>
): ɵSdFormControlConnector<TControl>;
export function ɵsdFormControlConnector<TModel, TControl>(
  options: ɵSdFormControlImplementationOptions<TModel, TControl>
): ɵSdFormControlConnector<TControl> {
  const controlEquals = options.controlEquals ?? Object.is;
  const controlState = sdFormControlState(options.control);
  const state = computed((): ɵSdFormControlConnectorState<TControl> => {
    const snapshot = controlState();
    const required = !!options.required?.();
    const readonly = !!options.readonly?.();
    const viewed = options.viewed?.() ?? false;
    const validationError = options.validationError?.() || undefined;
    const showValidationError = snapshot.invalid && validationError !== undefined;

    return {
      ...snapshot,
      dirty: options.control().dirty,
      required,
      readonly,
      viewed,
      isViewed: viewed === true,
      isInline: viewed === 'inline',
      showValidationError,
      validationError: showValidationError ? validationError : undefined,
    };
  });

  effect(onCleanup => {
    const formGroup = ɵsdCoerceFormGroup(options.form());
    const name = options.name();
    const control = options.control();

    if (!formGroup || !name) return;

    const current = formGroup.get(name);
    const ownsRegistration = !current;
    if (ownsRegistration) formGroup.addControl(name, control);

    onCleanup(() => {
      if (ownsRegistration && formGroup.get(name) === control) formGroup.removeControl(name);
    });
  });

  if (hasModelBinding(options)) {
    effect(() => {
      const control = options.control();
      const controlValue = readControlValue(options);

      untracked(() => {
        if (!controlEquals(control.value, controlValue)) {
          control.setValue(controlValue, { emitEvent: false });
        }
      });
    });
  }

  if (hasModelBinding(options)) {
    effect(onCleanup => {
      const control = options.control();
      const subscription = control.valueChanges.subscribe(controlValue => {
        writeModelValue(options, controlValue);
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  if (options.validators || options.asyncValidators || options.required) {
    effect(onCleanup => {
      const control = options.control();
      const requestedValidators = normalizeValidatorList(options.validators?.());
      if (options.required?.()) requestedValidators.push(Validators.required);
      const validatorsToAdd = [...new Set(requestedValidators)].filter(validator => !control.hasValidator(validator));
      const asyncValidatorsToAdd = [...new Set(normalizeValidatorList(options.asyncValidators?.()))].filter(
        validator => !control.hasAsyncValidator(validator)
      );

      untracked(() => {
        if (validatorsToAdd.length > 0) control.addValidators(validatorsToAdd);
        if (asyncValidatorsToAdd.length > 0) control.addAsyncValidators(asyncValidatorsToAdd);
        control.updateValueAndValidity({ emitEvent: false });
      });

      onCleanup(() => {
        untracked(() => {
          if (validatorsToAdd.length > 0) control.removeValidators(validatorsToAdd);
          if (asyncValidatorsToAdd.length > 0) control.removeAsyncValidators(asyncValidatorsToAdd);
          control.updateValueAndValidity({ emitEvent: false });
        });
      });
    });
  }

  if (options.disabled) {
    effect(onCleanup => {
      const control = options.control();
      const disabled = !!options.disabled!();
      const previousDisabled = control.disabled;
      let appliedDisabled: boolean | undefined;

      untracked(() => {
        if (disabled !== control.disabled) {
          appliedDisabled = disabled;
          if (disabled) control.disable({ emitEvent: false });
          else control.enable({ emitEvent: false });
        }
      });

      onCleanup(() => {
        if (appliedDisabled === undefined || control.disabled !== appliedDisabled) return;

        untracked(() => {
          if (previousDisabled) control.disable({ emitEvent: false });
          else control.enable({ emitEvent: false });
        });
      });
    });
  }

  return {
    state,
    markAsTouched: () => options.control().markAsTouched(),
    markAsUntouched: () => options.control().markAsUntouched(),
    markAsDirty: () => options.control().markAsDirty(),
    markAsPristine: () => options.control().markAsPristine(),
  };
}
