import {
  HttpBackend,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { DestroyRef, inject, Injectable, InjectionToken } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Observable, of, Subscription, throwError } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';

/**
 * URL dùng để dò kết nối khi một request trả về status 0.
 *
 * why: bản cũ hard-code `https://jsonplaceholder.typicode.com/todos/1`, không override được. Mọi
 * app tiêu dùng thư viện đều ping một bên thứ ba lạ mỗi 3 giây khi mất mạng, và vì probe đi qua
 * NGUYÊN chuỗi interceptor của app nên bất kỳ interceptor nào gắn header auth vô điều kiện đều
 * rò token ra ngoài origin. Mặc định giờ là một đường dẫn same-origin; app đổi bằng cách provide
 * lại token này (nên trỏ tới endpoint tĩnh, rẻ, không cần auth).
 */
export const SD_NO_INTERNET_PROBE_URL = new InjectionToken<string>('sd.no-internet.probe-url', {
  providedIn: 'root',
  factory: () => '/favicon.ico',
});

@Injectable()
export class SdNoInternetInterceptor implements HttpInterceptor {
  private snackBar = inject(MatSnackBar);

  readonly #i18n = inject(I18nService);

  // why: HttpBackend là tầng cuối, KHÔNG đi qua chuỗi interceptor — probe vì thế không kéo theo
  // header do interceptor của app gắn, và cũng không tự đệ quy vào chính interceptor này.
  // Dùng backend cũng loại luôn lý do phải lazy-resolve HttpClient qua Injector (circular DI).
  readonly #backend = inject(HttpBackend);

  readonly #probeUrl = inject(SD_NO_INTERNET_PROBE_URL);

  readonly #destroyRef = inject(DestroyRef);

  // Trạng thái offline để tránh spam request check hoặc hiển thị nhiều snackbar
  #isOffline = false;

  // Giữ tham chiếu để có thể đóng/thao tác snackbar
  #snackBarRef: MatSnackBarRef<any> | null = null;

  // Giữ tham chiếu interval để clear khi có mạng lại
  #pollInterval: ReturnType<typeof setInterval> | null = null;

  // Giữ tham chiếu request probe đang bay để huỷ được khi dừng polling
  #pollSubscription: Subscription | null = null;

  // Thời gian lặp lại việc kiểm tra mạng (ms)
  readonly #checkIntervalDuration = 3000;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    // why: interceptor sống ở root injector nhưng vòng polling không có teardown nào — nó chỉ
    // dừng khi mạng phục hồi. App/microfrontend bị destroy giữa lúc offline sẽ bỏ lại một timer
    // 3s cùng request HTTP của nó chạy mãi.
    this.#destroyRef.onDestroy(() => this.#stopPolling());
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // --- TRƯỜNG HỢP 1: Lỗi mất kết nối (Status 0) ---
        if (error.status === 0 && !this.#isOffline) {
          this.#isOffline = true;

          // Gọi thử probe để xác minh xem là Mất mạng thật hay do CORS/SSL/Server chặn
          return this.#probe().pipe(
            // 1. Ưu tiên bắt lỗi kết nối trước (MẤT MẠNG THẬT — probe cũng không mở nổi kết nối,
            //    tức status 0; mọi status HTTP khác đã được #probe quy về "có mạng")
            catchError(_checkError => {
              // Hiển thị thông báo và bắt đầu polling chờ mạng
              this.#showReloadSnackbar(this.#i18n.t('core.interceptor.no-internet.offline'), { isSticky: true });
              this.#startPolling();

              // Ném lại lỗi gốc để Component biết request thất bại
              return throwError(() => error);
            }),

            // 2. Nếu không vào catchError ở trên -> Check thành công -> CÓ MẠNG
            // Lỗi status 0 ban đầu là do CORS, SSL, hoặc Server chặn connection
            switchMap(() => {
              this.#isOffline = false; // Reset cờ

              this.snackBar.open(this.#i18n.t('core.interceptor.no-internet.cors-error'), this.#i18n.t('core.common.close'), {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
              });

              // Ném lại lỗi gốc
              return throwError(() => error);
            })
          );
        }

        // --- TRƯỜNG HỢP 2: Server bảo trì (503) ---
        else if (error.status === 503) {
          this.snackBar.open(this.#i18n.t('core.interceptor.no-internet.maintenance'), this.#i18n.t('core.common.close'), {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 5000,
          });
        }

        // --- TRƯỜNG HỢP KHÁC: 401, 404, 500... ---
        // Ném lỗi ra để component xử lý bình thường
        return throwError(() => error);
      })
    );
  }

  /**
   * Bắn một request dò kết nối đi thẳng qua HttpBackend.
   *
   * Phát `true` khi CÓ mạng; chỉ ném lỗi khi thật sự không mở được kết nối (`status === 0`).
   */
  #probe = (): Observable<boolean> => {
    const request = new HttpRequest<null>('GET', this.#probeUrl, {
      responseType: 'text',
      // why: probe mà đọc được từ HTTP cache thì lúc offline vẫn "thành công" và interceptor sẽ
      // kết luận nhầm là đã có mạng. no-cache buộc trình duyệt phải đi hỏi lại server.
      headers: new HttpHeaders({ 'Cache-Control': 'no-cache', Pragma: 'no-cache' }),
    });

    // why: HttpBackend phát HttpEvent thô (có thể gồm sent/progress), chỉ HttpResponse mới là
    // tín hiệu "đã có mạng".
    return this.#backend.handle(request).pipe(
      filter((event): event is HttpResponse<unknown> => event instanceof HttpResponse),
      map(() => true),
      // why: HttpBackend ném HttpErrorResponse cho MỌI status không phải 2xx, nên coi "probe lỗi"
      // = "mất mạng thật" là sai. Một `404` rất phổ biến (app xoá favicon mặc định của CLI, static
      // host trả 404/403 cho đường dẫn không tồn tại) và chính nó ĐÃ chứng minh là có mạng — nhưng
      // vẫn bị phân loại thành offline, dựng snackbar offline dính cứng cùng vòng poll 3 giây không
      // bao giờ thoát được. Chỉ status 0 (không thiết lập nổi kết nối) mới là offline.
      catchError((error: HttpErrorResponse) => (error.status === 0 ? throwError(() => error) : of(true)))
    );
  };

  /**
   * Hiển thị Snackbar thông báo trạng thái mạng
   */
  #showReloadSnackbar = (message: string, options?: { duration?: number; isSticky?: boolean }): void => {
    // Đóng snackbar cũ nếu đang hiện
    if (this.#snackBarRef) {
      this.#snackBarRef.dismiss();
    }

    this.#snackBarRef = this.snackBar.open(message, this.#i18n.t('core.common.reload'), {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      // Nếu isSticky = true (mất mạng) -> Không tự tắt. Nếu có duration -> tự tắt.
      duration: options?.duration,
      panelClass: options?.isSticky ? ['offline-snackbar'] : undefined, // Class CSS tùy chọn
    });

    // Xử lý sự kiện bấm nút "Tải lại trang"
    this.#snackBarRef.onAction().subscribe(() => {
      window.location.reload();
    });
  };

  /**
   * Bắt đầu vòng lặp kiểm tra kết nối mạng
   */
  #startPolling = (): void => {
    this.#stopPolling(); // Clear cũ nếu có

    this.#pollInterval = setInterval(() => {
      // Check nhẹ
      this.#pollSubscription?.unsubscribe();
      this.#pollSubscription = this.#probe().subscribe({
        next: () => {
          // --> ĐÃ CÓ MẠNG LẠI (2xx, hoặc bất kỳ status HTTP nào — xem #probe)
          this.#stopPolling();
          this.#isOffline = false;

          // Thông báo thành công (tự tắt sau 5s)
          this.#showReloadSnackbar(this.#i18n.t('core.interceptor.no-internet.restored'), { duration: 5000, isSticky: false });
        },
        error: () => {
          // --> VẪN MẤT MẠNG (status 0): Không làm gì cả, chờ lần check tiếp theo
        },
      });
    }, this.#checkIntervalDuration);
  };

  /**
   * Dừng vòng lặp kiểm tra
   */
  #stopPolling = (): void => {
    if (this.#pollInterval) {
      clearInterval(this.#pollInterval);
      this.#pollInterval = null;
    }
    this.#pollSubscription?.unsubscribe();
    this.#pollSubscription = null;
  };
}
