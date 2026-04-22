import { Injectable, inject, signal } from '@angular/core';
import { SdResolveMaybeAsync } from '@sdcorejs/angular/utilities/models';
import { ISdLayoutConfiguration, ISdSidebarConfiguration, SD_LAYOUT_CONFIGURATION, SdLayoutUserInfo } from '../configurations';

@Injectable({
  providedIn: 'root' // CÃ³ thá»ƒ Ä‘á»•i thÃ nh 'any' hoáº·c khai bÃ¡o trong máº£ng providers cá»§a LayoutModule tÃ¹y kiáº¿n trÃºc cá»§a báº¡n
})
export class SdLayoutService {
  // ==========================================
  // INJECT CONFIGURATIONS
  // ==========================================
  #layoutConfiguration = inject<ISdLayoutConfiguration>(SD_LAYOUT_CONFIGURATION);

  // ==========================================
  // SHARED SIGNALS (STATE)
  // ==========================================
  userInfo = signal<SdLayoutUserInfo | undefined>(undefined);
  sidebar = signal<ISdSidebarConfiguration | undefined>(undefined);

  constructor() {
    this.#initUserInfo();
    this.#initSidebar();
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================
  #initUserInfo(): void {
    const userInfoConfig = this.#layoutConfiguration.userInfo;
    if (typeof userInfoConfig === 'function') {
      SdResolveMaybeAsync(userInfoConfig()).then(userInfo => this.userInfo.set(userInfo));
    } else {
      this.userInfo.set(userInfoConfig);
    }
  }

  #initSidebar(): void {
    const sidebarConfig = this.#layoutConfiguration.sidebar;
    if (typeof sidebarConfig === 'function') {
      SdResolveMaybeAsync(sidebarConfig()).then(config => this.sidebar.set(config));
    } else {
      this.sidebar.set(sidebarConfig);
    }
  }
}
