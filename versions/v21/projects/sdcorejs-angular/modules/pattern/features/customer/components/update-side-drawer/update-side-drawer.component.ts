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
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDto } from '../../services/customer.model';
import {
  customerSaveReq,
  GeneralInformationFormComponent,
  invalidCustomerGroups,
  type CustomerForm,
  type CustomerFormGroup,
} from '../general-information-form/general-information-form.component';

/**
 * Cập nhật khách hàng trong drawer (route con `:id/update`). X, Esc và backdrop đi qua `beforeClose`: còn thay đổi
 * thì hỏi trước khi bỏ. Lưu thành công thì đóng drawer; danh sách tải lại và focus trở về dòng đã mở.
 */
@Component({
  selector: 'update-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, GeneralInformationFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-side-drawer
      [title]="'Cập nhật khách hàng #' + entity().code"
      width="600px"
      autoId="customer-update"
      [beforeClose]="beforeClose"
      (sdClosed)="closed()">
      <general-information-form [form]="form" [seed]="entity()" [errors]="apiErrors.errors()" [invalidGroups]="invalidGroups()" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button title="Lưu" type="fill" color="primary" autoId="customer-save" [loading]="saving()" (click)="save()" />
      </div>
    </sd-side-drawer>
  `,
})
export class UpdateSideDrawerComponent {
  readonly #customerService = inject(CustomerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #injector = inject(Injector);
  private readonly drawer = viewChild.required(SdSideDrawer);
  // why: sd-side-drawer chuyển nội dung ra body, nên tìm field lỗi trong form chứ không trong host của component.
  private readonly formElement = viewChild.required(GeneralInformationFormComponent, { read: ElementRef });
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as CustomerDto)), { requireSync: true });
  protected readonly form: CustomerForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  protected readonly invalidGroups = signal<CustomerFormGroup[]>([]);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'customer-update', dirty: 'value' });

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
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
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
      await firstValueFrom(this.#customerService.update(this.entity().id, customerSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success('Đã cập nhật khách hàng.');
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
