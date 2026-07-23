export interface SdTimeParts {
  readonly hour: number;
  readonly minute: number;
}

export interface SdTimeConstraints {
  readonly min?: string | null;
  readonly max?: string | null;
  /** Minute increment. Non-positive and non-finite values disable step validation. */
  readonly step?: number | null;
}

export type SdTimeValidationError = 'time' | 'min' | 'max' | 'step';

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Parses a time-only string without constructing a Date or applying a timezone. */
export function sdParseTime(value: unknown): SdTimeParts | null {
  if (typeof value !== 'string') return null;
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/** Converts a valid time-only value to the canonical `HH:mm` representation. */
export function sdNormalizeTime(value: unknown): string | null {
  const parsed = sdParseTime(value);
  if (!parsed) return null;
  return `${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`;
}

/** Returns minutes since midnight for ordering and range validation. */
export function sdTimeToMinutes(value: unknown): number | null {
  const parsed = sdParseTime(value);
  return parsed ? parsed.hour * 60 + parsed.minute : null;
}

/** Validates syntax, inclusive boundaries, and minute-step alignment. */
export function sdValidateTime(value: unknown, constraints: SdTimeConstraints = {}): SdTimeValidationError | null {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return null;

  const minutes = sdTimeToMinutes(value);
  if (minutes === null) return 'time';

  const minMinutes = sdTimeToMinutes(constraints.min);
  if (minMinutes !== null && minutes < minMinutes) return 'min';

  const maxMinutes = sdTimeToMinutes(constraints.max);
  if (maxMinutes !== null && minutes > maxMinutes) return 'max';

  const step = constraints.step;
  if (typeof step === 'number' && Number.isFinite(step) && step > 0) {
    const base = minMinutes ?? 0;
    if ((minutes - base) % step !== 0) return 'step';
  }

  return null;
}
