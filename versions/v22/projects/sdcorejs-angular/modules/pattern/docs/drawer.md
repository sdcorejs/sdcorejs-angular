# Drawer

Xem, tạo, cập nhật ngay trên danh sách: `sd-side-drawer` trong route con của danh sách. Route mẫu: `/pattern/customer/create`, `/pattern/customer/:id/detail`, `/pattern/customer/:id/update`, `/pattern/category/create?parent=`, `/pattern/category/:id/update`, chi tiết đơn hàng mặc định của `/pattern/order`.

## Khi nào dùng / khi nào không

- Dùng khi người dùng cần giữ ngữ cảnh danh sách: xem nhanh, sửa vài field, tạo bản ghi con.
- Nhiều tab, bảng quan hệ lớn, form nhiều bước hoặc rộng hơn 800px: dùng trang ([detail](detail.md), [form](form.md)).

## Code mẫu

Chi tiết trong drawer: bản ghi tải bằng `detail(id)` qua resolver, footer có Hồ sơ 360° và Cập nhật, Xoá là icon đỏ cạnh X, đóng bằng X điều hướng về danh sách:

<!-- @source features/customer/components/detail-side-drawer/detail-side-drawer.component.ts -->
```ts
import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { CustomerService } from '../../services/customer.service';
import { customerStatusBadge, customerTypeName, type CustomerDto } from '../../services/customer.model';
import { GeneralInformationViewComponent } from '../general-information-view/general-information-view.component';

/**
 * Chi tiết khách hàng trong drawer (route con `:id/detail` của danh sách). Bản ghi do resolver tải bằng
 * `detail(id)`, không lấy dữ liệu của dòng. Chỉ đóng bằng X (cùng Esc, backdrop): không có nút Đóng (E4).
 * Xoá là tác vụ hiếm dùng và phá huỷ: nút chỉ có icon màu đỏ ở header, cạnh X; footer giữ tác vụ thường dùng.
 */
@Component({
  selector: 'detail-side-drawer',
  standalone: true,
  imports: [RouterLink, SdSideDrawer, SdBadge, SdButton, SdPermissionDirective, GeneralInformationViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let customer = entity();
    <sd-side-drawer width="600px" autoId="customer-detail" (sdClosed)="closed()">
      <div sdHeaderLeft class="d-flex flex-column">
        <div class="d-flex align-items-center gap-8">
          <span class="T16M">Chi tiết khách hàng #{{ customer.code }}</span>
          <sd-badge size="md" [type]="badge().type ?? 'round'" [title]="badge().title" [color]="badge().color" />
        </div>
        <span class="T14R text-secondary">{{ typeName() }} · {{ customer.phone }}</span>
      </div>
      <sd-button
        sdHeaderRight
        *sdPermission="'PATTERN_CUSTOMER_D_DELETE'"
        prefixIcon="delete"
        tooltip="Xoá khách hàng"
        type="text"
        color="error"
        autoId="customer-delete"
        [loading]="deleting()"
        (click)="delete()" />
      <general-information-view [customer]="customer" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button title="Hồ sơ 360°" prefixIcon="contact_page" type="outline" autoId="customer-profile" [routerLink]="['../360']" />
        <sd-button
          *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
          title="Cập nhật khách hàng"
          prefixIcon="edit"
          type="fill"
          color="primary"
          autoId="customer-update"
          [routerLink]="['../update']" />
      </div>
    </sd-side-drawer>
  `,
})
export class DetailSideDrawerComponent {
  readonly #customerService = inject(CustomerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly drawer = viewChild.required(SdSideDrawer);
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as CustomerDto)), { requireSync: true });
  protected readonly badge = computed(() => customerStatusBadge(this.entity().status));
  protected readonly typeName = computed(() => customerTypeName(this.entity().type));
  protected readonly deleting = signal(false);

  constructor() {
    afterNextRender(() => this.drawer().open());
  }

  protected closed(): void {
    // X, Esc, backdrop đều qua sdClosed; về danh sách bằng điều hướng để Back của trình duyệt cũng đóng được.
    // Sang drawer cập nhật hay hồ sơ 360° thì drawer này bị huỷ cùng route, không phát sdClosed.
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
  }

  protected async delete(): Promise<void> {
    const customer = this.entity();
    try {
      await this.#confirm.confirm(`Xoá khách hàng ${customer.name}? Thao tác không hoàn tác được.`, {
        title: 'Xoá khách hàng',
        yesTitle: 'Xoá',
        noTitle: 'Không xoá',
        yesButtonColor: 'error',
      });
    } catch {
      return;
    }
    this.deleting.set(true);
    try {
      await firstValueFrom(this.#customerService.delete(customer.id));
      this.#notify.success(`Đã xoá khách hàng ${customer.name}.`);
      this.drawer().close();
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Không xoá được khách hàng.'));
    } finally {
      this.deleting.set(false);
    }
  }
}
```

Cập nhật trong drawer: `beforeClose` hỏi trước khi bỏ thay đổi, lưu xong đóng drawer, danh sách tải lại, focus trở về dòng:

<!-- @source features/customer/components/update-side-drawer/update-side-drawer.component.ts -->
```ts
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
```

Form ba nhóm, nhóm còn lỗi có `sd-inform` cảnh báo ngay trong nhóm:

<!-- @source features/customer/components/general-information-form/general-information-form.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import type { FormControl, FormGroup } from '@angular/forms';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import type { CustomerSaveReq, CustomerStatus, CustomerTier, CustomerType } from '../../services/customer.model';
import { CustomerTypeSelectComponent } from '../customer-type-select/customer-type-select.component';

/** Các field Core tự đăng ký control qua `[form]` + `name`. */
export type CustomerForm = FormGroup<{
  name?: FormControl<string>;
  type?: FormControl<CustomerType>;
  taxCode?: FormControl<string | null>;
  vip?: FormControl<boolean>;
  email?: FormControl<string>;
  phone?: FormControl<string>;
  address?: FormControl<string>;
  active?: FormControl<boolean>;
  note?: FormControl<string | null>;
}>;

/** Ba nhóm của form; nhóm còn lỗi sau khi bấm Lưu hiện `sd-inform` cảnh báo ngay trong nhóm. */
export type CustomerFormGroup = 'general' | 'contact' | 'other';

const GROUP_FIELDS: Readonly<Record<CustomerFormGroup, readonly string[]>> = {
  general: ['name', 'type', 'taxCode', 'vip'],
  contact: ['email', 'phone', 'address'],
  other: ['active', 'note'],
};

/** Nhóm có field không hợp lệ: field còn lỗi validate hoặc lỗi do API trả về. */
export function invalidCustomerGroups(form: CustomerForm, apiErrors: Readonly<Record<string, string>>): CustomerFormGroup[] {
  return (Object.keys(GROUP_FIELDS) as CustomerFormGroup[]).filter(group =>
    GROUP_FIELDS[group].some(field => form.get(field)?.invalid || !!apiErrors[field])
  );
}

/** Giá trị form → request lưu. */
export function customerSaveReq(form: CustomerForm): CustomerSaveReq {
  const value = form.getRawValue();
  const type: CustomerType = value.type ?? 'individual';
  const tier: CustomerTier = value.vip ? 'vip' : 'standard';
  const status: CustomerStatus = value.active === false ? 'inactive' : 'active';
  return {
    name: value.name ?? '',
    type,
    tier,
    email: value.email ?? '',
    phone: value.phone ?? '',
    address: value.address ?? '',
    taxCode: type === 'business' ? (value.taxCode ?? null) : null,
    status,
    note: value.note || null,
  };
}

/** Form khách hàng ba nhóm, dùng chung cho drawer tạo mới và cập nhật. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdSection, SdInput, SdTextarea, SdSwitch, SdInform, CustomerTypeSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let invalid = invalidGroups();
    <div class="d-flex flex-column gap-16">
      <sd-section title="Thông tin chung">
        <div class="d-flex flex-column gap-8 p-16">
          @if (invalid.includes('general')) {
            <sd-inform warning description="Kiểm tra tên và loại khách hàng." autoId="customer-general-warning" />
          }
          <sd-input
            label="Tên khách hàng"
            name="name"
            autoId="customer-name"
            [form]="form()"
            [model]="seed().name"
            [inlineError]="errors()['name']"
            maxlength="120"
            required />
          <customer-type-select [form]="form()" [model]="seed().type" (modelChange)="type.set($event ?? 'individual')" />
          @if (type() === 'business') {
            <sd-input
              label="Mã số thuế"
              name="taxCode"
              autoId="customer-tax-code"
              [form]="form()"
              [model]="seed().taxCode"
              [inlineError]="errors()['taxCode']"
              maxlength="14"
              required />
          }
          <sd-switch label="Khách VIP" name="vip" [form]="form()" [model]="seed().tier === 'vip'" />
        </div>
      </sd-section>
      <sd-section title="Liên hệ">
        <div class="d-flex flex-column gap-8 p-16">
          @if (invalid.includes('contact')) {
            <sd-inform warning description="Kiểm tra email và số điện thoại." autoId="customer-contact-warning" />
          }
          <sd-input
            label="Email"
            name="email"
            autoId="customer-email"
            [form]="form()"
            [model]="seed().email"
            [inlineError]="errors()['email']"
            pattern="EMAIL"
            required />
          <sd-input
            label="Điện thoại"
            name="phone"
            autoId="customer-phone"
            [form]="form()"
            [model]="seed().phone"
            [inlineError]="errors()['phone']"
            maxlength="15"
            required />
          <sd-input label="Địa chỉ" name="address" autoId="customer-address" [form]="form()" [model]="seed().address" maxlength="200" />
        </div>
      </sd-section>
      <sd-section title="Khác">
        <div class="d-flex flex-column gap-8 p-16">
          <sd-switch label="Đang hoạt động" name="active" [form]="form()" [model]="seed().status !== 'inactive'" />
          <sd-textarea label="Ghi chú" name="note" [form]="form()" [model]="seed().note" maxlength="500" />
        </div>
      </sd-section>
    </div>
  `,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<CustomerForm>();
  readonly seed = input.required<CustomerSaveReq>();
  /** Lỗi theo field do API trả về. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly invalidGroups = input<readonly CustomerFormGroup[]>([]);
  /** Loại khách đang chọn: doanh nghiệp mới có mã số thuế. */
  protected readonly type = linkedSignal(() => this.seed().type);
}
```

Route con của danh sách; `data.detail: 'page'` cho route mở thành trang thay chỗ danh sách:

<!-- @source features/customer/routes.ts -->
```ts
import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { CustomerService } from './services/customer.service';

/**
 * Chi tiết, tạo và cập nhật mở trong drawer (route con của danh sách); hồ sơ 360° là trang thay chỗ danh sách
 * (`data.detail: 'page'`). Đóng drawer hay quay lại đều giữ bộ lọc, trang và vị trí cuộn của danh sách.
 */
export const routes: Routes = [
  {
    path: '',
    providers: [CustomerService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Khách hàng',
        data: { permission: 'PATTERN_CUSTOMER_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            data: { permission: 'PATTERN_CUSTOMER_C_CREATE' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/create-side-drawer/create-side-drawer.component').then(module => module.CreateSideDrawerComponent),
          },
          {
            path: ':id/detail',
            data: { permission: 'PATTERN_CUSTOMER_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () =>
              import('./components/detail-side-drawer/detail-side-drawer.component').then(module => module.DetailSideDrawerComponent),
          },
          {
            path: ':id/update',
            data: { permission: 'PATTERN_CUSTOMER_U_UPDATE' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/update-side-drawer/update-side-drawer.component').then(module => module.UpdateSideDrawerComponent),
          },
          {
            path: ':id/360',
            title: 'Hồ sơ khách hàng',
            data: { permission: 'PATTERN_CUSTOMER_R_DETAIL', detail: 'page' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/profile/profile.component').then(module => module.ProfileComponent),
          },
        ],
      },
    ],
  },
];
```

## Quy tắc

- MUST đặt drawer trong component của route con (`create`, `:id/detail`, `:id/update`) và mở khi component sẵn sàng; `sdClosed` điều hướng về danh sách (`'../..'` từ route hai segment), nên Back của trình duyệt cũng đóng drawer.
- MUST chỉ đóng bằng X, Esc, backdrop (E4); không có nút Đóng hay Huỷ thường trực.
- MUST đi qua `beforeClose` cho mọi đường đóng khi còn thay đổi; đồng ý bỏ thì `markPristine()` để guard của route không hỏi lần hai.
- MUST đặt tác vụ thường dùng ở `sdFooterRight`: nút chính (`fill`, có icon) ở ngoài cùng bên phải, nút phụ (`outline`) bên trái nó. Mở màn khác (Hồ sơ 360°) cũng là nút, không phải link.
- MUST đặt tác vụ phá huỷ ít dùng (Xoá) ở `sdHeaderRight`, cạnh X: nút chỉ có icon màu đỏ (`type="text"`, `color="error"`) với `tooltip` làm tên, và vẫn hỏi xác nhận (E13).
- MUST tải chi tiết bằng `detail(id)`; không dùng object của dòng làm dữ liệu chi tiết.
- MUST chỉ tải lại danh sách khi lưu thành công; trả focus về phần tử đã mở drawer (`sd-page-list` giữ phần tử này kể cả khi chi tiết chuyển sang cập nhật).
- SHOULD dùng bề rộng 600px cho chi tiết và form thường, 480px cho nội dung ngắn, tối đa 800px (E9).
- SHOULD tách `detail-side-drawer`, `create-side-drawer`, `update-side-drawer`; dùng chung `-form`/`-view`, không gộp ba chế độ vào một drawer.

## Lỗi hay gặp

- Drawer mở bằng method mà không có route: Back của trình duyệt rời cả màn danh sách, link không chia sẻ được.
- Mở chồng drawer cập nhật lên drawer chi tiết: hai lớp backdrop, Esc chỉ đóng một lớp.
- Tải lại danh sách mỗi lần đóng drawer: mất vị trí cuộn và lựa chọn dù không có gì thay đổi.
