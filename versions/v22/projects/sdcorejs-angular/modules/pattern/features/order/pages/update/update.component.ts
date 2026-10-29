import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import {
  GeneralInformationFormComponent,
  orderSaveReq,
  type OrderForm,
} from '../../components/general-information-form/general-information-form.component';
import { LinesFormComponent } from '../../components/lines-form/lines-form.component';
import { LinesTableFormComponent } from '../../components/lines-table-form/lines-table-form.component';
import { OrderService } from '../../services/order.service';
import type { OrderDto } from '../../services/order.model';

/**
 * Cập nhật đơn hàng: khách đã ngừng hoạt động vẫn hiện (`customer-select` tải theo ID), lỗi của API trên một dòng
 * hiện ngay ở dòng đó. Lưu xong sang chi tiết.
 */
@Component({
  selector: 'update',
  standalone: true,
  imports: [SdPageComponent, SdButton, SdSection, SdTextarea, GeneralInformationFormComponent, LinesFormComponent, LinesTableFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-page-form [title]="'Cập nhật đơn hàng #' + entity().code" [backLink]="['../detail']" toc>
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Huỷ" type="outline" autoId="order-cancel" (click)="cancel()" />
        <sd-button title="Lưu" prefixIcon="save" type="fill" color="primary" autoId="order-save" [loading]="saving()" (click)="save()" />
      </div>
      <div class="d-flex flex-column gap-16 py-16">
        <general-information-form [form]="form" [seed]="entity()" />
        @if (linesTable) {
          <lines-table-form [form]="form" [seed]="entity().lines" [errors]="apiErrors.errors()" />
        } @else {
          <lines-form [form]="form" [seed]="entity().lines" [errors]="apiErrors.errors()" />
        }
        <sd-section title="Ghi chú">
          <div class="px-16 pt-16 pb-8">
            <sd-textarea label="Ghi chú nội bộ" name="note" [form]="form" [model]="entity().note" maxlength="500" />
          </div>
        </sd-section>
      </div>
    </sd-page-form>
  `,
})
export class UpdateComponent {
  readonly #orderService = inject(OrderService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  /** `?lines=sd-table`: dòng hàng dựng bằng `sd-table` (`lines-table-form`) để so với `<table>`. Màn thật chọn một. */
  protected readonly linesTable = this.#route.snapshot.queryParamMap.get('lines') === 'sd-table';
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  /** Đơn do resolver tải; draft khởi tạo từ đây. */
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as OrderDto)), { requireSync: true });
  protected readonly form: OrderForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'order-update', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
    // why: chỉ đổi `:id` thì trang được dùng lại; khi đơn mới đã vào form, nó là mốc so sánh mới và lỗi cũ bỏ đi.
    let loaded = this.entity();
    effect(() => {
      const entity = this.entity();
      if (entity === loaded) return;
      loaded = entity;
      untracked(() => {
        this.apiErrors.clear();
        afterNextRender(() => this.#unsaved.markPristine(), { injector: this.#injector });
      });
    });
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
      await firstValueFrom(this.#orderService.update(this.entity().id, orderSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success('Đã cập nhật đơn hàng.');
      await this.#router.navigate(['../detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
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
