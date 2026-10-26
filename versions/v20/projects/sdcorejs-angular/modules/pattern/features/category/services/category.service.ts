import { Injectable, signal } from '@angular/core';
import { tap, type Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { CategoryDto, CategoryNodeDto, CategorySaveReq } from './category.model';

@Injectable()
export class CategoryService extends BaseApiService {
  readonly #changes = signal(0);
  /** Tăng sau mỗi lần tạo, cập nhật hoặc xoá thành công: danh sách chỉ tải lại khi có thay đổi. */
  readonly changes = this.#changes.asReadonly();

  /** Cả cây danh mục, các nút gốc theo thứ tự. */
  tree(): Observable<CategoryNodeDto[]> {
    return this.http.get<CategoryNodeDto[]>(this.apiUrl('categories', 'tree'));
  }

  detail(id: string): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(this.apiUrl('categories', id));
  }

  create(req: CategorySaveReq): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.apiUrl('categories'), req).pipe(tap(() => this.#changed()));
  }

  update(id: string, req: CategorySaveReq): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(this.apiUrl('categories', id), req).pipe(tap(() => this.#changed()));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(this.apiUrl('categories', id)).pipe(tap(() => this.#changed()));
  }

  #changed(): void {
    this.#changes.update(count => count + 1);
  }
}
