# Form

Tạo hoặc cập nhật một bản ghi trong một bước: `sd-page-form`. Route mẫu: `/pattern/product/create` và `/pattern/product/:id/update` (một section), `/pattern/order/create` và `/pattern/order/:id/update` (dòng hàng nhập trực tiếp, mục lục), `/pattern/settings` (một bản ghi, nhiều nhóm, trạng thái lưu ở footer).

## Khi nào dùng / khi nào không

- Dùng khi form cần cả trang: nhiều nhóm, bảng dòng chi tiết, hoặc người dùng cần tập trung.
- Form ngắn sửa ngay trên danh sách: dùng drawer ([drawer](drawer.md)).
- Nhiều bước có điều kiện chuyển bước: dùng [flow](flow.md).

## Code mẫu

Nhóm field nằm trong component `-form` dùng chung cho tạo và cập nhật; field Core tự đăng ký control qua `[form]` + `name`:

<!-- @source features/product/components/general-information-form/general-information-form.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FormControl, FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import type { ProductSaveReq, ProductStatus } from '../../services/product.model';
import { ProductStatusSelectComponent } from '../product-status-select/product-status-select.component';

/** Các field Core tự đăng ký control qua `[form]` + `name`; page không khai báo trước control trùng tên. */
export type ProductForm = FormGroup<{
  code?: FormControl<string>;
  name?: FormControl<string>;
  unit?: FormControl<string>;
  price?: FormControl<number>;
  status?: FormControl<ProductStatus>;
}>;

/** Giá trị form → request lưu. `code` truyền vào khi cập nhật (mã bị khoá). */
export function productSaveReq(form: ProductForm, code?: string): ProductSaveReq {
  const value = form.getRawValue();
  return {
    code: code ?? value.code ?? '',
    name: value.name ?? '',
    unit: value.unit ?? '',
    price: value.price ?? 0,
    status: value.status ?? 'active',
  };
}

/** Nhóm "Thông tin chung" của form sản phẩm, dùng chung cho tạo mới và cập nhật. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdInput, SdInputNumber, SdSection, ProductStatusSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-section title="Thông tin chung">
    <div class="row p-8">
      <div class="col-12 col-md-6">
        <sd-input
          label="Mã sản phẩm"
          name="code"
          autoId="product-code"
          [form]="form()"
          [model]="seed().code"
          [disabled]="editing()"
          [inlineError]="errors()['code']"
          maxlength="20"
          required />
      </div>
      <div class="col-12 col-md-6">
        <sd-input
          label="Tên sản phẩm"
          name="name"
          autoId="product-name"
          [form]="form()"
          [model]="seed().name"
          [inlineError]="errors()['name']"
          maxlength="100"
          required />
      </div>
      <div class="col-12 col-md-6">
        <sd-input label="Đơn vị tính" name="unit" autoId="product-unit" [form]="form()" [model]="seed().unit" maxlength="20" />
      </div>
      <div class="col-12 col-md-6">
        <sd-input-number
          label="Giá bán (₫)"
          name="price"
          autoId="product-price"
          type="positive"
          [precision]="0"
          [form]="form()"
          [model]="seed().price"
          [inlineError]="errors()['price']"
          required />
      </div>
      <div class="col-12 col-md-6">
        <product-status-select [form]="form()" [model]="seed().status" />
      </div>
    </div>
  </sd-section>`,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<FormGroup>();
  readonly seed = input.required<ProductSaveReq>();
  readonly editing = input(false);
  /** Lỗi theo field do API trả về. */
  readonly errors = input<Readonly<Record<string, string>>>({});
}
```

Trang tạo: Huỷ · Lưu ở `headerRight`, lưu lỗi thì focus field lỗi đầu tiên và gắn lỗi của API vào field, lưu xong sang chi tiết bằng `replaceUrl`:

<!-- @source features/product/pages/create/create.component.ts -->
```ts
import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import {
  GeneralInformationFormComponent,
  productSaveReq,
  type ProductForm,
} from '../../components/general-information-form/general-information-form.component';
import { ProductService } from '../../services/product.service';
import type { ProductSaveReq } from '../../services/product.model';

@Component({
  selector: 'create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, SdButton, GeneralInformationFormComponent],
  template: `
    <sd-page-form title="Tạo mới sản phẩm" [backLink]="['..']">
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Huỷ" type="outline" autoId="product-cancel" (click)="cancel()" />
        <sd-button title="Lưu" type="fill" color="primary" autoId="product-save" [loading]="saving()" (click)="save()" />
      </div>
      <div class="py-16">
        <general-information-form [form]="form" [seed]="seed" [errors]="apiErrors.errors()" />
      </div>
    </sd-page-form>
  `,
})
export class CreateComponent {
  readonly #productService = inject(ProductService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  protected readonly seed: ProductSaveReq = { code: '', name: '', unit: 'Cái', price: 0, status: 'active' };
  protected readonly form: ProductForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  // Dirty theo giá trị: gõ rồi xoá về như cũ thì rời trang không bị hỏi.
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'product-create', dirty: 'value' });

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
      const product = await firstValueFrom(this.#productService.create(productSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success(`Đã tạo sản phẩm ${product.code}.`);
      // replaceUrl: Back ở trang chi tiết về danh sách, không quay lại form tạo mới.
      await this.#router.navigate(['..', product.id, 'detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
      // Lưu lỗi: giữ nguyên dữ liệu đã nhập; lỗi theo field hiện ngay trên field.
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
```

Trang cập nhật: mã bị khoá, dirty tính theo giá trị:

<!-- @source features/product/pages/update/update.component.ts -->
```ts
import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import {
  GeneralInformationFormComponent,
  productSaveReq,
  type ProductForm,
} from '../../components/general-information-form/general-information-form.component';
import { ProductService } from '../../services/product.service';
import type { ProductDto } from '../../services/product.model';

@Component({
  selector: 'update',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, SdButton, GeneralInformationFormComponent],
  template: `
    <sd-page-form [title]="'Cập nhật sản phẩm #' + entity().code" [backLink]="['../detail']">
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Huỷ" type="outline" autoId="product-cancel" (click)="cancel()" />
        <sd-button title="Lưu" type="fill" color="primary" autoId="product-save" [loading]="saving()" (click)="save()" />
      </div>
      <div class="py-16">
        <general-information-form [form]="form" [seed]="entity()" [editing]="true" [errors]="apiErrors.errors()" />
      </div>
    </sd-page-form>
  `,
})
export class UpdateComponent {
  readonly #productService = inject(ProductService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  /** Sản phẩm do resolver tải; draft khởi tạo từ đây, sửa draft không đổi bản ghi trước khi lưu thành công. */
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as ProductDto)), { requireSync: true });
  protected readonly form: ProductForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'product-update', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
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
      // Mã bị khoá sau khi tạo: gửi mã của bản ghi, không lấy từ form.
      await firstValueFrom(this.#productService.update(this.entity().id, productSaveReq(this.form, this.entity().code)));
      this.#unsaved.markPristine();
      this.#notify.success('Đã cập nhật sản phẩm.');
      await this.#router.navigate(['../detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
      // Lưu lỗi: giữ nguyên draft để sửa và thử lại.
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
```

Dòng hàng nhập trực tiếp, tổng tự tính, lỗi của API hiện trên đúng dòng:

<!-- @source features/order/components/lines-form/lines-form.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { ProductSelectComponent } from '../../../product/components/product-select/product-select.component';
import { ProductService } from '../../../product/services/product.service';
import type { OrderLineDto } from '../../services/order.model';
import type { OrderForm } from '../general-information-form/general-information-form.component';

interface LineRow {
  readonly key: number;
  readonly group: FormGroup;
  readonly seed: OrderLineDto;
}

/**
 * Bảng dòng hàng nhập trực tiếp: mỗi dòng là một FormGroup trong `form.lines` (FormArray), các field Core tự đăng
 * ký vào dòng. Chọn sản phẩm điền đơn giá; thành tiền và tổng tự tính. Lỗi API theo dòng (`lines.<i>.<field>`) hiện
 * ngay trên ô của dòng đó.
 */
@Component({
  selector: 'lines-form',
  standalone: true,
  imports: [SdSection, SdButton, SdInputNumber, SdFormatNumberPipe, ProductSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-section title="Dòng hàng">
      <div sdHeaderRight>
        <sd-button title="Thêm dòng" prefixIcon="add" type="text" autoId="order-line-add" (click)="add()" />
      </div>
      <table class="lines">
        <thead>
          <tr>
            <th scope="col">Sản phẩm</th>
            <th scope="col" class="lines__number">Số lượng</th>
            <th scope="col" class="lines__number">Đơn giá (₫)</th>
            <th scope="col" class="lines__number">Thành tiền (₫)</th>
            <th scope="col"><span class="sd-visually-hidden">Xoá dòng</span></th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.key; let index = $index) {
            <tr [attr.data-line]="index">
              <td>
                <product-select
                  [label]="undefined"
                  [form]="row.group"
                  [model]="row.seed.productId || null"
                  [autoId]="'order-line-' + index + '-product'"
                  (modelChange)="pick(row, $event)"
                  required />
                @if (errors()['lines.' + index + '.productId']; as error) {
                  <span class="lines__error" role="alert">{{ error }}</span>
                }
              </td>
              <td class="lines__number">
                <sd-input-number
                  name="quantity"
                  type="positive"
                  [precision]="0"
                  [form]="row.group"
                  [model]="row.seed.quantity"
                  [inlineError]="errors()['lines.' + index + '.quantity']"
                  [autoId]="'order-line-' + index + '-quantity'"
                  required />
              </td>
              <td class="lines__number">
                <sd-input-number
                  name="unitPrice"
                  type="positive"
                  [precision]="0"
                  [form]="row.group"
                  [model]="row.seed.unitPrice"
                  required />
              </td>
              <td class="lines__number">{{ amounts()[index] | sdFormatNumber: 0 }}</td>
              <td>
                <sd-button
                  prefixIcon="delete"
                  type="text"
                  color="error"
                  tooltip="Xoá dòng"
                  [autoId]="'order-line-' + index + '-remove'"
                  [disabled]="rows().length === 1"
                  (click)="remove(row)" />
              </td>
            </tr>
          }
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colspan="3" class="lines__number">Tổng tiền (₫)</th>
            <td class="lines__number lines__total" data-autoid="order-total">{{ total() | sdFormatNumber: 0 }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </sd-section>
  `,
  styles: `
    .lines {
      width: 100%;
      border-collapse: collapse;
    }
    .lines th,
    .lines td {
      padding: 4px 8px;
      text-align: left;
      vertical-align: top;
    }
    .lines thead th {
      color: var(--sd-text-secondary);
      font-size: 12px;
      font-weight: 500;
      border-bottom: 1px solid var(--sd-border);
    }
    .lines td:first-child {
      min-width: 240px;
    }
    .lines__number {
      width: 150px;
      text-align: right !important;
    }
    .lines td.lines__number {
      padding-top: 14px;
    }
    .lines tfoot th,
    .lines tfoot td {
      padding-top: 12px;
      border-top: 1px solid var(--sd-border);
    }
    .lines__total {
      font-weight: 500;
    }
    .lines__error {
      color: var(--sd-error, currentColor);
      font-size: 12px;
    }
  `,
})
export class LinesFormComponent implements OnInit {
  readonly #productService = inject(ProductService);
  readonly form = input.required<OrderForm>();
  /** Dòng ban đầu (cập nhật) hoặc một dòng trống (tạo mới). */
  readonly seed = input.required<readonly OrderLineDto[]>();
  /** Lỗi theo field do API trả về, khoá dạng `lines.<index>.<field>`. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly #array = new FormArray<FormGroup>([]);
  readonly #version = signal(0);
  #nextKey = 0;
  protected readonly rows = signal<readonly LineRow[]>([]);
  protected readonly amounts = computed(() => {
    this.#version();
    return this.rows().map(
      row => Number(row.group.get('quantity')?.value ?? row.seed.quantity) * Number(row.group.get('unitPrice')?.value ?? row.seed.unitPrice)
    );
  });
  protected readonly total = computed(() => this.amounts().reduce((sum, amount) => sum + amount, 0));

  constructor() {
    const subscription = this.#array.valueChanges.subscribe(() => this.#version.update(version => version + 1));
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  ngOnInit(): void {
    const seed = this.seed().length ? this.seed() : [{ productId: '', quantity: 1, unitPrice: 0 }];
    seed.forEach(line => this.#push(line));
    this.form().setControl('lines', this.#array);
  }

  protected add(): void {
    this.#push({ productId: '', quantity: 1, unitPrice: 0 });
  }

  protected remove(row: LineRow): void {
    const index = this.rows().indexOf(row);
    if (index < 0) return;
    // why: đánh dấu đã sửa TRƯỚC khi gỡ, để dirty theo giá trị so với danh sách dòng lúc trước.
    this.#array.markAsDirty();
    this.#array.removeAt(index);
    this.rows.update(rows => rows.filter(item => item !== row));
  }

  /** Chọn sản phẩm thì điền đơn giá hiện hành của sản phẩm. */
  protected async pick(row: LineRow, productId: string | null | undefined): Promise<void> {
    if (!productId) return;
    const product = await firstValueFrom(this.#productService.cachedDetail(productId));
    row.group.get('unitPrice')?.setValue(product.price);
  }

  #push(seed: OrderLineDto): void {
    const group = new FormGroup({});
    this.#array.push(group);
    this.rows.update(rows => [...rows, { key: this.#nextKey++, group, seed }]);
  }
}
```

## Quy tắc

- MUST đặt Huỷ (outline) và Lưu (fill, primary) ở `headerRight` của `sd-page-form` (E3); không lặp nút lưu ở cuối thân.
- MUST đặt title "Tạo mới <entity>" hoặc "Cập nhật <entity> #<mã>" (E5).
- MUST bảo vệ thay đổi chưa lưu: `canDeactivate: [sdPageFormLeaveGuard]` trên route và `registerSdUnsavedChangesForm(..., { dirty: 'value' })` trong trang. Gõ rồi sửa về như cũ không bị hỏi; đóng tab trình duyệt khi còn thay đổi có hộp thoại của trình duyệt.
- MUST kiểm tra khi rời field và khi bấm Lưu (`markAllAsTouched`); lưu lỗi thì focus field lỗi đầu tiên (E13).
- MUST gắn lỗi theo field của API vào đúng field (`[inlineError]`), giữ nguyên dữ liệu đã nhập; field đổi giá trị thì bỏ lỗi cũ của nó.
- MUST lưu xong thì `markPristine()` trước khi điều hướng, sang chi tiết với `replaceUrl: true` để Back không quay lại form tạo mới.
- MUST không khai báo trước FormControl trùng tên với field Core tự đăng ký.
- SHOULD dùng `toc` khi form có từ ba nhóm trở lên; mục lục lấy các `sd-section` có title, cả section nằm trong component `-form` con.
- SHOULD giữ bản ghi một dòng (cài đặt) ở lại trang sau khi lưu: `form.markAsPristine()` làm giá trị vừa lưu thành mốc so sánh mới, footer báo trạng thái lưu.

## Lỗi hay gặp

- Chụp giá trị ban đầu lúc khởi tạo form khi field Core chưa đăng ký: form vừa mở đã bị coi là có thay đổi. Dùng `dirty: 'value'` của `registerSdUnsavedChangesForm`.
- Bắt mọi lỗi lưu rồi báo chung "Không thể lưu": lỗi theo field của API mất chỗ hiện.
- Điều hướng sau khi lưu mà chưa `markPristine()`: guard hỏi "Rời trang khi chưa lưu?" ngay sau khi lưu xong.
- Bấm Lưu liên tiếp tạo hai request: chặn bằng cờ `saving` và trạng thái `loading` của nút.
