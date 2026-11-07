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
import { CategoryService } from '../../services/category.service';
import type { CategoryDto } from '../../services/category.model';
import {
  categorySaveReq,
  GeneralInformationFormComponent,
  type CategoryForm,
} from '../general-information-form/general-information-form.component';

/**
 * Cập nhật danh mục trong drawer, mở từ tên danh mục bằng `@if` (không đổi URL). Drawer mở ngay rồi tải bản ghi bằng
 * `detail(id)`, trạng thái tải và lỗi do `sd-data-state` hiện. Mã bị khoá; danh mục cha giữ nguyên.
 * X, Esc và backdrop hỏi trước khi bỏ thay đổi; lưu xong đóng drawer và danh sách tải lại.
 */
@Component({
  selector: 'update-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, SdDataState, GeneralInformationFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _entity = entity();
    <sd-side-drawer
      [title]="_entity ? 'Cập nhật danh mục ' + _entity.code : 'Cập nhật danh mục'"
      autoId="category-update"
      [beforeClose]="beforeClose"
      (sdClosed)="closed.emit()">
      <sd-data-state [state]="state()" retryable (sdRetry)="load()">
        @if (_entity) {
          <general-information-form
            [form]="form"
            [seed]="_entity"
            [parentName]="parentName()"
            [editing]="true"
            [errors]="apiErrors.errors()" />
        }
      </sd-data-state>
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button
          title="Lưu"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="category-save"
          [disabled]="!_entity"
          [loading]="saving()"
          (click)="save()" />
      </div>
    </sd-side-drawer>
  `,
})
export class UpdateSideDrawerComponent implements OnInit {
  readonly #categoryService = inject(CategoryService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #injector = inject(Injector);
  readonly id = input.required<string>();
  /** Drawer đã đóng (X, Esc, backdrop hoặc lưu xong): danh sách gỡ drawer khỏi màn. */
  readonly closed = output<void>();
  private readonly drawer = viewChild.required(SdSideDrawer);
  private readonly formElement = viewChild.required(GeneralInformationFormComponent, { read: ElementRef });
  protected readonly state = signal<'loading' | 'error' | 'success'>('loading');
  protected readonly entity = signal<CategoryDto | null>(null);
  protected readonly parentName = signal<string | null>(null);
  protected readonly form: CategoryForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'category-update', dirty: 'value' });

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

  ngOnInit(): void {
    void this.load();
  }

  /** Tải bản ghi bằng `detail(id)`, không dùng object của dòng; lỗi hiện trong drawer kèm nút thử lại. */
  protected async load(): Promise<void> {
    this.state.set('loading');
    try {
      const entity = await firstValueFrom(this.#categoryService.detail(this.id()).pipe(timeout(10_000)));
      this.entity.set(entity);
      this.state.set('success');
      if (entity.parentId) {
        firstValueFrom(this.#categoryService.detail(entity.parentId)).then(
          parent => this.parentName.set(parent.name),
          () => this.parentName.set(null)
        );
      }
    } catch {
      this.state.set('error');
    }
  }

  protected async save(): Promise<void> {
    const entity = this.entity();
    if (!entity || this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(this.#categoryService.update(entity.id, categorySaveReq(this.form, entity.parentId, entity.code)));
      this.#unsaved.markPristine();
      this.#notify.success('Đã cập nhật danh mục.');
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
