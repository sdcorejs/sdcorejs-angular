import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { resolveMaybeAsync } from '@sdcorejs/utils/models';
import { ISdLayoutConfiguration, ISdSidebarConfiguration, SD_LAYOUT_CONFIGURATION, SdLayoutUserInfo } from '../configurations';

@Injectable({
  providedIn: 'root', // Có thể đổi thành 'any' hoặc khai báo trong mảng providers của LayoutModule tùy kiến trúc của bạn
})
export class SdLayoutService {
  // ==========================================
  // INJECT CONFIGURATIONS
  // ==========================================
  // WHY: optional=true cho phép layout module chạy không cần SD_LAYOUT_CONFIGURATION
  // (use case demo / khởi tạo nhanh). Khi token không có → fallback mock data trong constructor.
  #layoutConfiguration = inject<ISdLayoutConfiguration | null>(SD_LAYOUT_CONFIGURATION, { optional: true });
  #i18n = inject(I18nService);

  // ==========================================
  // SHARED SIGNALS (STATE)
  // ==========================================
  userInfo = signal<SdLayoutUserInfo | undefined>(undefined);
  sidebar = signal<ISdSidebarConfiguration | undefined>(undefined);

  constructor() {
    if (!this.#layoutConfiguration) {
      // WHY: cho phép layout module chạy không cần config (use case demo / khởi tạo nhanh).
      // Fallback dùng mock data đã i18n hóa; thật tế khi tích hợp portal cần provide SD_LAYOUT_CONFIGURATION.
      // @i18n-ignore dev-facing console.warn — không cần dịch
      console.warn(
        // @i18n-ignore
        '[SdLayoutService] SD_LAYOUT_CONFIGURATION chưa được inject — đang dùng mock data. ' +
          // @i18n-ignore
          'Provide token này (xem ISdLayoutConfiguration) để custom user info / sidebar / signout.'
      );
      this.userInfo.set(this.#mockUserInfo());
      this.sidebar.set(this.#mockSidebar());
      return;
    }
    this.#initUserInfo();
    this.#initSidebar();
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================
  #initUserInfo(): void {
    const userInfoConfig = this.#layoutConfiguration!.userInfo;
    if (typeof userInfoConfig === 'function') {
      resolveMaybeAsync(userInfoConfig()).then(userInfo => this.userInfo.set(userInfo));
    } else {
      this.userInfo.set(userInfoConfig);
    }
  }

  #initSidebar(): void {
    const sidebarConfig = this.#layoutConfiguration!.sidebar;
    if (typeof sidebarConfig === 'function') {
      resolveMaybeAsync(sidebarConfig()).then(config => this.sidebar.set(config));
    } else {
      this.sidebar.set(sidebarConfig);
    }
  }

  #mockUserInfo(): SdLayoutUserInfo {
    return {
      fullName: this.#i18n.t('core.module.layout.mock.user.full-name'),
      email: 'demo@example.com',
      username: 'demo',
    };
  }

  #mockSidebar(): ISdSidebarConfiguration {
    return {
      version: 1,
      defaultTitle: 'Back Office',
    };
  }
}
