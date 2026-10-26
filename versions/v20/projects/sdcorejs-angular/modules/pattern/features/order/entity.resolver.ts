import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { OrderService } from './services/order.service';
import type { OrderDto } from './services/order.model';

/** Tải đơn hàng bằng `detail(id)` trước khi mở chi tiết hoặc form; lỗi đi tới navigation error handler của host. */
export const entityResolver: ResolveFn<OrderDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(OrderService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};
