import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { ProductService } from './services/product.service';
import type { ProductDto } from './services/product.model';

/** Tải sản phẩm trước khi mở detail/update; lỗi (404, 403, timeout) đi tới navigation error handler của host. */
export const entityResolver: ResolveFn<ProductDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(ProductService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};
