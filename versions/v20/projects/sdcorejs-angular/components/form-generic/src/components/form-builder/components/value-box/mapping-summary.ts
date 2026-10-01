import type { SdFormGenericFill, SdFormGenericParam, SdFormGenericValueRef } from '../../../../models/form-generic-field.model';
import { sdIsField, sdIsGroup } from '../../../../models/form-generic-schema';
import type { SdFormGenericPageElement, SdFormGenericVariable } from '../../../../models/form-generic-schema.model';

/** Một dòng của khung xem ánh xạ `tên = giá trị` (tham số catalog/html/upload, fill). */
export interface MappingRow {
  readonly name: string;
  readonly value: string;
}

/** Nhãn hiển thị theo key: field (kể cả trong group) rồi tới biến của form. */
export const referenceLabels = (
  elements: readonly SdFormGenericPageElement[] | undefined,
  variables: readonly SdFormGenericVariable[] | undefined
): ReadonlyMap<string, string> => {
  const labels = new Map<string, string>();
  for (const element of elements ?? []) {
    const fields = sdIsGroup(element) ? (element.elements ?? []) : [element];
    for (const field of fields) if (sdIsField(field) && field.key) labels.set(field.key, field.label || field.key);
  }
  for (const variable of variables ?? []) {
    if (variable?.key && !labels.has(variable.key)) labels.set(variable.key, variable.label || variable.key);
  }
  return labels;
};

/** Chữ hiển thị của một tham chiếu giá trị: nhãn field, nhãn biến (có tiền tố) hoặc hằng số. */
export const valueRefText = (ref: SdFormGenericValueRef | undefined, labels: ReadonlyMap<string, string>, variablePrefix = ''): string => {
  if (!ref) return '';
  if ('field' in ref) return labels.get(ref.field) ?? ref.field;
  if ('variable' in ref) return `${variablePrefix}${labels.get(ref.variable) ?? ref.variable}`;
  return `${ref.value ?? ''}`;
};

/** Dòng của danh sách tham số, theo thứ tự khai báo. */
export const paramRows = (
  params: readonly SdFormGenericParam[] | null | undefined,
  labels: ReadonlyMap<string, string>,
  nameOf: (name: string) => string = name => name,
  variablePrefix = ''
): MappingRow[] =>
  (params ?? [])
    .filter(param => !!param?.name)
    .map(param => ({ name: nameOf(param.name), value: valueRefText(param.value, labels, variablePrefix) }));

/** Dòng của `fill`: `field đích = thuộc tính của mục catalog`. */
export const fillRows = (
  fill: readonly SdFormGenericFill[] | null | undefined,
  labels: ReadonlyMap<string, string>,
  fromLabel: (from: string) => string = from => from
): MappingRow[] =>
  (fill ?? [])
    .filter(item => !!item?.field && !!item.from)
    .map(item => ({ name: labels.get(item.field) ?? item.field, value: fromLabel(item.from) }));

/** Toàn văn cho tooltip. */
export const mappingText = (rows: readonly MappingRow[]): string => rows.map(row => `${row.name} = ${row.value}`).join('\n');
