# Spec â€” Module `authom` cho `sd-angular`

**NgÃ y:** 2026-05-05
**Tráº¡ng thÃ¡i:** Approved (chá» implementation plan)
**TÃ¡c giáº£:** nghiatt15

## 1. Má»¥c tiÃªu

XÃ¢y dá»±ng module `authom` trong thÆ° viá»‡n `sd-angular`, mirror cáº¥u trÃºc module `keycloak` hiá»‡n cÃ³, Ä‘á»ƒ consumer cÃ³ thá»ƒ tÃ­ch há»£p xÃ¡c thá»±c vá»›i AuthOM (server OAuth 2.0 dá»±a trÃªn Auth0 cÅ©) chá»‰ báº±ng vÃ i dÃ²ng provider trong `app.config.ts`.

YÃªu cáº§u cá»‘t lÃµi:
- Authorization Code Flow + PKCE (gá»i tháº³ng AuthOM, khÃ´ng cáº§n BE proxy).
- Silent refresh qua iframe áº©n + session cookie (`prompt=none`).
- Auto-refresh token trÆ°á»›c khi háº¿t háº¡n (dá»±a vÃ o JWT `exp`).
- Token chá»‰ lÆ°u RAM (khÃ´ng persist localStorage / sessionStorage).
- Há»— trá»£ cáº£ standalone (`provideSdAuthOm`) vÃ  NgModule (`SdAuthOmModule.forRoot`) â€” nháº¥t quÃ¡n vá»›i module keycloak.

## 2. Pháº¡m vi

**In scope:**
- Login redirect flow + handle callback.
- Silent refresh dÃ¹ng iframe + file HTML tÄ©nh `silent-authom.html`.
- Auto-refresh timer dá»±a trÃªn JWT `exp`.
- HTTP interceptor Ä‘Ã­nh `Authorization: Bearer` cho URL match `secureRoutes` (glob pattern vá»›i `*`).
- Logout redirect tá»›i AuthOM `/v2/logout`.
- Há»— trá»£ tham sá»‘ AuthOM-specific: `audience`, `organization`, `scope`.

**Out of scope (YAGNI, cÃ³ thá»ƒ thÃªm sau):**
- Refresh tokens (`useRefreshTokens` cá»§a Auth0 SDK) â€” module chá»‰ dÃ¹ng silent iframe.
- `cacheLocation: 'localstorage'` â€” module luÃ´n lÆ°u RAM.
- BE proxy `tokenEndpoint` â€” bá», dÃ¹ng PKCE Ä‘á»ƒ gá»i tháº³ng `/oauth/token`.
- Cross-tab sync token.

## 3. Cáº¥u trÃºc file

```
projects/sdcorejs-angular/modules/authom/
â”œâ”€â”€ index.ts                       # re-export public API
â”œâ”€â”€ ng-package.json                # entry point cho ng-packagr
â”œâ”€â”€ authom.configuration.ts        # InjectionToken + interface
â”œâ”€â”€ authom.service.ts              # core service
â”œâ”€â”€ authom.interceptor.ts          # HttpInterceptorFn
â”œâ”€â”€ authom.module.ts               # provideSdAuthOm + SdAuthOmModule.forRoot
â””â”€â”€ silent-authom.html             # template HTML tÄ©nh cho iframe
```

`silent-authom.html` Ä‘Æ°á»£c ship nhÆ° má»™t file tÄ©nh trong source â€” consumer copy thá»§ cÃ´ng vÃ o `public/` (Angular 19) hoáº·c `src/` + thÃªm vÃ o `angular.json` `assets`. Document trong README/comment.

Bá»• sung 1 helper vÃ o file Ä‘Ã£ cÃ³: thÃªm `sha256` vÃ o `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts` (export qua `StringUtilities`). Quyáº¿t Ä‘á»‹nh cuá»‘i cÃ¹ng: váº«n dÃ¹ng `crypto.subtle.digest` vÃ  `crypto.getRandomValues` (Web Crypto API) â€” khÃ´ng viáº¿t SHA-256 pure JS ná»¯a.

## 4. Configuration

### 4.1 `SdAuthOmTenantConfig`

```ts
export interface SdAuthOmTenantConfig {
  // Báº¯t buá»™c
  domain: string;                    // vd: 'login-qc.oneshop.dev'
  clientId: string;

  // Tuá»³ chá»n â€” params cho /authorize
  redirectUri?: string;              // default: window.location.origin
  audience?: string;                 // API audience (cho JWT cÃ³ aud)
  organization?: string;             // org ID
  scope?: string;                    // default: 'openid profile email'

  // Tuá»³ chá»n â€” interceptor
  secureRoutes?: string[];           // glob patterns, vd ['https://api.example.com/*']

  // Tuá»³ chá»n â€” silent refresh
  silentRefreshRedirectUri?: string; // default: `${origin}/silent-authom.html`
  refreshThresholdSeconds?: number;  // default: 30 (refresh trÆ°á»›c khi háº¿t háº¡n)
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

Há»— trá»£ async load (multi-tenant fetch theo subdomain), giá»‘ng pattern keycloak.

## 5. Service contract â€” `SdAuthOmService`

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

### 5.1 `init(config)` â€” cháº¡y bá»Ÿi `APP_INITIALIZER`

1. Guard `isPlatformBrowser(PLATFORM_ID)` â€” náº¿u khÃ´ng pháº£i browser, return `false`.
2. LÆ°u config vÃ o `this.config`.
3. Náº¿u `window.location.search` chá»©a `?code=` â†’ gá»i `handleCallback()`.
4. Náº¿u chÆ°a cÃ³ token sau callback â†’ gá»i `silentRefresh()` (case má»Ÿ app khi Ä‘Ã£ cÃ³ session á»Ÿ AuthOM).
5. Tráº£ vá» `true` náº¿u cuá»‘i cÃ¹ng cÃ³ `accessToken`, `false` náº¿u khÃ´ng.

### 5.2 `login(options?)`

1. Generate `state` = `crypto.randomUUID()`.
2. Generate `code_verifier` = base64url cá»§a `crypto.getRandomValues(new Uint8Array(32))`.
3. Generate `code_challenge` = base64url cá»§a `await crypto.subtle.digest('SHA-256', encoder.encode(verifier))`.
4. LÆ°u `sessionStorage`: `authom_state`, `authom_code_verifier`, `authom_return_to` (default = `pathname + search`).
5. Build URL `https://{domain}/authorize` vá»›i query:
   - `response_type=code`
   - `client_id={clientId}`
   - `redirect_uri={redirectUri || origin}`
   - `state={state}`
   - `code_challenge={challenge}`
   - `code_challenge_method=S256`
   - `scope={scope || 'openid profile email'}`
   - `audience={audience}` (náº¿u cÃ³)
   - `organization={organization}` (náº¿u cÃ³)
6. `window.location.href = url`.

### 5.3 `logout(options?)`

1. Clear `accessToken`, `idTokenClaims`, refresh timer.
2. Build `https://{domain}/v2/logout?client_id={clientId}&returnTo={returnTo || origin}`.
3. `window.location.href = url`.

### 5.4 `silentRefresh()` â€” Promise<boolean>

State + code_verifier cho silent refresh Ä‘Æ°á»£c giá»¯ trong **closure local variables** (khÃ´ng dÃ¹ng sessionStorage) â€” trÃ¡nh race vá»›i `login()` (Standard flow). File `silent-authom.html` echo `state` vá» parent qua postMessage Ä‘á»ƒ parent verify.

1. Generate local `state`, `code_verifier`, `code_challenge` (lÆ°u trong biáº¿n closure).
2. Táº¡o iframe áº©n (`display: none`).
3. Build URL `https://{domain}/authorize` cÃ¹ng cÃ¡c params nhÆ° `login()` nhÆ°ng:
   - `redirect_uri = silentRefreshRedirectUri || ${origin}/silent-authom.html`
   - thÃªm `prompt=none`
   - **khÃ´ng** ghi sessionStorage
4. `iframe.src = authorizeUrl`, append vÃ o body.
5. Listen `message` event:
   - Verify `event.origin === window.location.origin`.
   - Náº¿u `event.data.type === 'AUTHOM_SILENT_SUCCESS'` vÃ  `event.data.state === local state` â†’ exchange `event.data.code` vá»›i local `code_verifier` â†’ set token + schedule refresh â†’ resolve `true`.
   - Náº¿u `event.data.type === 'AUTHOM_SILENT_ERROR'` hoáº·c state mismatch â†’ resolve `false`.
6. Timeout sau `authorizeTimeoutInSeconds * 1000` ms â†’ resolve `false`.
7. Cleanup: remove iframe, removeEventListener.

### 5.5 `handleCallback()` â€” Promise<boolean>

`handleCallback` chá»‰ cháº¡y cho Standard Login Flow (khÃ´ng pháº£i silent refresh â€” silent refresh cÃ³ flow riÃªng trong section 5.4 qua postMessage).

1. Äá»c `code` + `state` tá»« `URLSearchParams(window.location.search)`.
2. Verify state khá»›p `sessionStorage.authom_state` â†’ mismatch â†’ cleanup sessionStorage, xÃ³a query string, return `false`.
3. Láº¥y `code_verifier` tá»« sessionStorage. Náº¿u khÃ´ng cÃ³ â†’ return `false`.
4. POST tá»›i `https://{domain}/oauth/token`:
   ```
   grant_type=authorization_code
   code={code}
   code_verifier={verifier}
   redirect_uri={redirectUri}
   client_id={clientId}
   ```
5. Cleanup sessionStorage: xÃ³a `authom_state`, `authom_code_verifier` (giá»¯ `authom_return_to` Ä‘áº¿n bÆ°á»›c 7).
6. Náº¿u exchange fail â†’ return `false`. Náº¿u thÃ nh cÃ´ng: set `accessToken`, decode `id_token` â†’ set `idTokenClaims`, schedule auto-refresh.
7. Láº¥y `returnTo` tá»« `sessionStorage.authom_return_to` (náº¿u cÃ³) â†’ `history.replaceState({}, '', returnTo)`, xÃ³a khá»i sessionStorage. Náº¿u khÃ´ng cÃ³ â†’ `history.replaceState({}, '', pathname)` (chá»‰ xÃ³a query string).
8. Return `true`.

**LÆ°u Ã½ timing**: `handleCallback` cháº¡y bÃªn trong `init()`, tá»©c lÃ  **trÆ°á»›c** khi Angular Router thá»±c hiá»‡n initial navigation. NÃªn viá»‡c gá»i `history.replaceState` á»Ÿ bÆ°á»›c 7 trÆ°á»›c khi `init()` resolve giÃºp Router parse URL Ä‘Ã£ sáº¡ch query.

### 5.6 Auto-refresh timer (private)

- Gá»i sau má»—i láº§n exchange/refresh thÃ nh cÃ´ng.
- Decode JWT báº±ng `atob(token.split('.')[1])` â†’ láº¥y `exp` (seconds since epoch).
- `delay = max(0, (exp - now/1000 - refreshThresholdSeconds) * 1000)`.
- `setTimeout(() => silentRefresh(), delay)`.
- LÆ°u timer ID, clear khi logout / new refresh / silent fail.
- Náº¿u JWT khÃ´ng cÃ³ `exp` â†’ log warning, skip auto-refresh.

## 6. Interceptor â€” `SdAuthOmInterceptor`

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

**`matchGlob(pattern, url)`** â€” helper ná»™i bá»™, há»— trá»£ kÃ½ tá»± `*`:
- Convert pattern thÃ nh RegExp: escape cÃ¡c kÃ½ tá»± regex, replace `\*` thÃ nh `.*`.
- Test url khá»›p regex.

KhÃ¡c biá»‡t so vá»›i keycloak interceptor:
- Glob match thay vÃ¬ `includes()` (vÃ¬ config Auth0 hiá»‡n táº¡i dÃ¹ng wildcard `*`).
- KhÃ´ng cÃ³ logic `updateToken(30)` async â€” auto-refresh Ä‘Ã£ cháº¡y timer riÃªng, token luÃ´n fresh.

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

NguyÃªn táº¯c:
- File tÄ©nh < 1KB, khÃ´ng bootstrap Angular trong iframe â†’ trÃ¡nh load nguyÃªn bundle (>1MB).
- `targetOrigin = window.location.origin` (khÃ´ng dÃ¹ng `'*'`) â†’ trÃ¡nh leak code ra origin khÃ¡c.
- Check `window.parent === window` â†’ trÃ¡nh cháº¡y nháº§m khi user má»Ÿ file trá»±c tiáº¿p.

## 8. Module providers

### 8.1 `provideSdAuthOm()` â€” standalone

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

### 8.2 `SdAuthOmModule.forRoot()` â€” NgModule legacy

TÆ°Æ¡ng tá»± keycloak.module.ts, dÃ¹ng `APP_INITIALIZER` thay vÃ¬ `provideAppInitializer`.

### 8.3 Wire interceptor (consumer self-service)

Module **khÃ´ng** auto-provide interceptor â€” consumer tá»± thÃªm vÃ o `provideHttpClient`:

```ts
provideHttpClient(withInterceptors([SdAuthOmInterceptor])),
provideSdAuthOm({ useFactory: () => ({ loadTenantConfig: ... }) }),
```

## 9. StringUtilities â€” bá»• sung

ThÃªm 1 hÃ m vÃ o `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts`:

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

Export qua `StringUtilities`. Service `authom.service.ts` import vÃ  dÃ¹ng.

## 10. Edge cases

| # | Scenario | Behavior |
|---|----------|----------|
| 1 | SSR / non-browser | `init()` return `false` ngay; má»i method skip. |
| 2 | `crypto.subtle` unavailable (HTTP, khÃ´ng pháº£i HTTPS / localhost) | `login()` throw error rÃµ rÃ ng â€” document trong README. |
| 3 | State mismatch | `handleCallback` return `false`, khÃ´ng exchange code. |
| 4 | Multi-tab race (tab B copy URL cÃ³ `?code=`) | Tab B exchange fail (code Ä‘Ã£ dÃ¹ng) â†’ return `false` â†’ app tá»± xá»­ lÃ½. |
| 5 | Silent refresh timeout | Resolve `false`, khÃ´ng clear token cÅ© (váº«n dÃ¹ng Ä‘áº¿n khi expire). |
| 6 | Silent refresh nháº­n error message | Resolve `false`, clear token, clear timer. |
| 7 | JWT khÃ´ng cÃ³ `exp` (opaque token) | Log warning, skip auto-refresh, token váº«n dÃ¹ng Ä‘Æ°á»£c. |
| 8 | Logout | Clear token + claims + timer **trÆ°á»›c** khi redirect tá»›i `/v2/logout`. |
| 9 | Network fail khi exchange | Return `false`, khÃ´ng retry. App tá»± xá»­ lÃ½. |
| 10 | URL cÃ³ `?code=` cÃ²n sÃ³t khi Router parse | `replaceState` xÃ³a query string **trÆ°á»›c** khi `init()` resolve. |

## 11. Public API export (`index.ts`)

```ts
export * from './authom.configuration';
export * from './authom.service';
export * from './authom.interceptor';
export * from './authom.module';
```

## 12. CÃ¡ch dÃ¹ng (vÃ­ dá»¥ standalone)

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

- `code_verifier` 32 bytes ngáº«u nhiÃªn qua `crypto.getRandomValues` â†’ Ä‘á»§ entropy cho PKCE.
- `state` qua `crypto.randomUUID` â†’ Ä‘á»§ unique chá»‘ng CSRF.
- `targetOrigin` cá»§a `postMessage` luÃ´n = `window.location.origin`, khÃ´ng bao giá» `*`.
- Token chá»‰ lÆ°u RAM, máº¥t khi reload â€” silent refresh sáº½ láº¥y láº¡i náº¿u session AuthOM cÃ²n há»£p lá»‡.
- `crypto.subtle` chá»‰ hoáº¡t Ä‘á»™ng trong secure context (HTTPS / localhost).

