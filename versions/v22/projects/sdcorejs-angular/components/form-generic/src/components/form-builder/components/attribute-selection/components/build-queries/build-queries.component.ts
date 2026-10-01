import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdInput, SdSelect } from '@sdcorejs/angular/forms';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import type { SdFormGenericParam, SdFormGenericValueRef } from '../../../../../../models/form-generic-field.model';
import { sdIsField, sdIsGroup } from '../../../../../../models/form-generic-schema';
import type { SdFormGenericPageElement, SdFormGenericVariable } from '../../../../../../models/form-generic-schema.model';
import { MappingBoxComponent } from '../../../value-box/mapping-box.component';
import { paramRows, referenceLabels } from '../../../value-box/mapping-summary';

/** Tham số do portal khai báo (catalog, html definition): tên cố định, người dùng chỉ gán giá trị. */
export interface BuilderParamDefinition {
  readonly name: string;
  readonly label: string;
  readonly required?: boolean;
}

type ValueSource = 'field' | 'variable' | 'value';

interface DraftParam {
  name: string;
  source: ValueSource;
  ref: string;
  /** Tên theo khai báo — không sửa, không xoá. */
  fixed: boolean;
  required: boolean;
  /** Giá trị trước khi sửa: giữ nguyên kiểu hằng số (số, boolean) nếu người dùng không đổi. */
  original?: SdFormGenericValueRef;
}

const sourceOf = (ref: SdFormGenericValueRef | undefined): ValueSource =>
  !ref || 'field' in ref ? 'field' : 'variable' in ref ? 'variable' : 'value';
const refText = (ref: SdFormGenericValueRef | undefined): string =>
  !ref ? '' : 'field' in ref ? ref.field : 'variable' in ref ? ref.variable : `${ref.value ?? ''}`;

const toValueRef = (row: DraftParam): SdFormGenericValueRef | undefined => {
  if (row.ref === '') return undefined;
  if (row.original && sourceOf(row.original) === row.source && refText(row.original) === row.ref) return row.original;
  return row.source === 'field' ? { field: row.ref } : row.source === 'variable' ? { variable: row.ref } : { value: row.ref };
};

/**
 * Sửa danh sách tham số `{ name, value }`; giá trị là tham chiếu có cấu trúc: field, biến hoặc hằng số.
 * Có `definitions` thì tên tham số theo khai báo của portal; không có thì người dùng tự đặt tên.
 * Tham số đã lưu nhưng không còn trong khai báo vẫn được giữ và có thể xoá — không mất dữ liệu ngầm.
 */
@Component({
  selector: 'build-queries',
  templateUrl: './build-queries.component.html',
  styleUrl: './build-queries.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdInput, SdSelect, SdButton, SdModal, SdTranslatePipe, MappingBoxComponent],
})
export class BuildQueries {
  readonly #i18n = inject(I18nService);
  readonly modal = viewChild(SdModal);

  readonly label = input<string>();
  /** Tiêu đề popup; mặc định "Thiết lập giá trị truy vấn". */
  readonly title = input<string>();
  readonly elements = input.required<readonly SdFormGenericPageElement[]>();
  readonly variables = input.required<readonly SdFormGenericVariable[]>();
  /** Tham số được khai báo; rỗng = tên tự do. */
  readonly definitions = input<readonly BuilderParamDefinition[] | null | undefined>([]);
  readonly model = input<readonly SdFormGenericParam[] | null | undefined>(undefined);
  /** Chỉ xem — không có nút mở popup chỉnh sửa. */
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly modelChange = output<SdFormGenericParam[]>();

  readonly form = new FormGroup({});
  readonly draft = signal<DraftParam[]>([]);
  readonly freeNames = computed(() => !this.definitions()?.length);
  readonly #labels = computed(() => referenceLabels(this.elements(), this.variables()));
  readonly rows = computed(() => {
    const definitions = this.definitions() ?? [];
    const nameOf = (name: string) => definitions.find(definition => definition.name === name)?.label || name;
    return paramRows(this.model(), this.#labels(), nameOf, this.#i18n.t('core.component.form-builder.variable.prefix'));
  });
  readonly sources = computed(() => [
    { value: 'field', display: this.#i18n.t('core.component.form-builder.value-ref.field') },
    { value: 'variable', display: this.#i18n.t('core.component.form-builder.value-ref.variable') },
    { value: 'value', display: this.#i18n.t('core.component.form-builder.value-ref.value') },
  ]);
  readonly fieldOptions = computed(() =>
    this.elements()
      .flatMap(element => (sdIsGroup(element) ? (element.elements ?? []) : [element]))
      .filter(sdIsField)
      .filter(field => !!field.key && field.type !== 'html' && field.type !== 'upload')
      .map(field => ({ value: field.key as string, display: field.label || (field.key as string) }))
  );
  readonly variableOptions = computed(() =>
    this.variables().map(variable => ({ value: variable.key, display: variable.label || variable.key }))
  );

  labelOf(name: string): string {
    return (this.definitions() ?? []).find(definition => definition.name === name)?.label || name;
  }

  edit(): void {
    if (this.readonly()) return;
    const current = this.model() ?? [];
    const definitions = this.definitions() ?? [];
    const toDraft = (param: SdFormGenericParam, fixed: boolean, required = false): DraftParam => ({
      name: param.name,
      source: sourceOf(param.value),
      ref: refText(param.value),
      fixed,
      required,
      original: param.value,
    });
    const declared = definitions.map(definition => {
      const existing = current.find(param => param.name === definition.name);
      return existing
        ? toDraft(existing, true, !!definition.required)
        : { name: definition.name, source: 'field' as const, ref: '', fixed: true, required: !!definition.required };
    });
    const extra = current
      .filter(param => !definitions.some(definition => definition.name === param.name))
      .map(param => toDraft(param, false));
    this.draft.set([...declared, ...extra]);
    this.modal()?.open();
  }

  setName(index: number, name: unknown): void {
    this.#patch(index, { name: typeof name === 'string' ? name : '' });
  }

  setSource(index: number, source: unknown): void {
    if (source !== 'field' && source !== 'variable' && source !== 'value') return;
    if (this.draft()[index]?.source === source) return;
    this.#patch(index, { source, ref: '' });
  }

  setRef(index: number, ref: unknown): void {
    this.#patch(index, { ref: ref === null || ref === undefined ? '' : `${ref}` });
  }

  add(): void {
    this.draft.set([...this.draft(), { name: '', source: 'field', ref: '', fixed: false, required: false }]);
  }

  remove(index: number): void {
    this.draft.set(this.draft().filter((row, position) => position !== index || row.fixed));
  }

  /** Bỏ dòng thiếu tên hoặc thiếu giá trị; tên trùng thì giữ dòng đầu. */
  accept(): void {
    const params: SdFormGenericParam[] = [];
    for (const row of this.draft()) {
      const name = row.name.trim();
      const value = toValueRef(row);
      if (!name || !value || params.some(param => param.name === name)) continue;
      params.push({ name, value });
    }
    this.modelChange.emit(params);
    this.modal()?.close();
  }

  #patch(index: number, patch: Partial<DraftParam>): void {
    this.draft.set(this.draft().map((row, position) => (position === index ? { ...row, ...patch } : row)));
  }
}
