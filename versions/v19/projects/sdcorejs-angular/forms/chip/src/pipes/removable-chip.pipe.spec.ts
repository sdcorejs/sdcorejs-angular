import { SdRemovableChipPipe } from './removable-chip.pipe';

describe('SdRemovableChipPipe', () => {
  let pipe: SdRemovableChipPipe;

  beforeEach(() => {
    pipe = new SdRemovableChipPipe();
  });

  it('returns true when removable is boolean true', () => {
    expect(pipe.transform({ id: 1 }, true)).toBe(true);
  });

  it('returns false when removable is boolean false', () => {
    expect(pipe.transform({ id: 1 }, false)).toBe(false);
  });

  it('invokes function with the item and returns its result (true)', () => {
    const fn = jasmine.createSpy('removable').and.returnValue(true);
    const item = { id: 42 };
    expect(pipe.transform(item, fn)).toBe(true);
    expect(fn).toHaveBeenCalledOnceWith(item);
  });

  it('invokes function with the item and returns its result (false)', () => {
    const fn = jasmine.createSpy('removable').and.returnValue(false);
    const item = { id: 7 };
    expect(pipe.transform(item, fn)).toBe(false);
    expect(fn).toHaveBeenCalledOnceWith(item);
  });

  it('calls function each invocation (no caching)', () => {
    const fn = jasmine.createSpy('removable').and.returnValues(true, false, true);
    expect(pipe.transform('a', fn)).toBe(true);
    expect(pipe.transform('b', fn)).toBe(false);
    expect(pipe.transform('c', fn)).toBe(true);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn.calls.allArgs()).toEqual([['a'], ['b'], ['c']]);
  });
});
