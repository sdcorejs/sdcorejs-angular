import { computed, inject, Injectable, signal } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Subject } from 'rxjs';
import { sdStableStringify } from '../../../models/form-generic-schema';
import type { SdFormGenericSchema, SdFormGenericValidation, SdFormGenericVariable } from '../../../models/form-generic-schema.model';
import { sdFindKeyReferences, sdRenameKey, type SdFormGenericKeyReference } from '../../../rules/form-generic-references';
import {
  applyVariables,
  duplicateItem,
  groupsOf,
  insertionIntentFor,
  insertItem,
  moveBy,
  moveToContainer,
  removeItem,
  setNewRow,
  setSpan,
  ungroup,
  VariableEdit,
} from './builder-commands';
import {
  BuilderDocument,
  BuilderItem,
  canDuplicate,
  childrenOf,
  collectKeys,
  ContainerId,
  documentFromSchema,
  documentToSchema,
  EMPTY_BUILDER_DOCUMENT,
  indexDocument,
  isField,
  isGroup,
  ItemLocation,
  replaceItem,
  sameDocumentContent,
} from './builder-document';
import { BuilderHistory } from './builder-history';
import { buildRows, DragSubject, DropIntent, DropResult, LayoutMode, LayoutRow, planDrop, SpanOverride } from './builder-layout';
import { PaletteItem } from './builder-palette';

export type BuilderMode = 'design' | 'preview' | 'schema';
export type BuilderViewport = LayoutMode;
export type InspectorTab = 'general' | 'data' | 'rules' | 'layout';
export type LeftTab = 'components' | 'structure';

/** Trạng thái kéo-thả tạm thời — KHÔNG phải schema, không vào history. */
export interface BuilderDragState {
  readonly subject: DragSubject;
  readonly label: string;
  readonly icon: string;
  /** Ý định đã được `planDrop` xác nhận hợp lệ; `null` = thả lúc này sẽ huỷ. */
  readonly intent: DropIntent | null;
  readonly hint?: 'row-full' | 'nested-group' | 'outside';
}

export interface CommitOptions {
  /** Gộp các lần sửa liên tiếp (vd gõ nhãn) thành một bước undo. */
  readonly coalesceKey?: string;
  /** Câu thông báo cho screen reader (aria-live). */
  readonly announce?: string;
}

/**
 * State của MỘT `<sd-form-builder>` (provide ở component → mỗi builder một instance độc lập).
 *
 * Tách bạch: `doc` là schema chuẩn duy nhất; selection/mode/viewport/kéo-thả/resize là editor state.
 * Mọi thay đổi schema đi qua `commit` (một bước history) — không nơi nào mutate `doc`.
 */
@Injectable()
export class FormBuilderStore {
  readonly #i18n = inject(I18nService);
  readonly #history = new BuilderHistory();
  readonly #historyTick = signal(0);

  readonly doc = signal<BuilderDocument>(EMPTY_BUILDER_DOCUMENT);
  readonly selectedId = signal<string | null>(null);
  readonly mode = signal<BuilderMode>('design');
  readonly viewport = signal<BuilderViewport>('desktop');
  readonly leftTab = signal<LeftTab>('components');
  readonly inspectorTab = signal<InspectorTab>('general');
  /** Group đang thu gọn TRÊN CANVAS (chỉ trình bày lúc thiết kế, không lưu vào schema). */
  readonly collapsed = signal<ReadonlySet<string>>(new Set());
  readonly drag = signal<BuilderDragState | null>(null);
  readonly resize = signal<SpanOverride | null>(null);
  /** Thông báo cho vùng aria-live. */
  readonly announcement = signal('');
  /** Yêu cầu đưa focus (mỗi yêu cầu là object mới) — shell nhận, rồi canvas focus sau khi render. */
  readonly focusRequest = signal<{ readonly id: string | null } | null>(null);

  /** Phát MỖI thay đổi schema do người dùng (commit/undo/redo) — KHÔNG phát khi nạp tài liệu. */
  readonly changes = new Subject<BuilderDocument>();

  readonly canUndo = computed(() => {
    this.#historyTick();
    return this.mode() === 'design' && this.#history.canUndo;
  });
  readonly canRedo = computed(() => {
    this.#historyTick();
    return this.mode() === 'design' && this.#history.canRedo;
  });

  readonly index = computed(() => indexDocument(this.doc()));
  readonly selected = computed<ItemLocation | null>(() => {
    const id = this.selectedId();
    return id ? (this.index().get(id) ?? null) : null;
  });
  readonly layoutMode = computed<LayoutMode>(() => this.viewport());
  readonly groups = computed(() => groupsOf(this.doc()));

  /** Hàng của vùng gốc theo viewport + độ rộng resize tạm thời. */
  readonly rootRows = computed(() => buildRows(this.doc().elements, this.layoutMode(), this.resize()));
  /** Hàng của từng group. */
  readonly groupRows = computed(() => {
    const mode = this.layoutMode();
    const override = this.resize();
    return new Map(this.groups().map(group => [group.id, buildRows(group.elements ?? [], mode, override)]));
  });

  /** Hàng của một vùng chứa (theo state hiện tại). */
  rowsOf = (parentId: ContainerId): readonly LayoutRow[] => (parentId === null ? this.rootRows() : (this.groupRows().get(parentId) ?? []));

  t = (key: string, params?: Record<string, string | number>): string => this.#i18n.t(key, params);

  // ── Tài liệu & history ─────────────────────────────────────────────────────

  /** Nạp tài liệu mới (form khác từ ngoài): reset history, selection và state tạm. Không phát `changes`. */
  load(doc: BuilderDocument): void {
    this.doc.set(doc);
    this.#history.clear();
    this.#historyTick.update(value => value + 1);
    this.selectedId.set(null);
    this.drag.set(null);
    this.resize.set(null);
    this.collapsed.set(new Set());
  }

  /** Áp tài liệu mới do người dùng thao tác — một bước undo (hoặc gộp theo `coalesceKey`). */
  commit(next: BuilderDocument, options: CommitOptions = {}): boolean {
    const current = this.doc();
    if (next === current) return false;
    this.#history.record(current, { coalesceKey: options.coalesceKey });
    this.doc.set(next);
    this.#historyTick.update(value => value + 1);
    this.#keepSelectionValid();
    if (options.announce) this.announce(options.announce);
    this.changes.next(next);
    return true;
  }

  undo(): boolean {
    if (this.mode() !== 'design') return false;
    const previous = this.#history.undo(this.doc());
    if (!previous) return false;
    this.doc.set(previous);
    this.#historyTick.update(value => value + 1);
    this.#keepSelectionValid();
    this.announce(this.t('core.component.form-builder.announce.undo'));
    this.changes.next(previous);
    return true;
  }

  redo(): boolean {
    if (this.mode() !== 'design') return false;
    const next = this.#history.redo(this.doc());
    if (!next) return false;
    this.doc.set(next);
    this.#historyTick.update(value => value + 1);
    this.#keepSelectionValid();
    this.announce(this.t('core.component.form-builder.announce.redo'));
    this.changes.next(next);
    return true;
  }

  /** Kết thúc phiên gộp history (rời ô nhập). */
  sealHistory(): void {
    this.#history.seal();
  }

  /** Xin canvas đưa focus tới phần tử `id` sau lần render kế tiếp (`null` = vùng canvas). */
  requestFocus(id: string | null): void {
    this.focusRequest.set({ id });
  }

  announce(message: string): void {
    // why: đặt rỗng rồi mới gán để cùng một câu (vd hai lần "Đã thêm Email") vẫn được đọc lại.
    this.announcement.set('');
    queueMicrotask(() => this.announcement.set(message));
  }

  // ── Selection & editor state ───────────────────────────────────────────────

  select(id: string | null): void {
    if (this.selectedId() !== id) this.#history.seal();
    this.selectedId.set(id);
  }

  setMode(mode: BuilderMode): void {
    this.drag.set(null);
    this.resize.set(null);
    this.#history.seal();
    this.mode.set(mode);
  }

  toggleCollapsed(groupId: string, collapsed?: boolean): void {
    const next = new Set(this.collapsed());
    const shouldCollapse = collapsed ?? !next.has(groupId);
    if (shouldCollapse) next.add(groupId);
    else next.delete(groupId);
    this.collapsed.set(next);
  }

  /** Mở group chứa phần tử (khi chọn từ tab Cấu trúc). */
  revealItem(id: string): void {
    const location = this.index().get(id);
    if (location?.parentId && this.collapsed().has(location.parentId)) this.toggleCollapsed(location.parentId, false);
  }

  // ── Commands ───────────────────────────────────────────────────────────────

  /** Thêm preset từ palette theo selection hiện tại (cùng semantics với kéo-thả). */
  addFromPalette(entry: PaletteItem): string | null {
    const item = this.createFromPalette(entry);
    const intent = insertionIntentFor(this.doc(), this.selectedId(), item, this.layoutMode());
    return this.#applyNew(item, intent, entry);
  }

  /** Tạo phần tử mới từ preset (chưa đưa vào tài liệu). */
  createFromPalette(entry: PaletteItem): BuilderItem {
    return entry.create({ takenKeys: collectKeys(this.doc()), t: this.t });
  }

  /** Thả theo ý định đã hiển thị. Kế hoạch được lập lại từ tài liệu HIỆN TẠI trước khi commit. */
  drop(intent: DropIntent, subject: DragSubject, label?: string): DropResult {
    const result = planDrop(this.doc(), intent, subject, this.layoutMode());
    if (result.ok && result.plan.changed) {
      const announce = subject.kind === 'new' ? 'core.component.form-builder.announce.added' : 'core.component.form-builder.announce.moved';
      this.commit(result.plan.doc, { announce: label ? this.t(announce, { label }) : undefined });
      this.select(result.plan.itemId);
    }
    return result;
  }

  remove(id: string): boolean {
    const location = this.index().get(id);
    if (!location) return false;
    const label = this.labelOf(location.item);
    // why: đọc TRƯỚC commit — commit bỏ chọn phần tử không còn tồn tại.
    const wasSelected = this.selectedId() === id;
    const siblings = this.childrenOf(location.parentId);
    const neighbour = siblings[location.index + 1] ?? siblings[location.index - 1];
    const changed = this.commit(removeItem(this.doc(), id), {
      announce: this.t('core.component.form-builder.announce.removed', { label }),
    });
    if (changed && wasSelected) this.select(location.parentId);
    // why: thẻ đang focus vừa bị huỷ — đưa focus sang phần tử bên cạnh (hoặc group cha, hoặc canvas)
    // để người dùng bàn phím không rơi về <body> và Ctrl+Z vẫn tới được builder.
    if (changed) this.requestFocus(neighbour?.id ?? location.parentId);
    return changed;
  }

  /** Nhân bản (không với phần tử type chưa hỗ trợ, hoặc group chứa nó — xem `canDuplicate`). */
  duplicate(id: string): string | null {
    if (!canDuplicate(this.index().get(id)?.item)) return null;
    const result = duplicateItem(this.doc(), id, this.layoutMode());
    if (!result.ok) return null;
    const location = this.index().get(id);
    this.commit(result.plan.doc, {
      announce: this.t('core.component.form-builder.announce.duplicated', { label: location ? this.labelOf(location.item) : '' }),
    });
    this.select(result.plan.itemId);
    return result.plan.itemId;
  }

  moveBy(id: string, delta: -1 | 1): boolean {
    return this.commit(moveBy(this.doc(), id, delta));
  }

  moveTo(id: string, parentId: ContainerId): boolean {
    const result = moveToContainer(this.doc(), id, parentId, this.layoutMode());
    if (!result.ok || !result.plan.changed) return false;
    const location = this.index().get(id);
    this.commit(result.plan.doc, {
      announce: this.t('core.component.form-builder.announce.moved', { label: location ? this.labelOf(location.item) : '' }),
    });
    if (parentId) this.revealItem(id);
    return true;
  }

  ungroup(groupId: string): boolean {
    const location = this.index().get(groupId);
    const first = location && isGroup(location.item) ? location.item.elements?.[0] : undefined;
    const changed = this.commit(ungroup(this.doc(), groupId));
    if (changed) this.requestFocus(first?.id ?? null);
    return changed;
  }

  /** Bật/tắt "Bắt đầu hàng mới" (`layout.newRow`) của phần tử. */
  setNewRow(id: string, newRow: boolean): boolean {
    return this.commit(setNewRow(this.doc(), id, newRow));
  }

  /** Span của mức `mode` (mặc định mức đang xem); `null` xoá về kế thừa. */
  setSpan(id: string, span: number | null, mode: LayoutMode = this.layoutMode()): boolean {
    return this.commit(setSpan(this.doc(), id, span, mode));
  }

  /** Cập nhật thuộc tính một phần tử. `updater` trả object MỚI (giữ `id`). */
  update(id: string, updater: (item: BuilderItem) => BuilderItem, coalesceKey?: string): boolean {
    return this.commit(replaceItem(this.doc(), id, updater), { coalesceKey });
  }

  /**
   * Đổi key (đã kiểm tra hợp lệ) + cập nhật tham chiếu có cấu trúc. Trả số tham chiếu đã cập nhật,
   * hoặc `-1` khi không đổi được (key đích đã có — không commit gì).
   */
  renameKey(id: string, nextKey: string): number {
    const item = this.index().get(id)?.item;
    const key = item && isField(item) ? item.key : undefined;
    if (!key || key === nextKey) return 0;
    const schema = documentToSchema(this.doc());
    let renamed: SdFormGenericSchema;
    try {
      renamed = sdRenameKey(schema, key, nextKey);
    } catch {
      return -1;
    }
    const updated = sdFindKeyReferences(schema, key).filter(reference => reference.kind === 'structured').length;
    this.commit(documentFromSchema(renamed));
    return updated;
  }

  /**
   * Áp mẫu của portal: `updater` đặt cấu hình của mẫu, `nextKey` (nếu có) đổi key kèm tham chiếu có
   * cấu trúc — cả hai là MỘT bước undo. Trả `false` khi không đổi được (key đích đã có).
   */
  applyTemplate(id: string, updater: (item: BuilderItem) => BuilderItem, nextKey: string | null): boolean {
    let next = replaceItem(this.doc(), id, updater);
    const item = indexDocument(next).get(id)?.item;
    const key = item && isField(item) ? item.key : undefined;
    if (nextKey && key && key !== nextKey) {
      try {
        next = documentFromSchema(sdRenameKey(documentToSchema(next), key, nextKey));
      } catch {
        return false;
      }
    }
    return this.commit(next);
  }

  /** Lưu dialog Biến: đổi key biến kéo theo tham chiếu (một bước undo); không đổi gì thì không commit. */
  saveVariables(edits: readonly VariableEdit[]): boolean {
    const next = applyVariables(this.doc(), edits);
    if (sameDocumentContent(next, this.doc())) return false;
    return this.commit(next);
  }

  /** Thay danh sách biến; cùng nội dung thì không tạo bước undo. */
  setVariables(variables: SdFormGenericVariable[]): boolean {
    if (sdStableStringify(variables) === sdStableStringify(this.doc().variables)) return false;
    return this.commit({ ...this.doc(), variables });
  }

  /** Thay validation cấp form; cùng nội dung thì không tạo bước undo. */
  setValidations(validations: SdFormGenericValidation[]): boolean {
    if (sdStableStringify(validations) === sdStableStringify(this.doc().validations)) return false;
    return this.commit({ ...this.doc(), validations });
  }

  // ── Truy vấn ───────────────────────────────────────────────────────────────

  /** Tham chiếu tới field (hoặc các field con của group) từ NƠI KHÁC — ảnh hưởng khi xoá. */
  dependentsOf(id: string): SdFormGenericKeyReference[] {
    const location = this.index().get(id);
    if (!location) return [];
    const schema = documentToSchema(this.doc());
    const owned = isGroup(location.item) ? [location.item, ...(location.item.elements ?? [])] : [location.item];
    const exclude = new Set(owned.map(item => item.id));
    return owned.flatMap(item =>
      isField(item) && item.key ? sdFindKeyReferences(schema, item.key).filter(reference => !exclude.has(reference.elementId ?? '')) : []
    );
  }

  labelOf(item: BuilderItem): string {
    const label = 'label' in item ? (item as { label?: string }).label : undefined;
    return label || ('key' in item && item.key ? `${item.key}` : this.t('core.component.form-builder.untitled'));
  }

  /** Vùng chứa của phần tử (hoặc `undefined` nếu không có). */
  parentOf(id: string): ContainerId | undefined {
    return this.index().get(id)?.parentId;
  }

  childrenOf(parentId: ContainerId): readonly BuilderItem[] {
    return childrenOf(this.doc(), parentId);
  }

  #applyNew(item: BuilderItem, intent: DropIntent, entry: PaletteItem): string | null {
    const result = insertItem(this.doc(), item, intent, this.layoutMode());
    if (!result.ok) return null;
    this.commit(result.plan.doc, {
      announce: this.t('core.component.form-builder.announce.added', { label: this.t(entry.labelKey) }),
    });
    this.select(result.plan.itemId);
    this.revealItem(result.plan.itemId);
    return result.plan.itemId;
  }

  #keepSelectionValid(): void {
    const id = this.selectedId();
    if (id && !this.index().has(id)) this.selectedId.set(null);
  }
}
