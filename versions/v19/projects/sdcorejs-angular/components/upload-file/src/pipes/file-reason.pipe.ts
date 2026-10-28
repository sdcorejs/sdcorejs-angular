import { Pipe, PipeTransform } from '@angular/core';

/**
 * Lý do một file bị từ chối, bỏ tiền tố `[tên file] ` mà các thông báo kiểm tra (`invalid-format`, `size-exceeded`…) có
 * sẵn — tên đã hiện ngay trên hàng / ô (đợt 3 · 4c).
 */
@Pipe({ name: 'sdUploadFileReason' })
export class SdUploadFileReasonPipe implements PipeTransform {
  transform(reason: string | null | undefined): string {
    return (reason ?? '').replace(/^\[[^\]]*\]\s*/, '');
  }
}
