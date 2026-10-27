import { HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { tap, type Observable } from 'rxjs';
import type { Filter } from '@sdcorejs/utils/models';
import { BaseApiService } from '../../../services/base-api.service';
import type {
  OrderAction,
  OrderActionReq,
  OrderBulkRes,
  OrderCounts,
  OrderDto,
  OrderListReq,
  OrderListRes,
  OrderSaveReq,
} from './order.model';

@Injectable()
export class OrderService extends BaseApiService {
  readonly #changes = signal(0);
  /** Tăng sau mỗi lần lưu hoặc đổi trạng thái thành công: danh sách chỉ tải lại khi có thay đổi. */
  readonly changes = this.#changes.asReadonly();

  list(req: OrderListReq): Observable<OrderListRes> {
    return this.http.get<OrderListRes>(this.apiUrl('orders'), { params: this.buildPagingReq(req) });
  }

  /** Số đơn của tab và score card, theo cùng bộ lọc của danh sách. */
  counts(filters: Filter<OrderDto>[]): Observable<OrderCounts> {
    return this.http.get<OrderCounts>(this.apiUrl('orders', 'counts'), {
      params: new HttpParams().set('filters', JSON.stringify(filters)),
    });
  }

  detail(id: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(this.apiUrl('orders', id));
  }

  create(req: OrderSaveReq): Observable<OrderDto> {
    return this.http.post<OrderDto>(this.apiUrl('orders'), req).pipe(tap(() => this.#changed()));
  }

  update(id: string, req: OrderSaveReq): Observable<OrderDto> {
    return this.http.put<OrderDto>(this.apiUrl('orders', id), req).pipe(tap(() => this.#changed()));
  }

  /** Một tác vụ trên một đơn; trả đơn sau khi đổi trạng thái. */
  act(action: OrderAction, req: OrderActionReq): Observable<OrderDto> {
    const { id, ...body } = req;
    return this.http.post<OrderDto>(this.apiUrl('orders', id, action), body).pipe(tap(() => this.#changed()));
  }

  /**
   * Một tác vụ trên nhiều đơn. API không có transaction cho cả lô: kết quả có từng đơn thành công hoặc thất bại,
   * nên luôn đọc `results` thay vì coi request thành công là thành công toàn bộ.
   */
  bulk(action: OrderAction, reqs: readonly OrderActionReq[]): Observable<OrderBulkRes> {
    return this.http.post<OrderBulkRes>(this.apiUrl('orders', 'bulk', action), { items: reqs }).pipe(tap(() => this.#changed()));
  }

  #changed(): void {
    this.#changes.update(count => count + 1);
  }
}
