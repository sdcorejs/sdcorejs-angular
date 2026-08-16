import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import type { SdApiContractDataType, SdApiContractJsonValue } from '../api-contract.model';
import type { SdApiContractStructuralNode } from '../api-contract.schema';
import type { SdApiContractSuggestion } from './api-contract-suggestion.model';

/** How a mapped node receives its value. `nested` / `none` mean "no whole-node mapping". */
export type SdApiContractValueMode = 'source' | 'static' | 'nested' | 'none';

interface SdApiContractOption {
  value: string;
  label: string;
}

/**
 * Value editor for one mapped node: a mode picker plus either an expression field (with a reference
 * picker fed by the injected env catalog and the surrounding schemas) or a typed static field.
 *
 * Composite static literals are intentionally not editable here — a nested object literal wants a
 * JSON sub-editor, and two editors writing one model is the exact trap the review step avoids. Such
 * a literal authored elsewhere still validates and still round-trips.
 */
@Component({
  selector: 'sd-api-contract-source-editor',
  standalone: true,
  imports: [SdInput, SdSelect, SdTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _node = node();
    @let _disabled = disabled();
    @let _mode = mode();
    @let _autoId = autoId();
    @let _suggestions = suggestionOptions();

    <div class="sd-acb-source">
      <sd-select
        class="sd-acb-source__mode"
        size="sm"
        hideInlineError
        [clearable]="false"
        [autoId]="_autoId ? _autoId + '-mode' : undefined"
        [label]="'core.component.api-contract-builder.mapping.mode' | sdTranslate"
        [items]="modeOptions()"
        valueField="value"
        displayField="label"
        [model]="_mode"
        [disabled]="_disabled"
        (sdChange)="setMode($event)"></sd-select>

      @if (_mode === 'source') {
        <sd-input
          class="sd-acb-source__expression"
          size="sm"
          hideInlineError
          [autoId]="_autoId ? _autoId + '-source' : undefined"
          [label]="'core.component.api-contract-builder.mapping.source' | sdTranslate"
          [placeholder]="expressionPlaceholder"
          [model]="_node.source ?? ''"
          [disabled]="_disabled"
          (sdChange)="setSource($event)"></sd-input>

        @if (_suggestions.length) {
          <sd-select
            class="sd-acb-source__insert"
            size="sm"
            hideInlineError
            [autoId]="_autoId ? _autoId + '-insert' : undefined"
            [label]="'core.component.api-contract-builder.mapping.insert' | sdTranslate"
            [items]="_suggestions"
            valueField="expression"
            displayField="display"
            [(model)]="insertToken"
            [disabled]="_disabled"
            (sdChange)="insertReference($event)"></sd-select>
        }
      } @else if (_mode === 'static') {
        @if (_node.type === 'boolean') {
          <sd-select
            class="sd-acb-source__static"
            size="sm"
            hideInlineError
            [clearable]="false"
            [autoId]="_autoId ? _autoId + '-static' : undefined"
            [label]="'core.component.api-contract-builder.mapping.value' | sdTranslate"
            [items]="booleanOptions"
            valueField="value"
            displayField="label"
            [model]="_node.value === true ? 'true' : 'false'"
            [disabled]="_disabled"
            (sdChange)="setStaticBoolean($event)"></sd-select>
        } @else {
          <sd-input
            class="sd-acb-source__static"
            size="sm"
            hideInlineError
            [autoId]="_autoId ? _autoId + '-static' : undefined"
            [label]="'core.component.api-contract-builder.mapping.value' | sdTranslate"
            [type]="_node.type === 'number' ? 'number' : 'text'"
            [model]="staticText()"
            [disabled]="_disabled"
            (sdChange)="setStaticScalar($event)"></sd-input>
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .sd-acb-source {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: flex-start;
      }
      .sd-acb-source__mode {
        flex: 0 0 160px;
        min-width: 140px;
      }
      .sd-acb-source__expression,
      .sd-acb-source__static {
        flex: 1 1 220px;
        min-width: 180px;
      }
      .sd-acb-source__insert {
        flex: 0 1 240px;
        min-width: 180px;
      }
    `,
  ],
})
export class SdApiContractSourceEditor {
  readonly #i18n = inject(I18nService);

  node = input.required<SdApiContractStructuralNode>();
  suggestions = input<readonly SdApiContractSuggestion[]>([]);
  disabled = input(false, { transform: booleanAttribute });
  autoId = input<string | null | undefined>();

  nodeChange = output<SdApiContractStructuralNode>();

  protected readonly insertToken = signal<string | null>(null);
  protected readonly expressionPlaceholder = '${input.field}';

  // why: dựng MỘT lần trong field initializer. `[items]` nhận mảng mới mỗi CD sẽ kích
  // `toObservable(items)` của sd-select → markForCheck → CD mới → treo trình duyệt (bug OOM
  // đã gặp ở query-builder). Ngôn ngữ chỉ đổi kèm reload trang nên dựng một lần là đủ.
  protected readonly booleanOptions: SdApiContractOption[] = [
    { value: 'true', label: this.#i18n.t('core.component.api-contract-builder.boolean.true') },
    { value: 'false', label: this.#i18n.t('core.component.api-contract-builder.boolean.false') },
  ];

  readonly #scalarModes: SdApiContractOption[] = [
    { value: 'source', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.source') },
    { value: 'static', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.static') },
    { value: 'none', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.none') },
  ];

  readonly #objectModes: SdApiContractOption[] = [
    { value: 'source', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.source') },
    { value: 'nested', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.nested') },
  ];

  readonly #arrayModes: SdApiContractOption[] = [
    { value: 'source', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.source') },
    { value: 'none', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.none') },
  ];

  protected readonly mode = computed<SdApiContractValueMode>(() => {
    const node = this.node();
    if (node.source !== undefined) return 'source';
    if (node.value !== undefined) return 'static';
    return node.type === 'object' ? 'nested' : 'none';
  });

  protected readonly modeOptions = computed<SdApiContractOption[]>(() => {
    const type = this.node().type;
    if (type === 'object') return this.#objectModes;
    if (type === 'array') return this.#arrayModes;
    return this.#scalarModes;
  });

  protected readonly suggestionOptions = computed<SdApiContractSuggestion[]>(() => {
    const type = this.node().type;
    const all = [...this.suggestions()];
    // why: lọc mềm — ưu tiên gợi ý hợp type, nhưng trả toàn bộ khi không cái nào khớp, để template
    // string (`Bearer ${env.token}`) và các cặp type tương thích không bị giấu mất.
    const compatible = all.filter(suggestion => isAssignable(suggestion.type, type));
    return compatible.length > 0 ? compatible : all;
  });

  protected readonly staticText = computed(() => {
    const value = this.node().value;
    return value === undefined || value === null ? '' : String(value);
  });

  protected setMode(mode: unknown): void {
    const node = this.node();
    if (mode === 'source') {
      this.nodeChange.emit({ ...withoutMapping(node), source: node.source ?? '' });
      return;
    }
    if (mode === 'static') {
      this.nodeChange.emit({ ...withoutMapping(node), value: defaultStatic(node.type) });
      return;
    }
    this.nodeChange.emit(withoutMapping(node));
  }

  protected setSource(value: unknown): void {
    this.nodeChange.emit({ ...withoutMapping(this.node()), source: typeof value === 'string' ? value : '' });
  }

  protected setStaticScalar(value: unknown): void {
    const node = this.node();
    const text = value === null || value === undefined ? '' : String(value);
    if (node.type !== 'number') {
      this.nodeChange.emit({ ...withoutMapping(node), value: text });
      return;
    }
    const parsed = text.trim() === '' ? 0 : Number(text);
    this.nodeChange.emit({ ...withoutMapping(node), value: Number.isFinite(parsed) ? parsed : 0 });
  }

  protected setStaticBoolean(value: unknown): void {
    this.nodeChange.emit({ ...withoutMapping(this.node()), value: value === 'true' || value === true });
  }

  protected insertReference(expression: unknown): void {
    if (typeof expression !== 'string' || !expression) return;
    const node = this.node();
    const current = node.source ?? '';
    this.insertToken.set(null);
    this.nodeChange.emit({ ...withoutMapping(node), source: `${current}${expression}` });
  }
}

/** Rebuilds a node without `source` / `value`, so the key is gone rather than set to `undefined`. */
function withoutMapping(node: SdApiContractStructuralNode): SdApiContractStructuralNode {
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(node)) {
    if (key === 'source' || key === 'value') continue;
    next[key] = (node as unknown as Record<string, unknown>)[key];
  }
  return next as unknown as SdApiContractStructuralNode;
}

function defaultStatic(type: SdApiContractDataType): SdApiContractJsonValue {
  if (type === 'number') return 0;
  if (type === 'boolean') return false;
  if (type === 'object') return {};
  if (type === 'array') return [];
  return '';
}

function isAssignable(sourceType: SdApiContractDataType, targetType: SdApiContractDataType): boolean {
  if (sourceType === targetType) return true;
  const temporalish = (type: SdApiContractDataType): boolean => type === 'string' || type === 'date' || type === 'datetime';
  return temporalish(sourceType) && temporalish(targetType);
}
