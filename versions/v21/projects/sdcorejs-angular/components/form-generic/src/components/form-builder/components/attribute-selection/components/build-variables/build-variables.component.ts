import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output, signal, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdInput, SdSelect } from '@sdcorejs/angular/forms';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import type { SdFormGenericFill } from '../../../../../../models/form-generic-field.model';
import { sdIsField, sdIsGroup } from '../../../../../../models/form-generic-schema';
import type { SdFormGenericPageElement } from '../../../../../../models/form-generic-schema.model';
import { MappingBoxComponent } from '../../../value-box/mapping-box.component';
import { fillRows, referenceLabels } from '../../../value-box/mapping-summary';

interface DraftFill {
  field: string;
  from: string;
}

/**
 * Sửa `options.fill`: khi người dùng chọn một mục catalog, ghi `item.data[from]` vào field đích.
 * `from` chọn theo `catalog.fields` nếu portal khai báo; không khai báo thì nhập tên thuộc tính.
 */
@Component({
  selector: 'build-variables',
  templateUrl: './build-variables.component.html',
  styleUrl: './build-variables.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdInput, SdSelect, SdButton, SdModal, SdTranslatePipe, MappingBoxComponent],
})
export class BuildVariables {
  readonly modal = viewChild(SdModal);

  readonly label = input<string>();
  readonly elements = input.required<readonly SdFormGenericPageElement[]>();
  /** Thuộc tính trong `item.data` mà catalog trả về (`catalog.fields`). */
  readonly fields = input<readonly { name: string; label: string }[] | null | undefined>([]);
  /** Key của chính field đang sửa — không được làm field đích. */
  readonly exclude = input<string | null | undefined>(undefined);
  readonly model = input<readonly SdFormGenericFill[] | null | undefined>(undefined);
  /** Chỉ xem — không có nút mở popup chỉnh sửa. */
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly modelChange = output<SdFormGenericFill[]>();

  readonly form = new FormGroup({});
  readonly draft = signal<DraftFill[]>([]);
  readonly #labels = computed(() => referenceLabels(this.elements(), []));
  readonly declared = computed(() => !!this.fields()?.length);
  readonly rows = computed(() => {
    const fields = this.fields() ?? [];
    return fillRows(this.model(), this.#labels(), from => fields.find(field => field.name === from)?.label || from);
  });
  readonly targetOptions = computed(() =>
    this.elements()
      .flatMap(element => (sdIsGroup(element) ? (element.elements ?? []) : [element]))
      .filter(sdIsField)
      .filter(field => !!field.key && field.key !== this.exclude() && field.type !== 'html' && field.type !== 'upload')
      .map(field => ({ value: field.key as string, display: field.label || (field.key as string) }))
  );
  readonly fromOptions = computed(() => (this.fields() ?? []).map(field => ({ value: field.name, display: field.label || field.name })));

  edit(): void {
    if (this.readonly()) return;
    this.draft.set((this.model() ?? []).map(item => ({ field: item.field, from: item.from })));
    this.modal()?.open();
  }

  setField(index: number, field: unknown): void {
    this.#patch(index, { field: typeof field === 'string' ? field : '' });
  }

  setFrom(index: number, from: unknown): void {
    this.#patch(index, { from: typeof from === 'string' ? from : '' });
  }

  add(): void {
    this.draft.set([...this.draft(), { field: '', from: '' }]);
  }

  remove(index: number): void {
    this.draft.set(this.draft().filter((_, position) => position !== index));
  }

  /** Bỏ dòng thiếu field đích hoặc thiếu thuộc tính nguồn; một field đích chỉ nhận một nguồn (giữ dòng đầu). */
  accept(): void {
    const fill: SdFormGenericFill[] = [];
    for (const row of this.draft()) {
      const field = row.field.trim();
      const from = row.from.trim();
      if (!field || !from || fill.some(item => item.field === field)) continue;
      fill.push({ field, from });
    }
    this.modelChange.emit(fill);
    this.modal()?.close();
  }

  #patch(index: number, patch: Partial<DraftFill>): void {
    this.draft.set(this.draft().map((row, position) => (position === index ? { ...row, ...patch } : row)));
  }
}
