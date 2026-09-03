import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { parseSdApiContractTemplate } from '../api-contract.expression';
import type { SdApiContractStructuralNode } from '../api-contract.schema';

/**
 * One collapsed, read-only row for a node in a layer list.
 *
 * The whole point is that it holds NO editable control. Editing a node happens in the drawer, so the
 * list can stay a thing you scan rather than a wall of inputs — and so a node never has two editors
 * writing it at once.
 *
 * The row shows what an author needs to spot a mistake without opening anything: the name, the
 * declared type, whether it is required, and where its value comes from.
 */
@Component({
  selector: 'sd-api-contract-node-summary',
  standalone: true,
  imports: [SdIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _autoId = autoId();
    @let _readonly = readonly();

    <div
      class="sd-acb-row"
      [class.sd-acb-row--readonly]="_readonly"
      [attr.role]="_readonly ? null : 'button'"
      [attr.tabindex]="_readonly ? null : 0"
      [attr.data-autoid]="_autoId || null"
      (click)="requestEdit()"
      (keydown.enter)="requestEdit()"
      (keydown.space)="requestEdit()">
      <span class="sd-acb-row__name">{{ name() }}</span>
      <span class="sd-acb-row__type">{{ node().type }}</span>

      @if (node().required === true) {
        <span class="sd-acb-row__required">{{ requiredLabel }}</span>
      }

      <span class="sd-acb-row__mapping" [class.sd-acb-row__mapping--unmapped]="unmapped()">{{ mappingSummary() }}</span>

      @if (!_readonly) {
        <button
          type="button"
          class="sd-acb-row__remove"
          [attr.data-autoid]="_autoId ? _autoId + '-remove' : null"
          [attr.aria-label]="removeLabel"
          [title]="removeLabel"
          (click)="requestRemove($event)">
          <sd-icon name="delete" size="sm"></sd-icon>
        </button>
      }
    </div>
  `,
  // why `.sd-acb-row__mapping` đẩy sang phải và tự co: nó là phần dài nhất của hàng và cũng là phần
  // dễ bỏ qua nhất. Comment để ngoài `styles`, không trong CSS: `check:i18n` quét chuỗi tiếng Việt
  // trong template và style.
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .sd-acb-row {
        display: flex;
        gap: 10px;
        align-items: center;
        padding: 8px 10px;
        border: 1px solid var(--sd-border-color, #e6e6e6);
        border-radius: 6px;
        background: var(--sd-surface, #fff);
        font-size: 13px;
        cursor: pointer;
      }
      .sd-acb-row:hover {
        border-color: var(--sd-primary, #005cbb);
      }
      .sd-acb-row--readonly {
        cursor: default;
      }
      .sd-acb-row--readonly:hover {
        border-color: var(--sd-border-color, #e6e6e6);
      }
      .sd-acb-row__name {
        min-width: 0;
        font-weight: 600;
        overflow-wrap: anywhere;
      }
      .sd-acb-row__type {
        padding: 1px 6px;
        border-radius: 4px;
        background: var(--sd-surface-muted, #f3f5f8);
        color: var(--sd-text-secondary, #6b6b6b);
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 12px;
      }
      .sd-acb-row__required {
        padding: 1px 6px;
        border-radius: 4px;
        background: color-mix(in srgb, var(--sd-primary, #005cbb) 12%, transparent);
        color: var(--sd-primary, #005cbb);
        font-size: 11px;
      }
      .sd-acb-row__mapping {
        min-width: 0;
        margin-left: auto;
        overflow: hidden;
        color: var(--sd-text-secondary, #6b6b6b);
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sd-acb-row__mapping--unmapped {
        color: var(--sd-warning, #8a5a00);
        font-style: italic;
      }
      .sd-acb-row__remove {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--sd-error, #b3261e);
        cursor: pointer;
      }
      .sd-acb-row__remove:hover {
        background: color-mix(in srgb, var(--sd-error, #b3261e) 12%, transparent);
      }
    `,
  ],
})
export class SdApiContractNodeSummary {
  readonly #i18n = inject(I18nService);

  name = input.required<string>();
  node = input.required<SdApiContractStructuralNode>();
  /** `view` mode and `disabled` both land here: the row becomes text, with no action at all. */
  readonly = input(false, { transform: booleanAttribute });
  autoId = input<string | null | undefined>();

  edit = output<void>();
  remove = output<void>();

  protected readonly requiredLabel = this.#i18n.t('core.component.api-contract-builder.field.required');
  protected readonly removeLabel = this.#i18n.t('core.component.api-contract-builder.node.remove');

  protected readonly unmapped = computed(() => {
    const node = this.node();
    if (node.source !== undefined || node.value !== undefined) return false;
    return !(node.type === 'object' && node.properties);
  });

  /**
   * One line describing where the value comes from.
   *
   * why bốn dạng khác nhau: `${input.keyword}` rút về `input.keyword` vì dấu `${}` là cú pháp chứ
   * không phải thông tin; còn template ghép giữ NGUYÊN VĂN vì rút gọn nó sẽ sai. Literal hiện giá trị
   * để thấy ngay, object hiện số trường để biết còn bao nhiêu phải mở ra xem.
   */
  protected readonly mappingSummary = computed(() => {
    const node = this.node();

    if (typeof node.source === 'string' && node.source !== '') {
      const parsed = parseSdApiContractTemplate(node.source);
      const reference = parsed.kind === 'exact' ? parsed.references[0] : undefined;
      return `← ${reference ? reference.expression : node.source}`;
    }

    if (node.value !== undefined) return `= ${formatLiteral(node.value)}`;

    if (node.type === 'object' && node.properties) {
      return this.#i18n.t('core.component.api-contract-builder.summary.field-count', {
        count: Object.keys(node.properties).length,
      });
    }

    return this.#i18n.t('core.component.api-contract-builder.summary.unmapped');
  });

  protected requestEdit(): void {
    if (this.readonly()) return;
    this.edit.emit();
  }

  /**
   * why stopPropagation: nút xoá nằm TRONG hàng có `(click)`, nên không chặn thì bấm xoá cũng mở
   * drawer — người dùng bấm xoá lại thấy form hiện ra.
   */
  protected requestRemove(event: Event): void {
    event.stopPropagation();
    if (this.readonly()) return;
    this.remove.emit();
  }
}

/** Renders a literal short enough for one row: strings quoted, composites collapsed. */
function formatLiteral(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null || typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return `[${value.length}]`;
  return `{${Object.keys(value).length}}`;
}
