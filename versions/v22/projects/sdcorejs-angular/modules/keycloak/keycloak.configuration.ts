import { InjectionToken } from '@angular/core';

export interface SdKeycloakTenantConfig {
  url: string;
  realm: string;
  clientId: string;
  secureRoutes?: string[]; // Các API cần đính token (vd: ['/api/v1'])

  /**
   * Basename (KHÔNG kèm đuôi `.html`) của file Keycloak **silent SSO redirect** mà consumer
   * BẮT BUỘC đặt trong thư mục `public/`. Mặc định `'silent-renew'`.
   *
   * Service sẽ truyền `${origin}/<silentRenewUrl>.html` vào `silentCheckSsoRedirectUri`. Với giá trị
   * mặc định, Keycloak gọi `${origin}/silent-renew.html` (giống hành vi cũ — không phá vỡ project hiện có).
   *
   * Consumer cần tạo file tĩnh này (nội dung mẫu ở `modules/keycloak/htmls/silent-renew.html`); nếu THIẾU,
   * silent `check-sso` thất bại và `init()` trả về `false` không mong muốn (user bị coi là chưa đăng nhập).
   * Cho phép truyền kèm `/` đầu hoặc đuôi `.html` (tự chuẩn hoá), hoặc đặt sâu hơn:
   * `'assets/silent-renew'` → `${origin}/assets/silent-renew.html`.
   */
  silentRenewUrl?: string;

  /**
   * Basename (KHÔNG kèm đuôi `.html`) của **trang lỗi tĩnh** trong `public/`, dùng làm đích redirect khi
   * `keycloak.init()` NÉM LỖI (Keycloak sập / mạng lỗi / cấu hình realm sai). Mặc định `'auth-keycloak-error'`.
   *
   * Khi init thất bại, app điều hướng full-page tới `${origin}/<authErrorUrl>.html`. Vì là file tĩnh nên
   * trang lỗi vẫn hiển thị kể cả khi bundle Angular chưa khởi tạo được. Service cũng tự bỏ qua `init()` nếu
   * đang đứng sẵn ở trang lỗi này (chống vòng lặp redirect).
   *
   * Consumer nên tạo file (nội dung mẫu ở `modules/keycloak/htmls/auth-keycloak-error.html`) và viết lại
   * branding/nội dung. Nếu THIẾU, redirect rơi vào trang 404 của host. Chuẩn hoá giá trị giống `silentRenewUrl`.
   */
  authErrorUrl?: string;
}

export interface ISdKeycloakConfiguration {
  loadTenantConfig: () => Promise<SdKeycloakTenantConfig>;
}

export const SD_KEYCLOAK_CONFIGURATION = new InjectionToken<ISdKeycloakConfiguration>('sd-keycloak.configuration');
