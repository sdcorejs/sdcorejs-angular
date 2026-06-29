import { DestroyRef, EffectRef, Signal, computed, effect, inject, signal, untracked } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';

export interface SdFormControlSnapshot<T> {
  value: T | undefined;
  disabled: boolean;
  invalid: boolean;
  touched: boolean;
}

/**
 * Wrap an AbstractControl Signal into a reactive snapshot signal.
 *
 * Re-emits on every value, status, touched, or dirty change so
 * downstream consumers can derive `data-disabled`, `data-value`,
 * `data-empty`, and `data-invalid` host-binding attributes from a
 * single, lazily evaluated signal.
 *
 * "invalid" is intentionally gated on `touched || dirty` so validation
 * errors are not surfaced until the user has interacted with the field.
 *
 * Must be called inside an Angular injection context (constructor,
 * field initialiser, or `runInInjectionContext`).
 */
export function sdFormControlState<T = unknown>(control: Signal<AbstractControl<T> | null | undefined>): Signal<SdFormControlSnapshot<T>> {
  // A tick counter incremented on every control event (value, status,
  // touched, dirty). Written only from the effect below — never inside
  // a computed() — satisfying Angular's no-side-effect-in-reactive rule.
  const tick = signal(0);
  const destroyRef = inject(DestroyRef);

  // Holds the active RxJS subscription so it can be torn down when the
  // control instance changes or the host component is destroyed.
  let subscription: Subscription | null = null;

  // An effect re-runs whenever the control Signal changes, tears down the
  // old subscription and creates a fresh one for the incoming control.
  // `AbstractControl.events` (Angular 14+) covers value, status, touched,
  // and dirty changes — a superset of valueChanges + statusChanges.
  const effectRef: EffectRef = effect(() => {
    const c = control(); // tracked — effect re-runs on change
    // effect() runs asynchronously; the old subscription is torn down on the next
    // scheduled run, not synchronously on signal change. A one-tick window of
    // double-subscription is harmless due to computed() memoization.
    subscription?.unsubscribe();
    subscription = null;

    if (c) {
      subscription = c.events.pipe(startWith(null)).subscribe(() => {
        // Increment outside reactive context to avoid Angular's
        // "signal written from computed / template" error.
        untracked(() => tick.update(n => n + 1));
      });
    }
  });

  // Clean up effect and subscription when host component is destroyed.
  destroyRef.onDestroy(() => {
    effectRef.destroy();
    subscription?.unsubscribe();
  });

  return computed((): SdFormControlSnapshot<T> => {
    const _control = control();
    tick(); // reactive dependency — recomputes on every control event

    if (!_control) {
      return { value: undefined, disabled: false, invalid: false, touched: false };
    }

    return {
      value: _control.value as T,
      disabled: _control.disabled,
      invalid: _control.invalid && (_control.touched || _control.dirty),
      touched: _control.touched,
    };
  });
}
