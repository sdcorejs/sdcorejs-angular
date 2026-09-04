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

  // why: `interval(1000)` cũ không bao giờ complete — N dòng trong list = N timer + N lượt
  // change-detection mỗi giây, vĩnh viễn, kể cả khi output đã là chuỗi ngày tĩnh.
  // (fakeAsync sẽ báo "timer(s) still in the queue" ở cuối test nếu observable còn treo timer.)
  it('completes immediately without starting a timer when the value is already past the window', fakeAsync(() => {
    const past = new Date(Date.now() - 2 * 60 * 1000); // 2 phút, vượt ngưỡng 'second' (60s)
    let completed = false;
    const emissions: string[] = [];

    pipe.transform(past, 'dd/MM/yyyy', 'second').subscribe({
      next: value => emissions.push(value),
      complete: () => (completed = true),
    });

    expect(completed).toBeTrue();
    expect(emissions.length).toBe(1);
    expect(emissions[0]).not.toContain('ago');
  }));

  it('emits the final static format and completes once the relative window is crossed', fakeAsync(() => {
    // 58 giây tuổi: còn trong ngưỡng 'second' (60s) nên vẫn tick, và sẽ vượt ngưỡng sau 2 tick.
    const past = new Date(Date.now() - 58 * 1000);
    const emissions: string[] = [];
    let completed = false;

    pipe.transform(past, 'dd/MM/yyyy', 'second').subscribe({
      next: value => emissions.push(value),
      complete: () => (completed = true),
    });

    tick(1000); // 59s — vẫn tương đối
    expect(completed).toBeFalse();
    expect(emissions[emissions.length - 1]).toContain('ago');

    tick(1000); // 60s — chạm ngưỡng: phát nốt bản tuyệt đối rồi complete
    expect(completed).toBeTrue();
    expect(emissions[emissions.length - 1]).not.toContain('ago');

    // Không còn timer nào: tick thêm cũng không sinh emission mới.
    const countAfterComplete = emissions.length;
    tick(5000);
    expect(emissions.length).toBe(countAfterComplete);
  }));

  it('keeps ticking while the value is still inside the window', fakeAsync(() => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 giờ, còn trong ngưỡng 'day'
    const emissions: string[] = [];
    let completed = false;

    const sub = pipe.transform(past, 'dd/MM/yyyy', 'day').subscribe({
      next: value => emissions.push(value),
      complete: () => (completed = true),
    });

    tick(3000);
    expect(emissions.length).toBe(3);
    expect(completed).toBeFalse();
    sub.unsubscribe();
  }));
});
