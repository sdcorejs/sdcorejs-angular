import {
  sdCountDecimals,
  sdIsValidPattern,
  sdNumberPrecision,
  sdNumberSuffix,
  sdTextInputSpec,
  sdTextPresetValidates,
  sdValidateNumberPreset,
  sdValidateTextPreset,
} from './form-generic-presets';

describe('form-generic presets · text', () => {
  const email = { subtype: 'email' as const };
  const phone = { subtype: 'phone' as const };
  const vnPhone = { subtype: 'phone' as const, validation: { phoneCountry: 'VN' as const } };
  const url = { subtype: 'url' as const };

  it('maps presets to semantic input attributes (no validation implied by type alone)', () => {
    expect(sdTextInputSpec(email)).toEqual({ type: 'email', inputmode: 'email', autocomplete: 'email' });
    expect(sdTextInputSpec(phone)).toEqual({ type: 'tel', inputmode: 'tel', autocomplete: 'tel' });
    expect(sdTextInputSpec(url)).toEqual({ type: 'url', inputmode: 'url', autocomplete: 'url' });
    expect(sdTextInputSpec({ subtype: 'password' })).toEqual({ type: 'password', autocomplete: 'new-password' });
    expect(sdTextInputSpec(undefined)).toEqual({ type: 'text' });
    expect(sdTextInputSpec({ subtype: 'unknown' as never })).toEqual({ type: 'text' });
  });

  it('validates email without asking for a regex; empty stays valid (required decides)', () => {
    expect(sdValidateTextPreset(email, 'name@example.com')).toBeNull();
    expect(sdValidateTextPreset(email, ' name@example.com ')).toBeNull();
    expect(sdValidateTextPreset(email, 'name@')).toEqual({ key: 'core.validator.email.error' });
    expect(sdValidateTextPreset(email, '')).toBeNull();
    expect(sdValidateTextPreset(email, null)).toBeNull();
  });

  it('accepts common phone notations, keeps + and leading 0, and rejects implausible lengths', () => {
    for (const value of ['0912345678', '0912 345 678', '+84 912 345 678', '(028) 3822-1234', '+1-555-123-4567']) {
      expect(sdValidateTextPreset(phone, value)).withContext(value).toBeNull();
    }
    for (const value of ['123', 'abc', '12345678901234567', '+84 91a 345']) {
      expect(sdValidateTextPreset(phone, value)).withContext(value).toEqual({ key: 'core.validator.phone.error' });
    }
  });

  it('enforces the Vietnam format only when configured explicitly', () => {
    expect(sdValidateTextPreset(vnPhone, '0912 345 678')).toBeNull();
    expect(sdValidateTextPreset(vnPhone, '+84912345678')).toBeNull();
    expect(sdValidateTextPreset(vnPhone, '+1 555 123 4567')).toEqual({ key: 'core.validator.vn-phone.error' });
    expect(sdValidateTextPreset(phone, '+1 555 123 4567')).toBeNull();
  });

  it('accepts only http(s) URLs', () => {
    expect(sdValidateTextPreset(url, 'https://sdcorejs.dev/docs')).toBeNull();
    expect(sdValidateTextPreset(url, 'http://example.com')).toBeNull();
    expect(sdValidateTextPreset(url, 'javascript:alert(1)')).toEqual({ key: 'core.validator.url.error' });
    expect(sdValidateTextPreset(url, 'ftp://example.com')).toEqual({ key: 'core.validator.url.error' });
    expect(sdValidateTextPreset(url, 'example.com')).toEqual({ key: 'core.validator.url.error' });
  });

  it('does not validate plain text or passwords', () => {
    expect(sdValidateTextPreset({ subtype: 'text' }, 'anything')).toBeNull();
    expect(sdValidateTextPreset({ subtype: 'password' }, 'x')).toBeNull();
  });

  it('only asks for a validator when the preset actually checks the value', () => {
    expect(sdTextPresetValidates(email)).toBeTrue();
    expect(sdTextPresetValidates(phone)).toBeTrue();
    expect(sdTextPresetValidates(url)).toBeTrue();
    expect(sdTextPresetValidates({ subtype: 'password' })).toBeFalse();
    expect(sdTextPresetValidates({ subtype: 'text' })).toBeFalse();
    expect(sdTextPresetValidates(undefined)).toBeFalse();
  });
});

describe('form-generic presets · number', () => {
  it('derives precision and suffix from the preset (legacy number keeps the control default)', () => {
    expect(sdNumberPrecision({ subtype: 'integer', precision: 4 })).toBe(0);
    expect(sdNumberPrecision({ subtype: 'decimal' })).toBe(2);
    expect(sdNumberPrecision({ subtype: 'decimal', precision: 4 })).toBe(4);
    expect(sdNumberPrecision({ subtype: 'currency' })).toBe(0);
    expect(sdNumberPrecision({ subtype: 'percent' })).toBe(2);
    expect(sdNumberPrecision({})).toBeUndefined();
    expect(sdNumberSuffix({ subtype: 'currency' })).toBe('VND');
    expect(sdNumberSuffix({ subtype: 'currency', currency: 'USD' })).toBe('USD');
    expect(sdNumberSuffix({ subtype: 'percent' })).toBe('%');
    expect(sdNumberSuffix({ subtype: 'decimal' })).toBeUndefined();
  });

  it('treats 0 as a value, null/empty as empty, and checks integers/decimals', () => {
    const integer = { subtype: 'integer' as const };
    const decimal = { subtype: 'decimal' as const, precision: 2 };
    expect(sdValidateNumberPreset(integer, 0)).toBeNull();
    expect(sdValidateNumberPreset(integer, null)).toBeNull();
    expect(sdValidateNumberPreset(integer, '')).toBeNull();
    expect(sdValidateNumberPreset(integer, 12)).toBeNull();
    expect(sdValidateNumberPreset(integer, 1.5)).toEqual({ key: 'core.component.form-generic.validator.integer' });
    expect(sdValidateNumberPreset(decimal, 1.25)).toBeNull();
    expect(sdValidateNumberPreset(decimal, 1.255)).toEqual({
      key: 'core.component.form-generic.validator.precision',
      params: { precision: 2 },
    });
    expect(sdValidateNumberPreset(decimal, 'abc')).toEqual({ key: 'core.component.form-generic.validator.number' });
    expect(sdValidateNumberPreset({}, 1.23456)).toBeNull();
  });

  it('keeps percent semantics: 10 means 10% (no conversion)', () => {
    const percent = { subtype: 'percent' as const };
    expect(sdValidateNumberPreset(percent, 10)).toBeNull();
    expect(sdValidateNumberPreset(percent, 12.5)).toBeNull();
    expect(sdCountDecimals(1e-7)).toBe(7);
    expect(sdCountDecimals(0.1 + 0.2)).toBeGreaterThan(2);
  });

  it('tells a pattern that compiles (with the ^…$ Angular adds) from one that does not', () => {
    expect(sdIsValidPattern('[A-Z]+')).toBeTrue();
    expect(sdIsValidPattern('^\\d{3}$')).toBeTrue();
    expect(sdIsValidPattern('[A-Z')).toBeFalse();
    expect(sdIsValidPattern('a(')).toBeFalse();
  });
});
