import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdButton } from '@sdcorejs/angular/components/button';
import { sdApiContractRecordRemove, type SdApiContractStructuralNode } from '../api-contract.schema';
import type { SdApiContractNodeEditRequest } from './api-contract-node-drawer.component';
import { SdApiContractNodeSummary } from './api-contract-node-summary.component';

type SdApiContractNodeRecord = Record<string, SdApiContractStructuralNode>;

interface SdApiContractRecordEntry {
  key: string;
  node: SdApiContractStructuralNode;
  path: string;
}

/**
 * One keyed collection of nodes — `req.path` / `req.query` / `req.headers` / `res.headers` — rendered
 * as a list you read, not a list you type into.
 *
 * Every entry is a collapsed row. Adding and editing both ask the builder to open its drawer; only
 * removal is applied straight away, because there is nothing to stage about deleting a row. That is
 * why `add()` emits an edit request rather than an entry: a half-declared field must never reach the
 * contract just because someone clicked the add button and changed their mind.
 */
@Component({
  selector: 'sd-api-contract-record-editor',
  standalone: true,
  imports: [SdButton, SdTranslatePipe, SdApiContractNodeSummary],
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
        <sd-api-contract-node-summary
          [name]="entry.key"
          [node]="entry.node"
          [readonly]="_disabled"
          [autoId]="_autoId ? _autoId + '-' + entry.key : undefined"
          (edit)="requestEdit(entry)"
          (remove)="remove(entry.key)"></sd-api-contract-node-summary>
      }

      @if (!_disabled) {
        <sd-button
          class="sd-acb-record__add"
          type="light"
          size="sm"
          prefixIcon="add"
          [autoId]="_autoId ? _autoId + '-add' : undefined"
          [title]="'core.component.api-contract-builder.request.add-entry' | sdTranslate"
          (click)="requestAdd()"></sd-button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .sd-acb-record {
        display: flex;
        flex-direction: column;
        gap: 6px;
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
    `,
  ],
})
export class SdApiContractRecordEditor {
  record = input<SdApiContractNodeRecord | undefined>();
  /** Diagnostic path of the collection itself, e.g. `req.query`. */
  basePath = input.required<string>();
  disabled = input(false, { transform: booleanAttribute });
  emptyLabel = input<string>('');
  autoId = input<string | null | undefined>();

  recordChange = output<SdApiContractNodeRecord>();
  editRequest = output<SdApiContractNodeEditRequest>();

  protected readonly entries = computed<SdApiContractRecordEntry[]>(() => {
    const record = this.record();
    if (!record) return [];
    const base = this.basePath();
    return Object.keys(record).map(key => ({ key, node: record[key], path: `${base}.${key}` }));
  });

  readonly #keys = computed(() => this.entries().map(entry => entry.key));

  protected requestAdd(): void {
    this.editRequest.emit({ name: null, node: null, siblingNames: this.#keys() });
  }

  protected requestEdit(entry: SdApiContractRecordEntry): void {
    this.editRequest.emit({ name: entry.key, node: entry.node, siblingNames: this.#keys() });
  }

  protected remove(key: string): void {
    const record = this.record();
    if (!record) return;
    this.recordChange.emit(sdApiContractRecordRemove(record, key));
  }
}
