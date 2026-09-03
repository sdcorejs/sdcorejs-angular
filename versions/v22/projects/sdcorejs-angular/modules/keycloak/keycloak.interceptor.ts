import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { sdMatchesSecureRoute } from '@sdcorejs/angular/utilities';
import { SdKeycloakService } from './keycloak.service';

export const SdKeycloakInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakService = inject(SdKeycloakService);
  const { keycloak, config } = keycloakService;

  // Nếu chưa init xong hoặc chưa đăng nhập -> cho request đi qua bình thường
  if (!keycloak || !keycloak.authenticated || !config) {
    return next(req);
  }

  // why: trước đây là `config.secureRoutes?.some(route => req.url.includes(route))` — một phép so
  // khớp chuỗi con KHÔNG neo, không kiểm tra host. Với cấu hình mẫu `secureRoutes: ['/api/v1']`,
  // bất kỳ URL nào chứa chuỗi đó (vd `https://evil.example.com/api/v1/collect`) đều nhận header
  // `Authorization: Bearer <token>` — tức là rò access token sang host bên thứ ba.
  // `sdMatchesSecureRoute` parse URL rồi so origin + tiền tố path theo segment, và fail-closed.
  const isSecure = sdMatchesSecureRoute(req.url, config.secureRoutes);
  if (!isSecure) {
    return next(req);
  }

  // Đảm bảo token luôn hợp lệ (cập nhật nếu token sẽ hết hạn trong 30s tới)
  return from(keycloak.updateToken(30)).pipe(
    switchMap(() => {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${keycloak.token}`),
      });
      return next(authReq);
    })
  );
};
