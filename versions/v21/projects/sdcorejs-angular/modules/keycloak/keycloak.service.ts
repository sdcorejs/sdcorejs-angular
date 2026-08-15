import { Injectable, isDevMode } from '@angular/core';
import Keycloak from 'keycloak-js'; // Import trực tiếp SDK gốc của Keycloak
import { SdKeycloakTenantConfig } from './keycloak.configuration';

@Injectable({ providedIn: 'root' })
export class SdKeycloakService {
  public keycloak!: Keycloak;
  public config!: SdKeycloakTenantConfig;

  async init(config: SdKeycloakTenantConfig): Promise<boolean> {
    this.#assertValidConfig(config);
    this.config = config;

    // Đường dẫn 2 file tĩnh trong public/ (consumer cấu hình qua silentRenewUrl / authErrorUrl).
    const silentRenewHref = this.toPublicHtmlUrl(config.silentRenewUrl || 'silent-renew');
    const authErrorHref = this.toPublicHtmlUrl(config.authErrorUrl || 'auth-keycloak-error');

    // Nếu đang đứng ở chính trang lỗi → KHÔNG init lại (chống vòng lặp redirect khi init liên tục lỗi).
    if (window.location.pathname === new URL(authErrorHref).pathname) {
      return false;
    }

    // 1. Khởi tạo instance
    this.keycloak = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    });

    // 2. Lắng nghe sự kiện hết hạn token để tự động làm mới ngầm
    this.keycloak.onTokenExpired = () => {
      this.keycloak.updateToken(30).catch(() => {
        // @i18n-ignore — dev console warning
        console.warn('Token refresh failed. Re-authentication required.');
        this.keycloak.login();
      });
    };

    // 3. Thực thi quá trình boot Keycloak; nếu lỗi → điều hướng tới trang lỗi tĩnh trong public/.
    try {
      return await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: silentRenewHref,
        checkLoginIframe: false, // Tắt check Iframe để chống lỗi vòng lặp
      });
    } catch (error) {
      // @i18n-ignore — dev console error
      console.error('Keycloak init failed:', error);
      window.location.href = authErrorHref;
      return false;
    }
  }

  /**
   * why: `url` / `realm` / `clientId` trước đây được truyền thẳng vào `new Keycloak(...)` mà không
   * kiểm tra. Thiếu hoặc rỗng thì lỗi chỉ lộ ra sau này dưới dạng một lỗi khởi tạo khó truy vết từ
   * bên trong `keycloak-js`. Ném sớm với tên field cụ thể.
   *
   * `secureRoutes` thì cảnh báo chứ không ném: khi thiếu, `SdKeycloakInterceptor` không đính token
   * vào BẤT KỲ request nào, nên consumer nhận 401 hàng loạt mà không có manh mối nào. Đây gần như
   * luôn là cấu hình sót, nhưng vẫn là trạng thái hợp lệ (app chỉ gọi API công khai).
   */
  #assertValidConfig(config: SdKeycloakTenantConfig | undefined | null): void {
    const missing = (['url', 'realm', 'clientId'] as const).filter(field => !config?.[field]?.trim?.());
    if (!config || missing.length) {
      // @i18n-ignore dev-facing config error — không cần dịch
      throw new Error(`[sd-keycloak] Thiếu cấu hình bắt buộc: ${missing.join(', ') || 'toàn bộ SdKeycloakTenantConfig'}.`);
    }
    if (isDevMode() && !config.secureRoutes?.length) {
      console.warn(
        // @i18n-ignore dev-facing console.warn — không cần dịch
        '[sd-keycloak] `secureRoutes` rỗng — SdKeycloakInterceptor sẽ KHÔNG đính access token vào bất kỳ request nào. ' +
          // @i18n-ignore
          "Khai báo path cùng origin (vd ['/api/v1']) hoặc origin tuyệt đối (vd ['https://api.example.com/v1'])."
      );
    }
  }

  /**
   * Chuẩn hoá basename file tĩnh trong public/ thành URL tuyệt đối.
   * `'silent-renew'` | `'/silent-renew'` | `'silent-renew.html'` → `${origin}/silent-renew.html`.
   */
  private toPublicHtmlUrl(name: string): string {
    const base = name
      .trim()
      .replace(/^\/+/, '')
      .replace(/\.html$/i, '');
    return `${window.location.origin}/${base}.html`;
  }

  // Tiện ích nhanh cho Dev sử dụng
  login() {
    return this.keycloak.login();
  }
  logout() {
    return this.keycloak.logout({ redirectUri: window.location.origin });
  }
  getToken() {
    return this.keycloak.token;
  }
  getIsAuthenticated() {
    return this.keycloak.authenticated;
  }
}
