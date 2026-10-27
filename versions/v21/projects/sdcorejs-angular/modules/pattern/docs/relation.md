# Relation

Hiện bản ghi liên quan theo ID bằng pipe `<entity>Detail` của feature sở hữu entity. Mẫu: `customerDetail` (điện thoại khách trên chi tiết đơn hàng), `productDetail` (tên sản phẩm trên dòng hàng).

## Khi nào dùng / khi nào không

- Dùng khi bản ghi chỉ có ID của entity khác và màn cần tên, mã hay field khác của entity đó.
- Response đã có tên (chứng từ giữ snapshot tên khách lúc lập đơn): hiện snapshot, không tra lại tên hiện tại.

## Code mẫu

<!-- @source features/customer/pipes/customer-detail.pipe.ts -->
```ts
import { inject, Pipe, type PipeTransform } from '@angular/core';
import { of, type Observable } from 'rxjs';
import { CustomerService } from '../services/customer.service';
import type { CustomerDto } from '../services/customer.model';

/**
 * Relation khách hàng theo ID: `@let customer = order.customerId | customerDetail | async;`.
 * CustomerService cache và chia sẻ request theo ID; nơi dùng pipe phải có CustomerService trong injector.
 */
@Pipe({ name: 'customerDetail', standalone: true })
export class CustomerDetailPipe implements PipeTransform {
  readonly #customerService = inject(CustomerService);

  transform(id: CustomerDto['id'] | null | undefined): Observable<CustomerDto | null> {
    if (id === null || id === undefined || id === '') return of(null);
    return this.#customerService.cachedDetail(id);
  }
}
```

Service sở hữu cache và chia sẻ request theo ID; lỗi tra cứu không được cache:

<!-- @source features/customer/services/customer.service.ts -->
```ts
import { HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { shareReplay, tap, type Observable } from 'rxjs';
import type { Filter, PagingRes } from '@sdcorejs/utils/models';
import { BaseApiService } from '../../../services/base-api.service';
import type {
  CustomerCounts,
  CustomerDebtDto,
  CustomerDocumentDto,
  CustomerDto,
  CustomerListReq,
  CustomerListRes,
  CustomerOrderDto,
  CustomerSaveReq,
} from './customer.model';

@Injectable()
export class CustomerService extends BaseApiService {
  readonly #details = new Map<string, Observable<CustomerDto>>();
  readonly #changes = signal(0);
  /** Tăng sau mỗi lần tạo, cập nhật hoặc xoá thành công: danh sách chỉ tải lại khi có thay đổi. */
  readonly changes = this.#changes.asReadonly();

  list(req: CustomerListReq): Observable<CustomerListRes> {
    return this.http.get<CustomerListRes>(this.apiUrl('customers'), { params: this.buildPagingReq(req) });
  }

  /** Số khách theo nhóm cho score card, theo cùng bộ lọc của danh sách. */
  counts(filters: Filter<CustomerDto>[]): Observable<CustomerCounts> {
    return this.http.get<CustomerCounts>(this.apiUrl('customers', 'counts'), {
      params: new HttpParams().set('filters', JSON.stringify(filters)),
    });
  }

  detail(id: string): Observable<CustomerDto> {
    return this.http.get<CustomerDto>(this.apiUrl('customers', id));
  }

  /** `detail(id)` có cache, cho relation (`customerDetail`) và giá trị đã chọn của `customer-select`. */
  cachedDetail(id: string): Observable<CustomerDto> {
    let detail = this.#details.get(id);
    if (!detail) {
      detail = this.detail(id).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.#details.set(id, detail);
      // Lỗi tra cứu không được cache: lần gọi sau hỏi lại.
      detail.subscribe({ error: () => this.#details.delete(id) });
    }
    return detail;
  }

  create(req: CustomerSaveReq): Observable<CustomerDto> {
    return this.http.post<CustomerDto>(this.apiUrl('customers'), req).pipe(tap(() => this.#changed()));
  }

  update(id: string, req: CustomerSaveReq): Observable<CustomerDto> {
    return this.http.put<CustomerDto>(this.apiUrl('customers', id), req).pipe(tap(() => this.#changed(id)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(this.apiUrl('customers', id)).pipe(tap(() => this.#changed(id)));
  }

  orders(id: string): Observable<PagingRes<CustomerOrderDto>> {
    return this.http.get<PagingRes<CustomerOrderDto>>(this.apiUrl('customers', id, 'orders'));
  }

  debts(id: string): Observable<PagingRes<CustomerDebtDto>> {
    return this.http.get<PagingRes<CustomerDebtDto>>(this.apiUrl('customers', id, 'debts'));
  }

  documents(id: string): Observable<PagingRes<CustomerDocumentDto>> {
    return this.http.get<PagingRes<CustomerDocumentDto>>(this.apiUrl('customers', id, 'documents'));
  }

  #changed(id?: string): void {
    if (id) this.#details.delete(id);
    this.#changes.update(count => count + 1);
  }
}
```

Dùng trong template:

<!-- @source features/order/components/lines-view/lines-view.component.ts -->
```ts
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
```

## Quy tắc

- MUST đặt pipe trong `pipes/<entity>-detail.pipe.ts` của feature sở hữu entity; tên template `<entity>Detail`, trả object có kiểu của entity, không trả chuỗi.
- MUST gọi service của đúng entity; pipe không tự gọi HTTP.
- MUST trả `null` không gọi API khi ID rỗng.
- MUST để service chia sẻ request theo ID; nhiều dòng cùng ID chỉ một request.
- MUST cấp service của entity ở route nơi pipe chạy.
- SHOULD hiện placeholder của Core (`sdEmpty`, `sd-view`) khi giá trị rỗng; không tự viết `--`.

## Lỗi hay gặp

- Gọi hàm tra tên trong template: chạy lại mỗi lần change detection, mỗi lần một request.
- Bắt lỗi tra cứu rồi trả `null` như thành công: người dùng thấy `--` thay vì biết là lỗi.
- Hiện ID thô thay cho tên.
