import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
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
 * Cập nhật khách hàng trong drawer, mở bằng `@if` từ drawer chi tiết hoặc hồ sơ 360° (không đổi URL). Drawer mở ngay
 * rồi tải bản ghi bằng `detail(id)`; trạng thái tải và lỗi do `sd-data-state` hiện. X, Esc và backdrop đi qua
 * `beforeClose`: còn thay đổi thì hỏi trước khi bỏ. Lưu thành công thì báo `saved` rồi đóng drawer; danh sách tải lại
 * và focus trở về phần tử đã mở drawer.
 */
@Component({
  selector: 'update-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, SdDataState, GeneralInformationFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _entity = entity();
    <sd-side-drawer
      [title]="_entity ? 'Cập nhật khách hàng #' + _entity.code : 'Cập nhật khách hàng'"
      width="600px"
      autoId="customer-update"
      [beforeClose]="beforeClose"
      (sdClosed)="closed.emit()">
      <sd-data-state [state]="state()" retryable (sdRetry)="load()">
        @if (_entity) {
          <general-information-form [form]="form" [seed]="_entity" [errors]="apiErrors.errors()" [invalidGroups]="invalidGroups()" />
        }
      </sd-data-state>
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button
          title="Lưu"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="customer-save"
          [disabled]="!_entity"
          [loading]="saving()"
          (click)="save()" />
      </div>
    </sd-side-drawer>
  `,
})
export class UpdateSideDrawerComponent implements OnInit {
  readonly #customerService = inject(CustomerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #injector = inject(Injector);
  readonly id = input.required<string>();
  /** Lưu thành công, kèm bản ghi API trả về: màn đang hiện bản ghi (hồ sơ 360°) cập nhật theo. */
  readonly saved = output<CustomerDto>();
  /** Drawer đã đóng (X, Esc, backdrop hoặc lưu xong): màn mở drawer gỡ nó khỏi màn. */
  readonly closed = output<void>();
  private readonly drawer = viewChild.required(SdSideDrawer);
  // why: sd-side-drawer chuyển nội dung ra body, nên tìm field lỗi trong form chứ không trong host của component.
  private readonly formElement = viewChild.required(GeneralInformationFormComponent, { read: ElementRef });
  protected readonly state = signal<'loading' | 'error' | 'success'>('loading');
  protected readonly entity = signal<CustomerDto | null>(null);
  protected readonly form: CustomerForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  protected readonly invalidGroups = signal<CustomerFormGroup[]>([]);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'customer-update', dirty: 'value' });

  /** Đóng khi còn thay đổi chưa lưu: hỏi, đồng ý thì bỏ thay đổi (guard rời trang không hỏi lại). */
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

  ngOnInit(): void {
    void this.load();
  }

  /** Tải bản ghi bằng `detail(id)`, không dùng object của dòng; lỗi hiện trong drawer kèm nút thử lại. */
  protected async load(): Promise<void> {
    this.state.set('loading');
    try {
      this.entity.set(await firstValueFrom(this.#customerService.detail(this.id()).pipe(timeout(10_000))));
      this.state.set('success');
    } catch {
      this.state.set('error');
    }
  }

  protected async save(): Promise<void> {
    const entity = this.entity();
    if (!entity || this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#showErrors();
      return;
    }
    this.saving.set(true);
    try {
      const customer = await firstValueFrom(this.#customerService.update(entity.id, customerSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success('Đã cập nhật khách hàng.');
      this.saved.emit(customer);
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
