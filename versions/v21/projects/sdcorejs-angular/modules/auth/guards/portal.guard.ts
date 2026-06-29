import { inject, Injectable } from '@angular/core';
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
    // Nếu chưa tích hợp Portal Guard thì pass canActive
    return true;
  };
}
