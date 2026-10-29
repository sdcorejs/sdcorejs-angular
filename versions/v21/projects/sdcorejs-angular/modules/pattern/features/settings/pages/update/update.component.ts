import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  linkedSignal,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdFormatDatetimePipe } from '@sdcorejs/angular/pipes';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import { SettingsService } from '../../services/settings.service';
import type { SettingsDto, SettingsSaveReq } from '../../services/settings.model';

const CURRENCIES = [
  { value: 'VND', label: 'Việt Nam đồng (VND)' },
  { value: 'USD', label: 'Đô la Mỹ (USD)' },
];

/**
 * Cài đặt một bản ghi: `sd-page-form` có mục lục, nhiều nhóm. Lưu xong vẫn ở trang; footer báo trạng thái lưu, rời
 * trang khi còn thay đổi thì hỏi. Vai trò chỉ có quyền xem thấy form ở chế độ xem.
 */
@Component({
  selector: 'update',
  standalone: true,
  imports: [SdPageComponent, SdButton, SdSection, SdInput, SdInputNumber, SdSelect, SdSwitch, SdPermissionDirective, SdFormatDatetimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let value = entity();
    @let errors = apiErrors.errors();
    <sd-page-form title="Cài đặt cửa hàng" description="Áp dụng cho mọi chi nhánh." toc>
      <sd-button
        headerRight
        *sdPermission="'PATTERN_SETTINGS_U_UPDATE'"
        title="Lưu"
        prefixIcon="save"
        type="fill"
        color="primary"
        autoId="settings-save"
        [loading]="saving()"
        (click)="save()" />
      <div class="d-flex flex-column gap-16 py-16">
        <sd-section title="Thông tin cửa hàng">
          <div class="row px-16 pt-16 pb-8">
            <div class="col-12 col-md-6">
              <sd-input
                label="Tên cửa hàng"
                name="storeName"
                autoId="settings-store-name"
                [form]="form"
                [model]="value.storeName"
                [viewed]="!canEdit"
                [inlineError]="errors['storeName']"
                required />
            </div>
            <div class="col-12 col-md-6">
              <sd-input label="Hotline" name="hotline" [form]="form" [model]="value.hotline" [viewed]="!canEdit" />
            </div>
            <div class="col-12">
              <sd-input label="Địa chỉ" name="address" [form]="form" [model]="value.address" [viewed]="!canEdit" />
            </div>
          </div>
        </sd-section>
        <sd-section title="Bán hàng">
          <div class="row px-16 pt-16 pb-8">
            <div class="col-12 col-md-6">
              <sd-select
                label="Tiền tệ"
                name="currency"
                [form]="form"
                [model]="value.currency"
                [items]="currencies"
                valueField="value"
                displayField="label"
                [viewed]="!canEdit"
                [clearable]="false" />
            </div>
            <div class="col-12 col-md-6">
              <sd-input
                label="Tiền tố mã đơn"
                name="orderPrefix"
                autoId="settings-order-prefix"
                [form]="form"
                [model]="value.orderPrefix"
                [viewed]="!canEdit"
                [inlineError]="errors['orderPrefix']"
                maxlength="5"
                required />
            </div>
            <div class="col-12 col-md-6">
              <sd-input-number
                label="Ngưỡng cảnh báo tồn kho"
                name="lowStockThreshold"
                type="positive"
                [precision]="0"
                [form]="form"
                [model]="value.lowStockThreshold"
                [viewed]="!canEdit" />
            </div>
            <div class="col-12 col-md-6 d-flex align-items-center">
              <sd-switch
                label="Tự xác nhận đơn online"
                name="autoConfirm"
                [form]="form"
                [model]="value.autoConfirm"
                [disabled]="!canEdit" />
            </div>
          </div>
        </sd-section>
        <sd-section title="Thông báo">
          <div class="row px-16 pt-16 pb-8">
            <div class="col-12 col-md-6 d-flex align-items-center">
              <sd-switch
                label="Gửi email"
                name="emailNotify"
                [form]="form"
                [model]="value.emailNotify"
                [disabled]="!canEdit"
                (modelChange)="emailNotify.set(!!$event)" />
            </div>
            <div class="col-12 col-md-6 d-flex align-items-center">
              <sd-switch label="Gửi SMS" name="smsNotify" [form]="form" [model]="value.smsNotify" [disabled]="!canEdit" />
            </div>
            <div class="col-12">
              <sd-input
                label="Email nhận thông báo"
                name="notifyEmail"
                [form]="form"
                [model]="value.notifyEmail"
                pattern="EMAIL"
                [viewed]="!canEdit"
                [required]="emailNotify()" />
            </div>
          </div>
        </sd-section>
        <sd-section title="Bảo mật">
          <div class="row px-16 pt-16 pb-8">
            <div class="col-12 col-md-6">
              <sd-input-number
                label="Hết phiên sau (phút)"
                name="sessionMinutes"
                autoId="settings-session"
                type="positive"
                [precision]="0"
                [form]="form"
                [model]="value.sessionMinutes"
                [viewed]="!canEdit"
                [inlineError]="errors['sessionMinutes']"
                required />
            </div>
            <div class="col-12 col-md-6 d-flex align-items-center">
              <sd-switch label="Xác thực hai bước" name="twoFactor" [form]="form" [model]="value.twoFactor" [disabled]="!canEdit" />
            </div>
          </div>
        </sd-section>
      </div>
      <span sdFooterLeft class="T14R text-secondary" role="status" data-autoid="settings-save-state">
        {{ unsaved.dirty() ? 'Có thay đổi chưa lưu' : 'Đã lưu lúc ' + (value.updatedAt | sdFormatDatetime) }}
      </span>
    </sd-page-form>
  `,
})
export class UpdateComponent {
  readonly #settingsService = inject(SettingsService);
  readonly #notify = inject(SdNotifyService);
  readonly #route = inject(ActivatedRoute);
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  protected readonly canEdit = inject(SdPermissionService).hasPermission('PATTERN_SETTINGS_U_UPDATE');
  protected readonly currencies = CURRENCIES;
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as SettingsDto)), { requireSync: true });
  /** Bản ghi đã lưu gần nhất: sau khi lưu thay bằng bản API trả về. */
  protected readonly entity = linkedSignal(() => this.#resolved());
  protected readonly emailNotify = linkedSignal(() => this.entity().emailNotify);
  protected readonly form = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  protected readonly unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'settings', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.unsaved.destroy());
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
      const saved = await firstValueFrom(this.#settingsService.update({ ...this.entity(), ...this.form.getRawValue() } as SettingsSaveReq));
      this.entity.set(saved);
      // Ở lại trang: giá trị vừa lưu là mốc so sánh mới (`markPristine()` ở chế độ value), sửa tiếp vẫn được bảo vệ khi rời trang.
      this.unsaved.markPristine();
      this.#notify.success('Đã lưu cài đặt.');
    } catch (error) {
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Không thể lưu. Thay đổi vẫn được giữ.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.#host), { injector: this.#injector });
  }
}
