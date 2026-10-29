import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import { CustomerService } from '../../services/customer.service';
import type { CustomerSaveReq } from '../../services/customer.model';
import {
  customerSaveReq,
  GeneralInformationFormComponent,
  invalidCustomerGroups,
  type CustomerForm,
  type CustomerFormGroup,
} from '../general-information-form/general-information-form.component';

/**
 * Tạo khách hàng trong drawer (route con `create` của danh sách). Ba nhóm, mỗi nhóm còn lỗi hiện `sd-inform`; BE báo
 * trùng email ngay trên field. Lưu thành công thì đóng drawer, danh sách tải lại.
 */
@Component({
  selector: 'create-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, GeneralInformationFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-side-drawer title="Tạo khách hàng" width="600px" autoId="customer-create" [beforeClose]="beforeClose" (sdClosed)="closed()">
      <general-information-form [form]="form" [seed]="seed" [errors]="apiErrors.errors()" [invalidGroups]="invalidGroups()" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button
          title="Tạo khách hàng"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="customer-save"
          [loading]="saving()"
          (click)="save()" />
      </div>
    </sd-side-drawer>
  `,
})
export class CreateSideDrawerComponent {
  readonly #customerService = inject(CustomerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #injector = inject(Injector);
  private readonly drawer = viewChild.required(SdSideDrawer);
  // why: sd-side-drawer chuyển nội dung ra body, nên tìm field lỗi trong form chứ không trong host của component.
  private readonly formElement = viewChild.required(GeneralInformationFormComponent, { read: ElementRef });
  protected readonly seed: CustomerSaveReq = {
    name: '',
    type: 'individual',
    tier: 'standard',
    email: '',
    phone: '',
    address: '',
    taxCode: null,
    status: 'active',
    note: null,
  };
  protected readonly form: CustomerForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  protected readonly invalidGroups = signal<CustomerFormGroup[]>([]);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'customer-create', dirty: 'value' });

  /** Đóng khi còn thay đổi chưa lưu: hỏi, đồng ý thì bỏ thay đổi (guard rời route không hỏi lại). */
  protected readonly beforeClose = async (): Promise<boolean> => {
    if (!this.#unsaved.dirty() || this.saving()) return !this.saving();
    try {
      await this.#confirm.confirm('Thay đổi chưa lưu sẽ bị mất.', {
        title: 'Đóng khi chưa lưu?',
        yesTitle: 'Bỏ thay đổi',
        noTitle: 'Tiếp tục sửa',
        yesButtonColor: 'warning',
      });
    } catch {
      return false;
    }
    this.#unsaved.markPristine();
    return true;
  };

  constructor() {
    afterNextRender(() => this.drawer().open());
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected closed(): void {
    void this.#router.navigate(['..'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#showErrors();
      return;
    }
    this.saving.set(true);
    try {
      const customer = await firstValueFrom(this.#customerService.create(customerSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success(`Đã tạo khách hàng ${customer.code}.`);
      this.saving.set(false);
      this.drawer().close();
    } catch (error) {
      if (this.apiErrors.set(error)) this.#showErrors();
      else this.#notify.error(apiErrorMessage(error, 'Không thể lưu. Dữ liệu đã nhập vẫn được giữ.'));
    } finally {
      this.saving.set(false);
    }
  }

  /** `sd-inform` trong từng nhóm có lỗi, rồi focus field lỗi đầu tiên. */
  #showErrors(): void {
    this.invalidGroups.set(invalidCustomerGroups(this.form, this.apiErrors.errors()));
    afterNextRender(() => focusFirstInvalid(this.formElement().nativeElement), { injector: this.#injector });
  }
}
