import type { SdTableColumn } from '../../models/table-column.model';

const sortValue = (value: unknown, type: SdTableColumn['type']): string | number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (type === 'number') {
    const number = typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' ? Number(value) : NaN;
    return Number.isNaN(number) ? null : number;
  }
  if (type === 'date' || type === 'datetime' || type === 'time') {
    const time =
      value instanceof Date ? value.getTime() : typeof value === 'string' || typeof value === 'number' ? new Date(value).getTime() : NaN;
    return Number.isNaN(time) ? null : time;
  }
  return String(value);
};

/** Internal local-sort comparison; intentionally not exported from the table entry point. */
export const compareLocalValues = (a: unknown, b: unknown, type: SdTableColumn['type'], direction: 'ASC' | 'DESC'): number => {
  const first = sortValue(a, type);
  const second = sortValue(b, type);
  // why: xếp rỗng trước khi xét chiều để DESC vẫn giữ rỗng ở cuối và không đảo các dòng bằng nhau.
  if (first === null) return second === null ? 0 : 1;
  if (second === null) return -1;
  const order = first < second ? -1 : first > second ? 1 : 0;
  return direction === 'DESC' ? -order : order;
};
