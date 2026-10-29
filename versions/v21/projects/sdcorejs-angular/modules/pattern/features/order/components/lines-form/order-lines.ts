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
