import { SdSavedFilter } from '../../query-bar.model';

/** localStorage key of the saved filters of `key` — unchanged since the first release, so old lists still load. */
export const ɵsdSavedFiltersStorageKey = (key: string): string => `sd-query-bar:savedFilters:${key}`;

// why: chép từ `components/table/src/services/table-query-params/table-query-params.util.ts` (ISO_DATE + reviver).
// query-bar không được import components/table (sai chiều phụ thuộc) và @sdcorejs/utils chưa có helper tương đương.
// Chỉ đúng định dạng `Date#toJSON` mới đọc lại thành `Date`; chuỗi ngày người dùng gõ (`2026-11-09`) giữ là chuỗi.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const reviveDate = (_: string, value: unknown): unknown => (typeof value === 'string' && ISO_DATE.test(value) ? new Date(value) : value);

/** A list read back from storage. `error`: the stored text is not a JSON array (or storage cannot be read). */
export interface ɵSdSavedFiltersRead {
  filters: SdSavedFilter[];
  error: boolean;
}

const isSavedFilter = (value: unknown): value is SdSavedFilter => {
  if (!value || typeof value !== 'object') return false;
  const { id, name, query } = value as Partial<SdSavedFilter>;
  if (typeof id !== 'string' || !id || typeof name !== 'string' || !query || typeof query !== 'object') return false;
  return query.filters === undefined || Array.isArray(query.filters);
};

/**
 * Parses the stored list. Dates written by `JSON.stringify` come back as `Date`. Entries without `id`, `name` or `query`
 * are dropped one by one instead of losing the whole list.
 */
export function ɵsdReadSavedFilters(raw: string | null): ɵSdSavedFiltersRead {
  if (raw === null || raw === '') return { filters: [], error: false };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw, reviveDate);
  } catch {
    return { filters: [], error: true };
  }
  return Array.isArray(parsed) ? { filters: parsed.filter(isSavedFilter), error: false } : { filters: [], error: true };
}
