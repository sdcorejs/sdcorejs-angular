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
