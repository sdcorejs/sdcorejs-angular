import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import { CategoryService } from '../../services/category.service';
import type { CategoryDto, CategorySaveReq } from '../../services/category.model';
import {
  categorySaveReq,
  GeneralInformationFormComponent,
  type CategoryForm,
} from '../general-information-form/general-information-form.component';

/**
 * Tạo danh mục trong drawer, mở từ danh sách bằng `@if` (không đổi URL); `parent` là danh mục cha khi thêm danh mục con.
 * X, Esc và backdrop hỏi trước khi bỏ thay đổi; lưu xong đóng drawer và danh sách tải lại.
 */
@Component({
  selector: 'create-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, GeneralInformationFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _parent = parent();
    <sd-side-drawer
      [title]="_parent ? 'Thêm danh mục con của ' + _parent.name : 'Tạo danh mục'"
      autoId="category-create"
      [beforeClose]="beforeClose"
      (sdClosed)="closed.emit()">
      <general-information-form [form]="form" [seed]="seed" [parentName]="_parent?.name ?? null" [errors]="apiErrors.errors()" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button
          title="Tạo danh mục"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="category-save"
          [loading]="saving()"
          (click)="save()" />
      </div>
    </sd-side-drawer>
  `,
})
export class CreateSideDrawerComponent {
  readonly #categoryService = inject(CategoryService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #injector = inject(Injector);
  /** Danh mục cha khi thêm danh mục con; `null` tạo danh mục gốc. */
  readonly parent = input<Pick<CategoryDto, 'id' | 'name'> | null>(null);
  /** Drawer đã đóng (X, Esc, backdrop hoặc lưu xong): danh sách gỡ drawer khỏi màn. */
  readonly closed = output<void>();
  private readonly drawer = viewChild.required(SdSideDrawer);
  private readonly formElement = viewChild.required(GeneralInformationFormComponent, { read: ElementRef });
  protected readonly seed: CategorySaveReq = { code: '', name: '', parentId: null, status: 'active' };
  protected readonly form: CategoryForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'category-create', dirty: 'value' });

  protected readonly beforeClose = async (): Promise<boolean> => {
    if (this.saving()) return false;
    if (!this.#unsaved.dirty()) return true;
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

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      const category = await firstValueFrom(this.#categoryService.create(categorySaveReq(this.form, this.parent()?.id ?? null)));
      this.#unsaved.markPristine();
      this.#notify.success(`Đã tạo danh mục ${category.name}.`);
      this.saving.set(false);
      this.drawer().close();
    } catch (error) {
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Không thể lưu. Dữ liệu đã nhập vẫn được giữ.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.formElement().nativeElement), { injector: this.#injector });
  }
}
