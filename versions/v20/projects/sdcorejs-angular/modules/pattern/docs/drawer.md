# Drawer

Xem, tạo, cập nhật ngay trên danh sách: `sd-side-drawer` mở bằng `@if` trên màn đang hiện, không đổi URL. Mẫu: `/pattern/customer` (chi tiết, tạo, cập nhật; cập nhật cũng mở từ hồ sơ 360°), `/pattern/category` (tạo danh mục gốc và danh mục con, cập nhật).

## Khi nào dùng / khi nào không

- Dùng khi người dùng cần giữ ngữ cảnh danh sách: xem nhanh, sửa vài field, tạo bản ghi con.
- Nhiều tab, bảng quan hệ lớn, form nhiều bước hoặc rộng hơn 800px: dùng trang ([detail](detail.md), [form](form.md)). Trang là route con, có URL riêng.
- Chi tiết cần link chia sẻ được: làm trang chi tiết (route con). `/pattern/order` cho trang đó hiện trong drawer bằng `sd-page-list detail="drawer"` ([list](list.md)); đó là trang chi tiết đổi cách hiện, không phải drawer của pattern này.

## Code mẫu

Màn danh sách giữ drawer đang mở trong một signal và dựng drawer bằng `@if`; mỗi lần mở là một drawer mới, đóng thì gỡ khỏi màn. Chi tiết sang cập nhật thay drawer này bằng drawer kia:

<!-- @source features/customer/pages/list/list.component.html -->
```html
@let _drawer = drawer();
<sd-page-list title="Khách hàng" description="Khách cá nhân và doanh nghiệp đang giao dịch.">
  <sd-button
    headerRight
    *sdPermission="'PATTERN_CUSTOMER_C_CREATE'"
    title="Tạo khách hàng"
    prefixIcon="add"
    type="fill"
    color="primary"
    autoId="customer-create"
    (click)="drawer.set({ type: 'create' })" />

  <summary-cards [counts]="counts()" [(segment)]="segment" />

  <sd-table autoId="customer-list" [option]="tableOption">
    <ng-template sdTableCellDef="code" let-customer="item">
      <a *sdPermission="'PATTERN_CUSTOMER_R_DETAIL'" href="" (click)="openDetail($event, customer.id)">{{ customer.code }}</a>
      @if (!canOpenDetail) {
        <span>{{ customer.code }}</span>
      }
    </ng-template>
  </sd-table>
</sd-page-list>

@if (_drawer?.type === 'create') {
  <create-side-drawer (closed)="drawer.set(null)" />
}
@if (_drawer?.type === 'detail') {
  <detail-side-drawer
    [id]="_drawer.id"
    (update)="drawer.set({ type: 'update', id: _drawer.id })"
    (profile)="openProfile(_drawer.id)"
    (closed)="drawer.set(null)" />
}
@if (_drawer?.type === 'update') {
  <update-side-drawer [id]="_drawer.id" (closed)="drawer.set(null)" />
}
```

Chi tiết trong drawer: nhận `id`, tự tải bằng `detail(id)` và hiện trạng thái tải, lỗi bằng `sd-data-state`; footer có Hồ sơ 360° và Cập nhật, Xoá là icon đỏ cạnh X, chỉ đóng bằng X:

<!-- @source features/customer/components/detail-side-drawer/detail-side-drawer.component.ts -->
```ts
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { CustomerService } from '../../services/customer.service';
import { customerStatusBadge, customerTypeName, type CustomerDto } from '../../services/customer.model';
import { GeneralInformationViewComponent } from '../general-information-view/general-information-view.component';

/**
 * Chi tiết khách hàng trong drawer, mở từ mã khách hàng bằng `@if` (không đổi URL). Drawer mở ngay rồi tải bản ghi
 * bằng `detail(id)`, không lấy dữ liệu của dòng; trạng thái tải và lỗi do `sd-data-state` hiện. Chỉ đóng bằng X (cùng
 * Esc, backdrop): không có nút Đóng (E4). Xoá là tác vụ hiếm dùng và phá huỷ: nút chỉ có icon màu đỏ ở header, cạnh X;
 * footer giữ tác vụ thường dùng. Cập nhật và Hồ sơ 360° báo lên danh sách, danh sách thay drawer này.
 */
@Component({
  selector: 'detail-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdBadge, SdButton, SdDataState, SdPermissionDirective, GeneralInformationViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let customer = entity();
    <sd-side-drawer width="600px" autoId="customer-detail" (sdClosed)="closed.emit()">
      <div sdHeaderLeft class="d-flex flex-column">
        @if (customer) {
          @let _badge = badge();
          <div class="d-flex align-items-center gap-8">
            <span class="T16M">Chi tiết khách hàng #{{ customer.code }}</span>
            <sd-badge size="md" [type]="_badge?.type ?? 'round'" [title]="_badge?.title" [color]="_badge?.color" />
          </div>
          <span class="T14R text-secondary">{{ typeName() }} · {{ customer.phone }}</span>
        } @else {
          <span class="T16M">Chi tiết khách hàng</span>
        }
      </div>
      <sd-button
        sdHeaderRight
        *sdPermission="'PATTERN_CUSTOMER_D_DELETE'"
        prefixIcon="delete"
        tooltip="Xoá khách hàng"
        type="text"
        color="error"
        autoId="customer-delete"
        [disabled]="!customer"
        [loading]="deleting()"
        (click)="delete()" />
      <sd-data-state [state]="state()" retryable (sdRetry)="load()">
        @if (customer) {
          <general-information-view [customer]="customer" />
        }
      </sd-data-state>
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button title="Hồ sơ 360°" prefixIcon="contact_page" type="outline" autoId="customer-profile" (click)="profile.emit()" />
        <sd-button
          *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
          title="Cập nhật khách hàng"
          prefixIcon="edit"
          type="fill"
          color="primary"
          autoId="customer-update"
          (click)="update.emit()" />
      </div>
    </sd-side-drawer>
  `,
})
export class DetailSideDrawerComponent implements OnInit {
  readonly #customerService = inject(CustomerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly id = input.required<string>();
  /** Người dùng chọn Cập nhật: danh sách thay drawer này bằng drawer cập nhật, không chồng hai lớp. */
  readonly update = output<void>();
  /** Người dùng chọn Hồ sơ 360°: danh sách đóng drawer này và mở trang hồ sơ. */
  readonly profile = output<void>();
  /** Drawer đã đóng (X, Esc, backdrop hoặc xoá xong): danh sách gỡ drawer khỏi màn. */
  readonly closed = output<void>();
  private readonly drawer = viewChild.required(SdSideDrawer);
  protected readonly state = signal<'loading' | 'error' | 'success'>('loading');
  protected readonly entity = signal<CustomerDto | null>(null);
  protected readonly badge = computed(() => {
    const customer = this.entity();
    return customer ? customerStatusBadge(customer.status) : null;
  });
  protected readonly typeName = computed(() => {
    const customer = this.entity();
    return customer ? customerTypeName(customer.type) : '';
  });
  protected readonly deleting = signal(false);

  constructor() {
    afterNextRender(() => this.drawer().open());
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

  protected async delete(): Promise<void> {
    const customer = this.entity();
    if (!customer) return;
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

Cập nhật trong drawer: `beforeClose` hỏi trước khi bỏ thay đổi, lưu xong báo `saved` rồi đóng drawer, danh sách tải lại, focus trở về dòng:

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

Drawer không có route; chỉ hồ sơ 360° (trang) là route con. Route của màn mở drawer có `sdPageFormLeaveGuard`, nên Back của trình duyệt lúc drawer còn thay đổi vẫn hỏi:

<!-- @source features/customer/routes.ts -->
```ts
import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { CustomerService } from './services/customer.service';

/**
 * Chi tiết, tạo và cập nhật mở trong drawer trên danh sách, không đổi URL. Hồ sơ 360° là trang, route con thay chỗ
 * danh sách; quay lại vẫn giữ bộ lọc, trang và vị trí cuộn. Guard rời trang hỏi trước khi bỏ thay đổi khi màn bị rời
 * lúc drawer còn thay đổi chưa lưu (Back của trình duyệt).
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
        canDeactivate: [sdPageFormLeaveGuard],
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: ':id/360',
            title: 'Hồ sơ khách hàng',
            data: { permission: 'PATTERN_CUSTOMER_R_DETAIL' },
            canDeactivate: [sdPageFormLeaveGuard],
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

- MUST mở drawer bằng `@if` trên màn đang hiện (danh sách, hồ sơ) theo một signal của màn; drawer không có route và không đổi URL. `sdClosed` của drawer báo `closed`, màn đặt signal về `null` để gỡ drawer.
- MUST truyền vào drawer `id` của bản ghi (hoặc dữ liệu tối thiểu cho bản ghi con, như danh mục cha); drawer tự tải bằng `detail(id)` và hiện tải, lỗi bằng `sd-data-state` có thử lại. Không dùng object của dòng làm dữ liệu chi tiết.
- MUST chỉ đóng bằng X, Esc, backdrop (E4); không có nút Đóng hay Huỷ thường trực.
- MUST đi qua `beforeClose` cho mọi đường đóng khi còn thay đổi; đồng ý bỏ thì `markPristine()`. Route của màn mở drawer khai báo `canDeactivate: [sdPageFormLeaveGuard]` để rời màn lúc drawer còn thay đổi vẫn hỏi.
- MUST đặt tác vụ thường dùng ở `sdFooterRight`: nút chính (`fill`, có icon) ở ngoài cùng bên phải, nút phụ (`outline`) bên trái nó. Mở màn khác (Hồ sơ 360°) cũng là nút, không phải link.
- MUST đặt tác vụ phá huỷ ít dùng (Xoá) ở `sdHeaderRight`, cạnh X: nút chỉ có icon màu đỏ (`type="text"`, `color="error"`) với `tooltip` làm tên, và vẫn hỏi xác nhận (E13).
- MUST chuyển chi tiết sang cập nhật bằng cách thay drawer trong cùng signal: mỗi lúc chỉ một drawer.
- MUST chỉ tải lại danh sách khi lưu thành công, sau khi drawer đã đóng; `sd-side-drawer` trả focus về phần tử đã mở drawer.
- SHOULD dùng bề rộng 600px cho chi tiết và form thường, 480px cho nội dung ngắn, tối đa 800px (E9).
- SHOULD tách `detail-side-drawer`, `create-side-drawer`, `update-side-drawer`; dùng chung `-form`/`-view`, không gộp ba chế độ vào một drawer.

## Lỗi hay gặp

- Đặt drawer làm route con (`create`, `:id/update`): mỗi lần mở đổi URL, Back của trình duyệt mở lại form đã đóng, link dẫn thẳng vào form mất ngữ cảnh danh sách.
- Giữ drawer luôn trong DOM rồi gọi `open()`: form còn giá trị của lần mở trước. Dựng lại bằng `@if` mỗi lần mở.
- Mở chồng drawer cập nhật lên drawer chi tiết: hai lớp backdrop, Esc chỉ đóng một lớp.
- Tải lại danh sách mỗi lần đóng drawer: mất vị trí cuộn và lựa chọn dù không có gì thay đổi.
