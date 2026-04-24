import { HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class SdNoInternetInterceptor implements HttpInterceptor {
  // Trạng thái offline để tránh spam request check hoặc hiển thị nhiều snackbar
  #isOffline = false;

  // Giữ tham chiếu để có thể đóng/thao tác snackbar
  #snackBarRef: MatSnackBarRef<any> | null = null;

  // Giữ tham chiếu interval để clear khi có mạng lại
  #pollInterval: ReturnType<typeof setInterval> | null = null;

  // Lazy load HttpClient
  #http: HttpClient | null = null;

  // Endpoint kiểm tra mạng (Nên dùng 1 file tĩnh nhẹ hoặc API ping public uy tín)
  readonly #healthCheckUrl = 'https://jsonplaceholder.typicode.com/todos/1';

  // Thời gian lặp lại việc kiểm tra mạng (ms)
  readonly #checkIntervalDuration = 3000;

  constructor(
    private snackBar: MatSnackBar,
    private injector: Injector
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // --- TRƯỜNG HỢP 1: Lỗi mất kết nối (Status 0) ---
        if (error.status === 0 && !this.#isOffline) {
          this.#isOffline = true;

          // Lazy load HttpClient để tránh lỗi Circular Dependency
          if (!this.#http) {
            this.#http = this.injector.get(HttpClient);
          }

          // Gọi thử một API public để xác minh xem là Mất mạng thật hay do CORS/Server chặn
          return this.#http.get(this.#healthCheckUrl).pipe(
            // 1. Ưu tiên bắt lỗi kết nối trước (Đây là logic MẤT MẠNG THẬT)
            catchError(_checkError => {
              // Hiển thị thông báo và bắt đầu polling chờ mạng
              this.#showReloadSnackbar('Không có kết nối mạng. Đang chờ kết nối...', { isSticky: true });
              this.#startPolling();

              // Ném lại lỗi gốc để Component biết request thất bại
              return throwError(() => error);
            }),

            // 2. Nếu không vào catchError ở trên -> Check thành công -> CÓ MẠNG
            // Lỗi status 0 ban đầu là do CORS, SSL, hoặc Server chặn connection
            switchMap(() => {
              this.#isOffline = false; // Reset cờ

              this.snackBar.open('Không thể kết nối đến máy chủ (Lỗi CORS hoặc cấu hình).', 'Đóng', {
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
          this.snackBar.open('Máy chủ đang bảo trì. Vui lòng thử lại sau!', 'Đóng', {
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
   * Hiển thị Snackbar thông báo trạng thái mạng
   */
  #showReloadSnackbar = (message: string, options?: { duration?: number; isSticky?: boolean }): void => {
    // Đóng snackbar cũ nếu đang hiện
    if (this.#snackBarRef) {
      this.#snackBarRef.dismiss();
    }

    this.#snackBarRef = this.snackBar.open(message, 'Tải lại trang', {
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

    console.log('--- Bắt đầu chế độ theo dõi mạng ---');

    this.#pollInterval = setInterval(() => {
      if (!this.#http) {
        this.#http = this.injector.get(HttpClient);
      }

      // Check nhẹ
      this.#http.get(this.#healthCheckUrl).subscribe({
        next: () => {
          // --> ĐÃ CÓ MẠNG LẠI
          console.log('--> Kết nối đã được khôi phục!');

          this.#stopPolling();
          this.#isOffline = false;

          // Thông báo thành công (tự tắt sau 5s)
          this.#showReloadSnackbar('Kết nối đã được khôi phục!', { duration: 5000, isSticky: false });
        },
        error: () => {
          // --> VẪN MẤT MẠNG: Không làm gì cả, chờ lần check tiếp theo
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
  };
}
