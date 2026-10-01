import { ChangeDetectionStrategy, Component, computed, inject, input, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';
import type { SdFormGenericUpload } from '../../../../../../models/form-generic-field.model';
import { sdResolveParams } from '../../../../../../rules/form-generic-values';
import { FormRenderContext } from '../../../../form-render.context';

@Component({
  selector: 'lib-upload',
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdUploadFile],
})
export class UploadComponent {
  readonly field = input.required<SdFormGenericUpload>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  // why: signal queries cannot live on ES `#private` members (NG1053).
  private readonly file = viewChild(SdUploadFile);

  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key]);
  /** Tham số gửi cho handler upload của Core, đã giải từ value và biến. */
  readonly args = computed(() => sdResolveParams(this.field().params, this.#context.value(), this.#context.variables()));

  setValue(value: unknown): void {
    this.#context.patch({ [this.field().key]: value });
  }

  /** Tải lên tệp đang chờ; kết quả về value qua `modelChange` của `sd-upload-file`. */
  async upload(): Promise<void> {
    await this.file()?.upload();
  }
}
