const DANGEROUS_SPREADSHEET_FORMULA_PREFIX = /^[=+\-@\t\r\n]/;

/**
 * Prefix spreadsheet formula-like strings so exported files treat them as text.
 */
export function neutralizeSpreadsheetFormula(value: string): string;
export function neutralizeSpreadsheetFormula<T>(value: T): T;
export function neutralizeSpreadsheetFormula(value: unknown): unknown {
  if (typeof value !== 'string' || value === '' || value.startsWith("'")) {
    return value;
  }

  return DANGEROUS_SPREADSHEET_FORMULA_PREFIX.test(value) ? `'${value}` : value;
}
