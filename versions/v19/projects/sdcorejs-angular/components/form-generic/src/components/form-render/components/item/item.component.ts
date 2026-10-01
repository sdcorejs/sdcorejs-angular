import { ChangeDetectionStrategy, Component, computed, inject, input, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import type { SdFormGenericField } from '../../../../models/form-generic-field.model';
import type { SdFormGenericElementState } from '../../../../rules/form-generic-filter';
import {
  CheckboxComponent,
  ChipCalendarComponent,
  ChipStringComponent,
  DatetimeComponent,
  HtmlComponent,
  NumberComponent,
  RadioComponent,
  SelectComponent,
  TextareaComponent,
  TextfieldComponent,
  UploadComponent,
} from './components';
import { FormRenderContext } from '../../form-render.context';

/** Một field của `sd-form-render`: chọn control theo `type`, trạng thái (khoá/bắt buộc) do renderer tính. */
@Component({
  selector: 'lib-item',
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TextfieldComponent,
    TextareaComponent,
    ChipStringComponent,
    ChipCalendarComponent,
    NumberComponent,
    DatetimeComponent,
    SelectComponent,
    RadioComponent,
    CheckboxComponent,
    UploadComponent,
    HtmlComponent,
  ],
})
export class LibItemComponent {
  readonly field = input.required<SdFormGenericField>();
  readonly state = input.required<SdFormGenericElementState>();
  readonly form = input.required<FormGroup>();

  readonly #context = inject(FormRenderContext);
  /**
   * Bắt buộc có hiệu lực. why: field chỉ xem không được validate — người dùng không sửa được nó, và
   * control của nó (có hoặc không, tuỳ type) không được làm `validate()` lỗi mà không hiện gì.
   */
  readonly required = computed(() => this.state().required && !(this.#context.viewed() || !!this.field().viewed));

  // why: signal queries cannot live on ES `#private` members (NG1053).
  private readonly uploader = viewChild(UploadComponent);

  /** Tải lên tệp đang chờ nếu field là upload. */
  async upload(): Promise<void> {
    await this.uploader()?.upload();
  }
}
