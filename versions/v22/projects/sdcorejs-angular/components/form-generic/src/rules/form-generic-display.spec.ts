import type { SdFormGenericField } from '../models/form-generic-field.model';
import { SD_FORM_GENERIC_PASSWORD_MASK, sdDisplayValue } from './form-generic-display';

const field = (extra: Record<string, unknown>) => ({ id: 'f', key: 'k', label: 'L', ...extra }) as unknown as SdFormGenericField;
const localIso = (...parts: [number, number, number, number?, number?]) =>
  new Date(parts[0], parts[1], parts[2], parts[3] ?? 0, parts[4] ?? 0).toISOString();

// why: expectations mirror what ComponentViewedPipe returned before the schema rewrite (AC-016).
describe('form generic display value', () => {
  it('shows the empty marker for a missing value', () => {
    expect(sdDisplayValue(field({ type: 'textfield' }), undefined)).toBe('--');
    expect(sdDisplayValue(field({ type: 'number' }), null)).toBe('--');
  });

  it('shows text as is and the empty marker for an empty string', () => {
    expect(sdDisplayValue(field({ type: 'textfield' }), 'Lan')).toBe('Lan');
    expect(sdDisplayValue(field({ type: 'textarea' }), '')).toBe('--');
  });

  it('always masks a password', () => {
    expect(sdDisplayValue(field({ type: 'textfield', subtype: 'password' }), 'secret')).toBe(SD_FORM_GENERIC_PASSWORD_MASK);
    expect(sdDisplayValue(field({ type: 'textfield', subtype: 'password' }), '')).toBe('--');
  });

  it('shows a number without preset with the 3 decimals its input allows, never padded', () => {
    expect(sdDisplayValue(field({ type: 'number' }), 1.234)).toBe('1.234');
    expect(sdDisplayValue(field({ type: 'number' }), 5)).toBe('5');
  });

  it('formats numbers by preset with the configured number format', () => {
    expect(sdDisplayValue(field({ type: 'number' }), 1234.5)).toBe('1,234.5');
    expect(sdDisplayValue(field({ type: 'number', subtype: 'integer' }), 12)).toBe('12');
    expect(sdDisplayValue(field({ type: 'number', subtype: 'currency' }), 1500000)).toBe('1,500,000 VND');
    expect(sdDisplayValue(field({ type: 'number', subtype: 'currency', currency: 'USD' }), 1500000)).toBe('1,500,000 USD');
    expect(sdDisplayValue(field({ type: 'number', subtype: 'percent' }), 12.5)).toBe('12.5 %');
    expect(sdDisplayValue(field({ type: 'number', subtype: 'decimal' }), 1234.5, { numberFormat: '1.234.567,89' })).toBe('1.234,5');
  });

  it('formats dates and date-times as dd/MM/yyyy and dd/MM/yyyy HH:mm', () => {
    expect(sdDisplayValue(field({ type: 'datetime', subtype: 'date' }), localIso(2026, 8, 30))).toBe('30/09/2026');
    expect(sdDisplayValue(field({ type: 'datetime' }), localIso(2026, 8, 30))).toBe('30/09/2026');
    expect(sdDisplayValue(field({ type: 'datetime', subtype: 'datetime' }), localIso(2026, 8, 30, 10, 4))).toBe('30/09/2026 10:04');
  });

  it('joins chips and formats calendar chips', () => {
    expect(sdDisplayValue(field({ type: 'chip-string' }), ['a', '', 'b'])).toBe('a, b');
    expect(sdDisplayValue(field({ type: 'chip-string' }), [])).toBe('--');
    expect(sdDisplayValue(field({ type: 'chip-calendar' }), [localIso(2026, 8, 30), localIso(2026, 9, 1)])).toBe('30/09/2026, 01/10/2026');
  });

  it('shows static option labels in option order', () => {
    const options = {
      source: 'static',
      items: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
      ],
    };
    expect(sdDisplayValue(field({ type: 'select', options }), 'b')).toBe('Beta');
    expect(sdDisplayValue(field({ type: 'select', options, multiple: true }), ['b', 'a'])).toBe('Alpha, Beta');
    expect(sdDisplayValue(field({ type: 'radio', options }), 'x')).toBe('--');
    expect(sdDisplayValue(field({ type: 'select', options }), [])).toBe('--');
  });

  it('shows catalog labels supplied by the caller', () => {
    const options = { source: 'catalog', catalog: 'cities' };
    const labels = { '79': 'Hồ Chí Minh', '1': 'Hà Nội' };
    expect(sdDisplayValue(field({ type: 'select', options, multiple: true }), ['79', '1'], { labels })).toBe('Hồ Chí Minh, Hà Nội');
    expect(sdDisplayValue(field({ type: 'select', options }), '79')).toBe('--');
  });

  it('returns an empty string for fields without a text view', () => {
    expect(sdDisplayValue(field({ type: 'checkbox' }), true)).toBe('');
    expect(sdDisplayValue(field({ type: 'upload' }), [{ name: 'a.pdf' }])).toBe('');
    expect(sdDisplayValue({ id: 'h', type: 'html', label: 'H' } as SdFormGenericField, 'x')).toBe('');
  });
});
