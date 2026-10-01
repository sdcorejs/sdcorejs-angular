import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { SdFormGenericField, SdFormGenericOption } from '../../../models/form-generic-field.model';
import { HtmlPipe } from '../../../pipes';
import { sdNumberSuffix, sdTextSubtype } from '../../../presets/form-generic-presets';
import { FormGenericService } from '../../../services/form-generic.service';
import { BuilderItem, isField } from '../state/builder-document';

type AnyField = SdFormGenericField & Record<string, unknown>;

/**
 * Biểu diễn THIẾT KẾ của một field trên canvas: nhãn rời, khung control với placeholder/hậu tố,
 * helper text và chip trạng thái. Không có control thật, không có logic form — nên click không mở
 * datepicker/upload và 300 field vẫn nhẹ. Hình dạng bám theo renderer (`labelPlacement="top"`);
 * bố cục/độ rộng do canvas tính bằng cùng thuật toán với renderer.
 *
 * Phần tử có `type` mà phiên bản này chưa biết hiện thẻ "chưa hỗ trợ" — nội dung được giữ nguyên.
 */
@Component({
  selector: 'fb-field-preview',
  templateUrl: './field-preview.component.html',
  styleUrl: './field-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, SdIcon, SdTranslatePipe, HtmlPipe],
})
export class FieldPreviewComponent {
  readonly #formGeneric = inject(FormGenericService);

  readonly item = input.required<BuilderItem>();

  readonly unsupported = computed(() => !isField(this.item()));
  readonly field = computed(() => this.item() as AnyField);
  readonly label = computed(() => (this.item() as { label?: string }).label ?? '');
  readonly required = computed(() => !!(this.item() as { validation?: { required?: boolean } }).validation?.required);
  readonly rules = computed(() => (this.item() as { rules?: SdFormGenericField['rules'] }).rules);
  readonly conditional = computed(() => {
    const rules = this.rules();
    return !!(rules?.visible || rules?.hidden || rules?.disabled || rules?.required);
  });
  readonly requiredWhen = computed(() => !this.required() && !!this.rules()?.required);
  readonly hidden = computed(() => !!(this.item() as { hidden?: boolean }).hidden);
  readonly readonly = computed(() => !!(this.item() as { viewed?: boolean }).viewed);
  readonly disabled = computed(() => !!(this.item() as { disabled?: boolean }).disabled);
  readonly placeholder = computed(() => (this.item() as { placeholder?: string }).placeholder ?? '');
  readonly helperText = computed(() => (this.item() as { helperText?: string }).helperText ?? '');
  readonly suffix = computed(() => {
    const item = this.item();
    return item.type === 'number' ? sdNumberSuffix(item as never) : undefined;
  });
  readonly isPassword = computed(() => {
    const item = this.item();
    return item.type === 'textfield' && sdTextSubtype(item as never) === 'password';
  });
  /** Lựa chọn tĩnh (tối đa 6) của radio. */
  readonly options = computed<SdFormGenericOption[]>(() => {
    const options = (this.item() as { options?: { source?: string; items?: SdFormGenericOption[] } }).options;
    return options?.source === 'static' && Array.isArray(options.items) ? options.items.slice(0, 6) : [];
  });
  /** Tên catalog của select/radio lấy lựa chọn từ portal. */
  readonly catalog = computed(() => {
    const options = (this.item() as { options?: { source?: string; catalog?: string } }).options;
    if (options?.source !== 'catalog') return '';
    return this.#formGeneric.catalog(options.catalog)?.label || options.catalog || '';
  });
  readonly direction = computed(() => ((this.item() as { direction?: string }).direction === 'column' ? 'column' : 'row'));
  readonly dateFormat = computed(() => ((this.item() as { subtype?: string }).subtype === 'datetime' ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'));
  readonly uploadIsImage = computed(() => (this.item() as { accept?: string }).accept === 'image');
  /** Nội dung html tĩnh; field theo html definition chỉ hiện tên definition. */
  readonly htmlContent = computed(() => (this.item() as { content?: string }).content ?? '');
  readonly htmlVariables = computed(() => (this.item() as { variables?: Record<string, string> }).variables);
  readonly htmlDefinition = computed(() => (this.item() as { definition?: string }).definition ?? '');
}
