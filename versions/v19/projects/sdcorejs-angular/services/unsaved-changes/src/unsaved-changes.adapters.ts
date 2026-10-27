import { signal } from '@angular/core';
import { FormGroup, PristineChangeEvent, type AbstractControl, type ControlEvent } from '@angular/forms';
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
   * `'control'` (default): the form's own `dirty` flag. `'value'`: dirty only while the value differs from the
   * saved one, so a value typed back to what it was is no change, whether or not the field marks its control dirty.
   * In `'value'` mode each control's saved value is the one it holds once it has joined the form (an `<sd-*>`
   * field registers and writes its model after this call), and it is taken again when the form or the control is
   * marked pristine, on `save()`, `reset()`, `discard()` and on `markPristine()` of the registration. A page that
   * loads another record into the same form calls `markPristine()` once the record is in.
   */
  readonly dirty?: 'control' | 'value';
}

export function registerSdUnsavedChangesForm<TValue extends Record<string, unknown>>(
  service: SdUnsavedChangesService,
  form: FormGroup,
  options: SdUnsavedChangesFormOptions<TValue>
): SdUnsavedChangesRegistration {
  let snapshot = cloneValue(form.getRawValue()) as TValue;
  const valueMode = options.dirty === 'value';
  // why: `<sd-*>` fields join the form in an effect after this call and write their model with `emitEvent: false`;
  // some of them write a user edit without marking the control dirty, or mark it only after the value. The saved
  // value of a control is therefore not tied to its dirty flag: it is read once the task that added the control
  // ends (its model is in by then), and again whenever the form or the control is marked pristine.
  const pending = new Set<string>();
  let settleQueued = false;
  const keyOf = (control: AbstractControl): string | undefined => {
    let current: AbstractControl | null = control;
    while (current && current.parent !== form) current = current.parent;
    return current ? Object.entries(form.controls).find(([, child]) => child === current)?.[0] : undefined;
  };
  const takeBaseline = (keys: Iterable<string>): void => {
    if (!valueMode) return;
    const value = form.getRawValue() as Record<string, unknown>;
    const baseline = snapshot as Record<string, unknown>;
    for (const key of keys) {
      if (key in form.controls) baseline[key] = cloneValue(value[key]);
      pending.delete(key);
    }
  };
  const readFormDirty = (): boolean => {
    if (!valueMode) return form.dirty;
    const value = form.getRawValue() as Record<string, unknown>;
    const baseline = snapshot as Record<string, unknown>;
    return Object.keys(form.controls).some(key => !pending.has(key) && !sameValue(value[key], baseline[key]));
  };
  const dirty = signal(readFormDirty());
  const settle = (): void => {
    settleQueued = false;
    takeBaseline([...pending]);
    dirty.set(readFormDirty());
  };
  const trackControls = (event?: ControlEvent): void => {
    const baseline = snapshot as Record<string, unknown>;
    for (const key of Object.keys(baseline)) {
      if (!(key in form.controls)) delete baseline[key];
    }
    for (const key of Object.keys(form.controls)) {
      if (!(key in baseline) && !pending.has(key)) pending.add(key);
    }
    // `form.events` reports the form's own pristine state, with the control that changed it as source.
    if (event instanceof PristineChangeEvent) {
      const key = event.source === form ? undefined : keyOf(event.source);
      if (event.pristine) takeBaseline(event.source === form ? Object.keys(form.controls) : key === undefined ? [] : [key]);
      // A field that marks dirty before writing (as Angular's value accessors do) still holds the value before
      // the edit: a control that joined in this very task gets that value as its saved value.
      else if (key !== undefined && pending.has(key)) takeBaseline([key]);
    }
    if (pending.size && !settleQueued) {
      settleQueued = true;
      queueMicrotask(settle);
    }
  };
  if (valueMode) trackControls();
  const subscription = form.events.subscribe(event => {
    if (valueMode) trackControls(event);
    dirty.set(readFormDirty());
  });
  const resetToSnapshot = (): void => {
    form.reset(cloneValue(snapshot));
    form.markAsPristine();
    takeBaseline(Object.keys(form.controls));
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
      pending.clear();
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
        takeBaseline(Object.keys(form.controls));
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
        takeBaseline(Object.keys(form.controls));
        dirty.set(false);
      }
      return true;
    },
    cleanup: () => subscription.unsubscribe(),
  });
  if (!valueMode) return registration;
  // why: in value mode `markPristine()` means "the current value is saved": the form keeps reporting later edits.
  // The registry's own `markPristine()` pins the registration clean until a prompt resets it.
  return {
    ...registration,
    markPristine: () => {
      snapshot = cloneValue(form.getRawValue()) as TValue;
      pending.clear();
      form.markAsPristine();
      dirty.set(false);
    },
  };
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
