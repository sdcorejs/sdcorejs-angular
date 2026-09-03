import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VERSION } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ISdApiConfiguration, SD_API_CONFIG } from './api.model';
import { SD_API_MISSING_HTTP_CLIENT_MESSAGE, SdApiModule } from './api.module';
import { SdHttpInterceptor } from './interceptors/api.interceptor';

/**
 * why: `SdApiModule` từng gọi `provideHttpClient(withInterceptorsFromDi())` trong providers của
 * chính nó. Một NgModule của THƯ VIỆN mà đăng ký lại cấu hình HttpClient ở root là chiếm quyền của
 * application: app đã tự `provideHttpClient(...)` rồi import module này sẽ bị ghi đè cấu hình mà
 * không có cảnh báo nào. Module giờ chỉ đóng góp đúng `HTTP_INTERCEPTORS`.
 */
describe('SdApiModule', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('does not change the HttpClient availability owned by Angular and the application', () => {
    // why: Angular 21 provides HttpClient in root by default, while Angular 19/20 do not.
    // Comparing against a bare TestBed proves module ownership without baking a framework-major
    // assumption into this cross-version regression.
    TestBed.configureTestingModule({});
    const availableWithoutModule = TestBed.inject(HttpClient, null) !== null;

    TestBed.resetTestingModule();
    const errorSpy = spyOn(console, 'error');
    TestBed.configureTestingModule({ imports: [SdApiModule] });
    const availableWithModule = TestBed.inject(HttpClient, null) !== null;

    expect(availableWithoutModule).toBe(Number(VERSION.major) >= 21);
    expect(availableWithModule).toBe(availableWithoutModule);
    if (availableWithoutModule) {
      expect(errorSpy).not.toHaveBeenCalled();
    } else {
      expect(errorSpy).toHaveBeenCalledOnceWith(SD_API_MISSING_HTTP_CLIENT_MESSAGE);
    }
  });

  it('contributes SdHttpInterceptor through HTTP_INTERCEPTORS', () => {
    TestBed.configureTestingModule({ imports: [SdApiModule], providers: [provideHttpClient()] });

    const interceptors = TestBed.inject(HTTP_INTERCEPTORS);
    expect(interceptors.some(interceptor => interceptor instanceof SdHttpInterceptor)).toBeTrue();
  });

  it('leaves the application functional interceptors intact when imported', () => {
    const marker: HttpInterceptorFn = (request, next) => next(request.clone({ setHeaders: { 'X-App-Interceptor': 'kept' } }));
    TestBed.configureTestingModule({
      imports: [SdApiModule],
      providers: [provideHttpClient(withInterceptors([marker])), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/app-owned').subscribe();

    const request = ctrl.expectOne('/api/app-owned');
    expect(request.request.headers.get('X-App-Interceptor')).toBe('kept');
    request.flush(null);
    ctrl.verify();
  });

  it('still applies SdHttpInterceptor when the application opts into withInterceptorsFromDi()', () => {
    const configuration: ISdApiConfiguration = {
      handlers: [{ hosts: ['/api'], intercept: request => request.clone({ setHeaders: { 'X-Handler': 'applied' } }) }],
    };
    TestBed.configureTestingModule({
      imports: [SdApiModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: SD_API_CONFIG, multi: true, useValue: configuration },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/di-interceptors').subscribe();

    const request = ctrl.expectOne('/api/di-interceptors');
    expect(request.request.headers.get('X-Handler')).toBe('applied');
    request.flush(null);
    ctrl.verify();
  });

  // ─── dev-mode assertion for the dropped provideHttpClient() ─────────────────

  describe('missing provideHttpClient() assertion', () => {
    it('names the missing provideHttpClient() call exactly when HttpClient is absent', () => {
      // why: bỏ `provideHttpClient(...)` khỏi module là đúng, nhưng nó phá consumer NgModule đang
      // dùng đúng hướng dẫn cũ `imports: [SdApiModule]` — và phá lúc RUNTIME (`NullInjectorError:
      // No provider for HttpClient` ở lời gọi API đầu tiên), không phải lúc build. Angular 21 cung
      // cấp HttpClient mặc định, nên trước hết phải đo contract của Angular thay vì giả định absent.
      TestBed.configureTestingModule({});
      const angularProvidesHttpClient = TestBed.inject(HttpClient, null) !== null;
      TestBed.resetTestingModule();

      const errorSpy = spyOn(console, 'error');
      TestBed.configureTestingModule({ imports: [SdApiModule] });

      TestBed.inject(HTTP_INTERCEPTORS);

      if (angularProvidesHttpClient) {
        expect(errorSpy).not.toHaveBeenCalled();
      } else {
        expect(errorSpy).toHaveBeenCalledOnceWith(SD_API_MISSING_HTTP_CLIENT_MESSAGE);
      }
      expect(SD_API_MISSING_HTTP_CLIENT_MESSAGE).toContain('provideHttpClient(withInterceptorsFromDi())');
    });

    it('stays silent when the application did provide HttpClient', () => {
      const errorSpy = spyOn(console, 'error');
      TestBed.configureTestingModule({
        imports: [SdApiModule],
        providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
      });

      TestBed.inject(HttpClient);

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('stays silent in a production build even when HttpClient is missing', () => {
      // why: `isDevMode()` chỉ đọc global `ngDevMode` — tắt cờ này mô phỏng đúng production build.
      const globalRef = globalThis as unknown as { ngDevMode?: unknown };
      const hadNgDevMode = 'ngDevMode' in globalRef;
      const originalNgDevMode = globalRef.ngDevMode;
      const errorSpy = spyOn(console, 'error');

      try {
        globalRef.ngDevMode = false;
        TestBed.configureTestingModule({ imports: [SdApiModule] });
        TestBed.inject(HTTP_INTERCEPTORS);
      } finally {
        if (hadNgDevMode) globalRef.ngDevMode = originalNgDevMode;
        else delete globalRef.ngDevMode;
      }

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
