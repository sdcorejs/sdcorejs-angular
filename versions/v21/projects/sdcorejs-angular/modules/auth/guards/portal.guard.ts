import { Inject, Injectable, Optional } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ISdAuthConfiguration, SD_AUTH_CONFIGURATION } from '../configurations';

@Injectable({ providedIn: 'root' })
export class SdPortalGuard implements CanActivate {
  constructor(
    @Optional() @Inject(SD_AUTH_CONFIGURATION) private authConfiguration: ISdAuthConfiguration,
    protected readonly router: Router
  ) {}

  canActivate = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    if (this.authConfiguration?.guard?.portal) {
      return this.authConfiguration.guard.portal(route, state);
    }
    // Nếu chưa tích hợp Portal Guard thì pass canActive
    return true;
  };
}
