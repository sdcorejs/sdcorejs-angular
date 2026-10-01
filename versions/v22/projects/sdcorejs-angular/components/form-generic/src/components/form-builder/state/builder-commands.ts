import { sdWithNewRow, sdWithSpan } from '../../../layout/form-generic-layout';
import type { SdFormGenericGroup, SdFormGenericSchema, SdFormGenericVariable } from '../../../models/form-generic-schema.model';
import { sdRenameKey } from '../../../rules/form-generic-references';
import {
  BuilderDocument,
  BuilderItem,
  childrenOf,
  cloneJson,
  collectKeys,
  ContainerId,
  createId,
  documentFromSchema,
  documentToSchema,
  indexDocument,
  isGroup,
  isUnknown,
  replaceItem,
  uniqueKey,
  withChildren,
} from './builder-document';
import { buildRows, DropIntent, DropResult, ensureRowStart, LayoutMode, layoutOf, planDrop, withLayout } from './builder-layout';

const LAYOUT_LEVELS: readonly LayoutMode[] = ['desktop', 'tablet', 'mobile'];

/**
 * Command thuần của builder: nhận tài liệu, trả tài liệu MỚI (không mutate). Mỗi command hoàn chỉnh
 * là một bước undo — store ghi history khi commit. Không command nào tạo phần tử `break`: xuống
 * hàng là cờ `layout.newRow` của chính phần tử.
 */

/** Ý định chèn "hàng mới ở cuối vùng chứa". */
export const endOf = (parentId: ContainerId): DropIntent => ({ kind: 'row', parentId, beforeRowKey: null });

/** Ý định chèn "hàng mới ngay sau hàng chứa `id`". */
export const rowAfter = (doc: BuilderDocument, id: string, mode: LayoutMode): DropIntent | null => {
  const location = indexDocument(doc).get(id);
  if (!location) return null;
  const rows = buildRows(childrenOf(doc, location.parentId), mode);
  const position = rows.findIndex(row => row.items.some(item => item.id === id));
  if (position < 0) return null;
  return { kind: 'row', parentId: location.parentId, beforeRowKey: rows[position + 1]?.key ?? null };
};

/**
 * Vị trí thêm phần tử khi bấm/Enter trên palette — CÙNG semantics với kéo-thả (qua `planDrop`):
 * - không chọn gì → hàng mới ở cuối form;
 * - chọn group → hàng mới ở cuối group (group mới thì đặt sau group, vì group không lồng nhau);
 * - chọn field → hàng mới ngay sau hàng chứa field (group mới trong group → sau group cha).
 */
export const insertionIntentFor = (doc: BuilderDocument, selectedId: string | null, adding: BuilderItem, mode: LayoutMode): DropIntent => {
  const location = selectedId ? indexDocument(doc).get(selectedId) : undefined;
  if (!location) return endOf(null);
  if (isGroup(location.item)) {
    return isGroup(adding) ? (rowAfter(doc, location.item.id, mode) ?? endOf(null)) : endOf(location.item.id);
  }
  if (isGroup(adding) && location.parentId !== null) return rowAfter(doc, location.parentId, mode) ?? endOf(null);
  return rowAfter(doc, location.item.id, mode) ?? endOf(location.parentId);
};

/** Thêm phần tử mới theo ý định (dùng chung với kéo từ palette). */
export const insertItem = (doc: BuilderDocument, item: BuilderItem, intent: DropIntent, mode: LayoutMode): DropResult =>
  planDrop(doc, intent, { kind: 'new', item }, mode);

/**
 * Xoá phần tử (group: xoá cả field con). Hàng xung quanh KHÔNG dồn lên ở mọi mức: phần tử kế tiếp
 * trong hàng của nó (khi nó là đầu hàng) và phần tử đầu của hàng sau vẫn mở hàng — `newRow` được bật
 * khi cần, như khi kéo phần tử đi (`planDrop`).
 */
export const removeItem = (doc: BuilderDocument, id: string): BuilderDocument => {
  const location = indexDocument(doc).get(id);
  if (!location) return doc;
  const siblings = childrenOf(doc, location.parentId);
  const next = siblings.filter(item => item.id !== id);
  for (const level of LAYOUT_LEVELS) {
    const rows = buildRows(siblings, level);
    const position = rows.findIndex(row => row.items.some(item => item.id === id));
    const row = rows[position];
    const held = [row?.key === id ? row.items[1] : undefined, rows[position + 1]?.items[0]];
    for (const item of held) {
      const index = item ? next.findIndex(candidate => candidate.id === item.id) : -1;
      if (index > 0) ensureRowStart(next, index, level);
    }
  }
  return withChildren(doc, location.parentId, next);
};

/**
 * Tách group: field con thay chỗ group ở cấp trang, giữ nguyên cấu hình; hàng trên/dưới không bị dồn
 * ở MỌI mức — group chiếm trọn hàng ở cả Desktop, Tablet và Mobile.
 */
export const ungroup = (doc: BuilderDocument, groupId: string): BuilderDocument => {
  const location = indexDocument(doc).get(groupId);
  if (!location || !isGroup(location.item) || location.parentId !== null) return doc;
  const children = [...(location.item.elements ?? [])] as BuilderItem[];
  const sequence = [...doc.elements];
  sequence.splice(location.index, 1, ...children);
  if (children.length) {
    for (const level of LAYOUT_LEVELS) {
      ensureRowStart(sequence, location.index, level);
      ensureRowStart(sequence, location.index + children.length, level);
    }
  }
  return { ...doc, elements: sequence };
};

/** Đổi chỗ với phần tử liền trước/sau trong cùng vùng chứa ("Di chuyển lên/xuống"). */
export const moveBy = (doc: BuilderDocument, id: string, delta: -1 | 1): BuilderDocument => {
  const location = indexDocument(doc).get(id);
  if (!location) return doc;
  const siblings = [...childrenOf(doc, location.parentId)];
  const target = location.index + delta;
  if (target < 0 || target >= siblings.length) return doc;
  [siblings[location.index], siblings[target]] = [siblings[target], siblings[location.index]];
  return withChildren(doc, location.parentId, siblings);
};

/** Chuyển phần tử sang vùng chứa khác (cuối group, hoặc cuối trang) — thay thế bằng nút cho kéo-thả. */
export const moveToContainer = (doc: BuilderDocument, id: string, parentId: ContainerId, mode: LayoutMode): DropResult =>
  planDrop(doc, endOf(parentId), { kind: 'move', id }, mode);

/**
 * Đặt span của MỘT mức (`null` = xoá về kế thừa). Chỉ đổi phần tử được chọn — không co field khác;
 * hàng tràn thì field sau tự xuống dòng đúng như renderer.
 */
export const setSpan = (doc: BuilderDocument, id: string, span: number | null, mode: LayoutMode): BuilderDocument =>
  replaceItem(doc, id, item => (isGroup(item) || isUnknown(item) ? item : withLayout(item, sdWithSpan(layoutOf(item), mode, span))));

/** Bật/tắt "Bắt đầu hàng mới" của một phần tử. Phần tử type chưa hỗ trợ không bị sửa. */
export const setNewRow = (doc: BuilderDocument, id: string, newRow: boolean): BuilderDocument =>
  replaceItem(doc, id, item => {
    if (isGroup(item) || isUnknown(item) || !!layoutOf(item)?.newRow === newRow) return item;
    return withLayout(item, sdWithNewRow(layoutOf(item), newRow));
  });

/** Clone phần tử với `id`/`key` mới; tham chiếu có cấu trúc NỘI BỘ bản sao trỏ về bản sao. */
export const cloneWithNewIdentity = (item: BuilderItem, takenKeys: Set<string>): BuilderItem => {
  const copy = cloneJson(item);
  const members: BuilderItem[] = isGroup(copy) ? [copy, ...(copy.elements ?? [])] : [copy];
  const renames: [string, string][] = [];
  for (const member of members) {
    member.id = createId();
    const key = (member as { key?: unknown }).key;
    if (isGroup(member) || typeof key !== 'string' || !key) continue;
    const next = uniqueKey(key.replace(/_\d+$/, '') || 'field', takenKeys);
    takenKeys.add(next);
    renames.push([key, next]);
  }
  if (!renames.length) return copy;
  // why: sdRenameKey đổi cả key lẫn mọi tham chiếu có cấu trúc — chạy trên schema tạm chỉ chứa bản
  // sao, nên tham chiếu tới field NGOÀI bản sao được giữ nguyên.
  let scratch: SdFormGenericSchema = { pages: [{ id: 'clone', elements: [copy] }] };
  for (const [from, to] of renames) scratch = sdRenameKey(scratch, from, to);
  const result = scratch.pages[0].elements[0] as BuilderItem;
  // why: sdRenameKey chỉ đổi key của field type ĐÃ BIẾT — phần tử type chưa hỗ trợ (vd trong group được
  // nhân bản) giữ key cũ và trùng với bản gốc, nên gán key mới trực tiếp.
  const renamed = new Map(renames);
  for (const member of isGroup(result) ? [result, ...(result.elements ?? [])] : [result]) {
    const record = member as { key?: unknown };
    if (isUnknown(member) && typeof record.key === 'string' && renamed.has(record.key)) record.key = renamed.get(record.key);
  }
  return result;
};

/** Nhân bản: bản sao đứng thành hàng mới ngay sau hàng của bản gốc. */
export const duplicateItem = (doc: BuilderDocument, id: string, mode: LayoutMode): DropResult => {
  const location = indexDocument(doc).get(id);
  if (!location) return { ok: false, reason: 'not-found' };
  const copy = cloneWithNewIdentity(location.item, collectKeys(doc));
  const intent = rowAfter(doc, id, mode) ?? endOf(location.parentId);
  return planDrop(doc, intent, { kind: 'new', item: copy }, mode);
};

/** Một dòng của dialog Biến: biến gốc (nếu đã có) và key/nhãn mới. */
export interface VariableEdit {
  readonly source?: SdFormGenericVariable;
  readonly key: string;
  readonly label: string;
}

/**
 * Thay danh sách biến theo các dòng của dialog (thứ tự = thứ tự dòng). Biến đổi key kéo theo mọi tham
 * chiếu có cấu trúc — như đổi mã field. Biến bị bỏ khỏi danh sách để lại tham chiếu (người dùng đã
 * xác nhận). Key mới phải đã được kiểm tra: duy nhất, không trùng key field.
 */
export const applyVariables = (doc: BuilderDocument, edits: readonly VariableEdit[]): BuilderDocument => {
  const kept = doc.variables.filter(variable => edits.some(edit => edit.source === variable));
  const renames = edits.filter(edit => edit.source?.key && edit.source.key !== edit.key);
  let schema = documentToSchema({ ...doc, variables: kept });
  if (renames.length) {
    // why: đổi qua key tạm trước — đổi chéo hai biến (a↔b) theo thứ tự sẽ đụng key còn đang dùng.
    const taken = new Set([...collectKeys(doc), ...edits.map(edit => edit.key)]);
    const temporary = renames.map(() => {
      const key = uniqueKey('_sd_variable', taken);
      taken.add(key);
      return key;
    });
    renames.forEach((edit, index) => (schema = sdRenameKey(schema, edit.source!.key, temporary[index])));
    renames.forEach((edit, index) => (schema = sdRenameKey(schema, temporary[index], edit.key)));
  }
  const variables = edits.map(edit => ({ ...(edit.source ?? {}), key: edit.key, label: edit.label }));
  return { ...documentFromSchema(schema), variables };
};

/** Danh sách group (cấp trang) — đích cho "Chuyển vào nhóm". */
export const groupsOf = (doc: BuilderDocument): SdFormGenericGroup[] => doc.elements.filter(isGroup) as SdFormGenericGroup[];
