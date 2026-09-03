import { inject, Injectable, isDevMode } from '@angular/core';
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

  /** Gọi `onForbiden` của config khớp key (hoặc config portal) rồi chặn điều hướng. */
  #deny = (permissionKey?: string): false => {
    const configurations = this.#getConfigurations();
    const onForbiden = configurations
      .filter(config => config.key === permissionKey || (permissionKey !== undefined && config.key === undefined))
      .map(config => config.onForbiden)
      .find(val => !!val);
    onForbiden?.();
    return false;
  };

  canActivate = async (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    // Guard ở layer portal: preload toàn bộ permission theo tất cả key đã cấu hình
    await this.permissionService.loadAllPermissions().catch(console.error);
    return true;
  };

  canActivateChild = async (activatedRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const data = activatedRoute.data ?? {};
    const permissionKey = data['permissionKey'] as string | undefined;

    // why: `canActivateChild` chạy cho MỌI route con, nên một route quên khai báo `data.permission`
    // hoặc gõ sai key (`permision`, `permissions`) trước đây rơi thẳng vào nhánh "rỗng ⇒ cho qua" của
    // `hasPermission` và được cấp quyền âm thầm. Không khai báo giờ = TỪ CHỐI; route thật sự công khai
    // phải nói ra bằng `data: { permission: SD_PERMISSION_PUBLIC }`.
    if (!Object.prototype.hasOwnProperty.call(data, 'permission')) {
      if (isDevMode()) {
        console.error(
          `[Permission] Access denied for "${state?.url ?? ''}": route data has no "permission" entry. ` +
            'Declare data.permission with a permission code, or SD_PERMISSION_PUBLIC if the route is intentionally public. ' +
            'Check for a typo in the data key.'
        );
      }
      // why: KHÔNG gọi `onForbiden()` ở nhánh này. `onForbiden` thường điều hướng sang trang forbidden;
      // nếu chính trang đó lại quên khai báo `data.permission` thì nó cũng bị từ chối và gọi tiếp
      // `onForbiden` → vòng lặp redirect vô tận, treo app. Thiếu khai báo là LỖI CẤU HÌNH, không phải
      // "hết quyền": chặn im lặng + log dev là đủ, và một cấu hình sai không bao giờ tự đệ quy được.
      return false;
    }

    if (this.permissionService.hasPermission(data['permission'], permissionKey)) {
      return true;
    }

    return this.#deny(permissionKey);
  };
}
