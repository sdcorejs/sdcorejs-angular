import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot } from '@angular/router';
import { ISdPermissionConfiguration, SD_PERMISSION_CONFIGURATION } from '../configurations';
import { SdPermissionService } from '../services';

@Injectable({ providedIn: 'root' })
export class SdPermissionGuard implements CanActivate, CanActivateChild {
  private readonly configuration: ISdPermissionConfiguration | ISdPermissionConfiguration[] = inject(SD_PERMISSION_CONFIGURATION);
  private readonly permissionService = inject(SdPermissionService);

  #getConfigurations = (): ISdPermissionConfiguration[] => {
    const config = this.configuration;
    if (!config) {
      return [];
    }
    return Array.isArray(config) ? config : [config];
  };

  canActivate = async (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    // Guard ở layer portal: preload toàn bộ permission theo tất cả key đã cấu hình
    await this.permissionService.loadAllPermissions().catch(console.error);
    return true;
  };

  canActivateChild = async (activatedRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const permission = activatedRoute.data['permission'];
    const permissionKey = activatedRoute.data?.['permissionKey'] as string | undefined;
    if (this.permissionService.hasPermission(permission, permissionKey)) {
      return true;
    }

    const configurations = this.#getConfigurations();
    const onForbiden = configurations
      .filter(config => config.key === permissionKey || (permissionKey !== undefined && config.key === undefined))
      .map(config => config.onForbiden)
      .find(val => !!val);
    onForbiden?.();
    return false;
  };
}
