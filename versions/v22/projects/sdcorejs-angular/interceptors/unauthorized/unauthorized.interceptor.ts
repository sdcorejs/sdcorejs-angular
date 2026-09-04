import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SdAuthService } from '@sdcorejs/angular/modules';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class SdUnauthorizedInterceptor implements HttpInterceptor {
  private authService = inject(SdAuthService);

  /**
   * why: bản cũ dùng một boolean `#unauthorizedHandled` set một lần rồi KHÔNG bao giờ mở lại.
   * Hệ quả: sau lần 401 đầu tiên, mọi 401 còn lại trong vòng đời trang đều bị nuốt — người dùng
   * đăng nhập lại xong, phiên hết hạn lần hai thì không còn bị ép signout nữa. Tệ hơn: nếu
   * `SD_AUTH_CONFIGURATION.action.signout` không được cấu hình thì `SdAuthService.signout()` là
   * no-op, nên lần 401 đầu tiên đốt latch mà chẳng làm gì cả.
   *
   * Thay bằng một cửa sổ debounce ngắn: 401 song song trong cùng cửa sổ vẫn chỉ gọi signout một
   * lần (đúng mục đích ban đầu của latch), nhưng hết cửa sổ là latch tự mở lại.
   *
   * why: latch CHỈ mở lại theo thời gian. Bản trước còn reset `#lastSignoutAt` ở mỗi `HttpResponse`
   * thành công, nhưng một 2xx KHÔNG chứng minh phiên còn sống — endpoint công khai vẫn trả 200 khi
   * token đã hết hạn. Đúng kịch bản latch sinh ra để chặn (một burst request song song, vài cái
   * trúng endpoint công khai trả 2xx xen giữa những cái trả 401) sẽ gọi signout một lần cho MỖI 200
   * xen vào.
   */
  readonly #signoutDebounceMs = 3000;
  #lastSignoutAt: number | null = null;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.#shouldSignout()) {
          this.#lastSignoutAt = Date.now();
          this.authService.signout();
        }

        return throwError(() => error);
      })
    );
  }

  #shouldSignout = (): boolean => {
    return this.#lastSignoutAt === null || Date.now() - this.#lastSignoutAt >= this.#signoutDebounceMs;
  };
}
