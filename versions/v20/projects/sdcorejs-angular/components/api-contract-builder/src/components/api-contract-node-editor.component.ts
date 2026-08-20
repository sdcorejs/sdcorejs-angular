import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdButton } from '@sdcorejs/angular/components/button';
import { removeSdApiContractProperty, setSdApiContractNodeAt, type SdApiContractStructuralNode } from '../api-contract.schema';
import type { SdApiContractNodeEditRequest } from './api-contract-node-drawer.component';
import { SdApiContractNodeSummary } from './api-contract-node-summary.component';

interface SdApiContractPropertyEntry {
  key: string;
  node: SdApiContractStructuralNode;
}

/**
 * One schema layer — `input.schema`, `req.body`, `res.body`, `output.schema` — rendered as a flat list
 * of the fields it declares.
 *
 * It used to be a recursive tree of editable seven-column rows. It is now a list you read: adding and
 * editing ask the builder to open its drawer, and only removal is applied straight away. The list is
 * deliberately FLAT — an `object` field shows how many fields it holds and the author drills into it
 * inside the drawer, so a deeply nested node is edited with a drawer's worth of room instead of a
 * 100px cell.
 */
@Component({
  selector: 'sd-api-contract-node-editor',
  standalone: true,
  imports: [SdButton, SdTranslatePipe, SdApiContractNodeSummary],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './api-contract-node-editor.component.html',
  styleUrl: './api-contract-node-editor.component.scss',
})
export class SdApiContractNodeEditor {
  /** The layer's root node. */
  node = input.required<SdApiContractStructuralNode>();
  /** Diagnostic path of the layer itself, e.g. `input.schema`. */
  basePath = input.required<string>();
  disabled = input(false, { transform: booleanAttribute });
  autoId = input<string | null | undefined>();

  nodeChange = output<SdApiContractStructuralNode>();
  editRequest = output<SdApiContractNodeEditRequest>();

  /**
   * Which node actually holds the fields.
   *
   * why: một tầng `array` (`output.schema` sau khi nhận `${res.body.items}`) khai field ở `items`, chứ
   * bản thân nó không có `properties`. Đọc thẳng `node.properties` sẽ ra danh sách rỗng và tầng output
   * của contract mẫu thành không sửa được.
   */
  readonly #container = computed<SdApiContractStructuralNode>(() => {
    const node = this.node();
    return node.type === 'array' && node.items ? node.items : node;
  });

  /** `['items']` for an array layer, `[]` otherwise — the prefix a commit has to be written under. */
  readonly #containerPointer = computed<readonly string[]>(() => {
    const node = this.node();
    return node.type === 'array' && node.items ? ['items'] : [];
  });

  protected readonly entries = computed<SdApiContractPropertyEntry[]>(() => {
    const properties = this.#container().properties;
    if (!properties) return [];
    return Object.keys(properties).map(key => ({ key, node: properties[key] }));
  });

  readonly #keys = computed(() => this.entries().map(entry => entry.key));

  protected requestAdd(): void {
    this.editRequest.emit({ name: null, node: null, siblingNames: this.#keys(), pointer: this.#containerPointer() });
  }

  protected requestEdit(key: string, node: SdApiContractStructuralNode): void {
    this.editRequest.emit({ name: key, node, siblingNames: this.#keys(), pointer: this.#containerPointer() });
  }

  protected removeProperty(key: string): void {
    const stripped = removeSdApiContractProperty(this.#container(), key);
    this.nodeChange.emit(setSdApiContractNodeAt(this.node(), this.#containerPointer(), stripped));
  }
}
