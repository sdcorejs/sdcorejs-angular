import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdInform } from '@sdcorejs/angular/components/inform';

/** Kết quả của một tác vụ hàng loạt: số thành công trên tổng và từng đơn lỗi. */
export interface OrderBulkSummary {
  /** Động từ của tác vụ, ví dụ "Đã xác nhận". */
  readonly done: string;
  readonly total: number;
  readonly failed: readonly { readonly id: string; readonly code: string; readonly message: string }[];
}

/** Báo kết quả từng phần (E13): "Đã xác nhận 8/10. 2 đơn lỗi." kèm lỗi từng đơn và nút thử lại phần lỗi. */
@Component({
  selector: 'bulk-result',
  standalone: true,
  imports: [SdInform],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _result = result();
    <sd-inform
      autoId="order-bulk-result"
      [color]="_result.failed.length ? 'warning' : 'success'"
      [title]="title()"
      [description]="failures()"
      [actionLabel]="_result.failed.length ? 'Thử lại phần lỗi' : undefined"
      closable
      (sdAction)="retry.emit()"
      (sdClosed)="dismiss.emit()" />
  `,
})
export class BulkResultComponent {
  readonly result = input.required<OrderBulkSummary>();
  readonly retry = output<void>();
  readonly dismiss = output<void>();
  protected readonly title = computed(() => {
    const { done, total, failed } = this.result();
    return `${done} ${total - failed.length}/${total}.` + (failed.length ? ` ${failed.length} đơn lỗi.` : '');
  });
  // why: nội dung chiếu vào sd-inform thay cả tiêu đề lẫn nút hành động; lỗi từng đơn đi qua `description`.
  protected readonly failures = computed(
    () =>
      this.result()
        .failed.map(item => `${item.code}: ${item.message}`)
        .join(' ') || undefined
  );
}
