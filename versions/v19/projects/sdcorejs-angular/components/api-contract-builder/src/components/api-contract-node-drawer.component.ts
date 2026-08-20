import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SD_API_CONTRACT_DATA_TYPES, type SdApiContractDataType } from '../api-contract.model';
import {
  addSdApiContractProperty,
  changeSdApiContractNodeType,
  cloneSdApiContractNode,
  createSdApiContractNode,
  getSdApiContractNodeAt,
  removeSdApiContractProperty,
  renameSdApiContractProperty,
  setSdApiContractNodeAt,
  type SdApiContractNodePointer,
  type SdApiContractStructuralNode,
} from '../api-contract.schema';
import { SdApiContractNodeSummary } from './api-contract-node-summary.component';
import { SdApiContractSourceEditor } from './api-contract-source-editor.component';
import type { SdApiContractSuggestion } from './api-contract-suggestion.model';

/** What the drawer hands back when the author closes the books on one node. */
export interface SdApiContractNodeCommit {
  name: string;
  node: SdApiContractStructuralNode;
}

/**
 * A layer list asking for the drawer to be opened.
 *
 * The list does not own the drawer — the builder does, so there is exactly one drawer and one staged
 * draft on the page. The list only says which node the author reached for; the builder knows which
 * section that list was wired into and applies the commit there.
 */
export interface SdApiContractNodeEditRequest {
  /** `null` means "add a new node to this collection". */
  name: string | null;
  node: SdApiContractStructuralNode | null;
  /** Names already taken at this level, so the drawer can refuse a duplicate. */
  siblingNames: readonly string[];
  /**
   * Where the listed collection sits inside its layer root — `[]` for an object layer, `['items']`
   * for an array layer whose fields belong to the element.
   *
   * why cần: drawer không dùng field này, nhưng builder thì có. Một tầng `array` (vd `output.schema`
   * nhận `${res.body.items}`) khai field ở `items.properties`, còn tầng `object` khai ở `properties`.
   * Danh sách đã biết mình đang đọc chỗ nào, nên nó nói ra thay vì để builder đoán lại.
   */
  pointer?: readonly string[];
}

interface SdApiContractOption {
  value: string;
  label: string;
}

/**
 * Editing surface for exactly one node, staged and committed in one go.
 *
 * The layer lists outside are read-only, so this drawer is the only place a node changes. It holds a
 * DEEP COPY of the node it was seeded from and emits `nodeCommit` once, when the author saves — that
 * is what makes "Huỷ" able to actually cancel, and what keeps the tree from changing under the
 * author's cursor on every keystroke.
 *
 * Save is blocked only for the two problems that stop a node from existing at all: no name, or a name
 * a sibling already holds. Everything else — a reference to a field that does not exist yet, a type
 * that will not fit — saves and is reported by `validateSdApiContract`, because inventing rules here
 * would stop an author declaring one end of a mapping before the other exists.
 */
@Component({
  selector: 'sd-api-contract-node-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, SdInput, SdSelect, SdApiContractNodeSummary, SdApiContractSourceEditor, SdTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _autoId = autoId();
    @let _current = current();
    @let _nameError = nameError();

    <sd-side-drawer
      #drawer
      width="560px"
      disableBackdropClose
      [title]="title()"
      [autoId]="_autoId"
      [beforeClose]="closeGuard"
      (sdClosed)="onClosed()">
      @if (_current) {
        <div class="sd-acb-drawer">
          @let _breadcrumb = breadcrumb();
          @if (_breadcrumb.length > 1) {
            <nav class="sd-acb-drawer__crumbs" [attr.aria-label]="title()">
              @for (crumb of _breadcrumb; track $index) {
                @if ($index < _breadcrumb.length - 1) {
                  <button
                    type="button"
                    class="sd-acb-drawer__crumb"
                    [attr.data-autoid]="_autoId ? _autoId + '-crumb-' + $index : null"
                    (click)="backTo($index)">
                    {{ crumb }}
                  </button>
                  <span class="sd-acb-drawer__crumb-sep">›</span>
                } @else {
                  <span class="sd-acb-drawer__crumb sd-acb-drawer__crumb--current">{{ crumb }}</span>
                }
              }
            </nav>
          }

          <sd-input
            size="sm"
            [autoId]="_autoId ? _autoId + '-name' : undefined"
            [label]="'core.component.api-contract-builder.node.name' | sdTranslate"
            [model]="currentName()"
            [inlineError]="_nameError ?? undefined"
            (sdChange)="setName($event)"></sd-input>

          <sd-select
            size="sm"
            hideInlineError
            [clearable]="false"
            [autoId]="_autoId ? _autoId + '-type' : undefined"
            [label]="'core.component.api-contract-builder.node.type' | sdTranslate"
            [items]="typeOptions"
            valueField="value"
            displayField="label"
            [model]="_current.type"
            (sdChange)="setType($event)"></sd-select>

          <sd-select
            size="sm"
            hideInlineError
            [clearable]="false"
            [autoId]="_autoId ? _autoId + '-required' : undefined"
            [label]="'core.component.api-contract-builder.node.required' | sdTranslate"
            [items]="requiredOptions"
            valueField="value"
            displayField="label"
            [model]="_current.required === true ? 'true' : 'false'"
            (sdChange)="setRequired($event)"></sd-select>

          <sd-input
            size="sm"
            hideInlineError
            [autoId]="_autoId ? _autoId + '-label' : undefined"
            [label]="'core.component.api-contract-builder.node.label' | sdTranslate"
            [model]="_current.label ?? ''"
            (sdChange)="setText('label', $event)"></sd-input>

          <sd-input
            size="sm"
            hideInlineError
            [autoId]="_autoId ? _autoId + '-description' : undefined"
            [label]="'core.component.api-contract-builder.node.description' | sdTranslate"
            [model]="_current.description ?? ''"
            (sdChange)="setText('description', $event)"></sd-input>

          @if (allowTransform() && (_current.type === 'date' || _current.type === 'datetime')) {
            <sd-select
              size="sm"
              hideInlineError
              [clearable]="false"
              [autoId]="_autoId ? _autoId + '-transform' : undefined"
              [label]="'core.component.api-contract-builder.node.transform' | sdTranslate"
              [items]="transformOptions"
              valueField="value"
              displayField="label"
              [model]="_current.transform ?? ''"
              (sdChange)="setTransform($event)"></sd-select>
          }

          @if (layer() === 'mapping') {
            <sd-api-contract-source-editor
              [node]="_current"
              [suggestions]="suggestions()"
              [autoId]="_autoId ? _autoId + '-value' : undefined"
              (nodeChange)="applyCurrent($event)"></sd-api-contract-source-editor>
          }

          @if (_current.type === 'object') {
            @let _children = children();
            <div class="sd-acb-drawer__children">
              <h5 class="sd-acb-drawer__children-title">
                {{ 'core.component.api-contract-builder.node.add-property' | sdTranslate }}
              </h5>

              @if (!_children.length) {
                <p class="sd-acb-drawer__empty">{{ 'core.component.api-contract-builder.node.empty' | sdTranslate }}</p>
              }

              @for (child of _children; track child.key) {
                <sd-api-contract-node-summary
                  [name]="child.key"
                  [node]="child.node"
                  [autoId]="_autoId ? _autoId + '-child-' + child.key : undefined"
                  (edit)="enter(child.key)"
                  (remove)="removeChild(child.key)"></sd-api-contract-node-summary>
              }

              <sd-button
                type="light"
                size="sm"
                prefixIcon="add"
                [autoId]="_autoId ? _autoId + '-add-child' : undefined"
                [title]="'core.component.api-contract-builder.node.add-property' | sdTranslate"
                (click)="addChild()"></sd-button>
            </div>
          }

          @if (discardPrompt()) {
            <div class="sd-acb-drawer__confirm" role="alertdialog">
              <span>{{ 'core.component.api-contract-builder.drawer.discard-confirm' | sdTranslate }}</span>
              <sd-button
                type="text"
                size="sm"
                color="error"
                [autoId]="_autoId ? _autoId + '-discard' : undefined"
                [title]="'core.component.api-contract-builder.confirm.yes' | sdTranslate"
                (click)="confirmDiscard()"></sd-button>
              <sd-button
                type="text"
                size="sm"
                [autoId]="_autoId ? _autoId + '-keep' : undefined"
                [title]="'core.component.api-contract-builder.confirm.no' | sdTranslate"
                (click)="cancelDiscard()"></sd-button>
            </div>
          }
        </div>
      }

      <sd-button
        sdFooterRight
        type="text"
        [autoId]="_autoId ? _autoId + '-cancel' : undefined"
        [title]="'core.component.api-contract-builder.drawer.cancel' | sdTranslate"
        (click)="requestCancel()"></sd-button>
      <sd-button
        sdFooterRight
        type="fill"
        color="primary"
        [autoId]="_autoId ? _autoId + '-save' : undefined"
        [disabled]="!canSave()"
        [title]="'core.component.api-contract-builder.drawer.save' | sdTranslate"
        (click)="save()"></sd-button>
    </sd-side-drawer>
  `,
  styles: [
    `
      .sd-acb-drawer {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
      }
      .sd-acb-drawer__crumbs {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        align-items: center;
        font-size: 12px;
      }
      .sd-acb-drawer__crumb {
        padding: 2px 4px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--sd-primary, #005cbb);
        font: inherit;
        cursor: pointer;
      }
      .sd-acb-drawer__crumb:hover {
        background: color-mix(in srgb, var(--sd-primary, #005cbb) 10%, transparent);
      }
      .sd-acb-drawer__crumb--current {
        color: var(--sd-text, #1a1b1f);
        font-weight: 600;
        cursor: default;
      }
      .sd-acb-drawer__crumb-sep {
        color: var(--sd-text-secondary, #6b6b6b);
      }
      .sd-acb-drawer__children {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-top: 4px;
        border-top: 1px solid var(--sd-border-color, #e6e6e6);
      }
      .sd-acb-drawer__children-title {
        margin: 0;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--sd-text-secondary, #6b6b6b);
      }
      .sd-acb-drawer__empty {
        margin: 0;
        font-size: 12px;
        font-style: italic;
        color: var(--sd-text-secondary, #6b6b6b);
      }
      .sd-acb-drawer__confirm {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 8px 10px;
        border: 1px dashed var(--sd-border-color, #e6e6e6);
        border-radius: 6px;
        background: var(--sd-surface-muted, #f3f5f8);
        font-size: 12px;
      }
    `,
  ],
})
export class SdApiContractNodeDrawer {
  readonly #i18n = inject(I18nService);

  /** `mapping` shows the value editor; `schema` is a plain declaration with no mapping. */
  layer = input<'schema' | 'mapping'>('mapping');
  allowTransform = input(false, { transform: booleanAttribute });
  suggestions = input<readonly SdApiContractSuggestion[]>([]);
  autoId = input<string | null | undefined>();

  nodeCommit = output<SdApiContractNodeCommit>();

  // why không phải ES-private: Angular từ chối `viewChild` trên field `#` (diagnostic 1053).
  protected readonly drawerRef = viewChild.required<SdSideDrawer>('drawer');

  // why: seed là mốc so sánh để biết draft có bẩn hay chưa. Không có nó thì "Huỷ" phải đoán, và mọi
  // lần mở drawer đều bị coi là đã sửa.
  #seedName = '';
  #seedJson = '';

  readonly #draftName = signal('');
  readonly #draft = signal<SdApiContractStructuralNode | null>(null);
  readonly #rootSiblings = signal<readonly string[]>([]);
  readonly #editingName = signal<string | null>(null);
  readonly #discardPrompt = signal(false);

  // why pointer chứ không phải "node hiện tại": draft luôn là GỐC của subtree, và một lần Lưu commit
  // cả gốc. Giữ node con rời ra sẽ phải ghép lại lúc Save, và ghép sai là mất nhánh.
  readonly #pointer = signal<SdApiContractNodePointer>([]);

  // why: tên đang gõ ở CẤP HIỆN TẠI, kể cả khi nó chưa áp được vào draft.
  readonly #typedName = signal('');

  protected readonly draftName = this.#draftName.asReadonly();
  protected readonly discardPrompt = this.#discardPrompt.asReadonly();

  /** The node the author is looking at right now — the draft root, or a descendant of it. */
  protected readonly current = computed(() => {
    const draft = this.#draft();
    if (!draft) return null;
    return getSdApiContractNodeAt(draft, this.#pointer());
  });

  /** Every key on the breadcrumb. The pointer alternates `properties`/key, so keys sit on odd slots. */
  protected readonly breadcrumb = computed(() => {
    const pointer = this.#pointer();
    const keys = pointer.filter((_, index) => index % 2 === 1);
    return [this.#draftName() || this.#i18n.t('core.component.api-contract-builder.drawer.add-title'), ...keys];
  });

  /**
   * What the name field shows.
   *
   * why một signal riêng chứ không đọc thẳng từ draft: một tên KHÔNG áp được — rỗng, hoặc trùng
   * sibling — vẫn phải hiện ra để người dùng thấy mình vừa gõ gì và đọc được lý do bị chặn. Đọc
   * thẳng từ draft thì ô input nhảy về tên cũ ngay khi gõ, tức là từ chối im lặng.
   */
  protected readonly currentName = this.#typedName.asReadonly();

  protected readonly children = computed(() => {
    const node = this.current();
    const properties = node?.properties;
    if (!properties) return [];
    return Object.keys(properties).map(key => ({ key, node: properties[key] }));
  });

  /** Siblings on the level the author is on — the root list, or the parent object's keys. */
  protected readonly siblingNames = computed<readonly string[]>(() => {
    const pointer = this.#pointer();
    if (pointer.length === 0) return this.#rootSiblings();

    const draft = this.#draft();
    if (!draft) return [];
    const parent = getSdApiContractNodeAt(draft, pointer.slice(0, -2));
    return parent?.properties ? Object.keys(parent.properties) : [];
  });

  protected readonly typeOptions: SdApiContractOption[] = SD_API_CONTRACT_DATA_TYPES.map(type => ({
    value: type,
    label: type,
  }));

  protected readonly requiredOptions: SdApiContractOption[] = [
    { value: 'true', label: this.#i18n.t('core.component.api-contract-builder.required.true') },
    { value: 'false', label: this.#i18n.t('core.component.api-contract-builder.required.false') },
  ];

  protected readonly transformOptions: SdApiContractOption[] = [
    { value: '', label: this.#i18n.t('core.component.api-contract-builder.transform.none') },
    { value: 'ISOString', label: 'ISOString' },
    { value: 'UTCString', label: 'UTCString' },
  ];

  protected readonly title = computed(() =>
    this.#editingName() === null
      ? this.#i18n.t('core.component.api-contract-builder.drawer.add-title')
      : this.#i18n.t('core.component.api-contract-builder.drawer.edit-title')
  );

  protected readonly dirty = computed(() => {
    const draft = this.#draft();
    if (!draft) return false;
    return this.#draftName() !== this.#seedName || JSON.stringify(draft) !== this.#seedJson;
  });

  protected readonly nameError = computed<string | null>(() => {
    const name = this.currentName().trim();
    if (name === '') return this.#i18n.t('core.component.api-contract-builder.node.name-required');

    // why: node đang sửa luôn nằm trong danh sách sibling của chính cấp nó — so với chính nó là tự báo
    // trùng. "Chính nó" phải là key THẬT đang lưu, không phải chữ đang gõ: lấy chữ đang gõ thì gõ đúng
    // tên một sibling khác cũng tự loại chính mình và lỗi trùng không bao giờ nổi lên.
    const pointer = this.#pointer();
    const self = pointer.length === 0 ? this.#editingName() : pointer[pointer.length - 1];
    const taken = this.siblingNames().some(sibling => sibling === name && sibling !== self);
    return taken ? this.#i18n.t('core.component.api-contract-builder.node.duplicate-key') : null;
  });

  // why chỉ xét lỗi ở GỐC: Lưu commit cả subtree, và tên đang gõ ở cấp sâu đã được `setName` áp vào
  // draft ngay. Nếu chặn theo cấp hiện tại thì đứng ở cấp sâu sẽ không Lưu được gốc hợp lệ.
  protected readonly canSave = computed(() => {
    if (this.#draft() === null) return false;
    if (this.#draftName().trim() === '') return false;
    return this.nameError() === null;
  });

  /**
   * `beforeClose` guard for `<sd-side-drawer>`.
   *
   * why an arrow field, not a method: the drawer takes it as an input value, so it must keep `this`
   * without the template having to bind it.
   */
  protected readonly closeGuard = (): boolean => this.guardClose();

  // -------------------------------------------------------------------------
  // Public surface the owning builder drives
  // -------------------------------------------------------------------------

  openForAdd(siblingNames: readonly string[] = [], type: SdApiContractDataType = 'string'): void {
    this.#seed(null, createSdApiContractNode(type), siblingNames);
    this.drawerRef().open();
  }

  openForEdit(name: string, node: SdApiContractStructuralNode, siblingNames: readonly string[] = []): void {
    this.#seed(name, cloneSdApiContractNode(node), siblingNames);
    this.drawerRef().open();
  }

  // -------------------------------------------------------------------------
  // Draft edits
  // -------------------------------------------------------------------------

  /**
   * Types into the name field.
   *
   * The typed text is ALWAYS kept, then applied to the draft only when it can be. A name that cannot
   * be applied — empty, or already taken by a sibling — stays visible and `nameError()` explains it,
   * which is what blocks Save. Refusing the keystroke instead would leave the field showing one name
   * while the contract holds another.
   */
  protected setName(value: unknown): void {
    const name = typeof value === 'string' ? value : '';
    this.#typedName.set(name);

    const pointer = this.#pointer();
    if (pointer.length === 0) {
      // why chỉ ghi khi hợp lệ: `#draftName` là thứ `save()` phát ra. Ghi tên rỗng vào đó rồi chặn ở
      // `canSave` cũng được, nhưng giữ nó luôn hợp lệ thì `save()` không cần tin vào cổng chặn.
      if (name.trim() !== '') this.#draftName.set(name);
      return;
    }

    const draft = this.#draft();
    const from = pointer[pointer.length - 1];
    if (!draft || name.trim() === '' || name === from) return;

    const parentPointer = pointer.slice(0, -2);
    const parent = getSdApiContractNodeAt(draft, parentPointer);
    if (!parent) return;

    const renamed = renameSdApiContractProperty(parent, from, name);
    // why: helper trả về CHÍNH object cũ khi trùng key. Không áp được thì thôi — `#typedName` đã giữ
    // chữ người dùng gõ và `nameError()` đã báo, nên không có gì bị nuốt im lặng.
    if (renamed === parent) return;

    this.#draft.set(setSdApiContractNodeAt(draft, parentPointer, renamed));
    // why dời pointer theo: nếu không, pointer vẫn trỏ key CŨ — `current()` trả null và form trắng xoá.
    this.#pointer.set([...parentPointer, 'properties', name]);
  }

  protected setType(value: unknown): void {
    const draft = this.#draft();
    if (!draft || typeof value !== 'string') return;
    if (!(SD_API_CONTRACT_DATA_TYPES as readonly string[]).includes(value)) return;
    this.applyCurrent(changeSdApiContractNodeType(draft, value as SdApiContractDataType));
  }

  protected setRequired(value: unknown): void {
    const draft = this.#draft();
    if (!draft) return;
    if (value === 'true') {
      this.applyCurrent({ ...draft, required: true });
      return;
    }
    // why: bỏ hẳn key thay vì ghi `false` — key vắng và `false` nghĩa như nhau với consumer, và JSON
    // gọn hơn. Một `false` do người khác viết tay vẫn được giữ khi nạp vào.
    const next: Record<string, unknown> = { ...draft };
    delete next['required'];
    this.applyCurrent(next as unknown as SdApiContractStructuralNode);
  }

  protected setText(key: 'label' | 'description', value: unknown): void {
    const draft = this.#draft();
    if (!draft) return;
    const text = typeof value === 'string' ? value.trim() : '';
    const next: Record<string, unknown> = { ...draft };
    if (text === '') delete next[key];
    else next[key] = text;
    this.applyCurrent(next as unknown as SdApiContractStructuralNode);
  }

  protected setTransform(value: unknown): void {
    const draft = this.#draft();
    if (!draft) return;
    const next: Record<string, unknown> = { ...draft };
    if (value === 'ISOString' || value === 'UTCString') next['transform'] = value;
    else delete next['transform'];
    this.applyCurrent(next as unknown as SdApiContractStructuralNode);
  }

  protected applyCurrent(node: SdApiContractStructuralNode): void {
    const draft = this.#draft();
    if (!draft) return;
    this.#draft.set(setSdApiContractNodeAt(draft, this.#pointer(), node));
  }

  protected enter(key: string): void {
    this.#pointer.set([...this.#pointer(), 'properties', key]);
    this.#syncTypedName();
    this.#discardPrompt.set(false);
  }

  /** `depth` counts breadcrumb entries, so 0 is the draft root. */
  protected backTo(depth: number): void {
    this.#pointer.set(this.#pointer().slice(0, depth * 2));
    this.#syncTypedName();
    this.#discardPrompt.set(false);
  }

  protected addChild(): void {
    const node = this.current();
    const draft = this.#draft();
    if (!node || !draft) return;

    const key = uniqueChildKey(node.properties ?? {});
    const next = addSdApiContractProperty(node, key, createSdApiContractNode('string'));
    this.#draft.set(setSdApiContractNodeAt(draft, this.#pointer(), next));
  }

  protected removeChild(key: string): void {
    const node = this.current();
    const draft = this.#draft();
    if (!node || !draft) return;
    this.#draft.set(setSdApiContractNodeAt(draft, this.#pointer(), removeSdApiContractProperty(node, key)));
  }

  // -------------------------------------------------------------------------
  // Chốt sổ
  // -------------------------------------------------------------------------

  protected save(): void {
    const draft = this.#draft();
    if (!draft || !this.canSave()) return;

    this.#discardPrompt.set(false);
    this.nodeCommit.emit({ name: this.#draftName().trim(), node: draft });
    // why: forceClose bỏ qua `beforeClose`. Save đã là chủ ý rõ ràng — hỏi lại "bỏ thay đổi?" ngay sau
    // khi vừa lưu là vô nghĩa.
    this.#markCommitted();
    this.drawerRef().forceClose();
  }

  protected requestCancel(): void {
    void this.drawerRef().requestClose();
  }

  protected confirmDiscard(): void {
    this.#discardPrompt.set(false);
    this.#markCommitted();
    this.drawerRef().forceClose();
  }

  protected cancelDiscard(): void {
    this.#discardPrompt.set(false);
  }

  /**
   * Blocks the close while the draft is dirty and raises an inline prompt instead.
   *
   * why inline chứ không `window.confirm`: một component thư viện không được dựng dialog của browser
   * — nó không style được, không test được, và chặn cả tab.
   */
  protected guardClose(): boolean {
    if (!this.dirty()) return true;
    this.#discardPrompt.set(true);
    return false;
  }

  protected onClosed(): void {
    this.#discardPrompt.set(false);
  }

  // -------------------------------------------------------------------------

  #seed(name: string | null, node: SdApiContractStructuralNode, siblingNames: readonly string[]): void {
    this.#editingName.set(name);
    this.#draftName.set(name ?? '');
    this.#draft.set(node);
    this.#pointer.set([]);
    this.#typedName.set(name ?? '');
    this.#rootSiblings.set([...siblingNames]);
    this.#discardPrompt.set(false);
    this.#seedName = name ?? '';
    this.#seedJson = JSON.stringify(node);
  }

  /** Re-points the name field at whatever level the author just moved to. */
  #syncTypedName(): void {
    const pointer = this.#pointer();
    this.#typedName.set(pointer.length === 0 ? this.#draftName() : pointer[pointer.length - 1]);
  }

  /** Re-baselines the seed so a closing drawer is never considered dirty any more. */
  #markCommitted(): void {
    const draft = this.#draft();
    this.#seedName = this.#draftName();
    this.#seedJson = draft ? JSON.stringify(draft) : '';
  }
}

/** First free `truong`, `truong2`, … so adding twice never collides. */
function uniqueChildKey(properties: Record<string, SdApiContractStructuralNode>): string {
  const base = 'truong';
  if (!Object.prototype.hasOwnProperty.call(properties, base)) return base;
  for (let index = 2; ; index += 1) {
    const candidate = `${base}${index}`;
    if (!Object.prototype.hasOwnProperty.call(properties, candidate)) return candidate;
  }
}
