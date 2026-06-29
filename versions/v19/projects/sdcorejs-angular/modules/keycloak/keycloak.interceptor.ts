import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { SdKeycloakService } from './keycloak.service';

export const SdKeycloakInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakService = inject(SdKeycloakService);
  const { keycloak, config } = keycloakService;

  // Nếu chưa init xong hoặc chưa đăng nhập -> cho request đi qua bình thường
  if (!keycloak || !keycloak.authenticated || !config) {
    return next(req);
  }

  // Kiểm tra xem URL của request có nằm trong mảng secureRoutes không
  const isSecure = config.secureRoutes?.some(route => req.url.includes(route));
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
