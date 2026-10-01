import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { filterToTokens, SdQueryBuilder, SdQueryBuilderField } from '@sdcorejs/angular/components/query-builder';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import type { Filter } from '@sdcorejs/utils/models';
import type { SdFormGenericCatalogItem } from '../../../../models/form-generic-config.model';
import type { SdFormGenericField, SdFormGenericRadio, SdFormGenericSelect } from '../../../../models/form-generic-field.model';
import { sdIsField, sdIsGroup } from '../../../../models/form-generic-schema';
import type { SdFormGenericPageElement, SdFormGenericVariable } from '../../../../models/form-generic-schema.model';
import { FormGenericService } from '../../../../services/form-generic.service';
import { ValueBoxComponent } from '../value-box/value-box.component';

export interface BuilderQueryLabels {
  readonly yes: string;
  readonly no: string;
  /** Tiền tố nhãn của biến trong danh sách field (vd `[Biến] `). */
  readonly variablePrefix?: string;
}

const fieldsOf = (elements: readonly SdFormGenericPageElement[]): SdFormGenericField[] =>
  elements.flatMap(element => (sdIsGroup(element) ? (element.elements ?? []).filter(sdIsField) : sdIsField(element) ? [element] : []));

/** Thời gian tối đa (ms) chờ catalog trước khi mở editor điều kiện. */
const CATALOG_VALUES_TIMEOUT_MS = 3000;

/** `promise`, hoặc lỗi khi quá `ms` — bộ đếm được huỷ ngay khi promise xong (không giữ zone bận). */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

/**
 * Field của `sd-query-builder` cho điều kiện/validation: field có key của schema (kể cả trong group)
 * và biến. Options static có sẵn nhãn; options catalog hiện giá trị thô cho tới khi popup tải catalog.
 */
export const builderQueryFields = (
  elements: readonly SdFormGenericPageElement[],
  variables: readonly SdFormGenericVariable[],
  labels: BuilderQueryLabels,
  catalogValues: ReadonlyMap<string, { value: string; display: string }[]> = new Map()
): SdQueryBuilderField[] => {
  const fields: SdQueryBuilderField[] = [];
  for (const field of fieldsOf(elements)) {
    if (!field.key || field.type === 'html' || field.type === 'upload') continue;
    const base = { key: field.key, label: field.label || field.key };
    switch (field.type) {
      case 'number':
        fields.push({ ...base, type: 'number' });
        break;
      case 'datetime':
        fields.push({ ...base, type: field.subtype === 'datetime' ? 'datetime' : 'date' });
        break;
      case 'checkbox':
        fields.push({ ...base, type: 'boolean', trueLabel: labels.yes, falseLabel: labels.no });
        break;
      case 'select':
      case 'radio': {
        const values =
          field.options?.source === 'static'
            ? (field.options.items ?? []).map(item => ({ value: item.value, display: item.label }))
            : catalogValues.get(field.key);
        fields.push(values ? { ...base, type: 'values', values } : { ...base, type: 'string' });
        break;
      }
      default:
        fields.push({ ...base, type: 'string' });
    }
  }
  for (const variable of variables ?? [])
    fields.push({ key: variable.key, label: `${labels.variablePrefix ?? ''}${variable.label || variable.key}`, type: 'string' });
  return fields;
};

/**
 * Một điều kiện (`Filter`) trong inspector: khung xem dạng token của `sd-query-builder`, sửa trong
 * popup query builder. Lưu thẳng `Filter` — không có định dạng biểu thức riêng.
 */
@Component({
  selector: 'attribute-expression',
  templateUrl: './attribute-expression.component.html',
  styleUrl: './attribute-expression.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdButton, SdModal, SdQueryBuilder, SdTranslatePipe, ValueBoxComponent],
})
export class AttributeExpression {
  readonly #i18n = inject(I18nService);
  readonly #formGeneric = inject(FormGenericService);

  readonly modal = viewChild(SdModal);

  readonly elements = input.required<readonly SdFormGenericPageElement[]>();
  readonly variables = input.required<readonly SdFormGenericVariable[]>();
  /** Chỉ xem — không có nút mở popup chỉnh sửa. */
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly label = input<string>();
  /** Điều kiện; `undefined` = không có điều kiện. */
  readonly model = model<Filter | undefined>(undefined);
  readonly sdChange = output<Filter | undefined>();

  readonly queryFields = signal<SdQueryBuilderField[]>([]);
  draftFilter: Filter | null = null;

  readonly #labels = computed<BuilderQueryLabels>(() => ({
    yes: this.#i18n.t('core.confirm.yes-short'),
    no: this.#i18n.t('core.confirm.no-short'),
    variablePrefix: this.#i18n.t('core.component.form-builder.variable.prefix'),
  }));
  /** Field cho khung xem — đồng bộ, KHÔNG gọi catalog của portal (tính lại mỗi lần schema đổi). */
  readonly #viewFields = computed(() => builderQueryFields(this.elements() ?? [], this.variables() ?? [], this.#labels()));
  readonly tokens = computed(() => {
    const t = (key: string, params?: Record<string, string | number>) => this.#i18n.t(key, params);
    return filterToTokens(this.model() ?? null, this.#viewFields(), t);
  });
  readonly text = computed(() =>
    this.tokens()
      .map(token => token.text)
      .join('')
  );

  async onEdit(): Promise<void> {
    if (this.readonly()) return;
    this.queryFields.set(builderQueryFields(this.elements() ?? [], this.variables() ?? [], this.#labels(), await this.#catalogValues()));
    this.draftFilter = this.model() ? structuredClone(this.model()!) : null;
    this.modal()?.open();
  }

  onAccept(): void {
    const next = this.draftFilter ?? undefined;
    this.model.set(next);
    this.sdChange.emit(next);
    this.modal()?.close();
  }

  /**
   * Giá trị của options catalog (không tham số) để chọn trong popup; lỗi hoặc quá hạn thì để nhập thô.
   * why: tải song song, mỗi catalog một lần, tối đa {@link CATALOG_VALUES_TIMEOUT_MS} — một catalog chậm
   * hay treo không được giữ editor điều kiện không mở.
   */
  async #catalogValues(): Promise<Map<string, { value: string; display: string }[]>> {
    const values = new Map<string, { value: string; display: string }[]>();
    const loads = new Map<string, Promise<{ value: string; display: string }[] | null>>();
    const fields = fieldsOf(this.elements() ?? []).filter(
      (field): field is SdFormGenericSelect | SdFormGenericRadio => (field.type === 'select' || field.type === 'radio') && !!field.key
    );
    await Promise.all(
      fields.map(async field => {
        const options = field.options;
        const catalog = options?.source === 'catalog' ? this.#formGeneric.catalog(options.catalog) : undefined;
        if (!catalog) return;
        let pending = loads.get(catalog.id);
        if (!pending) {
          // why: a catalog that needs params cannot list values here — the editor falls back to free input.
          // The mapping stays inside the guarded chain, so an answer that is not a list of items does too.
          pending = withTimeout(
            Promise.resolve().then(() => catalog.load({}, { field, value: {}, variables: {} })),
            CATALOG_VALUES_TIMEOUT_MS
          )
            .then(items =>
              Array.isArray(items)
                ? items
                    .filter((item): item is SdFormGenericCatalogItem => !!item && typeof item === 'object')
                    .map(item => ({ value: item.value, display: item.label }))
                : null
            )
            .catch(() => null);
          loads.set(catalog.id, pending);
        }
        const items = await pending;
        if (items) values.set(field.key, items);
      })
    );
    return values;
  }
}
