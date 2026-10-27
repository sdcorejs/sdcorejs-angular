import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { ApprovalService } from './services/approval.service';
import type { ApprovalDto } from './services/approval.model';

/** Tải đề nghị bằng `detail(id)` trước khi mở panel chi tiết; lỗi đi tới navigation error handler của host. */
export const entityResolver: ResolveFn<ApprovalDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(ApprovalService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};
