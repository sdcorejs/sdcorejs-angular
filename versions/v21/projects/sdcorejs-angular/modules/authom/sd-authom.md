# AuthOM Module

- **Type:** `EnvironmentProviders` (`provideSdAuthOm`) **or** `NgModule.forRoot` (`SdAuthOmModule`)
- **Import path:** `@sdcorejs/angular/modules/authom`
- **Library version:** `@sdcorejs/angular@19.0.0-beta.86`

## One-line purpose

OAuth 2.0 + PKCE authentication client for AuthOM (Auth0-based) — handles login redirect, callback exchange, silent token refresh via hidden iframe, and HTTP `Authorization` header injection.

## When to use

- Your portal authenticates against AuthOM / Auth0 using **Authorization Code + PKCE** (browser SPA flow, no client secret).
- You want automatic silent refresh (no full-page redirect) before access tokens expire.
- You need a `HttpInterceptor` that automatically attaches `Bearer <token>` only to allow-listed API URLs.
- Differs from `keycloak` module: AuthOM targets Auth0-style `/authorize` + `/oauth/token` endpoints with PKCE; Keycloak module wraps `keycloak-js` directly.
- Differs from `auth` module: this module **owns** the actual sign-in flow and token state; `auth` is a façade you can additionally wire on top.

## When NOT to use

- Do not use it for Keycloak realms. Use the `keycloak` module so `keycloak-js` owns the provider-specific behavior.
- Do not use it when the app needs a backend-confidential client secret flow; this module is for browser SPA Authorization Code + PKCE only.
- Do not use it only to expose current user info in a header. Wire the generic `auth` module on top if the login flow is already handled elsewhere.
- Do not attach it to every outbound request. Scope `secureRoutes` to trusted API origins so tokens are not sent to third parties.

## What it provides

| Symbol | Kind | Purpose |
|---|---|---|
| `provideSdAuthOm(options)` | EnvironmentProviders factory | Standalone-bootstrap registration |
| `SdAuthOmModule.forRoot(options)` | NgModule | Legacy `AppModule` registration |
| `SdAuthOmService` | Service (`providedIn: 'root'`) | Login/logout, callback handling, silent refresh, token signals |
| `SdAuthOmInterceptor` | `HttpInterceptorFn` | Attaches `Authorization: Bearer <token>` to URLs matching `secureRoutes` |
| `SD_AUTHOM_CONFIGURATION` | InjectionToken | Holds the `loadTenantConfig()` provider |
| `SdAuthOmTenantConfig` | Interface | Auth0 tenant config shape |
| `ISdAuthOmConfiguration` | Interface | `{ loadTenantConfig: () => Promise<SdAuthOmTenantConfig> }` |

## Configuration

```ts
interface SdAuthOmTenantConfig {
  domain: string;             // 'login.example.com' (no protocol)
  clientId: string;           // Auth0 application clientId
  redirectUri?: string;       // default: window.location.origin
  audience?: string;          // API audience for access token
  organization?: string;      // Auth0 organization id (org_xxx)
  scope?: string;             // default: 'openid profile email'
  secureRoutes?: string[];    // glob patterns ['https://api.example.com/*']
  silentRefreshRedirectUri?: string;  // default: ${origin}/silent-authom.html
  refreshThresholdSeconds?: number;   // default 30 — refresh this many sec before exp
  authorizeTimeoutInSeconds?: number; // default 5 — silent iframe timeout
}

interface ISdAuthOmConfiguration {
  loadTenantConfig: () => Promise<SdAuthOmTenantConfig>;
}
```

The factory `loadTenantConfig` is called once at app-init — fetch tenant config from your backend or return a static object.

## Setup

**Required app-side files / conditions:**
1. Copy `silent-authom.html` from this module's source into the app's `public/` folder (referenced as silent-refresh redirect target).
2. App must run on HTTPS (or `localhost`) — Web Crypto API requires a secure context.

**Standalone (`app.config.ts`):**
```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideSdAuthOm, SdAuthOmInterceptor } from '@sdcorejs/angular/modules/authom';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([SdAuthOmInterceptor])),
    provideSdAuthOm({
      useFactory: () => ({
        loadTenantConfig: () => Promise.resolve({
          domain: 'login.example.com',
          clientId: 'YOUR_CLIENT_ID',
          audience: 'https://api.example.com',
          organization: 'org_xxx',
          scope: 'openid profile email offline_access',
          secureRoutes: ['https://api.example.com/*'],
        }),
      }),
    }),
  ],
};
```

**NgModule fallback:**
```ts
@NgModule({
  imports: [
    SdAuthOmModule.forRoot({ useFactory: () => ({ loadTenantConfig: () => fetch('/config.json').then(r => r.json()) }) }),
  ],
  providers: [
    provideHttpClient(withInterceptors([SdAuthOmInterceptor])),
  ],
})
export class AppModule {}
```

## Public API

- **`SdAuthOmService`** — inject anywhere:
  - `accessToken` / `idTokenClaims` — `signal<string | null>` / `signal<Record<string, unknown> | null>`
  - `isAuthenticated` — `computed<boolean>` derived from `accessToken !== null`
  - `getAccessToken(): string | null`
  - `login(options?: { returnTo?: string }): Promise<void>` — full-page redirect to `/authorize`
  - `logout(options?: { returnTo?: string }): void` — clears state, redirects to `/v2/logout`
  - `silentRefresh(): Promise<boolean>` — runs hidden iframe + `prompt=none` flow
  - `handleCallback(): Promise<boolean>` — exchanges `?code=` query for tokens (called automatically by `init`)
- **`SdAuthOmInterceptor`** — registered via `withInterceptors([...])`. No setup beyond that.

## Behavior notes

- **App init order:** `provideAppInitializer` runs `loadTenantConfig()` then `service.init(config)`. `init` checks for a `?code=` callback (exchanges if found) and otherwise attempts `silentRefresh`. So tokens may already be present before your routes activate.
- **State integrity:** PKCE `state` is stored in `sessionStorage` keyed `authom_state`; mismatched state on callback aborts the exchange and clears query string.
- **Return-to:** `login({ returnTo })` (or current URL) is preserved across redirect via `sessionStorage["authom_return_to"]` and replayed via `history.replaceState` after callback.
- **Silent refresh schedule:** `scheduleRefresh` reads JWT `exp`, schedules a `setTimeout` for `(exp - now - threshold) * 1000`. If `exp` is missing, auto-refresh is disabled (warning logged).
- **Silent refresh transport:** hidden iframe + `postMessage` from `silent-authom.html` (which must `postMessage` `{ type: 'AUTHOM_SILENT_SUCCESS', code, state }` or `{ type: 'AUTHOM_SILENT_ERROR' }`). Origin check enforces same-origin.
- **Interceptor matching:** `secureRoutes` uses simple `*`-glob. Non-matching URLs pass through with no header.
- **SSR safety:** all browser-only paths gate on `isPlatformBrowser` — `init` returns `false` server-side.
- **Token decoding:** payload-only base64url decode — signature is NOT verified client-side (server is the source of truth).

## Examples

**Trigger login from a button:**
```ts
@Component({
  template: `
    @if (auth.isAuthenticated()) {
      <span>Hi {{ auth.idTokenClaims()?.['name'] }}</span>
      <button (click)="auth.logout()">Logout</button>
    } @else {
      <button (click)="auth.login()">Login</button>
    }
  `,
})
export class LoginButton {
  protected readonly auth = inject(SdAuthOmService);
}
```

**Wire into the auth façade:**
```ts
{
  provide: SD_AUTH_CONFIGURATION,
  useFactory: () => {
    const authom = inject(SdAuthOmService);
    return {
      action: {
        signout: () => authom.logout(),
      },
      guard: {
        authInfo: () => {
          const c = authom.idTokenClaims() ?? {};
          return { id: c['sub'] as string, email: c['email'] as string, firstName: c['name'] as string };
        },
      },
    };
  },
}
```

**Guard a route on auth state:**
```ts
export const authedGuard: CanActivateFn = () => {
  const authom = inject(SdAuthOmService);
  if (authom.isAuthenticated()) return true;
  authom.login({ returnTo: location.pathname });
  return false;
};
```

## Anti-patterns

- Do NOT call `silentRefresh()` from app code — the service schedules it automatically. Manual calls are racy.
- Do NOT add wildcard `secureRoutes: ['*']` — the interceptor will leak tokens to third-party URLs (analytics, CDN, etc.). Always scope to your API origin.
- Do NOT rely on `idTokenClaims` for authorization decisions on the server — they are unsigned client-side reads.
- Do NOT forget `silent-authom.html` in `public/` — silent refresh will time out and the user gets logged out at every token expiry.

## Related

- [keycloak module](./sd-keycloak.md) — alternative SSO provider (Keycloak instead of Auth0).
- [auth module](./sd-auth.md) — generic façade you can layer on top to expose `SdAuthService` to the layout/header.
- [permission module](./sd-permission.md) — `getToken: () => authom.getAccessToken()` lets the permission service read JWT claims via `decodeToken`.
