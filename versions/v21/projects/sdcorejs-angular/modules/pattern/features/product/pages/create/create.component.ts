import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
import type { ProductSaveReq } from '../../services/product.model';

@Component({
  selector: 'create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, SdButton, GeneralInformationFormComponent],
  template: `
    <sd-page-form title="Tạo mới sản phẩm" [backLink]="['..']">
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Huỷ" type="outline" autoId="product-cancel" (click)="cancel()" />
        <sd-button
          title="Tạo sản phẩm"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="product-save"
          [loading]="saving()"
          (click)="save()" />
      </div>
      <div class="py-16">
        <general-information-form [form]="form" [seed]="seed" [errors]="apiErrors.errors()" />
      </div>
    </sd-page-form>
  `,
})
export class CreateComponent {
  readonly #productService = inject(ProductService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  protected readonly seed: ProductSaveReq = { code: '', name: '', unit: 'Cái', price: 0, status: 'active' };
  protected readonly form: ProductForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  // Dirty theo giá trị: gõ rồi xoá về như cũ thì rời trang không bị hỏi.
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'product-create', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected cancel(): void {
    void this.#router.navigate(['..'], { relativeTo: this.#route });
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
      const product = await firstValueFrom(this.#productService.create(productSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success(`Đã tạo sản phẩm ${product.code}.`);
      // replaceUrl: Back ở trang chi tiết về danh sách, không quay lại form tạo mới.
      await this.#router.navigate(['..', product.id, 'detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
      // Lưu lỗi: giữ nguyên dữ liệu đã nhập; lỗi theo field hiện ngay trên field.
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
