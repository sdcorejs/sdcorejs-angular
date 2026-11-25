import { HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { shareReplay, tap, type Observable } from 'rxjs';
import type { Filter, PagingReq, PagingRes } from '@sdcorejs/utils/models';
import { BaseApiService } from '../../../services/base-api.service';
import type {
  CustomerActivityDto,
  CustomerCounts,
  CustomerDebtDto,
  CustomerDocumentDto,
  CustomerDto,
  CustomerListReq,
  CustomerListRes,
  CustomerOrderDto,
  CustomerSaveReq,
  CustomerSummaryDto,
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

  summary(id: string): Observable<CustomerSummaryDto> {
    return this.http.get<CustomerSummaryDto>(this.apiUrl('customers', id, 'summary'));
  }

  orders(id: string, query?: number | PagingReq<CustomerOrderDto>): Observable<PagingRes<CustomerOrderDto>> {
    return this.#relation(id, 'orders', query);
  }

  debts(id: string, query?: number | PagingReq<CustomerDebtDto>): Observable<PagingRes<CustomerDebtDto>> {
    return this.#relation(id, 'debts', query);
  }

  documents(id: string, query?: number | PagingReq<CustomerDocumentDto>): Observable<PagingRes<CustomerDocumentDto>> {
    return this.#relation(id, 'documents', query);
  }

  activities(id: string, query?: number | PagingReq<CustomerActivityDto>): Observable<PagingRes<CustomerActivityDto>> {
    return this.#relation(id, 'activities', query);
  }

  #relation<T>(id: string, relation: string, query?: number | PagingReq<T>): Observable<PagingRes<T>> {
    const params = typeof query === 'number' ? new HttpParams().set('limit', query) : this.buildPagingReq(query ?? {});
    return this.http.get<PagingRes<T>>(this.apiUrl('customers', id, relation), { params });
  }

  #changed(id?: string): void {
    if (id) this.#details.delete(id);
    this.#changes.update(count => count + 1);
  }
}
