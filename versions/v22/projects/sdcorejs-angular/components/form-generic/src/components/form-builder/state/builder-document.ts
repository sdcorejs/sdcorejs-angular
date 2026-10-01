import { Utilities } from '@sdcorejs/utils/fns';
import type { SdFormGenericField } from '../../../models/form-generic-field.model';
import { sdIsField, sdIsGroup, sdNormalizeSchema, sdStableStringify } from '../../../models/form-generic-schema';
import type {
  SdFormGenericGroup,
  SdFormGenericPage,
  SdFormGenericPageElement,
  SdFormGenericSchema,
  SdFormGenericValidation,
  SdFormGenericVariable,
} from '../../../models/form-generic-schema.model';

/** Một phần tử trên canvas: field, group, hoặc phần tử type chưa hỗ trợ (giữ nguyên khi phát lại). */
export type BuilderItem = SdFormGenericPageElement;

/** Vùng chứa phần tử: `null` = trang, ngược lại là `id` của group. */
export type ContainerId = string | null;

/**
 * Nguồn schema chuẩn DUY NHẤT của builder. Được thay thế bất biến bởi các command — không component
 * nào sửa object bên trong. Selection, viewport, kéo-thả… là editor state, không nằm ở đây.
 *
 * `elements` là phần tử của trang đang thiết kế (đợt 1: trang đầu). `base` giữ phần còn lại của
 * schema (thông tin trang, các trang khác, navigation, khoá lạ) để phát lại nguyên vẹn.
 */
export interface BuilderDocument {
  readonly elements: readonly BuilderItem[];
  readonly variables: readonly SdFormGenericVariable[];
  readonly validations: readonly SdFormGenericValidation[];
  readonly base: {
    readonly page: Omit<SdFormGenericPage, 'elements'>;
    readonly otherPages: readonly SdFormGenericPage[];
    readonly rest: Readonly<Record<string, unknown>>;
  };
}

/** Vị trí của một phần tử trong tài liệu. */
export interface ItemLocation {
  readonly item: BuilderItem;
  readonly parentId: ContainerId;
  readonly index: number;
}

export const EMPTY_BUILDER_DOCUMENT: BuilderDocument = Object.freeze({
  elements: [],
  variables: [],
  validations: [],
  base: { page: { id: 'page' }, otherPages: [], rest: {} },
});

/** Schema chỉ chứa dữ liệu JSON. */
export const cloneJson = <T>(value: T): T => (value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T));

export const isGroup = (item: BuilderItem | null | undefined): item is SdFormGenericGroup => sdIsGroup(item);

/** Field thuộc type builder hiểu (không gồm group, phần tử type lạ). */
export const isField = (item: BuilderItem | null | undefined): item is SdFormGenericField => sdIsField(item);

/** Phần tử type mà phiên bản này chưa hỗ trợ — hiện thẻ "chưa hỗ trợ", giữ nguyên nội dung. */
export const isUnknown = (item: BuilderItem | null | undefined): boolean => !!item && !isGroup(item) && !isField(item);

/**
 * Nhân bản được không. why: phần tử type chưa hỗ trợ (kể cả nằm trong group) có thể mang id/key lồng
 * bên trong mà builder không biết — sao chép mù sẽ trùng chúng.
 */
export const canDuplicate = (item: BuilderItem | null | undefined): boolean =>
  !!item && !isUnknown(item) && !(isGroup(item) && (item.elements ?? []).some(child => isUnknown(child)));

export const createId = (): string => Utilities.randomId('id');

/**
 * Nạp schema từ consumer. Chuẩn hoá (clone, cấp `id` còn thiếu) — KHÔNG mutate input, không bỏ
 * thuộc tính nào, phần tử type lạ được giữ nguyên.
 */
export const documentFromSchema = (schema: SdFormGenericSchema | null | undefined): BuilderDocument => {
  const normalized = sdNormalizeSchema((schema ?? {}) as SdFormGenericSchema);
  const { pages, variables, validations, ...rest } = normalized;
  const [first, ...otherPages] = pages;
  const { elements, ...page } = first;
  return {
    elements: elements ?? [],
    variables: variables ?? [],
    validations: validations ?? [],
    base: { page, otherPages, rest },
  };
};

/** Snapshot công khai: bản clone độc lập. Mảng rỗng của biến/validation không được ghi. */
export const documentToSchema = (doc: BuilderDocument): SdFormGenericSchema => {
  const schema: SdFormGenericSchema = {
    ...cloneJson(doc.base.rest),
    pages: [{ ...cloneJson(doc.base.page), elements: cloneJson([...doc.elements]) }, ...cloneJson([...doc.base.otherPages])],
  };
  if (doc.variables.length) schema.variables = cloneJson([...doc.variables]);
  if (doc.validations.length) schema.validations = cloneJson([...doc.validations]);
  return schema;
};

/** Hai tài liệu có cùng nội dung schema không (không phụ thuộc thứ tự khoá). */
export const sameDocumentContent = (left: BuilderDocument, right: BuilderDocument): boolean =>
  left === right || sdStableStringify(documentToSchema(left)) === sdStableStringify(documentToSchema(right));

/** Chỉ mục id → vị trí (group không lồng group). */
export const indexDocument = (doc: BuilderDocument): Map<string, ItemLocation> => {
  const index = new Map<string, ItemLocation>();
  doc.elements.forEach((item, position) => {
    if (!item) return;
    index.set(item.id, { item, parentId: null, index: position });
    if (isGroup(item) && Array.isArray(item.elements)) {
      item.elements.forEach((child, childPosition) => {
        if (child) index.set(child.id, { item: child, parentId: item.id, index: childPosition });
      });
    }
  });
  return index;
};

/** Danh sách phần tử của một vùng chứa. Group không tồn tại → rỗng. */
export const childrenOf = (doc: BuilderDocument, parentId: ContainerId): readonly BuilderItem[] => {
  if (parentId === null) return doc.elements;
  const group = doc.elements.find(item => item?.id === parentId);
  return isGroup(group) && Array.isArray(group.elements) ? group.elements : [];
};

/** Thay danh sách phần tử của một vùng chứa, trả về tài liệu mới (sao chép đúng đường đi). */
export const withChildren = (doc: BuilderDocument, parentId: ContainerId, next: readonly BuilderItem[]): BuilderDocument => {
  if (parentId === null) return { ...doc, elements: [...next] };
  return {
    ...doc,
    elements: doc.elements.map(item =>
      item?.id === parentId && isGroup(item) ? { ...item, elements: [...(next as SdFormGenericGroup['elements'])] } : item
    ),
  };
};

/** Thay một phần tử theo `id` (giữ nguyên vị trí). `updater` phải trả object mới, giữ `id`. */
export const replaceItem = (doc: BuilderDocument, id: string, updater: (item: BuilderItem) => BuilderItem): BuilderDocument => {
  const location = indexDocument(doc).get(id);
  if (!location) return doc;
  const next = updater(location.item);
  if (next === location.item) return doc;
  const siblings = [...childrenOf(doc, location.parentId)];
  siblings[location.index] = { ...next, id } as BuilderItem;
  return withChildren(doc, location.parentId, siblings);
};

/**
 * Mọi `key` đang dùng: field (kể cả trong group, kể cả phần tử type lạ có key), field của các trang
 * khác (key duy nhất trong CẢ schema) và biến.
 */
export const collectKeys = (doc: BuilderDocument, exceptItemId?: string): Set<string> => {
  const keys = new Set<string>();
  const visit = (items: readonly BuilderItem[]) => {
    for (const item of items) {
      if (!item) continue;
      if (isGroup(item)) {
        visit(item.elements ?? []);
        continue;
      }
      const key = (item as { key?: unknown }).key;
      if (item.id !== exceptItemId && typeof key === 'string' && key) keys.add(key);
    }
  };
  visit(doc.elements);
  for (const page of doc.base.otherPages) visit(page?.elements ?? []);
  for (const variable of doc.variables) if (variable?.key) keys.add(variable.key);
  return keys;
};

/** `base`, `base_2`, `base_3`… — key đầu tiên chưa bị dùng. */
export const uniqueKey = (base: string, taken: ReadonlySet<string>): string => {
  const normalized = (base || 'field').replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1') || 'field';
  if (!taken.has(normalized)) return normalized;
  let counter = 2;
  while (taken.has(`${normalized}_${counter}`)) counter += 1;
  return `${normalized}_${counter}`;
};

const KEY_HASH_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const KEY_HASH_LENGTH = 6;

const keyHash = (): string => {
  const bytes = new Uint8Array(KEY_HASH_LENGTH);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return Array.from(bytes, byte => KEY_HASH_ALPHABET[byte % KEY_HASH_ALPHABET.length]).join('');
};

/**
 * Key cho field MỚI: `<loại>_<hash>` (vd `email_k3x9qa`). Loại là id preset của palette.
 *
 * why: key theo tên (`email`, `email_2`…) dễ trùng với key đã có ở form khác cùng nguồn dữ liệu,
 * và thứ tự số đổi theo lúc thêm; hash giữ key ổn định, không đụng nhau, vẫn đọc được loại trường.
 */
export const randomKey = (type: string, taken: ReadonlySet<string>): string => {
  const base = uniqueKey(type || 'field', new Set());
  let key = `${base}_${keyHash()}`;
  while (taken.has(key)) key = `${base}_${keyHash()}`;
  return key;
};

/** Key hợp lệ cho một field đổi tên: chữ/số/`_`/`-`, bắt đầu bằng chữ hoặc `_`. */
export const SD_FORM_BUILDER_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;

/** Đếm field và group — dùng cho phần tổng quan của form. */
export const countItems = (doc: BuilderDocument): { fields: number; groups: number } => {
  let fields = 0;
  let groups = 0;
  const visit = (items: readonly BuilderItem[]) => {
    for (const item of items) {
      if (!item) continue;
      if (isGroup(item)) {
        groups += 1;
        visit(item.elements ?? []);
      } else if (isField(item)) fields += 1;
    }
  };
  visit(doc.elements);
  return { fields, groups };
};
