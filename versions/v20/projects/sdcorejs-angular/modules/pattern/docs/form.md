# Form

Tạo hoặc cập nhật một bản ghi trong một bước: `sd-page-form`. Route mẫu: `/pattern/product/create` và `/pattern/product/:id/update` (một section), `/pattern/order/create` và `/pattern/order/:id/update` (dòng hàng nhập trực tiếp, mục lục; thêm `?lines=sd-table` để xem cùng bảng dựng bằng `sd-table`), `/pattern/settings` (một bản ghi, nhiều nhóm, trạng thái lưu ở footer).

## Khi nào dùng / khi nào không

- Dùng khi form cần cả trang: nhiều nhóm, bảng dòng chi tiết, hoặc người dùng cần tập trung.
- Form ngắn sửa ngay trên danh sách: dùng drawer ([drawer](drawer.md)).
- Nhiều bước có điều kiện chuyển bước: dùng [flow](flow.md).

## Code mẫu

Nhóm field nằm trong component `-form` dùng chung cho tạo và cập nhật; field Core tự đăng ký control qua `[form]` + `name`. Thân section là `row px-16 pt-16 pb-8`: field thẳng lề 16px với title của section; dưới hàng cuối còn chỗ dành cho lỗi của field, nên đáy chỉ cần 8px:

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
    <div class="row px-16 pt-16 pb-8">
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

Dòng hàng nhập trực tiếp: trạng thái của dòng (FormArray `form.lines`, thành tiền, tổng, chọn sản phẩm thì điền đơn giá) nằm trong một hàm dùng chung cho hai cách dựng bảng bên dưới:

<!-- @source features/order/components/lines-form/order-lines.ts -->
```ts
import { computed, DestroyRef, effect, inject, signal, untracked, type Signal } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../../../product/services/product.service';
import type { OrderLineDto } from '../../services/order.model';
import type { OrderForm } from '../general-information-form/general-information-form.component';

/** Một dòng đang nhập: field Core của dòng tự đăng ký vào `group`; `seed` là giá trị ban đầu của dòng. */
export interface OrderLineRow {
  readonly key: number;
  readonly group: FormGroup;
  readonly seed: OrderLineDto;
}

export interface OrderLines {
  readonly rows: Signal<readonly OrderLineRow[]>;
  /** Thành tiền theo thứ tự của `rows`. */
  readonly amounts: Signal<readonly number[]>;
  readonly total: Signal<number>;
  add(): void;
  remove(row: OrderLineRow): void;
  /** Chọn sản phẩm thì điền đơn giá hiện hành của sản phẩm. */
  pick(row: OrderLineRow, productId: string | null | undefined): Promise<void>;
  /** Gắn `form.lines` vào form khi field của các dòng vừa nạp đã đăng ký; gọi lại khi đã gắn thì không làm gì. */
  attach(): void;
}

/**
 * Dòng hàng của form đơn: mỗi dòng là một FormGroup trong `form.lines` (FormArray). Thành tiền và tổng tính lại khi
 * giá trị đổi. `lines-form` (bảng HTML) và `lines-table-form` (`sd-table`) dùng chung, chỉ khác phần hiển thị.
 * Gọi trong injection context của component.
 *
 * `registerSdUnsavedChangesForm(..., { dirty: 'value' })` lấy giá trị của một control lúc nó vào form làm giá trị đã
 * lưu, nên `form.lines` chỉ vào form khi field của các dòng đã đăng ký; vào sớm hơn thì form vừa mở đã bị coi là có
 * thay đổi. `<table>` vẽ dòng ngay trong lượt change detection đó (`attach: 'now'`); `sd-table` vẽ dòng sau lần đọc
 * đầu, nên `lines-table-form` dùng `attach: 'manual'` rồi gọi `attach()` khi bảng đã vẽ.
 */
export function orderLines(
  form: Signal<OrderForm>,
  seed: Signal<readonly OrderLineDto[]>,
  options: { readonly attach: 'now' | 'manual' } = { attach: 'now' }
): OrderLines {
  const productService = inject(ProductService);
  const array = new FormArray<FormGroup>([]);
  const version = signal(0);
  const rows = signal<readonly OrderLineRow[]>([]);
  let nextKey = 0;

  const attach = (): void => {
    if (form().get('lines') !== array) form().setControl('lines', array);
  };
  const push = (line: OrderLineDto): void => {
    const group = new FormGroup({});
    array.push(group);
    rows.update(items => [...items, { key: nextKey++, group, seed: line }]);
  };
  const load = (lines: readonly OrderLineDto[]): void => {
    // why: gỡ ra rồi gắn lại, để giá trị đã lưu của `lines` là các dòng mới chứ không phải dòng của đơn trước.
    if (form().get('lines') === array) form().removeControl('lines');
    array.clear();
    rows.set([]);
    (lines.length ? lines : [{ productId: '', quantity: 1, unitPrice: 0 }]).forEach(push);
    if (options.attach === 'now') attach();
  };

  const subscription = array.valueChanges.subscribe(() => version.update(value => value + 1));
  inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  // why: trang cập nhật được dùng lại khi chỉ đổi `:id`; dòng hàng phải theo đơn mới, không giữ dòng của đơn trước.
  effect(() => {
    const lines = seed();
    untracked(() => load(lines));
  });

  const amounts = computed(() => {
    version();
    return rows().map(
      row => Number(row.group.get('quantity')?.value ?? row.seed.quantity) * Number(row.group.get('unitPrice')?.value ?? row.seed.unitPrice)
    );
  });

  return {
    rows: rows.asReadonly(),
    amounts,
    total: computed(() => amounts().reduce((sum, amount) => sum + amount, 0)),
    add: () => push({ productId: '', quantity: 1, unitPrice: 0 }),
    remove: row => {
      const index = rows().indexOf(row);
      if (index < 0) return;
      // why: đánh dấu đã sửa TRƯỚC khi gỡ, để dirty theo giá trị so với danh sách dòng lúc trước.
      array.markAsDirty();
      array.removeAt(index);
      rows.update(items => items.filter(item => item !== row));
    },
    pick: async (row, productId) => {
      if (!productId) return;
      const product = await firstValueFrom(productService.cachedDetail(productId));
      row.group.get('unitPrice')?.setValue(product.price);
    },
    attach,
  };
}
```

Bảng dựng bằng `<table>`: field trong ô dùng `size="sm"` và `hideInlineError`, mọi ô căn giữa theo chiều dọc, lỗi của API là icon kèm tooltip trên đúng ô nên dòng không cao thêm:

<!-- @source features/order/components/lines-form/lines-form.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { ProductSelectComponent } from '../../../product/components/product-select/product-select.component';
import type { OrderLineDto } from '../../services/order.model';
import type { OrderForm } from '../general-information-form/general-information-form.component';
import { orderLines } from './order-lines';

/**
 * Bảng dòng hàng nhập trực tiếp, dựng bằng `<table>`: mỗi dòng là một FormGroup trong `form.lines` (FormArray, do
 * `orderLines()` quản lý), các field Core tự đăng ký vào dòng. Chọn sản phẩm điền đơn giá; thành tiền và tổng tự
 * tính. Field trong ô dùng `size="sm"` và `hideInlineError`: lỗi, kể cả lỗi API theo dòng (`lines.<i>.<field>`), là
 * icon kèm tooltip ngay trên ô đó, dòng không cao thêm. Cùng bảng dựng bằng `sd-table`: `lines-table-form`.
 */
@Component({
  selector: 'lines-form',
  standalone: true,
  imports: [SdSection, SdButton, SdInputNumber, SdFormatNumberPipe, ProductSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-section title="Dòng hàng">
      <div sdHeaderRight>
        <sd-button title="Thêm dòng" prefixIcon="add" type="text" autoId="order-line-add" (click)="lines.add()" />
      </div>
      <div class="lines-scroll">
        <table class="lines">
          <colgroup>
            <col />
            <col class="lines__quantity" />
            <col class="lines__money" />
            <col class="lines__money" />
            <col class="lines__action" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Sản phẩm <span class="text-error" aria-hidden="true">*</span></th>
              <th scope="col" class="lines__number">Số lượng <span class="text-error" aria-hidden="true">*</span></th>
              <th scope="col" class="lines__number">Đơn giá (₫) <span class="text-error" aria-hidden="true">*</span></th>
              <th scope="col" class="lines__number">Thành tiền (₫)</th>
              <th scope="col" class="lines__action"><span class="sd-visually-hidden">Xoá dòng</span></th>
            </tr>
          </thead>
          <tbody>
            @for (row of lines.rows(); track row.key; let index = $index) {
              <tr [attr.data-line]="index">
                <td>
                  <product-select
                    size="sm"
                    hideInlineError
                    [label]="undefined"
                    [form]="row.group"
                    [model]="row.seed.productId || null"
                    [inlineError]="errors()['lines.' + index + '.productId']"
                    [autoId]="'order-line-' + index + '-product'"
                    (modelChange)="lines.pick(row, $event)"
                    required />
                </td>
                <td class="lines__number">
                  <sd-input-number
                    name="quantity"
                    size="sm"
                    hideInlineError
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
                    size="sm"
                    hideInlineError
                    type="positive"
                    [precision]="0"
                    [form]="row.group"
                    [model]="row.seed.unitPrice"
                    [inlineError]="errors()['lines.' + index + '.unitPrice']"
                    [autoId]="'order-line-' + index + '-unit-price'"
                    required />
                </td>
                <td class="lines__number" [attr.data-autoid]="'order-line-' + index + '-amount'">
                  {{ lines.amounts()[index] | sdFormatNumber: 0 }}
                </td>
                <td class="lines__action">
                  <sd-button
                    prefixIcon="delete"
                    type="text"
                    color="error"
                    tooltip="Xoá dòng"
                    [autoId]="'order-line-' + index + '-remove'"
                    [disabled]="lines.rows().length === 1"
                    (click)="lines.remove(row)" />
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colspan="3" class="lines__number">Tổng tiền (₫)</th>
              <td class="lines__number lines__total" data-autoid="order-total">{{ lines.total() | sdFormatNumber: 0 }}</td>
              <td class="lines__action"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </sd-section>
  `,
  styles: `
    /* Màn hẹp thì cuộn ngang trong section thay vì bóp cột sản phẩm. */
    .lines-scroll {
      overflow-x: auto;
    }
    /* Cột cố định, sản phẩm lấy phần còn lại: vừa thân 576px của sd-page-form. */
    .lines {
      width: 100%;
      min-width: 544px;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .lines__quantity {
      width: 88px;
    }
    .lines__money {
      width: 120px;
    }
    .lines__action {
      width: 48px;
    }
    .lines th,
    .lines td {
      padding: 8px;
      text-align: left;
      vertical-align: middle;
    }
    /* Cột đầu và cuối thẳng lề 16px với title và nút "Thêm dòng" của section. */
    .lines th:first-child,
    .lines td:first-child {
      padding-left: 16px;
    }
    .lines th:last-child,
    .lines td:last-child {
      padding-right: 16px;
    }
    .lines thead th {
      color: var(--sd-text-secondary);
      font-size: 12px;
      font-weight: 500;
      border-bottom: 1px solid var(--sd-border);
    }
    .lines tbody tr:first-child td {
      padding-top: 12px;
    }
    .lines tbody tr:last-child td {
      padding-bottom: 12px;
    }
    .lines__number {
      text-align: right !important;
    }
    .lines tfoot th,
    .lines tfoot td {
      padding-top: 12px;
      padding-bottom: 12px;
      border-top: 1px solid var(--sd-border);
    }
    .lines__total {
      font-weight: 500;
    }
  `,
})
export class LinesFormComponent {
  readonly form = input.required<OrderForm>();
  /** Dòng ban đầu (cập nhật) hoặc một dòng trống (tạo mới). */
  readonly seed = input.required<readonly OrderLineDto[]>();
  /** Lỗi theo field do API trả về, khoá dạng `lines.<index>.<field>`. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  protected readonly lines = orderLines(this.form, this.seed);
}
```

Cùng dòng hàng dựng bằng `sd-table` (`/pattern/order/create?lines=sd-table`): nút thêm dòng ở header cột command (`sdTableCommandHeaderDef`), xoá dòng là command của bảng, số dòng và tổng tiền dưới bảng. Dòng đổi thì `reload()` bảng; `rowKey` giữ view của các dòng còn lại nên giá trị đang nhập không mất. `sd-table` vẽ dòng sau lần đọc đầu, nên `form.lines` chỉ vào form khi bảng đã vẽ (`attach: 'manual'` rồi `attach()` từ `reload.onReload`):

<!-- @source features/order/components/lines-table-form/lines-table-form.component.ts -->
```ts
import { afterNextRender, ChangeDetectionStrategy, Component, effect, inject, Injector, input, untracked, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import {
  SdTable,
  SdTableCellDefDirective,
  SdTableCommandHeaderDefDirective,
  SdTableTitleDefDirective,
  type SdTableOption,
} from '@sdcorejs/angular/components/table';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { ProductSelectComponent } from '../../../product/components/product-select/product-select.component';
import type { OrderLineDto } from '../../services/order.model';
import type { OrderForm } from '../general-information-form/general-information-form.component';
import { orderLines, type OrderLineRow } from '../lines-form/order-lines';

/** Dòng của `sd-table`: dòng form cộng tên các cột. Ô của mọi cột vẽ bằng `sdTableCellDef` từ `group`/`seed`. */
interface LineItem extends OrderLineRow {
  readonly productId?: string;
  readonly quantity?: number;
  readonly unitPrice?: number;
  readonly amount?: number;
}

/**
 * Dòng hàng nhập trực tiếp, dựng bằng `sd-table` thay cho `<table>` của `lines-form`; trạng thái dòng vẫn là
 * `orderLines()`. Bảng local, không phân trang, không lọc. Nút thêm dòng nằm ở header cột command
 * (`sdTableCommandHeaderDef`), ngay trên nút xoá của từng dòng; field trong ô dùng `size="sm"` và `hideInlineError`,
 * cột bắt buộc có `*` ở title; số dòng và tổng tiền ở dưới bảng. Dòng đổi thì `reload()` bảng; `rowKey` giữ view
 * của các dòng còn lại nên giá trị đang nhập không mất. `form.lines` chỉ vào form khi bảng đã vẽ dòng (`attach`).
 */
@Component({
  selector: 'lines-table-form',
  standalone: true,
  imports: [
    SdSection,
    SdButton,
    SdTable,
    SdTableCellDefDirective,
    SdTableCommandHeaderDefDirective,
    SdTableTitleDefDirective,
    SdInputNumber,
    SdFormatNumberPipe,
    ProductSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-section title="Dòng hàng">
      <sd-table autoId="order-lines" [option]="option">
        <ng-template sdTableCommandHeaderDef>
          <sd-button
            tooltip="Thêm dòng"
            prefixIcon="add"
            size="sm"
            type="light"
            color="primary"
            autoId="order-line-add"
            (click)="lines.add()" />
        </ng-template>
        <ng-template sdTableTitleDef="productId">Sản phẩm <span class="text-error" aria-hidden="true">*</span></ng-template>
        <ng-template sdTableTitleDef="quantity">Số lượng <span class="text-error" aria-hidden="true">*</span></ng-template>
        <ng-template sdTableTitleDef="unitPrice">Đơn giá (₫) <span class="text-error" aria-hidden="true">*</span></ng-template>
        <ng-template sdTableCellDef="productId" let-row="item">
          @let index = lines.rows().indexOf(row);
          <product-select
            class="lines-table__input"
            size="sm"
            hideInlineError
            [label]="undefined"
            [form]="row.group"
            [model]="row.seed.productId || null"
            [inlineError]="errors()['lines.' + index + '.productId']"
            [autoId]="'order-line-' + index + '-product'"
            (modelChange)="lines.pick(row, $event)"
            required />
        </ng-template>
        <ng-template sdTableCellDef="quantity" let-row="item">
          @let index = lines.rows().indexOf(row);
          <sd-input-number
            class="lines-table__input"
            name="quantity"
            size="sm"
            hideInlineError
            type="positive"
            [precision]="0"
            [form]="row.group"
            [model]="row.seed.quantity"
            [inlineError]="errors()['lines.' + index + '.quantity']"
            [autoId]="'order-line-' + index + '-quantity'"
            required />
        </ng-template>
        <ng-template sdTableCellDef="unitPrice" let-row="item">
          @let index = lines.rows().indexOf(row);
          <sd-input-number
            class="lines-table__input"
            name="unitPrice"
            size="sm"
            hideInlineError
            type="positive"
            [precision]="0"
            [form]="row.group"
            [model]="row.seed.unitPrice"
            [inlineError]="errors()['lines.' + index + '.unitPrice']"
            [autoId]="'order-line-' + index + '-unit-price'"
            required />
        </ng-template>
        <ng-template sdTableCellDef="amount" let-row="item">
          @let index = lines.rows().indexOf(row);
          <strong class="lines-table__amount" [attr.data-autoid]="'order-line-' + index + '-amount'">
            {{ lines.amounts()[index] | sdFormatNumber: 0 }}
          </strong>
        </ng-template>
      </sd-table>
      <div class="lines-table__summary">
        <span>{{ lines.rows().length }} dòng hàng</span>
        <strong
          >Tổng tiền: <span data-autoid="order-total">{{ lines.total() | sdFormatNumber: 0 }}</span> ₫</strong
        >
      </div>
    </sd-section>
  `,
  styles: `
    /* Field trong dòng: 6px trên dưới để dòng 44px vẫn thoáng. */
    .lines-table__input {
      display: block;
      padding-block: 6px;
    }
    .lines-table__amount {
      display: block;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .lines-table__summary {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 12px 16px;
      color: var(--sd-text-secondary);
    }
    .lines-table__summary strong {
      color: var(--sd-text);
    }
  `,
})
export class LinesTableFormComponent {
  readonly form = input.required<OrderForm>();
  /** Dòng ban đầu (cập nhật) hoặc một dòng trống (tạo mới). */
  readonly seed = input.required<readonly OrderLineDto[]>();
  /** Lỗi theo field do API trả về, khoá dạng `lines.<index>.<field>`. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly #injector = inject(Injector);
  private readonly table = viewChild(SdTable<LineItem>);
  protected readonly lines = orderLines(this.form, this.seed, { attach: 'manual' });
  protected readonly option: SdTableOption<LineItem> = {
    type: 'local',
    items: () => [...this.lines.rows()],
    rowKey: 'key',
    filter: { disabled: true },
    paginate: { hidden: true, pageSize: 200 },
    reload: {
      visible: false,
      // why: sd-table vẽ dòng sau lần đọc; field trong ô đăng ký xong thì mới gắn `form.lines` (xem `orderLines`).
      onReload: () => {
        afterNextRender(() => this.lines.attach(), { injector: this.#injector });
      },
    },
    config: { visible: false },
    columns: [
      { field: 'productId', title: 'Sản phẩm', type: 'string', minWidth: '180px' },
      { field: 'quantity', title: 'Số lượng', type: 'number', width: '88px' },
      { field: 'unitPrice', title: 'Đơn giá (₫)', type: 'number', width: '120px' },
      { field: 'amount', title: 'Thành tiền (₫)', type: 'number', width: '120px', align: 'right' },
    ],
    command: {
      commands: [
        {
          title: 'Xoá dòng',
          icon: 'delete',
          color: 'error',
          disabled: () => this.lines.rows().length === 1,
          click: row => this.lines.remove(row),
        },
      ],
    },
  };

  constructor() {
    // why: bảng local chỉ đọc `items` khi tải; thêm, xoá dòng hay nạp đơn khác đều phải `reload()` để vẽ lại. Gọi sau
    // lượt render, khi `option` của bảng đã được gán.
    effect(() => {
      this.lines.rows();
      untracked(() => afterNextRender(() => void this.table()?.reload(), { injector: this.#injector }));
    });
  }
}
```

## Quy tắc

- MUST đặt Huỷ (outline) và Lưu (fill, primary) ở `headerRight` của `sd-page-form` (E3); không lặp nút lưu ở cuối thân.
- SHOULD cho nút lưu icon `save`; trang tạo ghi rõ hành động ("Tạo đơn hàng"), trang cập nhật ghi "Lưu".
- MUST đặt title "Tạo mới <entity>" hoặc "Cập nhật <entity> #<mã>" (E5).
- MUST bảo vệ thay đổi chưa lưu: `canDeactivate: [sdPageFormLeaveGuard]` trên route và `registerSdUnsavedChangesForm(..., { dirty: 'value' })` trong trang. Gõ rồi sửa về như cũ không bị hỏi; đóng tab trình duyệt khi còn thay đổi có hộp thoại của trình duyệt.
- MUST kiểm tra khi rời field và khi bấm Lưu (`markAllAsTouched`); lưu lỗi thì focus field lỗi đầu tiên (E13).
- MUST gắn lỗi theo field của API vào đúng field (`[inlineError]`), giữ nguyên dữ liệu đã nhập; field đổi giá trị thì bỏ lỗi cũ của nó.
- MUST lưu xong thì `markPristine()` trước khi điều hướng, sang chi tiết với `replaceUrl: true` để Back không quay lại form tạo mới.
- MUST không khai báo trước FormControl trùng tên với field Core tự đăng ký.
- MUST dùng `size="sm"` và `hideInlineError` cho field trong ô của bảng dòng, dù bảng là `<table>` hay `sd-table`; field trong ô không có label, cột bắt buộc có `*` màu error sau title.
- SHOULD dùng `toc` khi form có từ ba nhóm trở lên; mục lục lấy các `sd-section` có title, cả section nằm trong component `-form` con.
- SHOULD giữ bản ghi một dòng (cài đặt) ở lại trang sau khi lưu: `form.markAsPristine()` làm giá trị vừa lưu thành mốc so sánh mới, footer báo trạng thái lưu.

## Lỗi hay gặp

- Chụp giá trị ban đầu lúc khởi tạo form khi field Core chưa đăng ký: form vừa mở đã bị coi là có thay đổi. Dùng `dirty: 'value'` của `registerSdUnsavedChangesForm`.
- Bắt mọi lỗi lưu rồi báo chung "Không thể lưu": lỗi theo field của API mất chỗ hiện.
- Điều hướng sau khi lưu mà chưa `markPristine()`: guard hỏi "Rời trang khi chưa lưu?" ngay sau khi lưu xong.
- Bấm Lưu liên tiếp tạo hai request: chặn bằng cờ `saving` và trạng thái `loading` của nút.
- Gắn FormArray dòng hàng vào form trước khi field của các dòng đăng ký xong (`sd-table` vẽ dòng sau lần đọc đầu): `dirty: 'value'` lấy dòng còn trống làm giá trị đã lưu, form vừa mở đã hỏi "Rời trang khi chưa lưu?".
- Để field trong ô bảng ở cỡ `md` và lỗi hiện dưới field: ô số và select cao khác nhau, dòng có lỗi cao hơn các dòng khác, cột thành tiền và nút xoá lệch dòng.
