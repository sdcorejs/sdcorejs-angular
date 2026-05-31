# Spec — Module `authom` cho `sd-angular`

**Ngày:** 2026-05-05
**Trạng thái:** Approved (chờ implementation plan)
**Tác giả:** nghiatt15

## 1. Mục tiêu

Xây dựng module `authom` trong thư viện `sd-angular`, mirror cấu trúc module `keycloak` hiện có, để consumer có thể tích hợp xác thực với AuthOM (server OAuth 2.0 dựa trên Auth0 cũ) chỉ bằng vài dòng provider trong `app.config.ts`.

Yêu cầu cốt lõi:
- Authorization Code Flow + PKCE (gọi thẳng AuthOM, không cần BE proxy).
- Silent refresh qua iframe ẩn + session cookie (`prompt=none`).
- Auto-refresh token trước khi hết hạn (dựa vào JWT `exp`).
- Token chỉ lưu RAM (không persist localStorage / sessionStorage).
- Hỗ trợ cả standalone (`provideSdAuthOm`) và NgModule (`SdAuthOmModule.forRoot`) — nhất quán với module keycloak.

## 2. Phạm vi

**In scope:**
- Login redirect flow + handle callback.
- Silent refresh dùng iframe + file HTML tĩnh `silent-authom.html`.
- Auto-refresh timer dựa trên JWT `exp`.
- HTTP interceptor đính `Authorization: Bearer` cho URL match `secureRoutes` (glob pattern với `*`).
- Logout redirect tới AuthOM `/v2/logout`.
- Hỗ trợ tham số AuthOM-specific: `audience`, `organization`, `scope`.

**Out of scope (YAGNI, có thể thêm sau):**
- Refresh tokens (`useRefreshTokens` của Auth0 SDK) — module chỉ dùng silent iframe.
- `cacheLocation: 'localstorage'` — module luôn lưu RAM.
- BE proxy `tokenEndpoint` — bỏ, dùng PKCE để gọi thẳng `/oauth/token`.
- Cross-tab sync token.

## 3. Cấu trúc file

```
projects/sdcorejs-angular/modules/authom/
├── index.ts                       # re-export public API
├── ng-package.json                # entry point cho ng-packagr
├── authom.configuration.ts        # InjectionToken + interface
├── authom.service.ts              # core service
├── authom.interceptor.ts          # HttpInterceptorFn
├── authom.module.ts               # provideSdAuthOm + SdAuthOmModule.forRoot
└── silent-authom.html             # template HTML tĩnh cho iframe
```

`silent-authom.html` được ship như một file tĩnh trong source — consumer copy thủ công vào `public/` (Angular 19) hoặc `src/` + thêm vào `angular.json` `assets`. Document trong README/comment.

Bổ sung 1 helper vào file đã có: thêm `sha256` vào `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts` (export qua `StringUtilities`). Quyết định cuối cùng: vẫn dùng `crypto.subtle.digest` và `crypto.getRandomValues` (Web Crypto API) — không viết SHA-256 pure JS nữa.

## 4. Configuration

### 4.1 `SdAuthOmTenantConfig`

```ts
export interface SdAuthOmTenantConfig {
  // Bắt buộc
  domain: string;                    // vd: 'login-qc.oneshop.dev'
  clientId: string;

  // Tuỳ chọn — params cho /authorize
  redirectUri?: string;              // default: window.location.origin
  audience?: string;                 // API audience (cho JWT có aud)
  organization?: string;             // org ID
  scope?: string;                    // default: 'openid profile email'

  // Tuỳ chọn — interceptor
  secureRoutes?: string[];           // glob patterns, vd ['https://api.example.com/*']

  // Tuỳ chọn — silent refresh
  silentRefreshRedirectUri?: string; // default: `${origin}/silent-authom.html`
  refreshThresholdSeconds?: number;  // default: 30 (refresh trước khi hết hạn)
  authorizeTimeoutInSeconds?: number;// default: 5 (timeout iframe)
}
```

### 4.2 InjectionToken

```ts
export interface ISdAuthOmConfiguration {
  loadTenantConfig: () => Promise<SdAuthOmTenantConfig>;
}

export const SD_AUTHOM_CONFIGURATION =
  new InjectionToken<ISdAuthOmConfiguration>('sd-authom.configuration');
```

Hỗ trợ async load (multi-tenant fetch theo subdomain), giống pattern keycloak.

## 5. Service contract — `SdAuthOmService`

```ts
@Injectable({ providedIn: 'root' })
export class SdAuthOmService {
  // State (signals)
  readonly accessToken = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);
  readonly idTokenClaims = signal<Record<string, unknown> | null>(null);

  config!: SdAuthOmTenantConfig;

  // Lifecycle
  init(config: SdAuthOmTenantConfig): Promise<boolean>;

  // User actions
  login(options?: { returnTo?: string }): void;
  logout(options?: { returnTo?: string }): void;
  silentRefresh(): Promise<boolean>;

  // Helpers
  handleCallback(): Promise<boolean>;
  getAccessToken(): string | null;
}
```

### 5.1 `init(config)` — chạy bởi `APP_INITIALIZER`

1. Guard `isPlatformBrowser(PLATFORM_ID)` — nếu không phải browser, return `false`.
2. Lưu config vào `this.config`.
3. Nếu `window.location.search` chứa `?code=` → gọi `handleCallback()`.
4. Nếu chưa có token sau callback → gọi `silentRefresh()` (case mở app khi đã có session ở AuthOM).
5. Trả về `true` nếu cuối cùng có `accessToken`, `false` nếu không.

### 5.2 `login(options?)`

1. Generate `state` = `crypto.randomUUID()`.
2. Generate `code_verifier` = base64url của `crypto.getRandomValues(new Uint8Array(32))`.
3. Generate `code_challenge` = base64url của `await crypto.subtle.digest('SHA-256', encoder.encode(verifier))`.
4. Lưu `sessionStorage`: `authom_state`, `authom_code_verifier`, `authom_return_to` (default = `pathname + search`).
5. Build URL `https://{domain}/authorize` với query:
   - `response_type=code`
   - `client_id={clientId}`
   - `redirect_uri={redirectUri || origin}`
   - `state={state}`
   - `code_challenge={challenge}`
   - `code_challenge_method=S256`
   - `scope={scope || 'openid profile email'}`
   - `audience={audience}` (nếu có)
   - `organization={organization}` (nếu có)
6. `window.location.href = url`.

### 5.3 `logout(options?)`

1. Clear `accessToken`, `idTokenClaims`, refresh timer.
2. Build `https://{domain}/v2/logout?client_id={clientId}&returnTo={returnTo || origin}`.
3. `window.location.href = url`.

### 5.4 `silentRefresh()` — Promise<boolean>

State + code_verifier cho silent refresh được giữ trong **closure local variables** (không dùng sessionStorage) — tránh race với `login()` (Standard flow). File `silent-authom.html` echo `state` về parent qua postMessage để parent verify.

1. Generate local `state`, `code_verifier`, `code_challenge` (lưu trong biến closure).
2. Tạo iframe ẩn (`display: none`).
3. Build URL `https://{domain}/authorize` cùng các params như `login()` nhưng:
   - `redirect_uri = silentRefreshRedirectUri || ${origin}/silent-authom.html`
   - thêm `prompt=none`
   - **không** ghi sessionStorage
4. `iframe.src = authorizeUrl`, append vào body.
5. Listen `message` event:
   - Verify `event.origin === window.location.origin`.
   - Nếu `event.data.type === 'AUTHOM_SILENT_SUCCESS'` và `event.data.state === local state` → exchange `event.data.code` với local `code_verifier` → set token + schedule refresh → resolve `true`.
   - Nếu `event.data.type === 'AUTHOM_SILENT_ERROR'` hoặc state mismatch → resolve `false`.
6. Timeout sau `authorizeTimeoutInSeconds * 1000` ms → resolve `false`.
7. Cleanup: remove iframe, removeEventListener.

### 5.5 `handleCallback()` — Promise<boolean>

`handleCallback` chỉ chạy cho Standard Login Flow (không phải silent refresh — silent refresh có flow riêng trong section 5.4 qua postMessage).

1. Đọc `code` + `state` từ `URLSearchParams(window.location.search)`.
2. Verify state khớp `sessionStorage.authom_state` → mismatch → cleanup sessionStorage, xóa query string, return `false`.
3. Lấy `code_verifier` từ sessionStorage. Nếu không có → return `false`.
4. POST tới `https://{domain}/oauth/token`:
   ```
   grant_type=authorization_code
   code={code}
   code_verifier={verifier}
   redirect_uri={redirectUri}
   client_id={clientId}
   ```
5. Cleanup sessionStorage: xóa `authom_state`, `authom_code_verifier` (giữ `authom_return_to` đến bước 7).
6. Nếu exchange fail → return `false`. Nếu thành công: set `accessToken`, decode `id_token` → set `idTokenClaims`, schedule auto-refresh.
7. Lấy `returnTo` từ `sessionStorage.authom_return_to` (nếu có) → `history.replaceState({}, '', returnTo)`, xóa khỏi sessionStorage. Nếu không có → `history.replaceState({}, '', pathname)` (chỉ xóa query string).
8. Return `true`.

**Lưu ý timing**: `handleCallback` chạy bên trong `init()`, tức là **trước** khi Angular Router thực hiện initial navigation. Nên việc gọi `history.replaceState` ở bước 7 trước khi `init()` resolve giúp Router parse URL đã sạch query.

### 5.6 Auto-refresh timer (private)

- Gọi sau mỗi lần exchange/refresh thành công.
- Decode JWT bằng `atob(token.split('.')[1])` → lấy `exp` (seconds since epoch).
- `delay = max(0, (exp - now/1000 - refreshThresholdSeconds) * 1000)`.
- `setTimeout(() => silentRefresh(), delay)`.
- Lưu timer ID, clear khi logout / new refresh / silent fail.
- Nếu JWT không có `exp` → log warning, skip auto-refresh.

## 6. Interceptor — `SdAuthOmInterceptor`

```ts
export const SdAuthOmInterceptor: HttpInterceptorFn = (req, next) => {
  const authom = inject(SdAuthOmService);
  const token = authom.getAccessToken();
  const config = authom.config;

  if (!token || !config) return next(req);

  const isSecure = config.secureRoutes?.some(pattern => matchGlob(pattern, req.url));
  if (!isSecure) return next(req);

  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
  return next(authReq);
};
```

**`matchGlob(pattern, url)`** — helper nội bộ, hỗ trợ ký tự `*`:
- Convert pattern thành RegExp: escape các ký tự regex, replace `\*` thành `.*`.
- Test url khớp regex.

Khác biệt so với keycloak interceptor:
- Glob match thay vì `includes()` (vì config Auth0 hiện tại dùng wildcard `*`).
- Không có logic `updateToken(30)` async — auto-refresh đã chạy timer riêng, token luôn fresh.

## 7. `silent-authom.html`

```html
<!DOCTYPE html>
<html>
<head><title>AuthOM Silent Refresh</title></head>
<body>
<script>
  (function () {
    if (window.parent === window) return;

    var params = new URLSearchParams(window.location.search);
    var code = params.get('code');
    var state = params.get('state');
    var error = params.get('error');

    window.parent.postMessage(
      code
        ? { type: 'AUTHOM_SILENT_SUCCESS', code: code, state: state }
        : { type: 'AUTHOM_SILENT_ERROR', error: error || 'no_code' },
      window.location.origin
    );
  })();
</script>
</body>
</html>
```

Nguyên tắc:
- File tĩnh < 1KB, không bootstrap Angular trong iframe → tránh load nguyên bundle (>1MB).
- `targetOrigin = window.location.origin` (không dùng `'*'`) → tránh leak code ra origin khác.
- Check `window.parent === window` → tránh chạy nhầm khi user mở file trực tiếp.

## 8. Module providers

### 8.1 `provideSdAuthOm()` — standalone

```ts
export function provideSdAuthOm(options: {
  useClass?: Type<ISdAuthOmConfiguration>;
  useFactory?: (...args: any[]) => ISdAuthOmConfiguration;
  deps?: any[];
}): EnvironmentProviders {
  const providers: Array<Provider | EnvironmentProviders> = [SdAuthOmService];

  if (options.useFactory) {
    providers.push({ provide: SD_AUTHOM_CONFIGURATION, useFactory: options.useFactory, deps: options.deps || [] });
  } else if (options.useClass) {
    providers.push({ provide: SD_AUTHOM_CONFIGURATION, useClass: options.useClass });
  }

  providers.push(
    provideAppInitializer(() => {
      const configLoader = inject(SD_AUTHOM_CONFIGURATION);
      const authom = inject(SdAuthOmService);
      return configLoader.loadTenantConfig().then((config) => authom.init(config));
    })
  );

  return makeEnvironmentProviders(providers);
}
```

### 8.2 `SdAuthOmModule.forRoot()` — NgModule legacy

Tương tự keycloak.module.ts, dùng `APP_INITIALIZER` thay vì `provideAppInitializer`.

### 8.3 Wire interceptor (consumer self-service)

Module **không** auto-provide interceptor — consumer tự thêm vào `provideHttpClient`:

```ts
provideHttpClient(withInterceptors([SdAuthOmInterceptor])),
provideSdAuthOm({ useFactory: () => ({ loadTenantConfig: ... }) }),
```

## 9. StringUtilities — bổ sung

Thêm 1 hàm vào `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts`:

```ts
const sha256 = async (input: string): Promise<string> => {
  const buffer = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); // base64url
};
```

Export qua `StringUtilities`. Service `authom.service.ts` import và dùng.

## 10. Edge cases

| # | Scenario | Behavior |
|---|----------|----------|
| 1 | SSR / non-browser | `init()` return `false` ngay; mọi method skip. |
| 2 | `crypto.subtle` unavailable (HTTP, không phải HTTPS / localhost) | `login()` throw error rõ ràng — document trong README. |
| 3 | State mismatch | `handleCallback` return `false`, không exchange code. |
| 4 | Multi-tab race (tab B copy URL có `?code=`) | Tab B exchange fail (code đã dùng) → return `false` → app tự xử lý. |
| 5 | Silent refresh timeout | Resolve `false`, không clear token cũ (vẫn dùng đến khi expire). |
| 6 | Silent refresh nhận error message | Resolve `false`, clear token, clear timer. |
| 7 | JWT không có `exp` (opaque token) | Log warning, skip auto-refresh, token vẫn dùng được. |
| 8 | Logout | Clear token + claims + timer **trước** khi redirect tới `/v2/logout`. |
| 9 | Network fail khi exchange | Return `false`, không retry. App tự xử lý. |
| 10 | URL có `?code=` còn sót khi Router parse | `replaceState` xóa query string **trước** khi `init()` resolve. |

## 11. Public API export (`index.ts`)

```ts
export * from './authom.configuration';
export * from './authom.service';
export * from './authom.interceptor';
export * from './authom.module';
```

## 12. Cách dùng (ví dụ standalone)

```ts
// app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideSdAuthOm, SdAuthOmInterceptor } from '@onemount/sd-angular/authom';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([SdAuthOmInterceptor])),
    provideSdAuthOm({
      useFactory: () => ({
        loadTenantConfig: () => Promise.resolve({
          domain: 'login-qc.oneshop.dev',
          clientId: 'vbsflDUwVBvOxbqtHlRrjZgoiIgpeSBr',
          audience: 'http://api-qc.int.onemount.dev/auth-om/api/v1/b2b-qc',
          organization: 'org_onehub',
          scope: 'openid profile email offline_access',
          secureRoutes: [
            'https://api-clms-qc.oneshop.dev/*',
            'https://api-mdm.oneshop.dev/*',
          ],
        }),
      }),
    }),
  ],
};
```

## 13. Security notes

- `code_verifier` 32 bytes ngẫu nhiên qua `crypto.getRandomValues` → đủ entropy cho PKCE.
- `state` qua `crypto.randomUUID` → đủ unique chống CSRF.
- `targetOrigin` của `postMessage` luôn = `window.location.origin`, không bao giờ `*`.
- Token chỉ lưu RAM, mất khi reload — silent refresh sẽ lấy lại nếu session AuthOM còn hợp lệ.
- `crypto.subtle` chỉ hoạt động trong secure context (HTTPS / localhost).
