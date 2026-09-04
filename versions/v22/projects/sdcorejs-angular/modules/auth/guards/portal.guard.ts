import { inject, Injectable, isDevMode } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ISdAuthConfiguration, SD_AUTH_CONFIGURATION } from '../configurations';

@Injectable({ providedIn: 'root' })
export class SdPortalGuard implements CanActivate {
  private readonly authConfiguration: ISdAuthConfiguration | null = inject(SD_AUTH_CONFIGURATION, { optional: true });
  protected readonly router = inject(Router);

  canActivate = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    if (this.authConfiguration?.guard?.portal) {
      return this.authConfiguration.guard.portal(route, state);
    }

    // why: giống `SdAuthGuard` — guard có mặt trong route table là lời tuyên bố "route này cần kiểm
    // tra". Trả `true` khi thiếu `SD_AUTH_CONFIGURATION.guard.portal` biến hàng rào portal thành vô
    // hiệu một cách âm thầm. Fail closed + log to ở dev mode để phát hiện thiếu provider ngay lập tức.
    if (isDevMode()) {
      console.error(
        '[SdPortalGuard] Navigation denied: SD_AUTH_CONFIGURATION.guard.portal is not configured. ' +
          'Provide SD_AUTH_CONFIGURATION with a guard.portal callback, or remove SdPortalGuard from this route if it is meant to be public.'
      );
    }
    return false;
  };
}
