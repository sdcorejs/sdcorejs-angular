import { sdNormalizeTimeRange, sdValidateTimeRange } from './time-range-value';

describe('time-range value contract', () => {
  it('normalizes both populated endpoints to canonical time-only strings', () => {
    expect(sdNormalizeTimeRange({ from: '9:05', to: '17:30' })).toEqual({ from: '09:05', to: '17:30' });
  });

  it('preserves explicit null endpoints for open ranges', () => {
    expect(sdNormalizeTimeRange({ from: null, to: '17:30' })).toEqual({ from: null, to: '17:30' });
  });

  it('rejects malformed endpoint values', () => {
    expect(sdNormalizeTimeRange({ from: '25:00', to: '17:30' })).toBeNull();
    expect(sdValidateTimeRange({ from: '08:00', to: '17:99' })).toBe('toTime');
  });

  it('requires both endpoints when required is enabled', () => {
    expect(sdValidateTimeRange(null, { required: true })).toBe('required');
    expect(sdValidateTimeRange({ from: '08:00', to: null }, { required: true, allowOpenEnded: true })).toBe('required');
  });

  it('reports incomplete optional ranges unless open-ended mode is enabled', () => {
    const value = { from: '08:00', to: null };
    expect(sdValidateTimeRange(value)).toBe('incomplete');
    expect(sdValidateTimeRange(value, { allowOpenEnded: true })).toBeNull();
  });

  it('rejects start values after end values', () => {
    expect(sdValidateTimeRange({ from: '18:00', to: '08:00' })).toBe('range');
  });

  it('applies min/max/step constraints to each populated endpoint', () => {
    const constraints = { min: '08:00', max: '18:00', step: 15 };
    expect(sdValidateTimeRange({ from: '07:45', to: '17:00' }, constraints)).toBe('fromMin');
    expect(sdValidateTimeRange({ from: '08:00', to: '18:15' }, constraints)).toBe('toMax');
    expect(sdValidateTimeRange({ from: '08:10', to: '17:00' }, constraints)).toBe('fromStep');
    expect(sdValidateTimeRange({ from: '08:15', to: '18:00' }, constraints)).toBeNull();
  });
});
