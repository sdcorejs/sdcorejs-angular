import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import {
  GeneralInformationFormComponent,
  productSaveReq,
  type ProductForm,
} from '../../components/general-information-form/general-information-form.component';
import { ProductService } from '../../services/product.service';
import type { ProductDto } from '../../services/product.model';

@Component({
  selector: 'update',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, SdButton, GeneralInformationFormComponent],
  template: `
    <sd-page-form [title]="'Cập nhật sản phẩm #' + entity().code" [backLink]="['../detail']">
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Huỷ" type="outline" autoId="product-cancel" (click)="cancel()" />
        <sd-button title="Lưu" prefixIcon="save" type="fill" color="primary" autoId="product-save" [loading]="saving()" (click)="save()" />
      </div>
      <div class="py-16">
        <general-information-form [form]="form" [seed]="entity()" [editing]="true" [errors]="apiErrors.errors()" />
      </div>
    </sd-page-form>
  `,
})
export class UpdateComponent {
  readonly #productService = inject(ProductService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  /** Sản phẩm do resolver tải; draft khởi tạo từ đây, sửa draft không đổi bản ghi trước khi lưu thành công. */
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as ProductDto)), { requireSync: true });
  protected readonly form: ProductForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'product-update', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected cancel(): void {
    void this.#router.navigate(['../detail'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      // Mã bị khoá sau khi tạo: gửi mã của bản ghi, không lấy từ form.
      await firstValueFrom(this.#productService.update(this.entity().id, productSaveReq(this.form, this.entity().code)));
      this.#unsaved.markPristine();
      this.#notify.success('Đã cập nhật sản phẩm.');
      await this.#router.navigate(['../detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
      // Lưu lỗi: giữ nguyên draft để sửa và thử lại.
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Không thể lưu. Dữ liệu đã nhập vẫn được giữ.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.#host), { injector: this.#injector });
  }
}
