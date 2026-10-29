import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
import { ORDER_CHANNELS, ORDER_PAYMENTS, ORDER_WAREHOUSES, type OrderSaveReq } from '../../services/order.model';

/** Tạo đơn hàng: form nhiều nhóm có mục lục (`toc`), dòng hàng nhập trực tiếp, lưu xong sang chi tiết. */
@Component({
  selector: 'create',
  standalone: true,
  imports: [SdPageComponent, SdButton, SdSection, SdTextarea, GeneralInformationFormComponent, LinesFormComponent, LinesTableFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-page-form title="Tạo mới đơn hàng" [backLink]="['..']" toc>
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Huỷ" type="outline" autoId="order-cancel" (click)="cancel()" />
        <sd-button
          title="Tạo đơn hàng"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="order-save"
          [loading]="saving()"
          (click)="save()" />
      </div>
      <div class="d-flex flex-column gap-16 py-16">
        <general-information-form [form]="form" [seed]="seed" />
        @if (linesTable) {
          <lines-table-form [form]="form" [seed]="seed.lines" [errors]="apiErrors.errors()" />
        } @else {
          <lines-form [form]="form" [seed]="seed.lines" [errors]="apiErrors.errors()" />
        }
        <sd-section title="Ghi chú">
          <div class="px-16 pt-16 pb-8">
            <sd-textarea label="Ghi chú nội bộ" name="note" [form]="form" [model]="seed.note" maxlength="500" />
          </div>
        </sd-section>
      </div>
    </sd-page-form>
  `,
})
export class CreateComponent {
  readonly #orderService = inject(OrderService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  /** `?lines=sd-table`: dòng hàng dựng bằng `sd-table` (`lines-table-form`) để so với `<table>`. Màn thật chọn một. */
  protected readonly linesTable = this.#route.snapshot.queryParamMap.get('lines') === 'sd-table';
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  protected readonly seed: OrderSaveReq = {
    customerId: '',
    channel: ORDER_CHANNELS[0],
    warehouse: ORDER_WAREHOUSES[0],
    payment: ORDER_PAYMENTS[0],
    note: null,
    lines: [],
  };
  protected readonly form: OrderForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'order-create', dirty: 'value' });

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
      const order = await firstValueFrom(this.#orderService.create(orderSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success(`Đã tạo đơn ${order.code}.`);
      await this.#router.navigate(['..', order.id, 'detail'], { relativeTo: this.#route, replaceUrl: true });
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
