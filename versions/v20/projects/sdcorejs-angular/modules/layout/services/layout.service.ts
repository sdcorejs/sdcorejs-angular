import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdResolveMaybeAsync } from '@sdcorejs/angular/utilities/models';
import { ISdLayoutConfiguration, ISdSidebarConfiguration, SD_LAYOUT_CONFIGURATION, SdLayoutUserInfo } from '../configurations';

@Injectable({
  providedIn: 'root' // CÃ³ thá»ƒ Ä‘á»•i thÃ nh 'any' hoáº·c khai bÃ¡o trong máº£ng providers cá»§a LayoutModule tÃ¹y kiáº¿n trÃºc cá»§a báº¡n
})
export class SdLayoutService {
  // ==========================================
  // INJECT CONFIGURATIONS
  // ==========================================
  // WHY: optional=true cho phÃ©p layout module cháº¡y khÃ´ng cáº§n SD_LAYOUT_CONFIGURATION
  // (use case demo / khá»Ÿi táº¡o nhanh). Khi token khÃ´ng cÃ³ â†’ fallback mock data trong constructor.
  #layoutConfiguration = inject<ISdLayoutConfiguration | null>(SD_LAYOUT_CONFIGURATION, { optional: true });
  #i18n = inject(I18nService);

  // ==========================================
  // SHARED SIGNALS (STATE)
  // ==========================================
  userInfo = signal<SdLayoutUserInfo | undefined>(undefined);
  sidebar = signal<ISdSidebarConfiguration | undefined>(undefined);

  constructor() {
    if (!this.#layoutConfiguration) {
      // WHY: cho phÃ©p layout module cháº¡y khÃ´ng cáº§n config (use case demo / khá»Ÿi táº¡o nhanh).
      // Fallback dÃ¹ng mock data Ä‘Ã£ i18n hÃ³a; tháº­t táº¿ khi tÃ­ch há»£p portal cáº§n provide SD_LAYOUT_CONFIGURATION.
      // @i18n-ignore dev-facing console.warn â€” khÃ´ng cáº§n dá»‹ch
      console.warn(
        // @i18n-ignore
        '[SdLayoutService] SD_LAYOUT_CONFIGURATION chÆ°a Ä‘Æ°á»£c inject â€” Ä‘ang dÃ¹ng mock data. ' +
        // @i18n-ignore
        'Provide token nÃ y (xem ISdLayoutConfiguration) Ä‘á»ƒ custom user info / sidebar / signout.'
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
      SdResolveMaybeAsync(userInfoConfig()).then(userInfo => this.userInfo.set(userInfo));
    } else {
      this.userInfo.set(userInfoConfig);
    }
  }

  #initSidebar(): void {
    const sidebarConfig = this.#layoutConfiguration!.sidebar;
    if (typeof sidebarConfig === 'function') {
      SdResolveMaybeAsync(sidebarConfig()).then(config => this.sidebar.set(config));
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

