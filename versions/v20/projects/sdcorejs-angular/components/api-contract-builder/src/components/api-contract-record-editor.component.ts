import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SD_API_CONTRACT_DATA_TYPES, type SdApiContractDataType, type SdApiContractDiagnostic } from '../api-contract.model';
import {
  createSdApiContractNode,
  sdApiContractRecordRemove,
  sdApiContractRecordRename,
  sdApiContractRecordSet,
  type SdApiContractStructuralNode,
} from '../api-contract.schema';
import { SdApiContractNodeEditor } from './api-contract-node-editor.component';
import type { SdApiContractSuggestion } from './api-contract-suggestion.model';

type SdApiContractNodeRecord = Record<string, SdApiContractStructuralNode>;

interface SdApiContractRecordEntry {
  key: string;
  node: SdApiContractStructuralNode;
  path: string;
}

/**
 * Editor for one keyed collection of nodes — `req.path`, `req.query`, `req.headers`, `res.headers`.
 *
 * Keys are renamed on blur, never per keystroke: a per-keystroke rename would rewrite the key one
 * character at a time and invalidate every `${…}` that points at it in between.
 */
@Component({
  selector: 'sd-api-contract-record-editor',
  standalone: true,
  imports: [SdButton, SdIcon, SdTranslatePipe, SdApiContractNodeEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _entries = entries();
    @let _disabled = disabled();
    @let _autoId = autoId();

    <div class="sd-acb-record">
      @if (!_entries.length) {
        <p class="sd-acb-record__empty">{{ emptyLabel() }}</p>
      }

      @for (entry of _entries; track entry.key) {
        <div class="sd-acb-record__entry" [attr.data-path]="entry.path">
          <!-- why: khoá đi THẲNG vào hàng của node thay vì đứng riêng một hàng bên trên — nhờ vậy
               "Tên trường / Kiểu dữ liệu / Bắt buộc" của một entry thẳng cột với mọi hàng khác, và
               bớt được một cấp lồng khung. -->
          <sd-api-contract-node-editor
            [node]="entry.node"
            [basePath]="entry.path"
            [layer]="layer()"
            [allowedTypes]="allowedTypes()"
            [suggestions]="suggestions()"
            [diagnostics]="diagnostics()"
            [disabled]="_disabled"
            [rootName]="entry.key"
            [rootRemovable]="!_disabled"
            [autoId]="_autoId"
            (nodeChange)="replace(entry.key, $event)"
            (rootRename)="rename(entry.key, $event)"
            (rootRemove)="remove(entry.key)"></sd-api-contract-node-editor>

          @if (duplicateKey() === entry.key) {
            <p class="sd-acb-record__diagnostic" data-severity="error">
              <sd-icon name="error" size="sm"></sd-icon>
              <span>{{ 'core.component.api-contract-builder.node.duplicate-key' | sdTranslate }}</span>
            </p>
          }
        </div>
      }

      @if (!_disabled) {
        <sd-button
          class="sd-acb-record__add"
          type="light"
          size="sm"
          prefixIcon="add"
          [autoId]="_autoId ? _autoId + '-add' : undefined"
          [title]="'core.component.api-contract-builder.request.add-entry' | sdTranslate"
          (click)="add()"></sd-button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .sd-acb-record {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .sd-acb-record__entry {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px 12px;
        border: 1px solid var(--sd-border-color, #e6e6e6);
        border-radius: 8px;
        background: var(--sd-surface, #fff);
      }
      .sd-acb-record__empty {
        margin: 0;
        font-size: 12px;
        font-style: italic;
        color: var(--sd-text-secondary, #6b6b6b);
      }
      .sd-acb-record__add {
        align-self: flex-start;
      }
      .sd-acb-record__diagnostic {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        font-size: 12px;
        color: var(--sd-error, #b3261e);
      }
    `,
  ],
})
export class SdApiContractRecordEditor {
  record = input<SdApiContractNodeRecord | undefined>();
  /** Diagnostic path of the collection itself, e.g. `req.query`. */
  basePath = input.required<string>();
  layer = input<'declaration' | 'mapping'>('mapping');
  allowedTypes = input<readonly SdApiContractDataType[]>(SD_API_CONTRACT_DATA_TYPES);
  suggestions = input<readonly SdApiContractSuggestion[]>([]);
  diagnostics = input<readonly SdApiContractDiagnostic[]>([]);
  disabled = input(false, { transform: booleanAttribute });
  emptyLabel = input<string>('');
  /** Prefix for generated keys when the user adds an entry. */
  newKeyPrefix = input<string>('field');
  autoId = input<string | null | undefined>();

  recordChange = output<SdApiContractNodeRecord>();

  protected readonly duplicateKey = signal<string | null>(null);

  protected readonly entries = computed<SdApiContractRecordEntry[]>(() => {
    const record = this.record();
    if (!record) return [];
    const base = this.basePath();
    return Object.keys(record).map(key => ({ key, node: record[key], path: `${base}.${key}` }));
  });

  protected add(): void {
    const record = this.record() ?? {};
    const prefix = this.newKeyPrefix();
    let index = Object.keys(record).length + 1;
    while (Object.prototype.hasOwnProperty.call(record, `${prefix}${index}`)) index += 1;
    const type = this.allowedTypes().includes('string') ? 'string' : this.allowedTypes()[0];
    this.recordChange.emit(sdApiContractRecordSet(record, `${prefix}${index}`, createSdApiContractNode(type)));
  }

  protected remove(key: string): void {
    this.duplicateKey.set(null);
    const record = this.record();
    if (!record) return;
    this.recordChange.emit(sdApiContractRecordRemove(record, key));
  }

  protected rename(from: string, to: unknown): void {
    this.duplicateKey.set(null);
    const record = this.record();
    if (!record || typeof to !== 'string') return;
    const trimmed = to.trim();
    if (!trimmed || trimmed === from) return;

    const renamed = sdApiContractRecordRename(record, from, trimmed);
    if (renamed === record) {
      this.duplicateKey.set(from);
      return;
    }
    this.recordChange.emit(renamed);
  }

  protected replace(key: string, node: SdApiContractStructuralNode): void {
    const record = this.record();
    if (!record) return;
    this.recordChange.emit(sdApiContractRecordSet(record, key, node));
  }
}
