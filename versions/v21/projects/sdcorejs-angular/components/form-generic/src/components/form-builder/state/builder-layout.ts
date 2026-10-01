import type { SdFormGenericBreakpoint } from '../../../configurations/form-generic-breakpoints';
import { SD_FORM_GENERIC_COLUMNS, sdPackRows, sdResolveSpan, sdWithNewRow, sdWithSpan } from '../../../layout/form-generic-layout';
import type { SdFormGenericLayout } from '../../../models/form-generic-field.model';
import { sdStableStringify } from '../../../models/form-generic-schema';
import { BuilderDocument, BuilderItem, childrenOf, ContainerId, indexDocument, isGroup, withChildren } from './builder-document';

/**
 * Thuật toán bố cục của builder — THUẦN, không phụ thuộc DOM/Angular.
 *
 * Hàng lấy từ `sdPackRows` — cùng hàm renderer dùng — nên hàng trên canvas = hàng khi render ở cùng
 * mức. Khi người dùng muốn "hàng mới" mà luật tự nhiên sẽ dồn phần tử lên hàng trước, `planDrop` bật
 * `layout.newRow` của phần tử đó: hàng tạo trong editor vì thế round-trip qua schema.
 *
 * Indicator khi kéo và lệnh commit dùng CHUNG `planDrop` → thứ nhìn thấy là thứ được lưu.
 */

/** Mức bố cục đang thiết kế (Desktop | Tablet | Mobile). */
export type LayoutMode = SdFormGenericBreakpoint;

export const GRID_COLUMNS = SD_FORM_GENERIC_COLUMNS;

/**
 * Số cột tối thiểu còn trống để một field MỚI (từ palette) được thả "cùng hàng". Field mới chiếm
 * đúng phần còn trống của hàng — không co field nào khác.
 */
export const MIN_INLINE_SPAN = 3;

/** Độ rộng tạm thời khi đang kéo resize (chưa commit). */
export interface SpanOverride {
  readonly id: string;
  readonly span: number;
  readonly mode: LayoutMode;
}

export const layoutOf = (item: BuilderItem | null | undefined): SdFormGenericLayout | undefined =>
  item && !isGroup(item) ? (item as { layout?: SdFormGenericLayout }).layout : undefined;

/** Bản sao với `layout` mới; layout rỗng thì bỏ hẳn thuộc tính (schema không mang `layout: {}`). */
export const withLayout = (item: BuilderItem, layout: SdFormGenericLayout): BuilderItem => {
  const next = { ...item } as BuilderItem & { layout?: SdFormGenericLayout };
  if (Object.keys(layout).length) next.layout = layout;
  else delete next.layout;
  return next;
};
const withNewRow = (item: BuilderItem, newRow: boolean): BuilderItem =>
  isGroup(item) ? item : withLayout(item, sdWithNewRow(layoutOf(item), newRow));

/** Số cột phần tử chiếm ở `mode`: group luôn 12; field theo kế thừa span của `sdResolveSpan`. */
export const itemSpan = (item: BuilderItem, mode: LayoutMode = 'desktop', override?: SpanOverride | null): number => {
  if (isGroup(item)) return GRID_COLUMNS;
  if (override && override.id === item.id && override.mode === mode) return override.span;
  return sdResolveSpan(layoutOf(item), mode);
};

/** Một hàng logic của canvas. */
export interface LayoutRow {
  /** Khoá ổn định: id phần tử đầu tiên của hàng. */
  readonly key: string;
  readonly kind: 'fields' | 'group';
  readonly items: readonly BuilderItem[];
  /** Tổng số cột đã dùng. */
  readonly used: number;
}

/** Chia một vùng chứa thành các hàng bằng `sdPackRows` (kèm span tạm khi đang resize). */
export const buildRows = (items: readonly BuilderItem[], mode: LayoutMode = 'desktop', override?: SpanOverride | null): LayoutRow[] => {
  const present = items.filter((item): item is BuilderItem => !!item);
  const original = new Map<BuilderItem, BuilderItem>();
  const effective = present.map(item => {
    const next =
      override && override.id === item.id && override.mode === mode && !isGroup(item)
        ? withLayout(item, sdWithSpan(layoutOf(item), mode, override.span))
        : item;
    original.set(next, item);
    return next;
  });
  return sdPackRows(effective, mode).map(row => {
    const members = row.map(cell => original.get(cell.element) ?? cell.element);
    return {
      key: members[0].id,
      kind: row.length === 1 && isGroup(members[0]) ? 'group' : 'fields',
      items: members,
      used: row.reduce((sum, cell) => sum + cell.span, 0),
    };
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Drop intent & planning
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Ý định thả, gắn vào id ỔN ĐỊNH của tài liệu hiện tại (không phải toạ độ):
 * - `row`: thành một hàng mới đứng trước hàng `beforeRowKey` (`null` = cuối vùng chứa).
 * - `inline`: vào hàng `rowKey`, đứng trước `beforeItemId` (`null` = cuối hàng).
 */
export type DropIntent =
  | { readonly kind: 'row'; readonly parentId: ContainerId; readonly beforeRowKey: string | null }
  | { readonly kind: 'inline'; readonly parentId: ContainerId; readonly rowKey: string; readonly beforeItemId: string | null };

/** Thứ đang được thả: phần tử mới (từ palette) hoặc phần tử có sẵn (theo id). */
export type DragSubject = { readonly kind: 'new'; readonly item: BuilderItem } | { readonly kind: 'move'; readonly id: string };

export type DropRejectReason = 'not-found' | 'nested-group' | 'row-full' | 'invalid';

export interface DropPlan {
  readonly doc: BuilderDocument;
  /** id của phần tử được thả (mới hoặc di chuyển). */
  readonly itemId: string;
  /** `false` khi thả đúng chỗ cũ — không tạo bước history. */
  readonly changed: boolean;
  /** Số `newRow` được bật để giữ đúng hàng mà người dùng chỉ định. */
  readonly insertedRowStarts: number;
}

export type DropResult = { readonly ok: true; readonly plan: DropPlan } | { readonly ok: false; readonly reason: DropRejectReason };

/**
 * Hai dãy phần tử cùng nội dung không. why: chỉ so sâu phần tử KHÁC tham chiếu — `planDrop` chạy mỗi
 * lần đích kéo đổi, stringify cả vùng chứa 300 field tốn ~10 ms mỗi lần.
 */
const sameSequence = (left: readonly BuilderItem[], right: readonly BuilderItem[]): boolean =>
  left.length === right.length &&
  left.every((item, index) => item === right[index] || sdStableStringify(comparable(item)) === sdStableStringify(comparable(right[index])));

/** `layout: {}` (JSON của consumer) và không có `layout` là cùng một bố cục — `withLayout` bỏ layout rỗng. */
const comparable = (item: BuilderItem): BuilderItem => {
  const layout = layoutOf(item);
  return layout && !Object.keys(layout).length ? withLayout(item, {}) : item;
};

/** Hàng chứa `id` trong danh sách hàng. */
const rowOf = (rows: readonly LayoutRow[], id: string): LayoutRow | undefined => rows.find(row => row.items.some(item => item.id === id));

/** Hàng chứa `subjectId` có đúng tập thành viên `expected` không. */
const rowMembersEqual = (rows: readonly LayoutRow[], subjectId: string, expected: ReadonlySet<string>): boolean => {
  const row = rowOf(rows, subjectId);
  if (!row || row.kind !== 'fields') return false;
  if (row.items.length !== expected.size) return false;
  return row.items.every(item => expected.has(item.id));
};

/** Phần tử tại `index` có bắt đầu một hàng không (hết danh sách coi như có). */
const startsRow = (sequence: readonly BuilderItem[], rows: readonly LayoutRow[], index: number): boolean => {
  const next = sequence[index];
  if (!next) return true;
  const row = rowOf(rows, next.id);
  return !!row && row.key === next.id;
};

/** Phần tử đầu của hàng ngay SAU hàng chứa `id` (kèm key hàng đó). */
const rowStartAfter = (rows: readonly LayoutRow[], id: string): { readonly id: string; readonly rowKey: string } | null => {
  const index = rows.findIndex(row => row.items.some(member => member.id === id));
  const next = index >= 0 ? rows[index + 1] : undefined;
  return next?.items[0] ? { id: next.items[0].id, rowKey: next.key } : null;
};

/**
 * Bảo đảm phần tử tại `index` bắt đầu một hàng (bật `newRow` nếu nó sẽ bị dồn lên hàng trước).
 * Sửa `sequence` tại chỗ (mảng tạm của command). Trả số `newRow` đã bật.
 */
export const ensureRowStart = (sequence: BuilderItem[], index: number, mode: LayoutMode = 'desktop'): number => {
  if (index <= 0 || index >= sequence.length) return 0;
  if (startsRow(sequence, buildRows(sequence, mode), index)) return 0;
  sequence[index] = withNewRow(sequence[index], true);
  return 1;
};

/** Giữ `keep` ở đầu hàng trong `sequence`. Trả số `newRow` đã bật. */
const keepRowStart = (sequence: BuilderItem[], keep: { readonly id: string } | null, mode: LayoutMode): number => {
  if (!keep) return 0;
  const position = sequence.findIndex(candidate => candidate.id === keep.id);
  return position > 0 ? ensureRowStart(sequence, position, mode) : 0;
};

/**
 * Lập kế hoạch thả — dùng cho CẢ indicator lúc kéo và commit. Trả tài liệu mới hoặc lý do từ chối.
 * Không bao giờ co field khác để nhét vừa: hàng không đủ cột → `row-full`.
 */
export const planDrop = (doc: BuilderDocument, intent: DropIntent, subject: DragSubject, mode: LayoutMode = 'desktop'): DropResult => {
  const index = indexDocument(doc);
  const moving = subject.kind === 'move' ? index.get(subject.id) : undefined;
  if (subject.kind === 'move' && !moving) return { ok: false, reason: 'not-found' };
  const item = subject.kind === 'move' ? moving!.item : subject.item;
  if (!item?.id) return { ok: false, reason: 'invalid' };
  if (subject.kind === 'new' && index.has(item.id)) return { ok: false, reason: 'invalid' };

  const parentId = intent.parentId;
  if (parentId !== null) {
    const parent = index.get(parentId);
    if (!parent || !isGroup(parent.item) || parent.parentId !== null) return { ok: false, reason: 'not-found' };
    // Group không lồng group; group cũng không thể thả vào chính nó.
    if (isGroup(item) || parentId === item.id) return { ok: false, reason: 'nested-group' };
  }
  if (isGroup(item) && intent.kind === 'inline') return { ok: false, reason: 'invalid' };

  // why: vào hàng có sẵn thì cờ `newRow` cũ sẽ tách phần tử khỏi hàng đó — bỏ đi; các phương án bên
  // dưới tự bật lại khi cần. Thành hàng mới thì giữ nguyên cờ.
  let placed = intent.kind === 'inline' ? withNewRow(item, false) : item;
  const sameContainer = !!moving && moving.parentId === parentId;
  // why: phần tử rời hàng của nó thì hàng NGAY SAU có thể "dồn lên" chỗ trống (vd [A6 S6] [C6] → kéo S
  // đi, C nhảy lên cạnh A) dù người dùng không động tới hàng đó. Giữ nguyên đầu hàng ấy.
  const sourceRows = moving ? buildRows(childrenOf(doc, moving.parentId), mode) : [];
  const keep = moving ? rowStartAfter(sourceRows, item.id) : null;
  // why: phần tử đang MỞ hàng của nó thì phần tử kế tiếp trong hàng thành đầu hàng khi nó rời đi — cũng
  // không được dồn lên hàng trước (vd [X6] [S6^ B6] → kéo S đi, B không được nhảy lên cạnh X).
  const ownRow = rowOf(sourceRows, item.id);
  const ownNext = ownRow && ownRow.key === item.id && ownRow.items.length > 1 ? { id: ownRow.items[1].id, rowKey: ownRow.key } : null;
  let keptStarts = 0;
  // why: gỡ khỏi vùng NGUỒN trước, rồi mới dựng vùng đích từ tài liệu đã gỡ — dựng đích từ `doc` cũ
  // thì group cũ (còn chứa phần tử) ghi đè bước gỡ và phần tử xuất hiện ở cả hai nơi.
  let base = doc;
  if (moving && !sameContainer) {
    const trimmed = childrenOf(doc, moving.parentId).filter(candidate => candidate.id !== item.id);
    keptStarts = keepRowStart(trimmed, ownNext, mode) + keepRowStart(trimmed, keep, mode);
    base = withChildren(doc, moving.parentId, trimmed);
  }
  const original = childrenOf(base, parentId);
  const originalRows = buildRows(original, mode);
  const withoutSubject = original.filter(candidate => candidate.id !== item.id);

  const positionOf = (id: string) => withoutSubject.findIndex(candidate => candidate.id === id);
  let insertAt: number;
  let expectedRow: Set<string> | null = null;
  if (intent.kind === 'row') {
    if (intent.beforeRowKey === null) insertAt = withoutSubject.length;
    else {
      const row = originalRows.find(candidate => candidate.key === intent.beforeRowKey);
      if (!row) return { ok: false, reason: 'not-found' };
      const members = row.items.filter(member => member.id !== item.id);
      // Hàng chỉ có chính phần tử đang kéo → "trước hàng này" = đúng chỗ cũ của nó.
      insertAt = members.length ? positionOf(members[0].id) : sameContainer ? moving!.index : withoutSubject.length;
    }
  } else {
    const row = originalRows.find(candidate => candidate.key === intent.rowKey);
    if (!row || row.kind !== 'fields') return { ok: false, reason: 'not-found' };
    const others = row.items.filter(member => member.id !== item.id);
    const used = others.reduce((sum, member) => sum + itemSpan(member, mode), 0);
    const available = GRID_COLUMNS - used;
    if (subject.kind === 'new' && !isGroup(item)) {
      // Field mới chiếm đúng phần còn trống của hàng ở mức đang xem (tối thiểu MIN_INLINE_SPAN cột).
      if (available < MIN_INLINE_SPAN) return { ok: false, reason: 'row-full' };
      placed = withLayout(placed, sdWithSpan(layoutOf(placed), mode, available));
    } else if (used + itemSpan(item, mode) > GRID_COLUMNS) return { ok: false, reason: 'row-full' };
    if (intent.beforeItemId && intent.beforeItemId !== item.id) {
      insertAt = positionOf(intent.beforeItemId);
      if (insertAt < 0 || !others.some(member => member.id === intent.beforeItemId)) return { ok: false, reason: 'not-found' };
    } else if (intent.beforeItemId === item.id) {
      insertAt = sameContainer ? moving!.index : withoutSubject.length;
    } else {
      const last = others[others.length - 1];
      insertAt = last ? positionOf(last.id) + 1 : sameContainer ? moving!.index : withoutSubject.length;
    }
    expectedRow = new Set([...others.map(member => member.id), item.id]);
  }
  if (insertAt < 0) return { ok: false, reason: 'not-found' };

  // Thử lần lượt từ ít cờ nhất: bật `newRow` cho phần tử được thả, và cho (row) bật / (inline) tắt
  // `newRow` của phần tử ngay sau nó. Lấy phương án đầu tiên cho đúng bố cục người dùng chỉ định.
  const variants: [boolean, boolean][] = [
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ];
  let chosen: { sequence: BuilderItem[]; starts: number } | null = null;
  for (const [startPlaced, adjustNext] of variants) {
    const sequence = [...withoutSubject];
    sequence.splice(insertAt, 0, startPlaced ? withNewRow(placed, true) : placed);
    const following = sequence[insertAt + 1];
    if (adjustNext) {
      if (!following) continue;
      sequence[insertAt + 1] = withNewRow(following, intent.kind === 'row');
    }
    // Chèn vào đầu chính hàng được giữ (trước phần tử đầu của nó) thì phần tử được kéo thành đầu hàng.
    const headOf = (held: { readonly id: string; readonly rowKey: string } | null) =>
      intent.kind === 'inline' && held && intent.rowKey === held.rowKey && intent.beforeItemId === held.id ? item.id : held?.id;
    const ownNextId = headOf(ownNext);
    const keepId = headOf(keep);
    const kept = sameContainer
      ? (ownNextId ? keepRowStart(sequence, { id: ownNextId }, mode) : 0) + (keepId ? keepRowStart(sequence, { id: keepId }, mode) : 0)
      : 0;
    const rows = buildRows(sequence, mode);
    let valid: boolean;
    if (intent.kind === 'row') {
      const row = rowOf(rows, item.id);
      const alone = !!row && row.items.length === 1 && row.items[0].id === item.id;
      valid = alone && startsRow(sequence, rows, insertAt + 1);
    } else {
      valid = rowMembersEqual(rows, item.id, expectedRow!);
    }
    if (valid) {
      chosen = { sequence, starts: (startPlaced ? 1 : 0) + (adjustNext && intent.kind === 'row' ? 1 : 0) + kept + keptStarts };
      break;
    }
  }
  if (!chosen) return { ok: false, reason: intent.kind === 'inline' ? 'row-full' : 'invalid' };

  const next = withChildren(base, parentId, chosen.sequence);
  const changed = !(sameContainer && sameSequence(original, chosen.sequence));
  return {
    ok: true,
    plan: { doc: changed ? next : doc, itemId: item.id, changed, insertedRowStarts: chosen.starts },
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// Hit testing (hình học → intent). Toạ độ là toạ độ NỘI DUNG của vùng cuộn canvas.
// ──────────────────────────────────────────────────────────────────────────────

export interface GeoRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface GeoItem extends GeoRect {
  readonly id: string;
}

export interface GeoRow extends GeoRect {
  readonly key: string;
  readonly items: readonly GeoItem[];
}

export interface GeoContainer extends GeoRect {
  readonly parentId: ContainerId;
  readonly rows: readonly GeoRow[];
}

export interface CanvasGeometry {
  /** Vùng gốc (cả trang canvas). */
  readonly root: GeoContainer;
  /** Thân các group (vùng nhận thả bên trong group). */
  readonly groups: readonly GeoContainer[];
}

export interface HitSubject {
  readonly id?: string;
  readonly isGroup: boolean;
  readonly span: number;
  /** Field mới từ palette: thả cùng hàng được nếu còn ≥ `MIN_INLINE_SPAN` cột (nó co vừa phần trống). */
  readonly adaptive?: boolean;
}

export interface HitResult {
  readonly intent: DropIntent | null;
  /** Lý do intent bị đổi sang phương án khác (hiện gợi ý cho người dùng). */
  readonly hint?: 'row-full' | 'nested-group';
}

const inside = (rect: GeoRect, x: number, y: number) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

/** Tỉ lệ chiều cao hàng dành cho vùng "chèn hàng mới" ở mép trên/dưới. */
const ROW_EDGE_RATIO = 0.25;

/**
 * Xác định ý định thả từ toạ độ con trỏ. Chỉ MỘT kết quả cho mỗi toạ độ — không có target cạnh
 * tranh. Kết quả vẫn phải qua `planDrop` (kiểm tra lại) trước khi hiện indicator hay commit.
 */
export const hitTest = (
  geometry: CanvasGeometry,
  rowsOf: (parentId: ContainerId) => readonly LayoutRow[],
  x: number,
  y: number,
  subject: HitSubject,
  mode: LayoutMode = 'desktop'
): HitResult => {
  if (!inside(geometry.root, x, y)) return { intent: null };
  let container: GeoContainer = geometry.root;
  let hint: HitResult['hint'];
  const group = geometry.groups.find(candidate => inside(candidate, x, y));
  if (group) {
    if (subject.isGroup) hint = 'nested-group';
    else container = group;
  }
  const logicalRows = rowsOf(container.parentId);
  const geoRows = container.rows;
  if (!geoRows.length || !logicalRows.length) return { intent: { kind: 'row', parentId: container.parentId, beforeRowKey: null }, hint };

  const rowIntent = (beforeRowKey: string | null): DropIntent => ({ kind: 'row', parentId: container.parentId, beforeRowKey });
  const nextKey = (position: number) => geoRows[position + 1]?.key ?? null;

  for (let position = 0; position < geoRows.length; position += 1) {
    const geoRow = geoRows[position];
    if (y < geoRow.top) return { intent: rowIntent(geoRow.key), hint };
    if (y > geoRow.bottom) continue;
    const logical = logicalRows.find(row => row.key === geoRow.key);
    const height = Math.max(1, geoRow.bottom - geoRow.top);
    const ratio = (y - geoRow.top) / height;
    const upperHalf = ratio < 0.5;
    if (!logical || logical.kind !== 'fields' || subject.isGroup) {
      return { intent: rowIntent(upperHalf ? geoRow.key : nextKey(position)), hint };
    }
    if (ratio < ROW_EDGE_RATIO) return { intent: rowIntent(geoRow.key), hint };
    if (ratio > 1 - ROW_EDGE_RATIO) return { intent: rowIntent(nextKey(position)), hint };
    const others = logical.items.filter(item => item.id !== subject.id);
    const used = others.reduce((sum, item) => sum + itemSpan(item, mode), 0);
    const needed = subject.adaptive ? MIN_INLINE_SPAN : subject.span;
    if (used + needed > GRID_COLUMNS) {
      return { intent: rowIntent(upperHalf ? geoRow.key : nextKey(position)), hint: 'row-full' };
    }
    const geoOthers = geoRow.items.filter(item => item.id !== subject.id);
    const before = geoOthers.find(item => x < (item.left + item.right) / 2);
    return {
      intent: { kind: 'inline', parentId: container.parentId, rowKey: geoRow.key, beforeItemId: before?.id ?? null },
      hint,
    };
  }
  return { intent: rowIntent(null), hint };
};
