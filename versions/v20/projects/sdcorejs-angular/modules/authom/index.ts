/**
 * Module `authom` — OAuth 2.0 + PKCE authentication client cho AuthOM (Auth0-based).
 *
 * Cách dùng (standalone):
 * ```ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { provideSdAuthOm, SdAuthOmInterceptor } from '@sdcorejs/angular/modules/authom';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(withInterceptors([SdAuthOmInterceptor])),
 *     provideSdAuthOm({
 *       useFactory: () => ({
 *         loadTenantConfig: () => Promise.resolve({
 *           domain: 'login.example.com',
 *           clientId: 'YOUR_CLIENT_ID',
 *           audience: 'https://api.example.com',
 *           organization: 'org_xxx',
 *           scope: 'openid profile email offline_access',
 *           secureRoutes: ['https://api.example.com/*'],
 *         }),
 *       }),
 *     }),
 *   ],
 * };
 * ```
 *
 * Yêu cầu setup thêm:
 * 1. Copy file `silent-authom.html` từ source module này vào thư mục `public/` của app.
 * 2. App phải chạy trên HTTPS (hoặc localhost) — Web Crypto API yêu cầu secure context.
 */
export * from './authom.configuration';
export * from './authom.service';
export * from './authom.interceptor';
export * from './authom.module';
