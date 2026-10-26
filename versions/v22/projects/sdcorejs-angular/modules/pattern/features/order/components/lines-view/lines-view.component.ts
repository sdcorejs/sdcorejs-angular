import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { ProductDetailPipe } from '../../../product/pipes/product-detail.pipe';
import type { OrderLineDto } from '../../services/order.model';

/** Dòng hàng chỉ đọc; tên sản phẩm lấy qua relation `productDetail`, không hiện ID thô. */
@Component({
  selector: 'lines-view',
  standalone: true,
  imports: [AsyncPipe, SdSection, SdTable, SdTableCellDefDirective, ProductDetailPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-section title="Dòng hàng">
      <sd-table autoId="order-lines" [option]="option()">
        <ng-template sdTableCellDef="productId" let-line="item">
          @let product = line.productId | productDetail | async;
          {{ product?.name ?? '…' }}
        </ng-template>
      </sd-table>
    </sd-section>
  `,
})
export class LinesViewComponent {
  readonly lines = input.required<readonly OrderLineDto[]>();
  protected readonly option = computed<SdTableOption<OrderLineDto & { amount: number }>>(() => {
    const items = this.lines().map(line => ({ ...line, amount: line.quantity * line.unitPrice }));
    return {
      type: 'local',
      items: () => items,
      paginate: { pageSize: 50 },
      filter: { hideInlineFilter: 'auto' },
      columns: [
        { field: 'productId', title: 'Sản phẩm', type: 'string', minWidth: '200px' },
        { field: 'quantity', title: 'Số lượng', type: 'number', width: '110px', align: 'right' },
        { field: 'unitPrice', title: 'Đơn giá (₫)', type: 'number', width: '140px', align: 'right' },
        { field: 'amount', title: 'Thành tiền (₫)', type: 'number', width: '150px', align: 'right' },
      ],
    };
  });
}
