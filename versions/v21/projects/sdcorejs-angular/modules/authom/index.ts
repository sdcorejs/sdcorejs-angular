/**
 * Module `authom` â€” OAuth 2.0 + PKCE authentication client cho AuthOM (Auth0-based).
 *
 * CÃ¡ch dÃ¹ng (standalone):
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
 * YÃªu cáº§u setup thÃªm:
 * 1. Copy file `silent-authom.html` tá»« source module nÃ y vÃ o thÆ° má»¥c `public/` cá»§a app.
 * 2. App pháº£i cháº¡y trÃªn HTTPS (hoáº·c localhost) â€” Web Crypto API yÃªu cáº§u secure context.
 */
export * from './authom.configuration';
export * from './authom.service';
export * from './authom.interceptor';
export * from './authom.module';

