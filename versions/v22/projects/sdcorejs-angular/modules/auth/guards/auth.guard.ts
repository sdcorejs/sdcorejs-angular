import { inject, Injectable, isDevMode } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ISdAuthConfiguration, SD_AUTH_CONFIGURATION } from '../configurations';

@Injectable({ providedIn: 'root' })
export class SdAuthGuard implements CanActivate {
  private readonly authConfiguration: ISdAuthConfiguration | null = inject(SD_AUTH_CONFIGURATION, { optional: true });
  protected readonly router = inject(Router);

  canActivate = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    if (this.authConfiguration?.guard?.auth) {
      return this.authConfiguration.guard.auth(route, state);
    }

    // why: đặt `SdAuthGuard` vào route table tức là consumer đã tuyên bố route ĐÓ cần bảo vệ. Code cũ
    // trả `true` khi thiếu `SD_AUTH_CONFIGURATION.guard.auth`, nên chỉ cần quên một provider là toàn bộ
    // route "được bảo vệ" trở thành công khai mà giao diện vẫn trông đúng — không có tín hiệu nào cả.
    // Vì vậy mặc định là TỪ CHỐI (fail closed); ở dev mode log thật to để lỗi cấu hình lộ ra ngay.
    if (isDevMode()) {
      console.error(
        '[SdAuthGuard] Navigation denied: SD_AUTH_CONFIGURATION.guard.auth is not configured. ' +
          'Provide SD_AUTH_CONFIGURATION with a guard.auth callback, or remove SdAuthGuard from this route if it is meant to be public.'
      );
    }
    return false;
  };
}
