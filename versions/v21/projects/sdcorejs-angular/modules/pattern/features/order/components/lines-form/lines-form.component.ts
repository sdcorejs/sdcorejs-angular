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
