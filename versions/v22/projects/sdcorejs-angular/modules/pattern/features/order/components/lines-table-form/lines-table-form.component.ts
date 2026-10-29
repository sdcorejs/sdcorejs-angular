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
