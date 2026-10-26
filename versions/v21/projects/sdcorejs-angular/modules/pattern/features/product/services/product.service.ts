import { Injectable, signal } from '@angular/core';
import { shareReplay, tap, type Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { ProductDto, ProductListReq, ProductListRes, ProductSaveReq } from './product.model';

@Injectable()
export class ProductService extends BaseApiService {
  /** Một request cho mỗi ID trong phạm vi service: pipe và select dùng chung kết quả. */
  readonly #details = new Map<string, Observable<ProductDto>>();
  readonly #changes = signal(0);
  /** Tăng sau mỗi lần tạo hoặc cập nhật thành công: danh sách tải lại khi quay về. */
  readonly changes = this.#changes.asReadonly();

  list(req: ProductListReq): Observable<ProductListRes> {
    return this.http.get<ProductListRes>(this.apiUrl('products'), {
      params: this.buildPagingReq(req),
    });
  }

  detail(id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(this.apiUrl('products', id));
  }

  /** `detail(id)` có cache, cho relation (`productDetail`) và giá trị đã chọn của `product-select`. */
  cachedDetail(id: string): Observable<ProductDto> {
    let detail = this.#details.get(id);
    if (!detail) {
      detail = this.detail(id).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.#details.set(id, detail);
      // Lỗi tra cứu không được cache: lần gọi sau hỏi lại.
      detail.subscribe({ error: () => this.#details.delete(id) });
    }
    return detail;
  }

  create(req: ProductSaveReq): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.apiUrl('products'), req).pipe(tap(() => this.#changes.update(count => count + 1)));
  }

  update(id: string, req: ProductSaveReq): Observable<ProductDto> {
    return this.http.put<ProductDto>(this.apiUrl('products', id), req).pipe(
      tap(() => {
        this.#details.delete(id);
        this.#changes.update(count => count + 1);
      })
    );
  }
}
