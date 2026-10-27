import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, of, timeout } from 'rxjs';
import { CategoryService } from './services/category.service';
import type { CategoryDto } from './services/category.model';

/** Tải danh mục bằng `detail(id)` trước khi mở drawer cập nhật; lỗi đi tới navigation error handler của host. */
export const entityResolver: ResolveFn<CategoryDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(CategoryService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};

/** Danh mục cha của drawer tạo (`?parent=<id>`); không có tham số thì tạo danh mục gốc. */
export const parentResolver: ResolveFn<CategoryDto | null> = route => {
  const id = route.queryParamMap.get('parent');
  return id ? inject(CategoryService).detail(id).pipe(timeout(10_000)) : of(null);
};
