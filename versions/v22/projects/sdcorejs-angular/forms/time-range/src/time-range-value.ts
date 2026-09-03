import { SdTimeConstraints, SdTimeValidationError, sdNormalizeTime, sdTimeToMinutes, sdValidateTime } from '@sdcorejs/angular/forms/time';

export interface SdTimeRangeValue {
  readonly from?: string | null;
  readonly to?: string | null;
}

export interface SdTimeRangeConstraints extends SdTimeConstraints {
  readonly required?: boolean;
  readonly allowOpenEnded?: boolean;
}

export type SdTimeRangeValidationError =
  | 'required'
  | 'incomplete'
  | 'fromTime'
  | 'fromMin'
  | 'fromMax'
  | 'fromStep'
  | 'toTime'
  | 'toMin'
  | 'toMax'
  | 'toStep'
  | 'range';

function hasEndpoint(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function endpointError(side: 'from' | 'to', error: SdTimeValidationError): SdTimeRangeValidationError {
  const suffix = `${error.charAt(0).toUpperCase()}${error.slice(1)}` as 'Time' | 'Min' | 'Max' | 'Step';
  return `${side}${suffix}` as SdTimeRangeValidationError;
}

/** Normalizes both endpoints while retaining explicit open-ended null values. */
export function sdNormalizeTimeRange(value: SdTimeRangeValue | null | undefined): SdTimeRangeValue | null {
  if (value == null) return null;
  const from = hasEndpoint(value.from) ? sdNormalizeTime(value.from) : null;
  const to = hasEndpoint(value.to) ? sdNormalizeTime(value.to) : null;
  if ((hasEndpoint(value.from) && !from) || (hasEndpoint(value.to) && !to)) return null;
  return { from, to };
}

/** Validates endpoint syntax, openness, shared boundaries, step, and ordering. */
export function sdValidateTimeRange(
  value: SdTimeRangeValue | null | undefined,
  constraints: SdTimeRangeConstraints = {}
): SdTimeRangeValidationError | null {
  const fromPresent = hasEndpoint(value?.from);
  const toPresent = hasEndpoint(value?.to);

  if (constraints.required && (!fromPresent || !toPresent)) return 'required';
  if (!fromPresent && !toPresent) return null;
  if (!constraints.allowOpenEnded && fromPresent !== toPresent) return 'incomplete';

  if (fromPresent) {
    const error = sdValidateTime(value?.from, constraints);
    if (error) return endpointError('from', error);
  }
  if (toPresent) {
    const error = sdValidateTime(value?.to, constraints);
    if (error) return endpointError('to', error);
  }

  const fromMinutes = sdTimeToMinutes(value?.from);
  const toMinutes = sdTimeToMinutes(value?.to);
  return fromMinutes !== null && toMinutes !== null && fromMinutes > toMinutes ? 'range' : null;
}
