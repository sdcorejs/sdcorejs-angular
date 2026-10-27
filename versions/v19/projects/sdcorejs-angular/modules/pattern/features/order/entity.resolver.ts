import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { createUrlTreeFromSnapshot, RedirectCommand, type ResolveFn } from '@angular/router';
import { map, timeout, type Observable } from 'rxjs';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { OrderService } from './services/order.service';
import { canUpdateOrder, type OrderDto } from './services/order.model';

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

/**
 * Như `entityResolver`, cho trang cập nhật: đơn không còn sửa được (đã xác nhận, đang duyệt…) mở trang chi tiết, thay vì
 * mở form rồi mới bị API từ chối khi lưu.
 */
export const updatableEntityResolver: ResolveFn<OrderDto> = (route, state) => {
  const notify = inject(SdNotifyService);
  return (entityResolver(route, state) as Observable<OrderDto>).pipe(
    map(order => {
      if (canUpdateOrder(order)) return order;
      notify.info(`Đơn ${order.code} không còn sửa được.`);
      return new RedirectCommand(createUrlTreeFromSnapshot(route, ['../detail']));
    })
  );
};
