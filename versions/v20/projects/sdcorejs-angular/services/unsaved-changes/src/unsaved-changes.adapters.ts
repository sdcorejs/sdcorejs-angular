import { signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CanDeactivateFn } from '@angular/router';
import { SdUnsavedChangesConfirmOptions, SdUnsavedChangesMaybeAsync, SdUnsavedChangesRegistration } from './unsaved-changes.model';
import { SdUnsavedChangesService } from './unsaved-changes.service';
import { inject } from '@angular/core';

export interface SdUnsavedChangesFormOptions<TValue> {
  readonly id: string;
  readonly scope?: unknown;
  readonly message?: string;
  readonly save?: (value: TValue) => SdUnsavedChangesMaybeAsync<void | boolean>;
  readonly reset?: (form: FormGroup) => SdUnsavedChangesMaybeAsync<void | boolean>;
  readonly discard?: (form: FormGroup) => SdUnsavedChangesMaybeAsync<void | boolean>;
  /**
   * `'control'` (default): the form's own `dirty` flag. `'value'`: dirty only while `getRawValue()` differs from
   * the snapshot, so a value typed back to what it was is no change.
   */
  readonly dirty?: 'control' | 'value';
}

export function registerSdUnsavedChangesForm<TValue extends Record<string, unknown>>(
  service: SdUnsavedChangesService,
  form: FormGroup,
  options: SdUnsavedChangesFormOptions<TValue>
): SdUnsavedChangesRegistration {
  let snapshot = cloneValue(form.getRawValue()) as TValue;
  const readFormDirty = (): boolean => (options.dirty === 'value' ? !sameValue(form.getRawValue(), snapshot) : form.dirty);
  const dirty = signal(readFormDirty());
  const subscription = form.events.subscribe(() => dirty.set(readFormDirty()));
  const resetToSnapshot = (): void => {
    form.reset(cloneValue(snapshot));
    form.markAsPristine();
    dirty.set(false);
  };
  const registration = service.register({
    id: options.id,
    scope: options.scope,
    message: options.message,
    isDirty: dirty,
    save: async () => {
      const result = options.save ? await Promise.resolve(options.save(form.getRawValue() as TValue)) : undefined;
      if (result === false) return false;
      snapshot = cloneValue(form.getRawValue()) as TValue;
      form.markAsPristine();
      dirty.set(false);
      return true;
    },
    reset: async () => {
      const result = options.reset ? await Promise.resolve(options.reset(form)) : undefined;
      if (result === false) return false;
      if (!options.reset) resetToSnapshot();
      else {
        form.markAsPristine();
        dirty.set(false);
      }
      return true;
    },
    discard: async () => {
      const result = options.discard ? await Promise.resolve(options.discard(form)) : undefined;
      if (result === false) return false;
      if (!options.discard) resetToSnapshot();
      else {
        form.markAsPristine();
        dirty.set(false);
      }
      return true;
    },
    cleanup: () => subscription.unsubscribe(),
  });
  return registration;
}

export function createSdUnsavedChangesCloseGuard(
  service: SdUnsavedChangesService,
  options: Omit<SdUnsavedChangesConfirmOptions, 'reason'> = {}
): () => Promise<boolean> {
  return () => service.confirmLeave({ ...options, reason: 'close' });
}

export const sdUnsavedChangesGuard: CanDeactivateFn<unknown> = () => inject(SdUnsavedChangesService).confirmLeave({ reason: 'navigation' });

function cloneValue<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map(item => cloneValue(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)])) as T;
  }
  return value;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => sameValue(item, b[index]));
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return (
      aKeys.length === bKeys.length &&
      aKeys.every(key => sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
    );
  }
  return false;
}
