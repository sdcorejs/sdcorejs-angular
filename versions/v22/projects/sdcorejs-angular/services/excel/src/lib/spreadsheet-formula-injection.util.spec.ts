import { neutralizeSpreadsheetFormula } from './spreadsheet-formula-injection.util';

describe('neutralizeSpreadsheetFormula', () => {
  it('prefixes spreadsheet formula injection strings with a single quote', () => {
    ["=cmd|' /C calc'!A0", '+SUM(A1:A2)', '-HYPERLINK("http://evil")', '@SUM(A1:A2)', '\t=cmd', '\r=cmd', '\n=cmd'].forEach(value => {
      expect(neutralizeSpreadsheetFormula(value)).toBe(`'${value}`);
    });
  });

  it('keeps safe strings, already-neutralized strings, and non-string values unchanged', () => {
    expect(neutralizeSpreadsheetFormula('Nguyen Van A')).toBe('Nguyen Van A');
    expect(neutralizeSpreadsheetFormula("'=already-safe")).toBe("'=already-safe");
    expect(neutralizeSpreadsheetFormula(-42)).toBe(-42);
    expect(neutralizeSpreadsheetFormula(null)).toBeNull();
    expect(neutralizeSpreadsheetFormula(undefined)).toBeUndefined();
  });
});
