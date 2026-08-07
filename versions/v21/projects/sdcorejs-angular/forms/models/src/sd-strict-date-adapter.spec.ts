import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { enUS } from 'date-fns/locale';

import { SdStrictDateFnsAdapter } from './sd-strict-date-adapter';

describe('SdStrictDateFnsAdapter', () => {
  let adapter: SdStrictDateFnsAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MAT_DATE_LOCALE, useValue: enUS }, SdStrictDateFnsAdapter],
    });
    adapter = TestBed.inject(SdStrictDateFnsAdapter);
  });

  it('parses a complete date', () => {
    const parsed = adapter.parse('22/08/1991', 'dd/MM/yyyy');

    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(1991);
  });

  it('refuses a half-typed year instead of inventing year 2', () => {
    expect(adapter.parse('11/12/2', 'dd/MM/yyyy')).toBeNull();
    expect(adapter.parse('11/12/20', 'dd/MM/yyyy')).toBeNull();
  });

  // The stock adapter falls back to parseISO, which reads "11" as a century.
  it('refuses a bare day instead of reading it as the year 1100', () => {
    expect(adapter.parse('11', 'dd/MM/yyyy')).toBeNull();
  });

  it('ignores surrounding whitespace', () => {
    expect(adapter.parse('  22/08/1991  ', 'dd/MM/yyyy')).not.toBeNull();
  });

  it('still deserializes ISO model values (untouched by the strict parse)', () => {
    const deserialized = adapter.deserialize('1991-08-22T00:00:00.000Z');

    expect(deserialized).not.toBeNull();
    expect(adapter.isValid(deserialized!)).toBeTrue();
  });

  it('still formats dates for display', () => {
    expect(adapter.format(new Date(1991, 7, 22), 'dd/MM/yyyy')).toBe('22/08/1991');
  });

  it('passes non-string values straight through', () => {
    const date = new Date(1991, 7, 22);

    expect(adapter.parse(date, 'dd/MM/yyyy')).toEqual(date);
    expect(adapter.parse(null, 'dd/MM/yyyy')).toBeNull();
  });

  it('tries every format when given a list', () => {
    expect(adapter.parse('22/08/1991', ['dd/MM/yyyy HH:mm', 'dd/MM/yyyy'])).not.toBeNull();
  });
});
