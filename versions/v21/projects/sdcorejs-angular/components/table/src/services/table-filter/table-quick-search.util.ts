import { isSignal } from '@angular/core';
import { FilterUtilities, Utilities } from '@sdcorejs/utils/fns';
import type { Filter } from '@sdcorejs/utils/models';
import type { SdTableOptionQuickSearch, SdTableQuickSearchFilterValue, SdTableQuickSearchValue } from './table-quick-search.model';

export const hasQuickSearchValue = (value: SdTableQuickSearchFilterValue): boolean =>
  Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== '';

export const sameQuickSearchValue = (left: SdTableQuickSearchFilterValue, right: SdTableQuickSearchFilterValue): boolean =>
  Array.isArray(left) && Array.isArray(right)
    ? left.length === right.length && left.every((value, index) => value === right[index])
    : left === right;

export const initialQuickSearchValue = (option: SdTableOptionQuickSearch, cached?: SdTableQuickSearchValue): SdTableQuickSearchValue => {
  const filters: SdTableQuickSearchValue['filters'] = {};
  for (const item of option.filters || []) {
    // why: tenant dùng chung phải thắng cache riêng của màn; null là clear có chủ đích.
    const value = isSignal(item.default)
      ? item.default()
      : cached && Object.prototype.hasOwnProperty.call(cached.filters || {}, item.field)
        ? cached.filters[item.field]
        : item.default;
    filters[item.field] = Array.isArray(value) ? [...value] : value;
  }
  return { term: cached?.term?.trim() || '', filters };
};

export const quickSearchValid = (option: SdTableOptionQuickSearch | undefined, value: SdTableQuickSearchValue | undefined): boolean =>
  (option?.filters || []).every(item => !item.required || hasQuickSearchValue(value?.filters?.[item.field]));

export const quickSearchConditions = (
  option: SdTableOptionQuickSearch | undefined,
  value: SdTableQuickSearchValue | undefined,
  fieldMapping: Record<string, string> = {}
): Filter[] => {
  if (!option || !value) return [];
  const filters: Filter[] = [];
  for (const item of option.filters || []) {
    const data = value.filters?.[item.field];
    if (!hasQuickSearchValue(data)) continue;
    filters.push({
      field: fieldMapping[item.field] || item.field,
      operator: Array.isArray(data) ? 'IN' : item.defaultOperator || 'EQUAL',
      data,
    } as Filter);
  }
  const term = value.term?.trim();
  const fields = [
    ...[...new Set(option.containFields || [])].filter(Boolean).map(field => ({ field, operator: 'CONTAIN' as const })),
    ...[...new Set(option.equalFields || [])].filter(Boolean).map(field => ({ field, operator: 'EQUAL' as const })),
  ];
  if (term && fields.length) {
    filters.push({
      operator: 'OR',
      data: fields.map(item => ({ field: fieldMapping[item.field] || item.field, operator: item.operator || 'CONTAIN', data: term })),
    });
  }
  return filters;
};

export const matchesQuickSearch = <T>(
  data: T,
  option: SdTableOptionQuickSearch | undefined,
  value: SdTableQuickSearchValue | undefined
): boolean => {
  if (!option || !value) return true;
  const dropdowns = quickSearchConditions({ ...option, containFields: [], equalFields: [] }, value);
  if (!FilterUtilities.match(dropdowns, data)) return false;
  const term = value.term?.trim().toLowerCase();
  const fields = [
    ...(option.containFields || []).map(field => ({ field, exact: false })),
    ...(option.equalFields || []).map(field => ({ field, exact: true })),
  ];
  return (
    !term ||
    !fields.length ||
    fields.some(({ field, exact }) => {
      const raw = Utilities.getNestedValue(data, field);
      if (raw == null) return false;
      const text = String(raw).toLowerCase();
      return exact ? text === term : text.includes(term);
    })
  );
};
