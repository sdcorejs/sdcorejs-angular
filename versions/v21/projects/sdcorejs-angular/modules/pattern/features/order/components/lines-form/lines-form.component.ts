import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
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
export class LinesFormComponent {
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
    // why: trang cập nhật được dùng lại khi chỉ đổi `:id`; dòng hàng phải theo đơn mới, không giữ dòng của đơn trước.
    effect(() => {
      const seed = this.seed();
      untracked(() => this.#load(seed));
    });
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

  #load(seed: readonly OrderLineDto[]): void {
    this.#array.clear();
    this.rows.set([]);
    (seed.length ? seed : [{ productId: '', quantity: 1, unitPrice: 0 }]).forEach(line => this.#push(line));
    if (this.form().get('lines') !== this.#array) this.form().setControl('lines', this.#array);
  }

  #push(seed: OrderLineDto): void {
    const group = new FormGroup({});
    this.#array.push(group);
    this.rows.update(rows => [...rows, { key: this.#nextKey++, group, seed }]);
  }
}
