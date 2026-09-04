import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdCodeEditor } from '@sdcorejs/angular/components/code-editor';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { parseSdApiContractTemplate } from '../api-contract.expression';
import type { SdApiContractDataType, SdApiContractJsonValue } from '../api-contract.model';
import type { SdApiContractStructuralNode } from '../api-contract.schema';
import type { SdApiContractSuggestion } from './api-contract-suggestion.model';

/**
 * How a mapped node receives its value.
 *
 * - `source` — one whole-value reference, picked from a dropdown.
 * - `advanced` — a raw template the dropdown cannot express, e.g. `Bearer ${env.token}`.
 * - `static` — a literal typed in a control that matches the declared type.
 * - `nested` — an object mapped field by field.
 * - `none` — CHƯA GÁN. Không phải một lựa chọn trong picker: picker để trống + `required`, nên node
 *   chưa gán là lỗi thấy ngay trên hàng thay vì một giá trị trông như đã chọn.
 */
export type SdApiContractValueMode = 'source' | 'advanced' | 'static' | 'nested' | 'none';

interface SdApiContractOption {
  value: string;
  label: string;
}

/**
 * Value editor for one mapped node: a mode picker plus one control chosen by the mode.
 *
 * `source` shows a single dropdown of the references the surrounding schemas and the injected env
 * catalog make available — the author never types `${…}` for the common case. `advanced` keeps a raw
 * expression field for what a dropdown cannot express (`Bearer ${env.token}`). `static` renders a
 * control matching the declared type, including a JSON editor for `object` / `array` literals.
 *
 * The JSON editor for a composite literal only writes when the text parses. While it is half-typed it
 * emits the raw string, and that string is dropped — otherwise one keystroke would turn a literal
 * object into a garbage string in the contract.
 */
@Component({
  selector: 'sd-api-contract-source-editor',
  standalone: true,
  imports: [SdCodeEditor, SdDate, SdDatetime, SdInput, SdInputNumber, SdSelect, SdTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _node = node();
    @let _disabled = disabled();
    @let _mode = mode();
    @let _autoId = autoId();
    @let _suggestions = sourceOptions();

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
        [required]="true"
        [model]="modeValue()"
        [disabled]="_disabled"
        (sdChange)="setMode($event)"></sd-select>

      @if (_mode === 'source') {
        <sd-select
          class="sd-acb-source__expression"
          size="sm"
          hideInlineError
          [clearable]="false"
          [autoId]="_autoId ? _autoId + '-source' : undefined"
          [label]="'core.component.api-contract-builder.mapping.source' | sdTranslate"
          [items]="_suggestions"
          valueField="expression"
          displayField="display"
          [model]="_node.source ?? ''"
          [disabled]="_disabled"
          (sdChange)="setSource($event)"></sd-select>
      } @else if (_mode === 'advanced') {
        <sd-input
          class="sd-acb-source__expression"
          size="sm"
          hideInlineError
          [autoId]="_autoId ? _autoId + '-advanced' : undefined"
          [label]="'core.component.api-contract-builder.mapping.source' | sdTranslate"
          [placeholder]="advancedPlaceholder"
          [model]="_node.source ?? ''"
          [disabled]="_disabled"
          (sdChange)="setSource($event)"></sd-input>
      } @else if (_mode === 'static') {
        @let _staticAutoId = _autoId ? _autoId + '-static' : undefined;
        @let _staticLabel = 'core.component.api-contract-builder.mapping.value' | sdTranslate;

        @switch (_node.type) {
          @case ('boolean') {
            <sd-select
              class="sd-acb-source__static"
              size="sm"
              hideInlineError
              [clearable]="false"
              [autoId]="_staticAutoId"
              [label]="_staticLabel"
              [items]="booleanOptions"
              valueField="value"
              displayField="label"
              [model]="_node.value === true ? 'true' : 'false'"
              [disabled]="_disabled"
              (sdChange)="setStaticBoolean($event)"></sd-select>
          }
          @case ('number') {
            <sd-input-number
              class="sd-acb-source__static"
              size="sm"
              hideInlineError
              [autoId]="_staticAutoId"
              [label]="_staticLabel"
              [model]="staticNumber()"
              [disabled]="_disabled"
              (sdChange)="setStaticNumber($event)"></sd-input-number>
          }
          @case ('date') {
            <sd-date
              class="sd-acb-source__static"
              size="sm"
              hideInlineError
              [autoId]="_staticAutoId"
              [label]="_staticLabel"
              [model]="staticText()"
              [disabled]="_disabled"
              (sdChange)="setStaticTemporal($event)"></sd-date>
          }
          @case ('datetime') {
            <sd-datetime
              class="sd-acb-source__static"
              size="sm"
              hideInlineError
              [autoId]="_staticAutoId"
              [label]="_staticLabel"
              [model]="staticText()"
              [disabled]="_disabled"
              (sdChange)="setStaticTemporal($event)"></sd-datetime>
          }
          @case ('object') {
            <sd-code-editor
              class="sd-acb-source__static sd-acb-source__static--json"
              language="json"
              maxHeight="220px"
              [model]="_node.value"
              [viewed]="_disabled"
              (modelChange)="setStaticJson($event)"></sd-code-editor>
          }
          @case ('array') {
            <sd-code-editor
              class="sd-acb-source__static sd-acb-source__static--json"
              language="json"
              maxHeight="220px"
              [model]="_node.value"
              [viewed]="_disabled"
              (modelChange)="setStaticJson($event)"></sd-code-editor>
          }
          @default {
            <sd-input
              class="sd-acb-source__static"
              size="sm"
              hideInlineError
              [autoId]="_staticAutoId"
              [label]="_staticLabel"
              [model]="staticText()"
              [disabled]="_disabled"
              (sdChange)="setStaticScalar($event)"></sd-input>
          }
        }
      }
    </div>
  `,
  // why các flex-basis dưới đây được nới rộng: hàng này từng phải chen vào một ô ~170px của grid bảy
  // cột. Giờ nó sống trong drawer, chiều rộng không còn khan hiếm — nhãn nổi của mat-form-field đủ
  // chỗ. Comment để ngoài `styles`: `check:i18n` quét chuỗi tiếng Việt trong template và style.
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
        flex: 0 0 200px;
        min-width: 180px;
      }
      .sd-acb-source__expression,
      .sd-acb-source__static {
        flex: 1 1 260px;
        min-width: 220px;
      }
      .sd-acb-source__static--json {
        flex: 1 1 100%;
        min-width: 0;
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

  protected readonly advancedPlaceholder = 'Bearer ${env.token}';

  // why: dựng MỘT lần trong field initializer. `[items]` nhận mảng mới mỗi CD sẽ kích
  // `toObservable(items)` của sd-select → markForCheck → CD mới → treo trình duyệt (bug OOM
  // đã gặp ở query-builder). Ngôn ngữ chỉ đổi kèm reload trang nên dựng một lần là đủ.
  protected readonly booleanOptions: SdApiContractOption[] = [
    { value: 'true', label: this.#i18n.t('core.component.api-contract-builder.boolean.true') },
    { value: 'false', label: this.#i18n.t('core.component.api-contract-builder.boolean.false') },
  ];

  readonly #sourceMode: SdApiContractOption = {
    value: 'source',
    label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.source'),
  };
  readonly #advancedMode: SdApiContractOption = {
    value: 'advanced',
    label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.advanced'),
  };

  readonly #scalarModes: SdApiContractOption[] = [
    this.#sourceMode,
    { value: 'static', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.static') },
    this.#advancedMode,
  ];

  readonly #objectModes: SdApiContractOption[] = [
    this.#sourceMode,
    { value: 'static', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.static') },
    this.#advancedMode,
    { value: 'nested', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.nested') },
  ];

  readonly #arrayModes: SdApiContractOption[] = [
    this.#sourceMode,
    { value: 'static', label: this.#i18n.t('core.component.api-contract-builder.mapping.mode.static') },
    this.#advancedMode,
  ];

  // why: mode là state của GIAO DIỆN, không nằm trong contract — nó được suy lại từ node mỗi khi cha
  // đẩy giá trị mới. `linkedSignal` (không phải `computed`) vì có đúng một trường hợp phải GHI ĐÈ
  // suy diễn: người dùng đang ở `advanced` và gõ tới lúc chuỗi tình cờ còn đúng một reference sạch.
  // Nếu để suy diễn thắng, ô text đang gõ sẽ biến thành dropdown giữa lúc gõ.
  protected readonly mode = linkedSignal<SdApiContractStructuralNode, SdApiContractValueMode>({
    source: () => this.node(),
    computation: (node, previous) => {
      const derived = deriveMode(node);
      if (previous?.value === 'advanced' && derived === 'source') return 'advanced';
      return derived;
    },
  });

  /**
   * Giá trị hiển thị của picker.
   *
   * why: `none` không còn là một option, nên bind nó vào `[model]` sẽ ra một ô trống mà người dùng
   * không hiểu tại sao. Trả `null` để picker rỗng THẬT — cộng `required`, một node chưa gán trở thành
   * lỗi thấy được ngay trên hàng, khớp với diagnostic `mapping.node.unmapped` mà validation đã báo.
   */
  protected readonly modeValue = computed<SdApiContractValueMode | null>(() => {
    const mode = this.mode();
    return mode === 'none' ? null : mode;
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

  /**
   * Options for the source dropdown.
   *
   * why: một `source` đang lưu có thể trỏ vào trường đã bị xoá hoặc đổi tên — nó KHÔNG còn trong
   * danh sách gợi ý. `sd-select` không tìm thấy value sẽ hiện ô rỗng, và giá trị vẫn nằm trong
   * contract mà người dùng không thấy để sửa. Thêm một option dựng từ chính giá trị đó để nó luôn
   * hiển thị; validation lo phần báo `mapping.reference.missing`.
   */
  protected readonly sourceOptions = computed<SdApiContractSuggestion[]>(() => {
    const options = this.suggestionOptions();
    const current = this.node().source;
    if (typeof current !== 'string' || current === '') return options;
    if (options.some(option => option.expression === current)) return options;

    const parsed = parseSdApiContractTemplate(current);
    if (parsed.kind !== 'exact') return options;

    const reference = parsed.references[0];
    return [
      ...options,
      {
        expression: current,
        path: reference?.expression ?? current,
        root: reference?.root ?? 'input',
        type: this.node().type,
        display: reference?.expression ?? current,
      },
    ];
  });

  protected readonly staticText = computed(() => {
    const value = this.node().value;
    return value === undefined || value === null ? '' : String(value);
  });

  protected readonly staticNumber = computed(() => {
    const value = this.node().value;
    return typeof value === 'number' ? value : null;
  });

  protected setMode(mode: unknown): void {
    const node = this.node();

    // why: đặt mode TRƯỚC khi emit. Node quay lại từ cha sẽ kích `linkedSignal` tính lại, và nó đọc
    // `previous.value` — nếu chưa đặt, carve-out `advanced` sẽ giữ lại mode cũ và chặn việc rời khỏi
    // `advanced` sang `source`.
    if (mode === 'source' || mode === 'advanced') {
      this.mode.set(mode);
      // Rời `advanced` sang `source` thì template ghép không còn diễn đạt được bằng dropdown — xoá để
      // dropdown bắt đầu sạch. Ngược lại, đã có key `source` thì đổi mode không đụng tới model.
      const abandonsTemplate = mode === 'source' && parseSdApiContractTemplate(node.source).kind === 'interpolated';
      if (node.source === undefined || abandonsTemplate) {
        this.nodeChange.emit({ ...withoutMapping(node), source: '' });
      }
      return;
    }

    if (mode === 'static') {
      this.mode.set('static');
      this.nodeChange.emit({ ...withoutMapping(node), value: defaultStatic(node.type) });
      return;
    }

    this.mode.set(node.type === 'object' ? 'nested' : 'none');
    this.nodeChange.emit(withoutMapping(node));
  }

  protected setSource(value: unknown): void {
    this.nodeChange.emit({ ...withoutMapping(this.node()), source: typeof value === 'string' ? value : '' });
  }

  protected setStaticScalar(value: unknown): void {
    const node = this.node();
    this.nodeChange.emit({ ...withoutMapping(node), value: value === null || value === undefined ? '' : String(value) });
  }

  protected setStaticNumber(value: unknown): void {
    const node = this.node();
    const parsed = typeof value === 'number' ? value : Number(value === null || value === undefined ? '' : String(value).trim());
    this.nodeChange.emit({ ...withoutMapping(node), value: Number.isFinite(parsed) ? parsed : 0 });
  }

  /**
   * Stores a `date` / `datetime` literal.
   *
   * why: `<sd-date>` / `<sd-datetime>` có thể bắn ra một `Date`. `String(new Date())` ra
   * `Mon Aug 17 2026 …` — không parse lại được và đổi theo locale của máy tác giả, nên contract sẽ
   * mang một giá trị không portable. Chuẩn hoá về ISO.
   */
  protected setStaticTemporal(value: unknown): void {
    const node = this.node();
    if (value instanceof Date) {
      const iso = Number.isNaN(value.getTime()) ? '' : value.toISOString();
      this.nodeChange.emit({ ...withoutMapping(node), value: iso });
      return;
    }
    this.nodeChange.emit({ ...withoutMapping(node), value: value === null || value === undefined ? '' : String(value) });
  }

  /**
   * Stores an `object` / `array` literal from the JSON editor.
   *
   * why: `<sd-code-editor language="json">` bắn ra STRING khi cú pháp còn dở (`{"a":`). Ghi chuỗi đó
   * vào contract sẽ biến một literal object thành rác, nên bỏ qua và giữ giá trị hợp lệ cuối cùng —
   * người dùng vẫn thấy nguyên văn mình đang gõ trong editor.
   */
  protected setStaticJson(value: unknown): void {
    if (value === null || typeof value !== 'object') return;
    this.nodeChange.emit({ ...withoutMapping(this.node()), value: value as SdApiContractJsonValue });
  }

  protected setStaticBoolean(value: unknown): void {
    this.nodeChange.emit({ ...withoutMapping(this.node()), value: value === 'true' || value === true });
  }
}

/**
 * Reads the mode out of the node alone — the contract never stores it.
 *
 * An EMPTY `source` means "Lấy từ nguồn đã chọn, chưa pick" and stays in `source`; anything the
 * dropdown cannot express (a template with literal text, or text with no reference at all) is
 * `advanced`. A clean single reference stays in `source` even when it resolves to nothing, so a typo
 * is fixed in the friendly picker while validation reports `mapping.reference.missing`.
 */
function deriveMode(node: SdApiContractStructuralNode): SdApiContractValueMode {
  if (node.source !== undefined) {
    if (node.source === '') return 'source';
    return parseSdApiContractTemplate(node.source).kind === 'exact' ? 'source' : 'advanced';
  }
  if (node.value !== undefined) return 'static';
  return node.type === 'object' ? 'nested' : 'none';
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
