import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { CustomerService } from './services/customer.service';
import type { CustomerDto } from './services/customer.model';

/** Tải khách hàng bằng `detail(id)` trước khi mở drawer/trang; lỗi đi tới navigation error handler của host. */
export const entityResolver: ResolveFn<CustomerDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(CustomerService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};
