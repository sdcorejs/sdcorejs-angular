import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { deferred } from '../../../testing/schedule-testing';
import { SdCalendarLoader } from './calendar-loader';
import { SdCalendarOperation, sdCalendarAllows, sdCalendarCallMove, type SdCalendarMoveOutcome } from './calendar-move';

describe('sd-calendar pipeline pieces', () => {
  describe('sdCalendarCallMove', () => {
    const request = (aborted = false): { signal: AbortSignal } => {
      const controller = new AbortController();
      if (aborted) controller.abort();
      return { signal: controller.signal };
    };
    const outcome = (
      result: () => boolean | 'cancel' | void | Promise<boolean | 'cancel' | void>,
      aborted = false
    ): SdCalendarMoveOutcome | null => {
      let value: SdCalendarMoveOutcome | null = null;
      void sdCalendarCallMove(result, request(aborted)).then(answer => (value = answer));
      flushMicrotasks();
      return value;
    };

    it('[CAL-SC-09] classifies true and nothing as accepted, false as rejected, "cancel" as cancelled, a throw as error', fakeAsync(() => {
      const error = new Error('x');
      expect(outcome(() => true)).toEqual({ kind: 'accepted' });
      expect(outcome(() => undefined)).toEqual({ kind: 'accepted' });
      expect(outcome(() => Promise.resolve(false))).toEqual({ kind: 'rejected' });
      expect(outcome(() => 'cancel')).toEqual({ kind: 'cancelled' });
      expect(
        outcome(() => {
          throw error;
        })
      ).toEqual({ kind: 'error', error });
      expect(outcome(() => Promise.reject(error))).toEqual({ kind: 'error', error });
    }));

    it('[CAL-SC-15] reports any answer after the abort as aborted', fakeAsync(() => {
      expect(outcome(() => true, true)).toEqual({ kind: 'aborted' });
      expect(outcome(() => Promise.reject(new Error('late')), true)).toEqual({ kind: 'aborted' });
    }));

    it('[CAL-SC-06] allows by default and evaluates a predicate with its context', () => {
      expect(sdCalendarAllows(undefined, 1)).toBeTrue();
      expect(sdCalendarAllows(false, 1)).toBeFalse();
      expect(sdCalendarAllows((value: number) => value > 0, 1)).toBeTrue();
      expect(sdCalendarAllows((value: number) => value > 0, 0)).toBeFalse();
    });
  });

  describe('SdCalendarOperation', () => {
    it('[CAL-SC-14] runs one operation at a time and aborts by kind', () => {
      const operation = new SdCalendarOperation<'create' | 'move'>();
      const first = operation.begin('move');
      expect(first).not.toBeNull();
      expect(operation.begin('create')).toBeNull();
      expect([operation.busy(), operation.kind()]).toEqual([true, 'move']);
      expect(operation.abort(['create'])).toBeFalse();
      const stale = new AbortController().signal;
      operation.end(stale);
      expect(operation.busy()).toBeTrue();
      expect(operation.abort(['move'])).toBeTrue();
      expect(first?.aborted).toBeTrue();
      expect(operation.abort()).toBeFalse();
      const second = operation.begin('create');
      operation.end(second!);
      expect([operation.busy(), operation.kind()]).toEqual([false, null]);
    });
  });

  describe('SdCalendarLoader', () => {
    it('[CAL-SC-23] keeps the items for the same key, clears them for a new key and drops a late result', fakeAsync(() => {
      const loader = new SdCalendarLoader<number>();
      const errors: unknown[] = [];
      void loader.load(
        'a',
        () => [1, 2],
        error => errors.push(error)
      );
      flushMicrotasks();
      expect([loader.items(), loader.phase(), loader.everLoaded()]).toEqual([[1, 2], 'idle', true]);
      const late = deferred<readonly number[]>();
      void loader.load(
        'a',
        () => late.promise,
        error => errors.push(error)
      );
      expect([loader.items(), loader.phase()]).toEqual([[1, 2], 'reloading']);
      void loader.load(
        'b',
        () => [3],
        error => errors.push(error)
      );
      expect(loader.items()).toEqual([]);
      flushMicrotasks();
      late.resolve([9]);
      flushMicrotasks();
      expect(loader.items()).toEqual([3]);
      void loader.load(
        'c',
        () => JSON.parse('null'),
        error => errors.push(error)
      );
      flushMicrotasks();
      expect(loader.items()).toEqual([]);
      expect(errors).toEqual([]);
    }));

    it('[CAL-SC-24] clears the items and reports a real failure only', fakeAsync(() => {
      const loader = new SdCalendarLoader<number>();
      const errors: unknown[] = [];
      void loader.load(
        'a',
        () => [1],
        error => errors.push(error)
      );
      flushMicrotasks();
      void loader.load(
        'a',
        () => Promise.reject('down'),
        error => errors.push(error)
      );
      flushMicrotasks();
      expect([loader.items(), loader.phase(), errors]).toEqual([[], 'error', ['down']]);
      const slow = deferred<readonly number[]>();
      void loader.load(
        'a',
        () => slow.promise,
        error => errors.push(error)
      );
      loader.abort();
      slow.reject('late');
      flushMicrotasks();
      expect(errors).toEqual(['down']);
    }));
  });
});
