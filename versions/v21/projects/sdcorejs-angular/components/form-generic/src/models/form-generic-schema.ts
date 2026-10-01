import { Utilities } from '@sdcorejs/utils/fns';
import type { SdFormGenericField } from './form-generic-field.model';
import type { SdFormGenericGroup, SdFormGenericSchema } from './form-generic-schema.model';

// why: pure grammar helpers shared by the renderer and the builder — no DI, no DOM, never mutate input.

/** Type field mà phiên bản này hiểu. Type khác (thêm ở đợt sau) được giữ nguyên nhưng không render. */
export const SD_FORM_GENERIC_FIELD_TYPES: ReadonlySet<string> = new Set([
  'textfield',
  'textarea',
  'number',
  'select',
  'radio',
  'checkbox',
  'datetime',
  'chip-string',
  'chip-calendar',
  'upload',
  'html',
]);

/**
 * Key không dùng được cho field hay biến: tên thuộc tính của `Object.prototype` (`__proto__`,
 * `constructor`, `toString`…) và `prototype`. why: value là object thường — các tên này đọc ra thuộc
 * tính kế thừa thay vì giá trị, còn gán `__proto__` thì đổi prototype của object.
 */
export const SD_FORM_GENERIC_RESERVED_KEYS: ReadonlySet<string> = new Set([...Object.getOwnPropertyNames(Object.prototype), 'prototype']);

export type SdFormGenericSchemaIssueCode =
  | 'pages-missing'
  | 'schema-version'
  | 'group-nested'
  | 'break-element'
  | 'id-missing'
  | 'id-duplicate'
  | 'key-missing'
  | 'key-reserved'
  | 'key-duplicate'
  | 'key-variable-conflict';

export interface SdFormGenericSchemaIssue {
  code: SdFormGenericSchemaIssueCode;
  /** Đường dẫn trong JSON, ví dụ `pages[0].elements[2]`. */
  path: string;
  id?: string;
  key?: string;
}

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord => !!value && typeof value === 'object' && !Array.isArray(value);
const hasId = (node: JsonRecord): boolean => typeof node['id'] === 'string' && node['id'].trim() !== '';
const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const sdIsGroup = (element: unknown): element is SdFormGenericGroup => isRecord(element) && element['type'] === 'group';

export const sdIsField = (element: unknown): element is SdFormGenericField =>
  isRecord(element) && typeof element['type'] === 'string' && SD_FORM_GENERIC_FIELD_TYPES.has(element['type']);

/** Kiểm tra ngữ pháp; mảng rỗng nghĩa là hợp lệ. Type lạ không bị coi là lỗi. */
export const sdValidateSchema = (schema: unknown): SdFormGenericSchemaIssue[] => {
  if (!isRecord(schema)) return [{ code: 'pages-missing', path: 'pages' }];
  const issues: SdFormGenericSchemaIssue[] = [];
  if (Object.hasOwn(schema, 'schemaVersion')) issues.push({ code: 'schema-version', path: 'schemaVersion' });
  const pages = schema['pages'];
  if (!Array.isArray(pages) || pages.length === 0) {
    issues.push({ code: 'pages-missing', path: 'pages' });
    return issues;
  }

  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const variableKeys = new Set(
    listOf(schema['variables'])
      .filter(isRecord)
      .map(variable => variable['key'])
      .filter((key): key is string => typeof key === 'string')
  );
  listOf(schema['variables']).forEach((variable, index) => {
    const key = isRecord(variable) ? variable['key'] : undefined;
    if (typeof key === 'string' && SD_FORM_GENERIC_RESERVED_KEYS.has(key))
      issues.push({ code: 'key-reserved', path: `variables[${index}]`, key });
  });
  const visitId = (node: JsonRecord, path: string) => {
    if (!hasId(node)) {
      issues.push({ code: 'id-missing', path });
      return;
    }
    const id = node['id'] as string;
    if (seenIds.has(id)) issues.push({ code: 'id-duplicate', path, id });
    seenIds.add(id);
  };
  const visitElement = (element: unknown, path: string, insideGroup: boolean) => {
    if (!isRecord(element)) {
      issues.push({ code: 'id-missing', path });
      return;
    }
    visitId(element, path);
    if (element['type'] === 'break') issues.push({ code: 'break-element', path });
    if (element['type'] === 'group') {
      if (insideGroup) issues.push({ code: 'group-nested', path, id: element['id'] as string });
      listOf(element['elements']).forEach((child, index) => visitElement(child, `${path}.elements[${index}]`, true));
      return;
    }
    const key = element['key'];
    if (typeof key !== 'string' || key === '') {
      // why: a field that stores a value needs a key (html shows content only; unknown types decide themselves).
      if (sdIsField(element) && element['type'] !== 'html') issues.push({ code: 'key-missing', path, id: element['id'] as string });
      return;
    }
    if (SD_FORM_GENERIC_RESERVED_KEYS.has(key)) issues.push({ code: 'key-reserved', path, key });
    if (seenKeys.has(key)) issues.push({ code: 'key-duplicate', path, key });
    seenKeys.add(key);
    if (variableKeys.has(key)) issues.push({ code: 'key-variable-conflict', path, key });
  };

  pages.forEach((page, pageIndex) => {
    const path = `pages[${pageIndex}]`;
    if (!isRecord(page)) {
      issues.push({ code: 'id-missing', path });
      return;
    }
    visitId(page, path);
    listOf(page['elements']).forEach((element, index) => visitElement(element, `${path}.elements[${index}]`, false));
  });
  return issues;
};

/**
 * Bản sao đã chuẩn hoá: luôn có ít nhất một trang, trang/group/phần tử thiếu `id` — hoặc có `id` trùng
 * với phần tử đứng trước — được cấp id mới. Phần tử type lạ được giữ nguyên từng thuộc tính.
 *
 * why: id là khoá của mọi lệnh (builder) và của `@for` (renderer); hai phần tử cùng id (JSON sao chép
 * tay) làm một lệnh xoá/sửa trúng cả hai.
 */
export const sdNormalizeSchema = (
  schema: SdFormGenericSchema,
  createId: () => string = () => Utilities.randomId('id')
): SdFormGenericSchema => {
  const clone: JsonRecord = isRecord(schema) ? structuredClone(schema as unknown as JsonRecord) : {};
  const seen = new Set<string>();
  const ensureId = (node: JsonRecord) => {
    if (!hasId(node) || seen.has(node['id'] as string)) node['id'] = createId();
    seen.add(node['id'] as string);
  };
  const pages = Array.isArray(clone['pages']) && clone['pages'].length > 0 ? clone['pages'] : [{ elements: [] }];
  for (const page of pages) {
    if (!isRecord(page)) continue;
    ensureId(page);
    if (!Array.isArray(page['elements'])) page['elements'] = [];
    for (const element of page['elements'] as unknown[]) {
      if (!isRecord(element)) continue;
      ensureId(element);
      if (element['type'] !== 'group') continue;
      if (!Array.isArray(element['elements'])) element['elements'] = [];
      for (const child of element['elements'] as unknown[]) if (isRecord(child)) ensureId(child);
    }
  }
  clone['pages'] = pages;
  return clone as unknown as SdFormGenericSchema;
};

/** Mọi field (type đã biết) theo thứ tự tài liệu, kể cả field trong group. */
export const sdSchemaFields = (schema: SdFormGenericSchema | null | undefined): SdFormGenericField[] => {
  const fields: SdFormGenericField[] = [];
  for (const page of schema?.pages ?? []) {
    for (const element of page?.elements ?? []) {
      if (sdIsGroup(element)) {
        for (const child of element.elements ?? []) if (sdIsField(child)) fields.push(child);
      } else if (sdIsField(element)) {
        fields.push(element);
      }
    }
  }
  return fields;
};

/** JSON có thứ tự khoá cố định; bỏ `undefined` và hàm như `JSON.stringify`. */
export const sdStableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(item => (item === undefined ? 'null' : sdStableStringify(item))).join(',')}]`;
  const record = value as JsonRecord;
  const keys = Object.keys(record)
    .filter(key => record[key] !== undefined && typeof record[key] !== 'function')
    .sort();
  return `{${keys.map(key => `${JSON.stringify(key)}:${sdStableStringify(record[key])}`).join(',')}}`;
};

/** Hai schema cùng nội dung không (không phụ thuộc thứ tự thuộc tính). */
export const sdSameSchema = (left: unknown, right: unknown): boolean =>
  left === right || sdStableStringify(left) === sdStableStringify(right);
