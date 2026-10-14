import { Injectable, Injector, inject } from '@angular/core';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { sdGenericPermissionCode } from '../core';
import type { SdGenericAction } from '../models';
import { SD_GENERIC_SCOPE } from '../registry';

/**
 * Permission checks of the generic screens (INV-005). Codes come from `sdGenericPermissionCode`; the default
 * permission key of the portal is used (D-029). These checks hide UI and block routes only: the backend behind
 * the adapter must enforce permissions again.
 */
@Injectable()
export class SdGenericPermissionService {
  readonly #scope = inject(SD_GENERIC_SCOPE);
  // why: SdPermissionService requires SD_PERMISSION_CONFIGURATION; with `permission: false` a portal may have none,
  // so the service is only resolved when a check really runs.
  readonly #injector = inject(Injector);
  #loading: Promise<unknown> | undefined;

  get enabled(): boolean {
    return this.#scope.permissionEnabled();
  }

  can(module: string, entity: string, action: SdGenericAction): boolean {
    return !this.enabled || this.#service().hasPermission(sdGenericPermissionCode(module, entity, action));
  }

  /** A custom action without `permission` is allowed. */
  canCode(code: string | undefined): boolean {
    return !this.enabled || !code || this.#service().hasPermission(code);
  }

  /**
   * Loads the permission list before a route check; a failed load denies instead of throwing. Only a load in
   * flight is shared: SdPermissionService skips keys it already loaded, and its `reset()` on sign-out must make
   * the next check load the permissions of the new user.
   */
  ensureLoaded(): Promise<unknown> {
    if (!this.enabled) return Promise.resolve();
    this.#loading ??= this.#service()
      .loadPermissions()
      .catch(error => console.error(error))
      .finally(() => (this.#loading = undefined));
    return this.#loading;
  }

  #service(): SdPermissionService {
    return this.#injector.get(SdPermissionService);
  }
}
