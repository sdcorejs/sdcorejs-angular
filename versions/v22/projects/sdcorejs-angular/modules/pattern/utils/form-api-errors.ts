import { computed, DestroyRef, inject, signal, type Signal } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { apiFieldErrors } from './api-error';

/** `lines.2.quantity` → value of that control. */
const valueAt = (value: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (current, key) => (current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined),
      value
    );

const sameValue = (left: unknown, right: unknown): boolean => Object.is(left, right) || JSON.stringify(left) === JSON.stringify(right);

/** Field errors of the last failed save, shown on the fields through `[inlineError]`. */
export interface FormApiErrors {
  /** Field → message, without the fields the user changed since the failure. */
  readonly errors: Signal<Readonly<Record<string, string>>>;
  /** Keeps the field errors of `error`; returns whether one of them is on a field of the form. */
  set(error: unknown): boolean;
  clear(): void;
}

/**
 * Field errors of a save that the API rejected (`errors: [{ field, message }]`, a field path such as `lines.2.quantity`
 * for a row). A field keeps its error until the user changes its value, so the next save is not blocked by an answer that no longer applies.
 * Call it in an injection context (a field initializer of the page or drawer).
 */
export function formApiErrors(form: FormGroup): FormApiErrors {
  const failure = signal<{ errors: Record<string, string>; value: Record<string, unknown> } | null>(null);
  // why: Core fields write their model with `emitEvent: false`; until the user edits, `valueChanges` has not seen
  // those values. `set()` reads the value again, so the error of a save made without edits still shows.
  const value = signal(form.getRawValue() as Record<string, unknown>);
  const subscription = form.valueChanges.subscribe(() => value.set(form.getRawValue() as Record<string, unknown>));
  inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  const errors = computed(() => {
    const current = failure();
    if (!current) return {};
    const now = value();
    return Object.fromEntries(
      Object.entries(current.errors).filter(([field]) => sameValue(valueAt(now, field), valueAt(current.value, field)))
    );
  });
  return {
    errors,
    set: error => {
      // A field the form does not show (`parentId` of a drawer opened under a parent) is left to the message of the caller.
      const fields = Object.fromEntries(Object.entries(apiFieldErrors(error)).filter(([field]) => !!form.get(field)));
      const current = form.getRawValue() as Record<string, unknown>;
      value.set(current);
      failure.set({ errors: fields, value: current });
      return Object.keys(fields).length > 0;
    },
    clear: () => failure.set(null),
  };
}
