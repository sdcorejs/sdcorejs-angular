import type { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import type { SdTableColumn } from '../../models/table-column.model';

type SortDateTime = Pick<SdDateTimeService, 'timeZone' | 'parse'>;

const sortValue = (value: unknown, type: SdTableColumn['type'], dateTime?: SortDateTime): string | number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (type === 'number') {
    const number = typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' ? Number(value) : NaN;
    return Number.isNaN(number) ? null : number;
  }
  if (type === 'date' || type === 'datetime' || type === 'time') {
    // why: a time of day has no zone, so only date/datetime values are read in the configured zone.
    const zone = type !== 'time' && dateTime && dateTime.timeZone !== 'local' ? dateTime : undefined;
    const parse = (input: string | number) => (zone ? (zone.parse(input)?.getTime() ?? NaN) : new Date(input).getTime());
    const time = value instanceof Date ? value.getTime() : typeof value === 'string' || typeof value === 'number' ? parse(value) : NaN;
    return Number.isNaN(time) ? null : time;
  }
  return String(value);
};

/**
 * Internal local-sort comparison; intentionally not exported from the table entry point.
 * `dateTime` reads zone-less dates in `ISdCoreConfiguration.timeZone`; omitted or `'local'` keeps the machine zone.
 */
export const compareLocalValues = (
  a: unknown,
  b: unknown,
  type: SdTableColumn['type'],
  direction: 'ASC' | 'DESC',
  dateTime?: SortDateTime
): number => {
  const first = sortValue(a, type, dateTime);
  const second = sortValue(b, type, dateTime);
  // why: xếp rỗng trước khi xét chiều để DESC vẫn giữ rỗng ở cuối và không đảo các dòng bằng nhau.
  if (first === null) return second === null ? 0 : 1;
  if (second === null) return -1;
  const order = first < second ? -1 : first > second ? 1 : 0;
  return direction === 'DESC' ? -order : order;
};
