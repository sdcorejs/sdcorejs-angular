import { SdDateTimePickerAdapter } from './time-picker.adapter';

describe('SdDateTimePickerAdapter', () => {
  const adapter = new SdDateTimePickerAdapter();

  it('uses a fixed local calendar anchor only inside the picker value', () => {
    const pickerValue = adapter.toPickerValue('23:45');

    expect(pickerValue.getFullYear()).toBe(2000);
    expect(pickerValue.getMonth()).toBe(0);
    expect(pickerValue.getDate()).toBe(1);
    expect(pickerValue.getHours()).toBe(23);
    expect(pickerValue.getMinutes()).toBe(45);
  });

  it('converts picker dates back to canonical time-only strings', () => {
    const pickerValue = new Date(2035, 10, 20, 9, 5, 42);

    expect(adapter.fromPickerValue(pickerValue)).toBe('09:05');
  });

  it('falls back to midnight for an absent or invalid model value', () => {
    expect(adapter.toPickerValue(null).getHours()).toBe(0);
    expect(adapter.toPickerValue('invalid').getMinutes()).toBe(0);
  });

  it('rejects invalid picker dates', () => {
    expect(adapter.fromPickerValue(new Date(Number.NaN))).toBeNull();
  });
});
