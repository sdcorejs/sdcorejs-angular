import { InjectionToken, Injectable, inject, signal } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { resolveMaybeAsync } from '@sdcorejs/utils/models';
import { ISdLayoutConfiguration, ISdSidebarConfiguration, SD_LAYOUT_CONFIGURATION, SdLayoutUserInfo } from '../configurations';

/**
 * Bật fallback demo của `SdLayoutService` khi KHÔNG provide `SD_LAYOUT_CONFIGURATION`.
 *
 * why: fallback cũ chạy ngầm sau mỗi `console.warn`, nên một app cấu hình thiếu vẫn ship được UI có
 * user "demo@example.com" đang đăng nhập cùng nút signout không làm gì — người dùng cuối tin là đã
 * đăng nhập thật. Giờ mặc định là throw; ai thực sự cần demo/playground phải khai báo ý định:
 *
 * ```ts
 * providers: [{ provide: SD_LAYOUT_DEMO_FALLBACK, useValue: true }]
 * ```
 *
 * Cờ nằm ở token riêng chứ không phải field của `ISdLayoutConfiguration`, vì nó phải đọc được ĐÚNG
 * lúc `SD_LAYOUT_CONFIGURATION` vắng mặt — khi đó không có object configuration nào để đọc field.
 */
export const SD_LAYOUT_DEMO_FALLBACK = new InjectionToken<boolean>('sd.layout.demo-fallback');

@Injectable({
  providedIn: 'root', // Có thể đổi thành 'any' hoặc khai báo trong mảng providers của LayoutModule tùy kiến trúc của bạn
})
export class SdLayoutService {
  // ==========================================
  // INJECT CONFIGURATIONS
  // ==========================================
  // WHY: optional=true để service tự phát hiện consumer thiếu config và báo lỗi rõ ràng,
  // thay vì để Angular ném NullInjectorError khó đọc từ một component sâu trong cây.
  #layoutConfiguration = inject<ISdLayoutConfiguration | null>(SD_LAYOUT_CONFIGURATION, { optional: true });
  #demoFallback = inject(SD_LAYOUT_DEMO_FALLBACK, { optional: true }) ?? false;
  #i18n = inject(I18nService);

  // ==========================================
  // SHARED SIGNALS (STATE)
  // ==========================================
  userInfo = signal<SdLayoutUserInfo | undefined>(undefined);
  sidebar = signal<ISdSidebarConfiguration | undefined>(undefined);

  /**
   * Route "về trang chủ" của consumer, lấy từ `ISdLayoutConfiguration.homeUrl`.
   * why: các trang lỗi (forbidden / not-found) cần một đích điều hướng thật thay vì reload chính nó.
   */
  readonly homeUrl = this.#layoutConfiguration?.homeUrl?.trim() || '/';

  constructor() {
    if (!this.#layoutConfiguration) {
      if (!this.#demoFallback) {
        // why: fail loudly. Im lặng degrade sang mock user là ship ra production một UI nói dối
        // rằng người dùng đã đăng nhập (email demo, signout no-op).
        throw new Error(
          // @i18n-ignore dev-facing error — không cần dịch
          '[SdLayoutService] SD_LAYOUT_CONFIGURATION chưa được provide. ' +
            'Provide token này (xem ISdLayoutConfiguration) để cấu hình user info / sidebar / signout. ' +
            'Nếu đang chạy demo/playground và CHỦ ĐỘNG muốn mock data, provide SD_LAYOUT_DEMO_FALLBACK = true.'
        );
      }

      // WHY: chỉ chạy khi consumer chủ động opt-in demo fallback.
      // @i18n-ignore dev-facing console.warn — không cần dịch
      console.warn(
        // @i18n-ignore
        '[SdLayoutService] SD_LAYOUT_CONFIGURATION chưa được inject — đang dùng mock data qua SD_LAYOUT_DEMO_FALLBACK. ' +
          // @i18n-ignore
          'Tuyệt đối không bật cờ này trên môi trường thật.'
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
