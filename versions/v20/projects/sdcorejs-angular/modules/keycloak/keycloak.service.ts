import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js'; // Import trực tiếp SDK gốc của Keycloak
import { SdKeycloakTenantConfig } from './keycloak.configuration';

@Injectable({ providedIn: 'root' })
export class SdKeycloakService {
  public keycloak!: Keycloak;
  public config!: SdKeycloakTenantConfig;

  async init(config: SdKeycloakTenantConfig): Promise<boolean> {
    this.config = config;
    
    // 1. Khởi tạo instance
    this.keycloak = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    });

    // 2. Lắng nghe sự kiện hết hạn token để tự động làm mới ngầm
    this.keycloak.onTokenExpired = () => {
      this.keycloak.updateToken(30).catch(() => {
        console.warn('Không thể làm mới token. Yêu cầu đăng nhập lại.');
        this.keycloak.login();
      });
    };

    // 3. Thực thi quá trình boot Keycloak
    return this.keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-renew.html',
      checkLoginIframe: false, // Tắt check Iframe để chống lỗi vòng lặp
    });
  }

  // Tiện ích nhanh cho Dev sử dụng
  login() { return this.keycloak.login(); }
  logout() { return this.keycloak.logout({ redirectUri: window.location.origin }); }
  getToken() { return this.keycloak.token; }
  getIsAuthenticated() { return this.keycloak.authenticated; }
}