import { fakeAsync, tick } from '@angular/core/testing';
import { SdTimeDifferentPipe } from './time-different.pipe';

describe('SdTimeDifferentPipe', () => {
  let pipe: SdTimeDifferentPipe;

  beforeEach(() => {
    pipe = new SdTimeDifferentPipe();
  });

  it('emits empty string for a null date', done => {
    pipe.transform(null, 'dd/MM/yyyy', 'day').subscribe(result => {
      expect(result).toBe('');
      done();
    });
  });

  it('emits empty string for an undefined date', done => {
    pipe.transform(undefined, 'dd/MM/yyyy', 'day').subscribe(result => {
      expect(result).toBe('');
      done();
    });
  });

  it('emits empty string for an invalid date string', done => {
    pipe.transform('not-a-date', 'dd/MM/yyyy', 'day').subscribe(result => {
      expect(result).toBe('');
      done();
    });
  });

  it('emits formatted date string for a future date', done => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day ahead
    pipe.transform(futureDate, 'dd/MM/yyyy', 'day').subscribe(result => {
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      done();
    });
  });

  it('emits time-relative string for a past date within the "day" threshold', fakeAsync(() => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    let emittedValue: string | undefined;

    const sub = pipe.transform(past, 'dd/MM/yyyy', 'day').subscribe(result => {
      emittedValue = result;
    });

    tick(1000); // trigger first interval emission
    expect(emittedValue).toContain('ago');
    sub.unsubscribe();
  }));

  it('emits formatted date string when past date exceeds the "second" threshold', fakeAsync(() => {
    // Date is 2 minutes old — exceeds "second" (60s) threshold, so falls back to toFormat
    const past = new Date(Date.now() - 2 * 60 * 1000);
    let emittedValue: string | undefined;

    const sub = pipe.transform(past, 'dd/MM/yyyy', 'second').subscribe(result => {
      emittedValue = result;
    });

    tick(1000);
    // 2min > maxSecond (60s), so should return a formatted date string, not "X ago"
    expect(emittedValue).not.toContain('ago');
    sub.unsubscribe();
  }));
});
