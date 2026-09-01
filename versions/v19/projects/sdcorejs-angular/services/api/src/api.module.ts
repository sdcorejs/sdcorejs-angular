import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { inject, isDevMode, NgModule } from '@angular/core';
import { SdHttpInterceptor } from './interceptors/api.interceptor';

/**
 * Thông điệp của assertion dev-mode ở constructor cho Angular 19/20. Export ra để spec khẳng định
 * đúng nội dung, và để consumer grep được khi thấy nó trong console.
 */
export const SD_API_MISSING_HTTP_CLIENT_MESSAGE =
  '[sd-api] SdApiModule không còn tự cấu hình HttpClient. ' +
  'Thêm `provideHttpClient(withInterceptorsFromDi())` vào providers của application ' +
  '(app.config.ts hoặc AppModule) — nếu không, lời gọi API đầu tiên sẽ ném ' +
  '`NullInjectorError: No provider for HttpClient`.';

// why: KHÔNG gọi `provideHttpClient(withInterceptorsFromDi())` ở đây. Đây là NgModule của thư viện,
// mà `provideHttpClient` đăng ký LẠI toàn bộ cấu hình HttpClient ở root injector: app nào đã khai
// báo `provideHttpClient(withInterceptors([...]))` rồi mới import SdApiModule sẽ mất sạch functional
// interceptor của chính nó mà không có cảnh báo nào. Module này chỉ góp `HTTP_INTERCEPTORS`;
// việc cấu hình HttpClient (và bật `withInterceptorsFromDi()`) thuộc về application.
@NgModule({
  imports: [],
  exports: [],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: SdHttpInterceptor, multi: true }],
})
export class SdApiModule {
  constructor() {
    // why: bỏ `provideHttpClient(...)` khỏi module là đúng, nhưng nó phá mọi consumer NgModule đang
    // theo đúng hướng dẫn cũ `imports: [SdApiModule]` — và phá KHÔNG ở thời điểm build. Họ chỉ gặp
    // `NullInjectorError: No provider for HttpClient` ở lời gọi API ĐẦU TIÊN lúc runtime, cách rất
    // xa chỗ cấu hình sai. Kiểm tra ngay lúc dựng module và gọi thẳng tên API còn thiếu.
    //
    // Chỉ cảnh báo (không ném) vì đây là thư viện: có app cấu hình HttpClient ở injector con hoặc
    // trong test harness riêng, ném ở đây sẽ chặn cả những setup hợp lệ đó.
    //
    // Angular 21 cung cấp HttpClient ở root mặc định, nên check này cố ý im lặng trên v21. Consumer
    // vẫn phải gọi `provideHttpClient(withInterceptorsFromDi())` nếu muốn HTTP_INTERCEPTORS dạng
    // class (bao gồm SdHttpInterceptor) tham gia request chain; public API không có token để module
    // phân biệt cấu hình đó với HttpClient mặc định.
    if (isDevMode() && inject(HttpClient, { optional: true }) === null) {
      console.error(SD_API_MISSING_HTTP_CLIENT_MESSAGE);
    }
  }
}
