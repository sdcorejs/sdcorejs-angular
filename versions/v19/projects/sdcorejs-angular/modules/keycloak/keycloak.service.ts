import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js'; // Import trực tiếp SDK gốc của Keycloak
import { SdKeycloakTenantConfig } from './keycloak.configuration';

@Injectable({ providedIn: 'root' })
export class SdKeycloakService {
  public keycloak!: Keycloak;
  public config!: SdKeycloakTenantConfig;

  async init(config: SdKeycloakTenantConfig): Promise<boolean> {
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
