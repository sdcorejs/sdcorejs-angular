import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { SD_TEMPORAL_VALUE_TRANSFORMS } from '@sdcorejs/angular/forms/models';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import {
  sdIsApiContractDataType,
  SD_API_CONTRACT_DATA_TYPES,
  type SdApiContractDataType,
  type SdApiContractDiagnostic,
} from '../api-contract.model';
import {
  addSdApiContractProperty,
  changeSdApiContractNodeType,
  createSdApiContractNode,
  formatSdApiContractPointer,
  getSdApiContractNodeAt,
  removeSdApiContractProperty,
  renameSdApiContractProperty,
  setSdApiContractNodeAt,
  type SdApiContractNodePointer,
  type SdApiContractStructuralNode,
} from '../api-contract.schema';
import { SdApiContractSourceEditor } from './api-contract-source-editor.component';
import type { SdApiContractSuggestion } from './api-contract-suggestion.model';

interface SdApiContractOption {
  value: string;
  label: string;
}

interface SdApiContractChildEntry {
  key: string;
  node: SdApiContractStructuralNode;
  pointer: SdApiContractNodePointer;
}

const NO_MESSAGES: readonly SdApiContractDiagnostic[] = [];

/**
 * Recursive editor for one node tree.
 *
 * It owns the **whole** subtree rather than delegating each child to a nested instance: Angular
 * cannot list a standalone component in its own `imports` (temporal dead zone), and the alternative
 * — a child component that re-emits upward through every level — turns one keystroke into N
 * emissions. Here a `<ng-template>` recurses, every edit is an immutable write at a structural
 * pointer, and exactly one `nodeChange` leaves per user action.
 */
@Component({
  selector: 'sd-api-contract-node-editor',
  standalone: true,
  imports: [NgTemplateOutlet, SdButton, SdIcon, SdInput, SdSelect, SdTranslatePipe, SdApiContractSourceEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './api-contract-node-editor.component.html',
  styleUrl: './api-contract-node-editor.component.scss',
})
export class SdApiContractNodeEditor {
  readonly #i18n = inject(I18nService);

  node = input.required<SdApiContractStructuralNode>();
  /** Diagnostic path of the root node, e.g. `input.schema` or `req.body`. */
  basePath = input.required<string>();
  /** `declaration` hides the mapping controls; `mapping` shows the source / static editor. */
  layer = input<'declaration' | 'mapping'>('declaration');
  allowTransform = input(false, { transform: booleanAttribute });
  allowedTypes = input<readonly SdApiContractDataType[]>(SD_API_CONTRACT_DATA_TYPES);
  suggestions = input<readonly SdApiContractSuggestion[]>([]);
  diagnostics = input<readonly SdApiContractDiagnostic[]>([]);
  disabled = input(false, { transform: booleanAttribute });
  /** Caption shown in place of a name field on the root node. */
  rootTitle = input<string>('');
  /**
   * Editable key of the root node, for a record entry (`req.query.page`).
   *
   * why: the key used to live in a separate row above the node card, which put the type / required
   * columns of an entry out of line with every other row and added a nesting level for nothing.
   * Passing it down folds the whole entry into one aligned row.
   */
  rootName = input<string | null>(null);
  rootRemovable = input(false, { transform: booleanAttribute });
  autoId = input<string | null | undefined>();

  nodeChange = output<SdApiContractStructuralNode>();
  /** Root-level rename / remove, for the record editor that owns the key. */
  rootRename = output<string>();
  rootRemove = output<void>();

  protected readonly emptyPointer: SdApiContractNodePointer = [];
  protected readonly itemsTitle = this.#i18n.t('core.component.api-contract-builder.node.items');

  protected readonly pendingRemovePath = signal<string | null>(null);
  protected readonly duplicateKeyPath = signal<string | null>(null);
  readonly #pendingType = signal<{ path: string; pointer: SdApiContractNodePointer; type: SdApiContractDataType } | null>(null);
  protected readonly pendingTypePath = computed(() => this.#pendingType()?.path ?? null);

  // why: dựng một lần — `[items]` đổi tham chiếu mỗi CD sẽ đẩy sd-select vào vòng lặp markForCheck.
  // Chỉ hai lựa chọn: mặc định là KHÔNG bắt buộc. Model vẫn là tri-state (`required` vắng mặt ≡
  // không bắt buộc), nên `required: false` viết tay vẫn round-trip nguyên vẹn — chỉ là UI không sinh ra nó.
  protected readonly requiredOptions: SdApiContractOption[] = [
    { value: 'true', label: this.#i18n.t('core.component.api-contract-builder.required.true') },
    { value: 'false', label: this.#i18n.t('core.component.api-contract-builder.required.false') },
  ];

  protected readonly transformOptions: SdApiContractOption[] = [
    { value: '', label: this.#i18n.t('core.component.api-contract-builder.transform.none') },
    ...SD_TEMPORAL_VALUE_TRANSFORMS.map(transform => ({ value: transform, label: transform })),
  ];

  // why: nhãn là token API (`string`, `datetime`…) nên KHÔNG dịch — dịch sẽ làm lệch khỏi JSON.
  protected readonly typeOptions = computed<SdApiContractOption[]>(() => this.allowedTypes().map(type => ({ value: type, label: type })));

  readonly #messagesByPath = computed(() => {
    const map = new Map<string, SdApiContractDiagnostic[]>();
    for (const diagnostic of this.diagnostics()) {
      const bucket = map.get(diagnostic.path);
      if (bucket) bucket.push(diagnostic);
      else map.set(diagnostic.path, [diagnostic]);
    }
    return map;
  });

  // -------------------------------------------------------------------------
  // Template helpers
  // -------------------------------------------------------------------------

  protected pathOf(pointer: SdApiContractNodePointer): string {
    return formatSdApiContractPointer(this.basePath(), pointer);
  }

  protected messagesAt(path: string): readonly SdApiContractDiagnostic[] {
    return this.#messagesByPath().get(path) ?? NO_MESSAGES;
  }

  protected childEntries(node: SdApiContractStructuralNode, pointer: SdApiContractNodePointer): SdApiContractChildEntry[] {
    const properties = node.properties;
    if (node.type !== 'object' || !properties) return [];
    return Object.keys(properties).map(key => ({ key, node: properties[key], pointer: [...pointer, 'properties', key] }));
  }

  protected itemsPointer(pointer: SdApiContractNodePointer): SdApiContractNodePointer {
    return [...pointer, 'items'];
  }

  protected hasWholeMapping(node: SdApiContractStructuralNode): boolean {
    return this.layer() === 'mapping' && (node.source !== undefined || node.value !== undefined);
  }

  protected requiredValue(node: SdApiContractStructuralNode): string {
    return node.required === true ? 'true' : 'false';
  }

  /** A property is always removable; the root only when its owner said so (a record entry). */
  protected canRemove(parent: SdApiContractNodePointer | null): boolean {
    return parent !== null || this.rootRemovable();
  }

  /** While a destructive retype waits for confirmation the picker shows the *pending* type. */
  protected displayType(node: SdApiContractStructuralNode, path: string): string {
    const pending = this.#pendingType();
    return pending && pending.path === path ? pending.type : node.type;
  }

  protected fieldAutoId(path: string, suffix: string): string | undefined {
    const base = this.autoId();
    if (!base) return undefined;
    return `${base}-${path.replace(/[^a-zA-Z0-9]+/g, '-')}-${suffix}`;
  }

  // -------------------------------------------------------------------------
  // Edits
  // -------------------------------------------------------------------------

  protected requestType(pointer: SdApiContractNodePointer, node: SdApiContractStructuralNode, type: unknown): void {
    if (!sdIsApiContractDataType(type) || type === node.type) return;
    if (hasNestedContent(node)) {
      this.#pendingType.set({ path: this.pathOf(pointer), pointer, type });
      return;
    }
    this.#applyType(pointer, type);
  }

  protected confirmType(): void {
    const pending = this.#pendingType();
    if (!pending) return;
    this.#pendingType.set(null);
    this.#applyType(pending.pointer, pending.type);
  }

  protected cancelType(): void {
    this.#pendingType.set(null);
  }

  /** `parent === null` means the root of a record entry — removal belongs to whoever owns the key. */
  protected requestRemove(parent: SdApiContractNodePointer | null, key: string, node: SdApiContractStructuralNode, path: string): void {
    if (parent === null && !this.rootRemovable()) return;
    if (hasNestedContent(node)) {
      this.pendingRemovePath.set(path);
      return;
    }
    this.confirmRemove(parent, key);
  }

  protected confirmRemove(parent: SdApiContractNodePointer | null, key: string): void {
    this.pendingRemovePath.set(null);
    if (parent === null) {
      if (this.rootRemovable()) this.rootRemove.emit();
      return;
    }
    this.#removeAt(parent, key);
  }

  protected cancelRemove(): void {
    this.pendingRemovePath.set(null);
  }

  protected addProperty(pointer: SdApiContractNodePointer, node: SdApiContractStructuralNode): void {
    const properties = node.properties ?? {};
    let index = Object.keys(properties).length + 1;
    while (Object.prototype.hasOwnProperty.call(properties, `field${index}`)) index += 1;
    const added = addSdApiContractProperty(node, `field${index}`, createSdApiContractNode('string'));
    this.#emitAt(pointer, added);
  }

  protected renameProperty(parent: SdApiContractNodePointer | null, from: string, to: unknown): void {
    this.duplicateKeyPath.set(null);
    if (typeof to !== 'string') return;
    const trimmed = to.trim();
    if (!trimmed || trimmed === from) return;

    // why: khoá của một record entry do record editor sở hữu — nó mới thấy được các key anh em để
    // phát hiện trùng, nên rename được đẩy ngược lên thay vì xử lý tại chỗ.
    if (parent === null) {
      this.rootRename.emit(trimmed);
      return;
    }

    const parentNode = getSdApiContractNodeAt(this.node(), parent);
    if (!parentNode) return;

    const renamed = renameSdApiContractProperty(parentNode, from, trimmed);
    // why: helper trả NGUYÊN tham chiếu cũ khi trùng key — đó là tín hiệu "từ chối", không phải no-op.
    if (renamed === parentNode) {
      this.duplicateKeyPath.set(formatSdApiContractPointer(this.basePath(), [...parent, 'properties', from]));
      return;
    }
    this.#emitAt(parent, renamed);
  }

  protected setRequired(pointer: SdApiContractNodePointer, value: unknown): void {
    const node = getSdApiContractNodeAt(this.node(), pointer);
    if (!node) return;
    if (value === 'true') this.#emitAt(pointer, { ...node, required: true });
    else this.#emitAt(pointer, withoutKeys(node, ['required']));
  }

  protected setTransform(pointer: SdApiContractNodePointer, value: unknown): void {
    const node = getSdApiContractNodeAt(this.node(), pointer);
    if (!node) return;
    const transform = typeof value === 'string' ? value.trim() : '';
    if (!transform) this.#emitAt(pointer, withoutKeys(node, ['transform']));
    else this.#emitAt(pointer, { ...node, transform: transform as SdApiContractStructuralNode['transform'] });
  }

  protected setText(pointer: SdApiContractNodePointer, key: 'label' | 'description', value: unknown): void {
    const node = getSdApiContractNodeAt(this.node(), pointer);
    if (!node) return;
    const text = typeof value === 'string' ? value : '';
    if (!text) this.#emitAt(pointer, withoutKeys(node, [key]));
    else this.#emitAt(pointer, { ...node, [key]: text });
  }

  protected applyNode(pointer: SdApiContractNodePointer, node: SdApiContractStructuralNode): void {
    this.#emitAt(pointer, node);
  }

  #applyType(pointer: SdApiContractNodePointer, type: SdApiContractDataType): void {
    const node = getSdApiContractNodeAt(this.node(), pointer);
    if (!node) return;
    this.#emitAt(pointer, changeSdApiContractNodeType(node, type));
  }

  #removeAt(parent: SdApiContractNodePointer, key: string): void {
    const parentNode = getSdApiContractNodeAt(this.node(), parent);
    if (!parentNode) return;
    this.#emitAt(parent, removeSdApiContractProperty(parentNode, key));
  }

  #emitAt(pointer: SdApiContractNodePointer, node: SdApiContractStructuralNode): void {
    this.nodeChange.emit(setSdApiContractNodeAt(this.node(), pointer, node));
  }
}

function hasNestedContent(node: SdApiContractStructuralNode): boolean {
  if (node.type === 'object') return Object.keys(node.properties ?? {}).length > 0;
  if (node.type === 'array') {
    const items = node.items;
    return !!items && (items.type === 'object' || items.type === 'array');
  }
  return false;
}

function withoutKeys(node: SdApiContractStructuralNode, keys: readonly string[]): SdApiContractStructuralNode {
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(node)) {
    if (keys.includes(key)) continue;
    next[key] = (node as unknown as Record<string, unknown>)[key];
  }
  return next as unknown as SdApiContractStructuralNode;
}
